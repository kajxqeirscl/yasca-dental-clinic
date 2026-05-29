"""
Unit tests for backend/api/middleware.py.

Tüm testler mock-based — django-tenants schema'ya veya gerçek PostgreSQL'e ihtiyaç
duymazlar. Bu sayede SQLite test ortamında da (settings_test.py) sorunsuz çalışır.

Kapsanan bileşenler:
- HeaderTenantMiddleware  → X-Tenant header / Host / public fallback önceliği
- ThreadLocalMiddleware   → request set/cleanup, exception path cleanup
- RequestLoggingMiddleware → /api/ filter + log seviyesi seçimi (2xx/4xx/5xx)
- TenantAwareFormatter     → tenant/user_id/request_path inject (varsayılan '-')
- get_current_request / get_current_user yardımcıları
"""
import logging
from unittest.mock import MagicMock

import pytest
from django.http import HttpResponse

from api import middleware as mw_mod
from api.middleware import (
    HeaderTenantMiddleware,
    RequestLoggingMiddleware,
    TenantAwareFormatter,
    ThreadLocalMiddleware,
    _thread_locals,
    get_current_request,
    get_current_user,
)


# ---------------------------------------------------------------------------
# Yardımcı stub'lar ve fixture'lar
# ---------------------------------------------------------------------------


class _StubTenant:
    def __init__(self, schema_name):
        self.schema_name = schema_name

    def __repr__(self):
        return f"<StubTenant {self.schema_name!r}>"


class _DoesNotExist(Exception):
    pass


def _ok_response(_request):
    return HttpResponse(b"ok", status=200)


@pytest.fixture
def tenant_env(monkeypatch):
    """
    api.middleware modülündeki dış bağımlılıkları (TenantModel, DomainModel,
    connection) deterministik olarak değiştirir. Test, döndürülen dict
    üzerinden tenant'ları ve domain'leri kurar; mw çağrısı bunlara göre
    çözümleme yapar.
    """
    tenants = {}   # schema_name -> _StubTenant
    domains = {}   # hostname -> _StubTenant

    class _TenantManager:
        def get(self, schema_name=None):
            try:
                return tenants[schema_name]
            except KeyError as exc:
                raise _DoesNotExist from exc

    class _TenantModel:
        DoesNotExist = _DoesNotExist
        objects = _TenantManager()

    class _DomainObj:
        def __init__(self, tenant):
            self.tenant = tenant

    class _DomainManager:
        def select_related(self, _related):
            return self

        def get(self, domain=None):
            try:
                return _DomainObj(domains[domain])
            except KeyError as exc:
                raise _DoesNotExist from exc

    class _DomainModel:
        DoesNotExist = _DoesNotExist
        objects = _DomainManager()

    set_tenant = MagicMock()
    conn_mock = MagicMock()
    conn_mock.set_tenant = set_tenant

    monkeypatch.setattr(mw_mod, "get_tenant_model", lambda: _TenantModel)
    monkeypatch.setattr(mw_mod, "get_tenant_domain_model", lambda: _DomainModel)
    monkeypatch.setattr(mw_mod, "connection", conn_mock)

    return {
        "tenants": tenants,
        "domains": domains,
        "set_tenant": set_tenant,
    }


@pytest.fixture(autouse=True)
def _clean_thread_locals():
    """Her testten önce ve sonra thread-local request'i temizle."""
    if hasattr(_thread_locals, "request"):
        del _thread_locals.request
    yield
    if hasattr(_thread_locals, "request"):
        del _thread_locals.request


@pytest.fixture
def api_log_capture(caplog):
    """
    settings.py'de ``api.request`` logger'ı ``propagate=False`` ile tanımlı,
    bu yüzden pytest'in caplog handler'ı root üzerinden kayıtları göremiyor.
    Geçici olarak handler'ı doğrudan logger'a takıyoruz.
    """
    api_logger = logging.getLogger("api.request")
    api_logger.addHandler(caplog.handler)
    original_level = api_logger.level
    api_logger.setLevel(logging.DEBUG)
    try:
        yield caplog
    finally:
        api_logger.removeHandler(caplog.handler)
        api_logger.setLevel(original_level)


# ---------------------------------------------------------------------------
# HeaderTenantMiddleware
# ---------------------------------------------------------------------------


