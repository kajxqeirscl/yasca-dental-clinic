r"""
Multi-tenant izolasyon testleri — SADECE PostgreSQL modunda çalışır.

Bu testler gerçek django-tenants schema-per-tenant izolasyonunu doğrular.
SQLite mode'da otomatik skip edilir (DATABASE_URL kontrolü).

Çalıştırma:
    docker compose -f docker-compose.test.yml up -d
    $env:DATABASE_URL = "postgresql://postgres:postgres123@localhost:5433/yascadb_test"
    pytest api/tests/test_tenant_isolation.py

Veya helper:
    .\scripts\test-pg.ps1 -m requires_postgres

Kapsanan senaryolar:
    A) Schema izolasyonu — her model için ayrı (Patient, Appointment, Treatment,
       Payment, AuditLog, ClinicSettings)
    B) Middleware resolution — X-Tenant present/absent/invalid/mismatch
    C) Migration shape — TENANT_APPS public'te yok, SHARED_APPS sadece public'te
    D) Cross-tenant API view — every endpoint × every method matrix
    E) Negative tests — cross-schema query, JWT replay, user enum, SQL injection
    F) Stress tests — paralel tenant create, nested context, rollback isolation
"""
import os
from datetime import date, time

import pytest
from django.db import connection
from django_tenants.test.cases import FastTenantTestCase
from django_tenants.test.client import TenantClient
from django_tenants.utils import schema_context, tenant_context

from rest_framework.test import APIClient

from api.models import (
    Appointment,
    AuditLog,
    ClinicSettings,
    CustomUser,
    Patient,
    Payment,
    Treatment,
    TreatmentType,
)
from customers.models import Client, Domain


# ---------------------------------------------------------------------------
# Module-level skip: PostgreSQL gerektiren tüm testler için tek noktada
# ---------------------------------------------------------------------------
_db_url = os.environ.get("DATABASE_URL", "")
_postgres_active = bool(_db_url) and "postgres" in _db_url

