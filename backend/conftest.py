"""
Backend root-level pytest configuration — DUAL MODE.

SQLite mode (default, DATABASE_URL boş ya da sqlite içeriyorsa):
    django-tenants'in PostgreSQL-spesifik ``set_schema`` çağrılarını
    no-op shim'le yutar. Çok-kiracılı izolasyon test edilemez ama
    diğer testler hızlı çalışır.

PostgreSQL mode (DATABASE_URL postgres içeriyorsa):
    Shim devre dışı. django-tenants'in gerçek ``DatabaseWrapper``'ı
    kullanılır; gerçek schema-per-tenant izolasyonu test edilir.
    ``requires_postgres`` marker'lı testler aktif olur.

İlgili testler `@pytest.mark.requires_postgres` ile işaretlenmeli ve
SQLite mode'da otomatik skip edilmelidir (decorator yardımcısı için
backend/api/tests/test_tenant_isolation.py'a bakın).
"""
import os

from django.db.backends.base.base import BaseDatabaseWrapper


_db_url = os.environ.get("DATABASE_URL", "")
_is_sqlite_mode = not _db_url or "sqlite" in _db_url


def _noop_set_schema(self, schema_name, **_kwargs):
    """SQLite üzerinde schema kavramı yok — sessizce yut."""
    self.schema_name = schema_name


def _noop_set_schema_to_public(self):
    self.schema_name = "public"


# Shim'i SADECE SQLite mode'unda uygula. PostgreSQL mode'da django-tenants'in
# gerçek set_schema'sının dokunulmaması production-fidelity için kritiktir.
if _is_sqlite_mode:
    if not hasattr(BaseDatabaseWrapper, "set_schema"):
        BaseDatabaseWrapper.set_schema = _noop_set_schema
    if not hasattr(BaseDatabaseWrapper, "set_schema_to_public"):
        BaseDatabaseWrapper.set_schema_to_public = _noop_set_schema_to_public
    if not hasattr(BaseDatabaseWrapper, "tenant"):
        BaseDatabaseWrapper.tenant = None
