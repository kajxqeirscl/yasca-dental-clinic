"""
Integration tests for backend/customers/views.py.

RegisterClinicView ve CheckDomainView, multi-tenant SaaS kayıt akışının
çekirdeğidir. ``schema_context`` ve schema-create işlemleri PostgreSQL'e
özgüdür; SQLite test ortamında bunları no-op'a indirgeyerek view'in
business logic'ini izole şekilde doğruluyoruz.
"""
from contextlib import contextmanager

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from api.models import CustomUser
from customers.models import Client, Domain
from .factories import ClientFactory


REGISTER_URL = "/api/public/register/"
CHECK_URL = "/api/public/check-domain/"


@pytest.fixture
def public_client(monkeypatch):
    """
    SQLite uyumlu APIClient. Schema operasyonlarını no-op'a düşürür:
    - ``Client.auto_create_schema`` → instance düzeyinde False
    - ``customers.views.schema_context`` → boş context manager
    """
    original_save = Client.save

    def patched_save(self, *args, **kwargs):
        self.auto_create_schema = False
        return original_save(self, *args, **kwargs)

    monkeypatch.setattr(Client, "save", patched_save)

    @contextmanager
    def noop_schema_context(_schema_name):
        yield

    monkeypatch.setattr("customers.views.schema_context", noop_schema_context)
    return APIClient()


def _valid_payload(**overrides):
    payload = {
        "subdomain": "yenidental",
        "clinic_name": "Yeni Dental",
        "admin_email": "admin@yenidental.com",
        "admin_password": "guclu-parola-123",
        "admin_first_name": "Ayşe",
        "admin_last_name": "Yılmaz",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# RegisterClinicView — happy path
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestRegisterClinicHappyPath:
    def test_returns_201_and_login_url(self, public_client):
        response = public_client.post(REGISTER_URL, _valid_payload(), format="json")

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["domain"] == "yenidental"
        assert response.data["login_url"] == "/app/yenidental"

    def test_creates_client_tenant_row(self, public_client):
        public_client.post(REGISTER_URL, _valid_payload(), format="json")

        client = Client.objects.get(schema_name="yenidental")
        assert client.name == "Yeni Dental"
        assert client.is_active is True

    def test_creates_localhost_and_render_domains(self, public_client):
        public_client.post(REGISTER_URL, _valid_payload(), format="json")

        client = Client.objects.get(schema_name="yenidental")
        domains = set(client.domains.values_list("domain", flat=True))
        assert "yenidental.localhost" in domains
        assert "yenidental.yasca-dental-clinic.onrender.com" in domains

    def test_localhost_domain_marked_primary(self, public_client):
        public_client.post(REGISTER_URL, _valid_payload(), format="json")

        primary = Domain.objects.get(domain="yenidental.localhost")
        secondary = Domain.objects.get(
            domain="yenidental.yasca-dental-clinic.onrender.com"
        )
        assert primary.is_primary is True
        assert secondary.is_primary is False

    def test_creates_admin_superuser(self, public_client):
        public_client.post(REGISTER_URL, _valid_payload(), format="json")

        user = CustomUser.objects.get(email="admin@yenidental.com")
        assert user.first_name == "Ayşe"
        assert user.last_name == "Yılmaz"
        assert user.is_superuser is True
        assert user.role == "admin"


# ---------------------------------------------------------------------------
# RegisterClinicView — validation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestRegisterClinicValidation:
    @pytest.mark.parametrize(
        "missing_field",
        ["subdomain", "clinic_name", "admin_email", "admin_password"],
    )
    def test_missing_required_field_returns_400(self, public_client, missing_field):
        payload = _valid_payload()
        payload.pop(missing_field)

        response = public_client.post(REGISTER_URL, payload, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    def test_duplicate_subdomain_returns_400(self, public_client):
        ClientFactory(schema_name="yenidental", name="Önceki Klinik")

        response = public_client.post(
            REGISTER_URL, _valid_payload(subdomain="yenidental"), format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "zaten kullanılıyor" in response.data["error"]

    def test_subdomain_is_normalized_to_lowercase(self, public_client):
        response = public_client.post(
            REGISTER_URL, _valid_payload(subdomain="  YeniDental  "), format="json"
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["domain"] == "yenidental"
        assert Client.objects.filter(schema_name="yenidental").exists()

    def test_unexpected_exception_returns_500(self, public_client, monkeypatch):
        # Domain.objects.get_or_create patlatılırsa view 500 dönmelidir.
        def boom(*_args, **_kwargs):
            raise RuntimeError("DB explosion")

        monkeypatch.setattr(
            "customers.views.Domain.objects.get_or_create",
            boom,
        )

        response = public_client.post(REGISTER_URL, _valid_payload(), format="json")

        assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "DB explosion" in response.data["error"]


# ---------------------------------------------------------------------------
# CheckDomainView
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestCheckDomainView:
    def test_existing_subdomain_returns_200(self):
        ClientFactory(schema_name="ali", name="Ali Klinik")
        client = APIClient()

        response = client.get(CHECK_URL, {"subdomain": "ali"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["exists"] is True

    def test_missing_subdomain_returns_404(self):
        client = APIClient()

        response = client.get(CHECK_URL, {"subdomain": "olmayan"})

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data["exists"] is False

    def test_empty_subdomain_returns_400(self):
        client = APIClient()

        response = client.get(CHECK_URL, {"subdomain": ""})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "error" in response.data

    def test_subdomain_param_is_normalized(self):
        ClientFactory(schema_name="ali", name="Ali Klinik")
        client = APIClient()

        # CheckDomainView: lower() + strip() ile normalize ediyor
        response = client.get(CHECK_URL, {"subdomain": "  ALI  "})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["exists"] is True