class TestHeaderTenantMiddleware:
    def test_resolves_by_x_tenant_header(self, rf, tenant_env):
        ali = _StubTenant("ali")
        tenant_env["tenants"]["ali"] = ali

        request = rf.get("/api/me/", HTTP_X_TENANT="ali")
        response = HeaderTenantMiddleware(_ok_response)(request)

        assert response.status_code == 200
        assert request.tenant is ali
        tenant_env["set_tenant"].assert_called_once_with(ali)
        assert request.urlconf == "core.urls"

    def test_resolves_by_host_when_header_missing(self, rf, tenant_env):
        ali = _StubTenant("ali")
        tenant_env["domains"]["ali.localhost"] = ali

        request = rf.get("/api/me/", HTTP_HOST="ali.localhost")
        HeaderTenantMiddleware(_ok_response)(request)

        assert request.tenant is ali

    def test_host_port_is_stripped(self, rf, tenant_env):
        ali = _StubTenant("ali")
        tenant_env["domains"]["ali.localhost"] = ali

        request = rf.get("/api/me/", HTTP_HOST="ali.localhost:8000")
        HeaderTenantMiddleware(_ok_response)(request)

        assert request.tenant is ali

    def test_header_takes_precedence_over_host(self, rf, tenant_env):
        ali = _StubTenant("ali")
        beta = _StubTenant("beta")
        tenant_env["tenants"]["ali"] = ali
        tenant_env["domains"]["beta.localhost"] = beta

        request = rf.get(
            "/api/me/",
            HTTP_X_TENANT="ali",
            HTTP_HOST="beta.localhost",
        )
        HeaderTenantMiddleware(_ok_response)(request)

        assert request.tenant is ali

    def test_unknown_header_falls_back_to_host(self, rf, tenant_env):
        ali = _StubTenant("ali")
        tenant_env["domains"]["ali.localhost"] = ali

        request = rf.get(
            "/api/me/",
            HTTP_X_TENANT="bilinmeyen",
            HTTP_HOST="ali.localhost",
        )
        HeaderTenantMiddleware(_ok_response)(request)

        assert request.tenant is ali

    def test_falls_back_to_public_when_nothing_matches(self, rf, tenant_env):
        public = _StubTenant("public")
        tenant_env["tenants"]["public"] = public

        request = rf.get("/api/me/", HTTP_HOST="bilinmeyen.example.com")
        HeaderTenantMiddleware(_ok_response)(request)

        assert request.tenant is public

    def test_empty_x_tenant_header_treated_as_absent(self, rf, tenant_env):
        public = _StubTenant("public")
        tenant_env["tenants"]["public"] = public

        request = rf.get("/api/me/", HTTP_X_TENANT="   ")
        HeaderTenantMiddleware(_ok_response)(request)

        assert request.tenant is public

    def test_returns_500_when_public_tenant_missing(self, rf, tenant_env):
        # Hiçbir tenant ve domain tanımlı değil → public lookup da DoesNotExist atar.
        request = rf.get("/api/me/", HTTP_HOST="bilinmeyen.example.com")
        response = HeaderTenantMiddleware(_ok_response)(request)

        assert response.status_code == 500
        assert b"Public tenant" in response.content
        # set_tenant çağrılmamalı (tenant çözülemedi)
        tenant_env["set_tenant"].assert_not_called()

    def test_sets_request_attributes(self, rf, tenant_env):
        ali = _StubTenant("ali")
        tenant_env["tenants"]["ali"] = ali

        request = rf.get("/api/me/", HTTP_X_TENANT="ali")
        HeaderTenantMiddleware(_ok_response)(request)

        assert hasattr(request, "tenant")
        assert hasattr(request, "urlconf")


# ---------------------------------------------------------------------------
# ThreadLocalMiddleware
# ---------------------------------------------------------------------------


class TestThreadLocalMiddleware:
    def test_request_accessible_inside_view(self, rf):
        captured = {}

        def get_response(request):
            captured["during"] = get_current_request()
            return HttpResponse(b"ok")

        request = rf.get("/api/me/")
        ThreadLocalMiddleware(get_response)(request)

        assert captured["during"] is request

    def test_request_cleaned_after_response(self, rf):
        request = rf.get("/api/me/")
        ThreadLocalMiddleware(_ok_response)(request)

        # Yanıt döndükten sonra thread-local boşalmış olmalı.
        assert get_current_request() is None

    def test_cleanup_runs_on_exception(self, rf):
        def explode(_request):
            raise RuntimeError("boom")

        request = rf.get("/api/me/")
        with pytest.raises(RuntimeError, match="boom"):
            ThreadLocalMiddleware(explode)(request)

        # Exception olsa bile finally bloğu thread-local'i temizlemiş olmalı.
        assert get_current_request() is None

    def test_get_current_user_returns_none_without_request(self):
        assert get_current_user() is None

    def test_get_current_user_returns_authenticated_user(self, rf):
        user = MagicMock()
        user.is_authenticated = True

        captured = {}

        def get_response(request):
            request.user = user
            captured["user"] = get_current_user()
            return HttpResponse(b"ok")

        ThreadLocalMiddleware(get_response)(rf.get("/api/me/"))
        assert captured["user"] is user


