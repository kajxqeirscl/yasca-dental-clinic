r"""
Tenant migration shape testleri — SADECE PostgreSQL modunda.

Doğrulanan:
- SHARED_APPS (customers, contenttypes) sadece public schema'da tablolar.
- TENANT_APPS (api) sadece tenant schema'larında tablolar.
- Her tenant create işlemi sonrası gerekli tablolar tenant schema'sında oluşmuş.

Çalıştırma:
    .\scripts\test-pg.ps1 -m requires_postgres
"""
import os

import pytest
from django.db import connection
from django_tenants.test.cases import FastTenantTestCase
from django_tenants.utils import schema_context


_db_url = os.environ.get("DATABASE_URL", "")
_postgres_active = bool(_db_url) and "postgres" in _db_url

pytestmark = [
    pytest.mark.requires_postgres,
    pytest.mark.skipif(
        not _postgres_active,
        reason="Requires real PostgreSQL.",
    ),
]


# SHARED_APPS modellerinden tablo isimleri (settings.py SHARED_APPS ile birebir).
SHARED_TABLES = [
    "customers_client",
    "customers_domain",
    "django_content_type",
]

# TENANT_APPS modellerinden tablo isimleri (api app).
TENANT_TABLES = [
    "api_customuser",
    "api_patient",
    "api_appointment",
    "api_treatment",
    "api_treatmenttype",
    "api_clinicsettings",
    "api_payment",
    "api_auditlog",
    "api_anamnesis",
]


def _table_exists_in_schema(table: str, schema: str) -> bool:
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT 1 FROM information_schema.tables "
            "WHERE table_schema = %s AND table_name = %s",
            [schema, table],
        )
        return cursor.fetchone() is not None


class TestMigrationShape(FastTenantTestCase):
    """SHARED vs TENANT tablo dağılımı production ile eşleşmeli."""

    def test_shared_apps_tables_present_in_public(self):
        with schema_context("public"):
            for table in SHARED_TABLES:
                assert _table_exists_in_schema(table, "public"), (
                    f"{table} public schema'da bulunamadı (SHARED_APPS modeli olmalı)"
                )

    def test_tenant_apps_tables_absent_from_public(self):
        """api_* tabloları SADECE tenant schema'larında olmalı, public'te değil."""
        with schema_context("public"):
            for table in TENANT_TABLES:
                assert not _table_exists_in_schema(table, "public"), (
                    f"{table} public schema'da bulundu — TENANT_APPS modeli "
                    f"yanlışlıkla SHARED_APPS'a flatten edilmiş olabilir!"
                )

    def test_tenant_apps_tables_present_in_tenant_schema(self):
        """Test tenant schema'sında api_* tablolar olmalı."""
        for table in TENANT_TABLES:
            assert _table_exists_in_schema(table, self.tenant.schema_name), (
                f"{table} '{self.tenant.schema_name}' tenant schema'sında bulunamadı"
            )
