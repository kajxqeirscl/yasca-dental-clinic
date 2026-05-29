"""
seed_demo_data smoke testleri.

Komut yoğun olarak django-tenants ``schema_context`` ve PostgreSQL'e özel
``DROP SCHEMA CASCADE`` SQL kullanır; bu yüzden SQLite test ortamında
sadece komutun varlığını + Public tenant oluşturma adımını doğruluyoruz.
Tam senaryo CI PostgreSQL ortamında E2E ile gerekli.
"""
from contextlib import contextmanager

import pytest
from django.core.management import call_command, get_commands

from customers.models import Client, Domain


class TestSeedDemoDataCommand:
    def test_command_is_registered(self):
        assert "seed_demo_data" in get_commands()

    def test_command_help_text(self):
        from api.management.commands.seed_demo_data import Command

        assert "Demo" in Command.help or "demo" in Command.help

    def test_command_class_imports_cleanly(self):
        from api.management.commands.seed_demo_data import Command
        from django.core.management.base import BaseCommand

        assert issubclass(Command, BaseCommand)
        assert hasattr(Command, "_seed_tenant_data")


@pytest.mark.django_db
class TestSeedDemoDataPublicTenant:
    """Sadece komutun "public tenant oluşturma" adımını izole şekilde test eder."""

    @pytest.fixture
    def mocked_command(self, monkeypatch):
        """Tenant data seeding'i no-op'a indirgeyerek sadece public tenant
        bootstrap'ını çalıştırır. PostgreSQL-specific kısımlar bypass edilir."""
        from api.management.commands import seed_demo_data as seed_mod

        # _seed_tenant_data tenant data oluşturma için heavy iş yapar;
        # smoke test için no-op.
        monkeypatch.setattr(
            seed_mod.Command, "_seed_tenant_data", lambda self, t, c: None
        )

        # DROP SCHEMA CASCADE PostgreSQL-only — no-op cursor.
        class _NoopCursor:
            def __enter__(self): return self
            def __exit__(self, *a): return False
            def execute(self, _sql): return None

        class _NoopConnection:
            def cursor(self): return _NoopCursor()

        # ``from django.db import connection`` handle() içinde yapılıyor,
        # bu yüzden django.db modülündeki connection sembolünü değiştiriyoruz.
        monkeypatch.setattr("django.db.connection", _NoopConnection())

        # schema_context — SQLite'te no-op.
        @contextmanager
        def noop_ctx(_name):
            yield
        monkeypatch.setattr(seed_mod, "schema_context", noop_ctx)

        # Client.save() schema oluşturmasın.
        original_save = Client.save

        def patched_save(self, *args, **kwargs):
            self.auto_create_schema = False
            return original_save(self, *args, **kwargs)

        monkeypatch.setattr(Client, "save", patched_save)

    def test_creates_public_tenant_when_missing(self, mocked_command):
        assert not Client.objects.filter(schema_name="public").exists()

        call_command("seed_demo_data")

        public = Client.objects.get(schema_name="public")
        assert public.name == "Yasca Dental SaaS"
        assert public.is_active is True

    def test_creates_localhost_domain_for_public(self, mocked_command):
        call_command("seed_demo_data")

        assert Domain.objects.filter(
            domain="localhost", tenant__schema_name="public"
        ).exists()

    def test_idempotent_public_tenant(self, mocked_command):
        """Komut tekrar çalıştırıldığında public tenant ikinci kez oluşturulmamalı."""
        call_command("seed_demo_data")
        call_command("seed_demo_data")

        public_count = Client.objects.filter(schema_name="public").count()
        assert public_count == 1
