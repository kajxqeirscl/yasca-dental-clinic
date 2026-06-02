"""
api app test fixture'ları.

NOT: Önceki `Clinic` modeli django-tenants'a geçişte kaldırıldı. Çok-kiracılı
izolasyon artık PostgreSQL schema-per-tenant ile sağlanıyor; testler default
schema'da çalışır ve clinic foreign key fixture'ı kullanmaz.
"""
import pytest
from django.test import RequestFactory
from rest_framework.test import APIClient

from .factories import (
    AdminUserFactory,
    AssistantUserFactory,
    DoctorUserFactory,
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def rf():
    return RequestFactory()


@pytest.fixture
def admin_user(db):
    return AdminUserFactory()


@pytest.fixture
def doctor_user(db):
    return DoctorUserFactory()


@pytest.fixture
def assistant_user(db):
    return AssistantUserFactory()


@pytest.fixture
def admin_client(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def doctor_client(api_client, doctor_user):
    api_client.force_authenticate(user=doctor_user)
    return api_client


@pytest.fixture
def assistant_client(api_client, assistant_user):
    api_client.force_authenticate(user=assistant_user)
    return api_client
