"""
Unit tests for DRF serializers.
Tests the nested create/update logic and the appointment conflict validation (F-008).

NOT: Önceki ``Clinic`` modeli django-tenants'a geçişte kaldırıldı; clinic
foreign key referansları temizlendi. Testler default schema'da çalışır.
"""
import pytest
from datetime import date, time

from api.serializers import (
    AppointmentCreateSerializer,
    AppointmentSerializer,
    PatientListSerializer,
    PatientSerializer,
    TreatmentSerializer,
)
from api.models import Anamnesis, Appointment
from api.tests.factories import (
    AppointmentFactory,
    DoctorUserFactory,
    PatientFactory,
    TreatmentFactory,
    TreatmentTypeFactory,
)


@pytest.mark.django_db
class TestPatientSerializer:
    def test_creates_patient_without_anamnesis(self):
        data = {
            "first_name": "Ali",
            "last_name": "Yılmaz",
            "phone": "05551234567",
        }
        serializer = PatientSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        patient = serializer.save()
        assert patient.pk is not None
        assert not Anamnesis.objects.filter(patient=patient).exists()

    def test_creates_patient_with_nested_anamnesis(self):
        data = {
            "first_name": "Ayşe",
            "last_name": "Kaya",
            "phone": "05559876543",
            "anamnesis": {
                "allergies": "Penisilin",
                "chronic_diseases": "Diyabet",
            },
        }
        serializer = PatientSerializer(data=data)
        assert serializer.is_valid(), serializer.errors
        patient = serializer.save()
        anam = Anamnesis.objects.get(patient=patient)
        assert anam.allergies == "Penisilin"
        assert anam.chronic_diseases == "Diyabet"

    def test_updates_existing_anamnesis(self):
        patient = PatientFactory()
        Anamnesis.objects.create(patient=patient, allergies="Aspirin")

        data = {
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "phone": patient.phone,
            "anamnesis": {"allergies": "Penisilin"},
        }
        serializer = PatientSerializer(instance=patient, data=data)
        assert serializer.is_valid(), serializer.errors
        serializer.save()
        patient.anamnesis.refresh_from_db()
        assert patient.anamnesis.allergies == "Penisilin"

    def test_updates_patient_creates_anamnesis_if_missing(self):
        patient = PatientFactory()
        assert not Anamnesis.objects.filter(patient=patient).exists()

        data = {
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "phone": patient.phone,
            "anamnesis": {"smoking": "Evet"},
        }
        serializer = PatientSerializer(instance=patient, data=data)
        assert serializer.is_valid(), serializer.errors
        serializer.save()
        assert Anamnesis.objects.filter(patient=patient).exists()


@pytest.mark.django_db
class TestPatientListSerializerLastVisit:
    def test_last_visit_is_none_when_no_appointments(self):
        patient = PatientFactory()
        serializer = PatientListSerializer(instance=patient)
        assert serializer.data["last_visit"] is None

    def test_last_visit_returns_most_recent_completed_date(self):
        doctor = DoctorUserFactory()
        patient = PatientFactory()
        AppointmentFactory(
            patient=patient,
            doctor=doctor,
            date=date(2026, 1, 10),
            status=Appointment.Status.COMPLETED,
        )
        AppointmentFactory(
            patient=patient,
            doctor=doctor,
            date=date(2026, 3, 20),
            status=Appointment.Status.COMPLETED,
        )
        # A scheduled one should NOT count
        AppointmentFactory(
            patient=patient,
            doctor=doctor,
            date=date(2026, 5, 1),
            status=Appointment.Status.SCHEDULED,
        )
        serializer = PatientListSerializer(instance=patient)
        assert serializer.data["last_visit"] == "2026-03-20"


