"""
Unit tests for api.models — properties, __str__, class-methods.

NOT: Önceki ``Clinic`` modeli ve modellerdeki ``clinic`` foreign key
django-tenants migrasyonu sırasında kaldırıldı. Çok-kiracılı izolasyon
artık PostgreSQL schema-per-tenant ile sağlanıyor; bu birim testler
default schema'da çalışır.
"""
import pytest
from django.utils import timezone

from api.models import (
    ClinicSettings,
    Patient,
    patient_directory_path,
)
from api.tests.factories import (
    AdminUserFactory,
    AssistantUserFactory,
    DoctorUserFactory,
    PatientFactory,
    TreatmentFactory,
    TreatmentTypeFactory,
)


@pytest.mark.django_db
class TestCustomUserRoleProperties:
    def test_doctor_is_hekim(self):
        user = DoctorUserFactory()
        assert user.is_hekim is True
        assert user.is_asistan is False
        assert user.is_yonetici is False

    def test_assistant_is_asistan(self):
        user = AssistantUserFactory()
        assert user.is_asistan is True
        assert user.is_hekim is False
        assert user.is_yonetici is False

    def test_admin_is_yonetici(self):
        user = AdminUserFactory()
        assert user.is_yonetici is True
        assert user.is_hekim is False
        assert user.is_asistan is False

    def test_superuser_is_yonetici_regardless_of_role(self):
        user = AssistantUserFactory(is_superuser=True)
        assert user.is_yonetici is True

    def test_get_role_display_doctor(self):
        user = DoctorUserFactory()
        assert user.get_role_display() == "Hekim"

    def test_get_role_display_admin(self):
        user = AdminUserFactory()
        assert user.get_role_display() == "Yönetici"

    def test_get_role_display_assistant(self):
        user = AssistantUserFactory()
        assert user.get_role_display() == "Asistan"


@pytest.mark.django_db
class TestPatientModel:
    def test_full_name_property(self):
        patient = PatientFactory(first_name="Ali", last_name="Yılmaz")
        assert patient.full_name == "Ali Yılmaz"

    def test_str_representation(self):
        patient = PatientFactory(first_name="Ayşe", last_name="Kaya")
        assert str(patient) == "Ayşe Kaya"

    def test_ordering_by_last_then_first_name(self):
        PatientFactory(first_name="Zeynep", last_name="Arslan")
        PatientFactory(first_name="Ali", last_name="Çelik")
        patients = list(Patient.objects.all())
        assert patients[0].last_name <= patients[1].last_name


@pytest.mark.django_db
class TestClinicSettingsGetSettings:
    def test_creates_singleton_if_missing(self):
        settings = ClinicSettings.get_settings()
        assert settings is not None
        assert settings.pk == 1

    def test_returns_same_object_on_second_call(self):
        s1 = ClinicSettings.get_settings()
        s2 = ClinicSettings.get_settings()
        assert s1.pk == s2.pk


@pytest.mark.django_db
class TestTreatmentModel:
    def test_str_uses_treatment_type_name_when_set(self):
        tt = TreatmentTypeFactory(name="Kanal Tedavisi")
        treatment = TreatmentFactory(
            treatment_type=tt,
            treatment_name="",
            date=timezone.localdate(),
        )
        assert "Kanal Tedavisi" in str(treatment)

    def test_str_falls_back_to_treatment_name(self):
        treatment = TreatmentFactory(
            treatment_type=None,
            treatment_name="Özel İşlem",
            date=timezone.localdate(),
        )
        assert "Özel İşlem" in str(treatment)


@pytest.mark.django_db
class TestPatientDirectoryPath:
    def test_generates_correct_path(self):
        patient = PatientFactory()

        class FakeInstance:
            pass

        instance = FakeInstance()
        instance.patient = patient
        path = patient_directory_path(instance, "xray.png")
        assert path == f"patients/patient_{patient.id}/xray.png"