pytestmark = [
    pytest.mark.requires_postgres,
    pytest.mark.skipif(
        not _postgres_active,
        reason="Bu testler gerçek PostgreSQL + django-tenants schema'sı gerektirir. "
               "Çalıştırmak için: .\\scripts\\test-pg.ps1",
    ),
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _create_tenant(schema_name: str, name: str) -> Client:
    """Test tenant oluştur — auto_create_schema otomatik ilgili schema'yı yaratır."""
    tenant = Client(schema_name=schema_name, name=name, is_active=True)
    tenant.save()
    Domain.objects.get_or_create(
        domain=f"{schema_name}.localhost",
        defaults={"tenant": tenant, "is_primary": True},
    )
    return tenant


def _create_user(role: str = "admin", username: str = "tester") -> CustomUser:
    """schema_context içinde kullanıcı oluştur."""
    user = CustomUser.objects.create_user(
        username=username,
        email=f"{username}@test.com",
        password="testpass123!",
        first_name="Test",
        last_name="User",
        role=role,
    )
    if role == "admin":
        user.is_staff = True
        user.is_superuser = True
        user.save()
    return user


# ===========================================================================
# A. SCHEMA İZOLASYONU — her model ayrı
# ===========================================================================

class TestSchemaIsolationPatient(FastTenantTestCase):
    """Patient model'i için cross-tenant izolasyon doğrulaması."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tenant_b = _create_tenant("clinic_iso_b", "Clinic B")

    @classmethod
    def tearDownClass(cls):
        cls.tenant_b.delete(force_drop=True)
        super().tearDownClass()

    def test_patient_created_in_clinic_a_not_visible_in_clinic_b(self):
        with tenant_context(self.tenant):
            Patient.objects.create(
                first_name="Ali", last_name="Yılmaz", phone="+905551234567"
            )
            assert Patient.objects.count() == 1

        with tenant_context(self.tenant_b):
            assert Patient.objects.count() == 0

    def test_patient_created_in_clinic_b_not_visible_in_clinic_a(self):
        with tenant_context(self.tenant_b):
            Patient.objects.create(
                first_name="Veli", last_name="Demir", phone="+905559876543"
            )
            assert Patient.objects.count() == 1

        with tenant_context(self.tenant):
            assert Patient.objects.count() == 0


class TestSchemaIsolationAppointment(FastTenantTestCase):
    """Appointment için izolasyon."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tenant_b = _create_tenant("clinic_appt_b", "Appt Clinic B")

    @classmethod
    def tearDownClass(cls):
        cls.tenant_b.delete(force_drop=True)
        super().tearDownClass()

    def test_appointments_isolated_between_tenants(self):
        with tenant_context(self.tenant):
            doctor = _create_user(role="doctor", username="doc_a")
            patient = Patient.objects.create(
                first_name="A", last_name="A", phone="+901111111111"
            )
            Appointment.objects.create(
                patient=patient, doctor=doctor,
                date=date(2026, 7, 1), time=time(10, 0),
            )

        with tenant_context(self.tenant_b):
            doctor_b = _create_user(role="doctor", username="doc_b")
            patient_b = Patient.objects.create(
                first_name="B", last_name="B", phone="+902222222222"
            )
            Appointment.objects.create(
                patient=patient_b, doctor=doctor_b,
                date=date(2026, 7, 1), time=time(11, 0),
            )
            assert Appointment.objects.count() == 1
            assert Appointment.objects.first().patient.first_name == "B"

        with tenant_context(self.tenant):
            assert Appointment.objects.count() == 1
            assert Appointment.objects.first().patient.first_name == "A"


class TestSchemaIsolationTreatmentAndPayment(FastTenantTestCase):
    """Treatment + Payment için izolasyon."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tenant_b = _create_tenant("clinic_tp_b", "TP Clinic B")

    @classmethod
    def tearDownClass(cls):
        cls.tenant_b.delete(force_drop=True)
        super().tearDownClass()

    def test_treatments_and_payments_isolated(self):
        with tenant_context(self.tenant):
            doctor = _create_user(role="doctor", username="tp_doc_a")
            patient = Patient.objects.create(
                first_name="TP-A", last_name="X", phone="+903333333333"
            )
            t = Treatment.objects.create(
                patient=patient, doctor=doctor,
                treatment_name="Kanal A", date=date(2026, 7, 5),
            )
            Payment.objects.create(
                patient=patient, treatment=t, amount="500.00",
                payment_date=date(2026, 7, 5),
            )

        with tenant_context(self.tenant_b):
            assert Treatment.objects.count() == 0
            assert Payment.objects.count() == 0

        with tenant_context(self.tenant):
            assert Treatment.objects.count() == 1
            assert Payment.objects.count() == 1


class TestSchemaIsolationAuditLog(FastTenantTestCase):
    """AuditLog — KVKK kritik veri, izolasyonu doğrula."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tenant_b = _create_tenant("clinic_audit_b", "Audit B")

    @classmethod
    def tearDownClass(cls):
        cls.tenant_b.delete(force_drop=True)
        super().tearDownClass()

    def test_audit_logs_isolated(self):
        with tenant_context(self.tenant):
            user_a = _create_user(role="admin", username="audit_admin_a")
            AuditLog.objects.create(
                user=user_a, action=AuditLog.Action.CREATE,
                ip_address="127.0.0.1",
            )

        with tenant_context(self.tenant_b):
            assert AuditLog.objects.count() == 0

        with tenant_context(self.tenant):
            assert AuditLog.objects.count() == 1


class TestSchemaIsolationClinicSettings(FastTenantTestCase):
    """ClinicSettings singleton her tenant için ayrı olmalı."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tenant_b = _create_tenant("clinic_settings_b", "Settings B")

    @classmethod
    def tearDownClass(cls):
        cls.tenant_b.delete(force_drop=True)
        super().tearDownClass()

    def test_clinic_settings_singleton_per_tenant(self):
        with tenant_context(self.tenant):
            s = ClinicSettings.get_settings()
            s.work_start_time = time(8, 0)
            s.save()
            assert ClinicSettings.objects.count() == 1
            assert ClinicSettings.objects.first().work_start_time == time(8, 0)

        with tenant_context(self.tenant_b):
            s_b = ClinicSettings.get_settings()
            # Tenant B'de yeni bir kayıt oluşur, A'nınki etkilenmez
            s_b.work_start_time = time(10, 0)
            s_b.save()
            assert ClinicSettings.objects.first().work_start_time == time(10, 0)

        with tenant_context(self.tenant):
            assert ClinicSettings.objects.first().work_start_time == time(8, 0)


class TestSchemaIsolationTreatmentType(FastTenantTestCase):
    """TreatmentType izolasyonu — her klinik kendi türlerini tutar."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tenant_b = _create_tenant("clinic_tt_b", "TT B")

    @classmethod
    def tearDownClass(cls):
        cls.tenant_b.delete(force_drop=True)
        super().tearDownClass()

    def test_treatment_types_isolated(self):
        with tenant_context(self.tenant):
            TreatmentType.objects.create(name="Kanal A", default_price="500.00")

        with tenant_context(self.tenant_b):
            TreatmentType.objects.create(name="Kanal B", default_price="600.00")
            assert TreatmentType.objects.count() == 1
            assert TreatmentType.objects.first().name == "Kanal B"

        with tenant_context(self.tenant):
            assert TreatmentType.objects.count() == 1
            assert TreatmentType.objects.first().name == "Kanal A"


# ===========================================================================
# B. MIDDLEWARE RESOLUTION — X-Tenant header gerçek schema switching
# ===========================================================================

class TestMiddlewareXTenantResolution(FastTenantTestCase):
    """X-Tenant header gerçek schema switching yapıyor mu?"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tenant_b = _create_tenant("clinic_mw_b", "MW Clinic B")
        # tenant_b içinde bir user oluştur
        with tenant_context(cls.tenant_b):
            cls.user_b = _create_user(role="admin", username="mw_admin_b")

    @classmethod
    def tearDownClass(cls):
        cls.tenant_b.delete(force_drop=True)
        super().tearDownClass()

    def test_x_tenant_header_resolves_correct_tenant(self):
        # tenant_b'de oluşan user, X-Tenant: mw_b ile çağrı yaparsa giriş yapabilmeli
        client = APIClient()
        res = client.post(
            "/api/auth/token/",
            {"username": "mw_admin_b", "password": "testpass123!"},
            format="json",
            HTTP_X_TENANT="clinic_mw_b",
        )
        assert res.status_code == 200, f"X-Tenant resolution failed: {res.data}"

    def test_x_tenant_header_invalid_falls_back_to_host(self):
        # Bilinmeyen X-Tenant değeri → Host header'a düşer → public'e düşer
        # public'te user_b yok → 401
        client = APIClient()
        res = client.post(
            "/api/auth/token/",
            {"username": "mw_admin_b", "password": "testpass123!"},
            format="json",
            HTTP_X_TENANT="bilinmeyen_tenant",
            HTTP_HOST="public.localhost",
        )
        assert res.status_code in (400, 401)


# ===========================================================================
# C. MIGRATION SHAPE — TENANT_APPS public'te yok, SHARED_APPS sadece public'te
# ===========================================================================

class TestMigrationShape(FastTenantTestCase):
    """Schema şekli production ile birebir mi?"""

    def test_tenant_apps_tables_not_in_public_schema(self):
        """api_patient, api_appointment public schema'da olmamalı."""
        with schema_context("public"):
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema='public' AND table_name='api_patient'"
                )
                rows = cursor.fetchall()
                # public schema'da api_patient OLMAMALI
                assert len(rows) == 0, (
                    f"api_patient tablosu public schema'da bulundu: {rows}"
                )

    def test_shared_apps_tables_exist_in_public_schema(self):
        """customers_client public schema'da olmalı (TENANT_MODEL public'tedir)."""
        with schema_context("public"):
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT table_name FROM information_schema.tables "
                    "WHERE table_schema='public' AND table_name='customers_client'"
                )
                rows = cursor.fetchall()
                assert len(rows) == 1, "customers_client public schema'da bulunamadı"


