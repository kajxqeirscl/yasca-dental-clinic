"""
Unit tests for custom DRF permission classes.
Tests use a simple mock request / view pattern — no database hit needed.
"""
import pytest
from unittest.mock import MagicMock

from api.permissions import IsAdminUser, IsAdminOrDoctorUser
from api.models import CustomUser


def make_request(role=None, is_authenticated=True):
    """Build a minimal mock request with a user attached."""
    request = MagicMock()
    if not is_authenticated:
        request.user = MagicMock(is_authenticated=False)
    else:
        request.user = MagicMock(is_authenticated=True, role=role)
    return request


class TestIsAdminUser:
    """IsAdminUser: only 'admin' role passes."""

    def test_allows_admin(self):
        perm = IsAdminUser()
        assert perm.has_permission(make_request(role="admin"), None) is True

    def test_blocks_doctor(self):
        perm = IsAdminUser()
        assert perm.has_permission(make_request(role="doctor"), None) is False

    def test_blocks_assistant(self):
        perm = IsAdminUser()
        assert perm.has_permission(make_request(role="assistant"), None) is False

    def test_blocks_unauthenticated(self):
        perm = IsAdminUser()
        assert perm.has_permission(make_request(is_authenticated=False), None) is False


class TestIsAdminOrDoctorUser:
    """IsAdminOrDoctorUser: 'admin' and 'doctor' pass; 'assistant' blocked."""

    def test_allows_admin(self):
        perm = IsAdminOrDoctorUser()
        assert perm.has_permission(make_request(role="admin"), None) is True

    def test_allows_doctor(self):
        perm = IsAdminOrDoctorUser()
        assert perm.has_permission(make_request(role="doctor"), None) is True

    def test_blocks_assistant(self):
        perm = IsAdminOrDoctorUser()
        assert perm.has_permission(make_request(role="assistant"), None) is False

    def test_blocks_unauthenticated(self):
        perm = IsAdminOrDoctorUser()
        assert perm.has_permission(make_request(is_authenticated=False), None) is False
