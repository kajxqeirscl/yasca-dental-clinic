"""
factory_boy factories for the customers (multi-tenant) app.

Schema oluşturma (django-tenants) sadece PostgreSQL'de çalışır. Yerel/CI
SQLite ortamında testlerin geçmesi için ``auto_create_schema=False`` ile
bypass ediyoruz; gerçek schema isolation E2E katmanında doğrulanır.
"""
import factory
from factory.django import DjangoModelFactory

from customers.models import Client, Domain


class ClientFactory(DjangoModelFactory):
    class Meta:
        model = Client
        django_get_or_create = ("schema_name",)

    schema_name = factory.Sequence(lambda n: f"clinic{n}")
    name = factory.Faker("company", locale="tr_TR")
    is_active = True

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        # Test ortamında otomatik schema oluşturmayı atla.
        instance = model_class(*args, **kwargs)
        instance.auto_create_schema = False
        instance.save()
        return instance


class DomainFactory(DjangoModelFactory):
    class Meta:
        model = Domain
        django_get_or_create = ("domain",)

    domain = factory.Sequence(lambda n: f"clinic{n}.localhost")
    tenant = factory.SubFactory(ClientFactory)
    is_primary = True