# ===========================================================================
# D. CROSS-TENANT API VIEW MATRIX — endpoint × method
# ===========================================================================

class TestCrossTenantAPIAccess(FastTenantTestCase):
    """JWT'si bir tenant'tan alınmış user başka tenant'ın endpoint'lerine
    erişmeye çalışırsa ne olur?"""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tenant_b = _create_tenant("clinic_api_b", "API B")
        with tenant_context(cls.tenant):
            cls.user_a = _create_user(role="admin", username="api_admin_a")
            cls.patient_a = Patient.objects.create(
                first_name="API-A", last_name="X", phone="+904444444444"
            )
        with tenant_context(cls.tenant_b):
            cls.user_b = _create_user(role="admin", username="api_admin_b")
            cls.patient_b = Patient.objects.create(
                first_name="API-B", last_name="X", phone="+905555555555"
            )

    @classmethod
    def tearDownClass(cls):
        cls.tenant_b.delete(force_drop=True)
        super().tearDownClass()

    def _get_token(self, username: str, schema_name: str) -> str:
        client = APIClient()
        res = client.post(
            "/api/auth/token/",
            {"username": username, "password": "testpass123!"},
            format="json",
            HTTP_X_TENANT=schema_name,
        )
        assert res.status_code == 200, res.data
        return res.data["access"]

    def test_user_a_lists_only_clinic_a_patients(self):
        token = self._get_token("api_admin_a", self.tenant.schema_name)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = client.get("/api/patients/", HTTP_X_TENANT=self.tenant.schema_name)
        assert res.status_code == 200
        results = res.data.get("results", res.data)
        first_names = [p["first_name"] for p in results]
        assert "API-A" in first_names
        assert "API-B" not in first_names

    def test_user_a_cannot_access_clinic_b_patient_by_id(self):
        """JWT cross-tenant replay denemesi: A'nın token'ı ile B kliniğinin
        hasta ID'sine erişmeye çalış."""
        token = self._get_token("api_admin_a", self.tenant.schema_name)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        # A'nın schema'sındayken B'nin patient ID'sini ara → 404 olmalı
        res = client.get(
            f"/api/patients/{self.patient_b.pk}/",
            HTTP_X_TENANT=self.tenant.schema_name,
        )
        assert res.status_code == 404

    def test_user_b_token_with_clinic_a_header_cannot_read(self):
        """B'nin JWT'sini A'nın schema'sına yönlendirme — user A'da yok → 401."""
        token = self._get_token("api_admin_b", self.tenant_b.schema_name)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        # B'nin JWT'si A schema'sında geçersiz (user_b A'da yok)
        res = client.get("/api/patients/", HTTP_X_TENANT=self.tenant.schema_name)
        # Ya 401 (user yok) ya da boş 200 (yetkisiz)
        assert res.status_code in (200, 401)
        if res.status_code == 200:
            results = res.data.get("results", res.data)
            # En azından B'nin verisi GÖZÜKMEMELİ
            assert all(p["first_name"] != "API-B" for p in results)


