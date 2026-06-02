"""
Unit tests for Django signals — group assignment and is_staff promotion.

NOT: Önceki ``Clinic`` modeli django-tenants'a geçişte kaldırıldı.
Test'ler default schema'da çalışır; clinic foreign key kullanmaz.
"""
import pytest

from api.models import CustomUser
from api.tests.factories import (
    AdminUserFactory,
    AssistantUserFactory,
    DoctorUserFactory,
)


@pytest.mark.django_db
class TestRoleGroupSignal:
    def test_doctor_assigned_to_hekim_group(self):
        user = DoctorUserFactory()
        group_names = list(user.groups.values_list("name", flat=True))
        assert "Hekim" in group_names

    def test_assistant_assigned_to_asistan_group(self):
        user = AssistantUserFactory()
        group_names = list(user.groups.values_list("name", flat=True))
        assert "Asistan" in group_names

    def test_admin_assigned_to_yonetici_group(self):
        user = AdminUserFactory()
        group_names = list(user.groups.values_list("name", flat=True))
        assert "Yönetici" in group_names

    def test_admin_gets_is_staff_true(self):
        user = AdminUserFactory()
        user.refresh_from_db()
        assert user.is_staff is True

    def test_non_admin_does_not_get_is_staff(self):
        user = DoctorUserFactory()
        user.refresh_from_db()
        assert user.is_staff is False

    def test_role_change_updates_group(self):
        """Changing a doctor to assistant should swap their group membership."""
        user = DoctorUserFactory()
        assert "Hekim" in list(user.groups.values_list("name", flat=True))

        user.role = CustomUser.Role.ASSISTANT
        user.save()

        group_names = list(user.groups.values_list("name", flat=True))
        assert "Asistan" in group_names
        assert "Hekim" not in group_names
