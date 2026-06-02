"""
Unit tests for backend/customers/models.py.

``Client`` ve ``Domain`` modelleri django-tenants'in TenantMixin/DomainMixin
sınıflarını miras alır. Bu testler PostgreSQL schema oluşumunu bypass eden
``ClientFactory`` üzerinden çalışır (settings_test.py SQLite kullanır).
"""
import pytest
from django_tenants.models import TenantMixin, DomainMixin

from customers.models import Client, Domain
from .factories import ClientFactory, DomainFactory


@pytest.mark.django_db
class TestClient:
    def test_str_returns_name(self):
        clinic = ClientFactory(name="Yıldız Diş Kliniği")
        assert str(clinic) == "Yıldız Diş Kliniği"

    def test_is_tenant_mixin_subclass(self):
        assert issubclass(Client, TenantMixin)

    def test_auto_create_schema_default_is_true(self):
        # Sınıf düzeyinde TenantMixin'in beklenen davranışı.
        assert Client.auto_create_schema is True

    def test_is_active_defaults_to_true(self):
        clinic = ClientFactory()
        assert clinic.is_active is True

    def test_created_on_is_set_automatically(self):
        clinic = ClientFactory()
        assert clinic.created_on is not None


@pytest.mark.django_db
class TestDomain:
    def test_is_domain_mixin_subclass(self):
        assert issubclass(Domain, DomainMixin)

    def test_domain_links_to_tenant(self):
        clinic = ClientFactory(schema_name="ali", name="Ali Klinik")
        domain = DomainFactory(domain="ali.localhost", tenant=clinic)
        assert domain.tenant_id == clinic.pk
        assert domain.tenant.name == "Ali Klinik"

    def test_multiple_domains_can_point_to_same_tenant(self):
        clinic = ClientFactory(schema_name="beta", name="Beta Klinik")
        DomainFactory(domain="beta.localhost", tenant=clinic, is_primary=True)
        DomainFactory(
            domain="beta.yasca-dental-clinic.onrender.com",
            tenant=clinic,
            is_primary=False,
        )
        assert clinic.domains.count() == 2
