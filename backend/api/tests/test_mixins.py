"""
``AuditLogMixin`` testleri — view'lerden bağımsız, sentetik bir
``DRF ViewSet`` subclass'ı üzerinden mixin'i izole şekilde doğrular.

Asıl entegre kullanım `test_views.py` üzerinden geliyor; burada özellikle
``sanitize_changes`` ve ``get_client_ip`` gibi yardımcı metotlar
kontrol ediliyor.
"""
from unittest.mock import MagicMock

import pytest
from django.test import RequestFactory

from api.mixins import AuditLogMixin
from api.models import AuditLog, Patient


class _StubViewSet(AuditLogMixin):
    """AuditLogMixin'i test edebilmek için minimal ViewSet stub'u."""

    def __init__(self, request):
        self.request = request


class TestSanitizeChanges:
    def setup_method(self):
        request = RequestFactory().get("/")
        self.vs = _StubViewSet(request)

    def test_empty_changes_returned_as_is(self):
        assert self.vs.sanitize_changes(None) is None
        assert self.vs.sanitize_changes({}) == {}

    def test_sensitive_keys_are_masked(self):
        changes = {
            "first_name": {"old": "Ali", "new": "Veli"},
            "password": {"old": "secret123", "new": "newsecret"},
            "is_staff": {"old": False, "new": True},
            "is_superuser": {"old": False, "new": True},
            "groups": {"old": [1], "new": [1, 2]},
            "user_permissions": {"old": [], "new": [5]},
            "last_login": {"old": None, "new": "2026-05-28T10:00:00"},
        }

        sanitized = self.vs.sanitize_changes(changes)

        assert sanitized["first_name"] == {"old": "Ali", "new": "Veli"}
        for key in ("password", "is_staff", "is_superuser", "groups",
                    "user_permissions", "last_login"):
            assert sanitized[key] == {"old": "[GİZLENDİ]", "new": "[GİZLENDİ]"}


class TestGetClientIp:
    def test_returns_remote_addr_when_no_forwarded(self):
        request = RequestFactory().get("/", REMOTE_ADDR="192.168.1.10")
        vs = _StubViewSet(request)
        assert vs.get_client_ip() == "192.168.1.10"

    def test_prefers_first_x_forwarded_for(self):
        request = RequestFactory().get(
            "/",
            HTTP_X_FORWARDED_FOR="10.0.0.1, 10.0.0.2, 10.0.0.3",
            REMOTE_ADDR="192.168.1.10",
        )
        vs = _StubViewSet(request)
        assert vs.get_client_ip() == "10.0.0.1"


@pytest.mark.django_db
class TestLogAction:
    def _make_view(self, user=None, ip="127.0.0.1"):
        request = RequestFactory().get("/", REMOTE_ADDR=ip)
        if user is None:
            user = MagicMock()
            user.is_authenticated = False
        request.user = user
        return _StubViewSet(request)

    def test_creates_audit_log_with_anonymous_user(self):
        patient = Patient.objects.create(
            first_name="Test", last_name="User", phone="+905551234567"
        )
        vs = self._make_view()

        vs.log_action(
            action=AuditLog.Action.CREATE,
            instance=patient,
            changes={"first_name": {"old": None, "new": "Test"}},
        )

        log = AuditLog.objects.latest("created_at")
        assert log.action == "CREATE"
        assert log.user is None
        assert log.object_id == patient.pk
        assert log.ip_address == "127.0.0.1"

    def test_sanitizes_sensitive_keys_when_logging(self):
        patient = Patient.objects.create(
            first_name="Test", last_name="User", phone="+905551234567"
        )
        vs = self._make_view()

        vs.log_action(
            action=AuditLog.Action.UPDATE,
            instance=patient,
            changes={
                "first_name": {"old": "X", "new": "Y"},
                "password": {"old": "raw", "new": "raw2"},
            },
        )

        log = AuditLog.objects.latest("created_at")
        assert log.changes["password"] == {"old": "[GİZLENDİ]", "new": "[GİZLENDİ]"}
        assert log.changes["first_name"] == {"old": "X", "new": "Y"}