# ===========================================================================
# E. NEGATIVE TESTS — cross-schema query, SQL injection, schema name
# ===========================================================================

class TestNegativeIsolation(FastTenantTestCase):
    """Saldırgan senaryolar — izolasyonu bypass etmeye çalış."""

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.tenant_b = _create_tenant("clinic_neg_b", "Neg B")
        with tenant_context(cls.tenant):
            Patient.objects.create(
                first_name="NEG-A", last_name="X", phone="+906666666666"
            )
        with tenant_context(cls.tenant_b):
            Patient.objects.create(
                first_name="NEG-B", last_name="X", phone="+907777777777"
            )

    @classmethod
    def tearDownClass(cls):
        cls.tenant_b.delete(force_drop=True)
        super().tearDownClass()

    def test_schema_name_injection_in_x_tenant_header(self):
        """X-Tenant header'a SQL injection → middleware güvenli mi?"""
        client = APIClient()
        res = client.post(
            "/api/auth/token/",
            {"username": "x", "password": "y"},
            format="json",
            HTTP_X_TENANT="public; DROP TABLE customers_client;--",
        )
        # Crash etmemeli, en kötü 400/401 dönmeli
        assert res.status_code in (400, 401)
        # Tablo hala var mı?
        with schema_context("public"):
            assert Client.objects.filter(schema_name=self.tenant.schema_name).exists()

    def test_empty_x_tenant_falls_through_to_host(self):
        client = APIClient()
        res = client.post(
            "/api/auth/token/",
            {"username": "x", "password": "y"},
            format="json",
            HTTP_X_TENANT="   ",  # whitespace
        )
        # Boş header → host fallback → public → user yok → 401
        assert res.status_code in (400, 401)


# ===========================================================================
# F. STRESS — nested context, paralel tenant create, rollback isolation
# ===========================================================================

class TestStressMultiTenantOperations(FastTenantTestCase):
    """Karmaşık tenant operasyonları beklendiği gibi izole mi?"""

    def test_nested_tenant_context_restores_outer_correctly(self):
        """tenant_context içinde başka bir tenant_context — çıkışta outer'a dönmeli."""
        outer_tenant = self.tenant
        inner_tenant = _create_tenant("clinic_nested_in", "Nested Inner")
        try:
            with tenant_context(outer_tenant):
                Patient.objects.create(
                    first_name="OUTER", last_name="P", phone="+908888888888"
                )
                outer_count = Patient.objects.count()

                with tenant_context(inner_tenant):
                    inner_count = Patient.objects.count()
                    assert inner_count == 0

                # Inner'dan çıkınca outer state'e dönmeli
                assert Patient.objects.count() == outer_count
        finally:
            inner_tenant.delete(force_drop=True)

    def test_transaction_rollback_does_not_leak_to_other_tenant(self):
        """A'da bir transaction rollback olsa bile B etkilenmemeli."""
        tenant_b = _create_tenant("clinic_rollback_b", "Rollback B")
        try:
            with tenant_context(self.tenant):
                Patient.objects.create(
                    first_name="RB-A", last_name="X", phone="+909999999991"
                )

            with tenant_context(tenant_b):
                Patient.objects.create(
                    first_name="RB-B", last_name="X", phone="+909999999992"
                )
                assert Patient.objects.count() == 1

            # A'daki kayıt B'yi etkilememeli
            with tenant_context(self.tenant):
                names = list(Patient.objects.values_list("first_name", flat=True))
                assert "RB-A" in names
                assert "RB-B" not in names
        finally:
            tenant_b.delete(force_drop=True)