@pytest.mark.django_db
class TestAppointmentConflictValidation:
    """F-008: same doctor + date + time must be rejected."""

    def _existing_appointment(self):
        doctor = DoctorUserFactory()
        patient = PatientFactory()
        appt = AppointmentFactory(
            patient=patient,
            doctor=doctor,
            date=date(2026, 6, 1),
            time=time(10, 0),
            status=Appointment.Status.SCHEDULED,
        )
        return appt, doctor, patient

    def test_appointment_serializer_rejects_duplicate_slot(self):
        appt, doctor, patient = self._existing_appointment()
        data = {
            "patient": patient.pk,
            "doctor": doctor.pk,
            "date": "2026-06-01",
            "time": "10:00:00",
            "status": "scheduled",
        }
        serializer = AppointmentSerializer(data=data)
        assert not serializer.is_valid()
        assert "non_field_errors" in serializer.errors

    def test_appointment_serializer_skips_conflict_check_on_update(self):
        appt, doctor, patient = self._existing_appointment()
        data = {
            "patient": patient.pk,
            "doctor": doctor.pk,
            "date": "2026-06-01",
            "time": "10:00:00",
            "status": "completed",
            "notes": "",
            "treatment_type": None,
        }
        # Passing instance= means it's an update — should be valid
        serializer = AppointmentSerializer(instance=appt, data=data)
        assert serializer.is_valid(), serializer.errors

    def test_appointment_create_serializer_rejects_duplicate_slot(self):
        appt, doctor, patient = self._existing_appointment()
        data = {
            "patient": patient.pk,
            "doctor": doctor.pk,
            "date": "2026-06-01",
            "time": "10:00:00",
            "status": "scheduled",
        }
        serializer = AppointmentCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert "non_field_errors" in serializer.errors

    def test_different_time_is_valid(self):
        appt, doctor, patient = self._existing_appointment()
        data = {
            "patient": patient.pk,
            "doctor": doctor.pk,
            "date": "2026-06-01",
            "time": "11:00:00",  # different time
            "status": "scheduled",
        }
        serializer = AppointmentCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_cancelled_slot_does_not_block_new_appointment(self):
        doctor = DoctorUserFactory()
        patient = PatientFactory()
        # Existing appointment is CANCELLED — should not block
        AppointmentFactory(
            patient=patient,
            doctor=doctor,
            date=date(2026, 6, 1),
            time=time(10, 0),
            status=Appointment.Status.CANCELLED,
        )
        data = {
            "patient": patient.pk,
            "doctor": doctor.pk,
            "date": "2026-06-01",
            "time": "10:00:00",
            "status": "scheduled",
        }
        serializer = AppointmentCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors


@pytest.mark.django_db
class TestPatientSerializerValidation:
    """Negatif senaryolar: zorunlu alanlar (Ad/Soyad/Telefon) eksik/boş ise reddedilir.

    F-003: Patient modelinde first_name, last_name ve phone zorunludur.
    DRF ModelSerializer bu alanları otomatik 'required' kabul eder.
    """

    def test_rejects_missing_phone(self):
        data = {"first_name": "Ali", "last_name": "Yılmaz"}  # phone yok
        serializer = PatientSerializer(data=data)
        assert not serializer.is_valid()
        assert "phone" in serializer.errors

    def test_rejects_blank_first_name(self):
        data = {"first_name": "", "last_name": "Yılmaz", "phone": "05551234567"}
        serializer = PatientSerializer(data=data)
        assert not serializer.is_valid()
        assert "first_name" in serializer.errors


@pytest.mark.django_db
class TestTreatmentSerializerValidation:
    """Tedavi tekrarı kontrolü (validate): aynı hasta + gün + diş + tedavi türü
    ikinci kez eklenemez. Farklı diş numarası ise sorun yok."""

    def _existing_treatment(self):
        doctor = DoctorUserFactory()
        patient = PatientFactory()
        ttype = TreatmentTypeFactory()
        treatment = TreatmentFactory(
            patient=patient,
            doctor=doctor,
            treatment_type=ttype,
            teeth=["11"],
            date=date(2026, 6, 1),
        )
        return treatment, doctor, patient, ttype

    def test_allows_different_tooth_same_day(self):
        _, doctor, patient, ttype = self._existing_treatment()
        data = {
            "patient": patient.pk,
            "doctor": doctor.pk,
            "treatment_type": ttype.pk,
            "teeth": ["21"],  # farklı diş → çakışma yok
            "date": "2026-06-01",
            "status": "completed",
            "price": "150.00",
        }
        serializer = TreatmentSerializer(data=data)
        assert serializer.is_valid(), serializer.errors

    def test_rejects_duplicate_tooth_same_day(self):
        _, doctor, patient, ttype = self._existing_treatment()
        data = {
            "patient": patient.pk,
            "doctor": doctor.pk,
            "treatment_type": ttype.pk,
            "teeth": ["11"],  # aynı diş + aynı gün + aynı tür → çakışma
            "date": "2026-06-01",
            "status": "completed",
            "price": "150.00",
        }
        serializer = TreatmentSerializer(data=data)
        assert not serializer.is_valid()
        assert "non_field_errors" in serializer.errors