# ---------------------------------------------------------------------------
# RequestLoggingMiddleware
# ---------------------------------------------------------------------------


class TestRequestLoggingMiddleware:
    def test_non_api_paths_are_skipped(self, rf, api_log_capture):
        mw = RequestLoggingMiddleware(_ok_response)
        with api_log_capture.at_level(logging.INFO, logger="api.request"):
            mw(rf.get("/static/foo.css"))

        api_records = [r for r in api_log_capture.records if r.name == "api.request"]
        assert api_records == []

    def test_2xx_logged_at_info(self, rf, api_log_capture):
        mw = RequestLoggingMiddleware(_ok_response)
        with api_log_capture.at_level(logging.INFO, logger="api.request"):
            mw(rf.get("/api/patients/"))

        records = [r for r in api_log_capture.records if r.name == "api.request"]
        assert len(records) == 1
        assert records[0].levelno == logging.INFO

    def test_4xx_logged_at_warning(self, rf, api_log_capture):
        def get_response(_req):
            return HttpResponse(b"not found", status=404)

        mw = RequestLoggingMiddleware(get_response)
        with api_log_capture.at_level(logging.WARNING, logger="api.request"):
            mw(rf.get("/api/patients/999/"))

        records = [r for r in api_log_capture.records if r.name == "api.request"]
        assert len(records) == 1
        assert records[0].levelno == logging.WARNING

    def test_5xx_logged_at_error(self, rf, api_log_capture):
        def get_response(_req):
            return HttpResponse(b"boom", status=500)

        mw = RequestLoggingMiddleware(get_response)
        with api_log_capture.at_level(logging.ERROR, logger="api.request"):
            mw(rf.get("/api/patients/"))

        records = [r for r in api_log_capture.records if r.name == "api.request"]
        assert len(records) == 1
        assert records[0].levelno == logging.ERROR

    def test_log_message_includes_method_path_status_and_duration(self, rf, api_log_capture):
        def get_response(_req):
            return HttpResponse(b"ok", status=201)

        mw = RequestLoggingMiddleware(get_response)
        with api_log_capture.at_level(logging.INFO, logger="api.request"):
            mw(rf.post("/api/patients/", data={"x": "y"}))

        records = [r for r in api_log_capture.records if r.name == "api.request"]
        assert len(records) == 1
        formatted = records[0].getMessage()
        assert "POST" in formatted
        assert "/api/patients/" in formatted
        assert "201" in formatted
        assert "ms" in formatted


# ---------------------------------------------------------------------------
# TenantAwareFormatter
# ---------------------------------------------------------------------------


def _make_record():
    return logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="",
        lineno=1,
        msg="hello",
        args=(),
        exc_info=None,
    )


class TestTenantAwareFormatter:
    fmt = "[{tenant}] [{user_id}] [{request_path}] {message}"

    def test_defaults_to_dash_when_no_request(self):
        formatter = TenantAwareFormatter(fmt=self.fmt, style="{")
        out = formatter.format(_make_record())
        assert out == "[-] [-] [-] hello"

    def test_injects_tenant_user_and_path(self, rf):
        request = rf.get("/api/patients/15/")
        request.tenant = _StubTenant("yildizdental")
        user = MagicMock()
        user.is_authenticated = True
        user.id = 42
        request.user = user

        _thread_locals.request = request
        formatter = TenantAwareFormatter(fmt=self.fmt, style="{")
        out = formatter.format(_make_record())

        assert "[yildizdental]" in out
        assert "[42]" in out
        assert "[/api/patients/15/]" in out

    def test_unauthenticated_user_gets_dash(self, rf):
        request = rf.get("/api/me/")
        request.tenant = _StubTenant("ali")
        user = MagicMock()
        user.is_authenticated = False
        request.user = user

        _thread_locals.request = request
        formatter = TenantAwareFormatter(fmt=self.fmt, style="{")
        out = formatter.format(_make_record())

        assert "[ali]" in out
        assert "[-]" in out  # user_id

    def test_missing_tenant_attribute_falls_back_to_dash(self, rf):
        request = rf.get("/api/me/")
        # tenant atanmamış
        _thread_locals.request = request
        formatter = TenantAwareFormatter(fmt=self.fmt, style="{")
        out = formatter.format(_make_record())

        assert out.startswith("[-]")
