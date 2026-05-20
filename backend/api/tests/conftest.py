import pytest
from rest_framework.test import APIClient
from .factories import (
    ClinicFactory,
    AdminUserFactory,
    DoctorUserFactory,
    AssistantUserFactory,
)

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def clinic(db):
    return ClinicFactory()

@pytest.fixture
def admin_user(db, clinic):
    return AdminUserFactory(clinic=clinic)

@pytest.fixture
def doctor_user(db, clinic):
    return DoctorUserFactory(clinic=clinic)

@pytest.fixture
def assistant_user(db, clinic):
    return AssistantUserFactory(clinic=clinic)

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
