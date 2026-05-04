"""
Integration tests for all API views/endpoints.
Uses DRF's APIClient. Covers auth, multi-tenancy, CRUD, RBAC, dashboard, doctor list.
"""
import pytest
from datetime import date, time, timedelta

from rest_framework.test import APIClient
from rest_framework import status

from api.models import Appointment, Patient, Treatment, Payment
from api.tests.factories import (
    ClinicFactory, AdminUserFactory, DoctorUserFactory, AssistantUserFactory,
    PatientFactory, AppointmentFactory, TreatmentTypeFactory, TreatmentFactory,
    PaymentFactory,
)


def auth_client(user):
    """Return APIClient authenticated as `user` via JWT."""
    client = APIClient()
    res = client.post(
        "/api/auth/token/",
        {"username": user.username, "password": "testpass123!"},
        format="json",
    )
    assert res.status_code == 200, f"Login failed for {user.username}: {res.data}"
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
    return client


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAuthentication:
    def test_login_returns_tokens(self):
        user = AssistantUserFactory()
        client = APIClient()
        res = client.post("/api/auth/token/", {"username": user.username, "password": "testpass123!"}, format="json")
        assert res.status_code == 200
        assert "access" in res.data and "refresh" in res.data

    def test_login_invalid_credentials_returns_401(self):
        user = AssistantUserFactory()
        client = APIClient()
        res = client.post("/api/auth/token/", {"username": user.username, "password": "wrong"}, format="json")
        assert res.status_code == 401

    def test_current_user_returns_correct_data(self):
        user = DoctorUserFactory()
        res = auth_client(user).get("/api/auth/me/")
        assert res.status_code == 200
        assert res.data["username"] == user.username
        assert res.data["role"] == "doctor"

    def test_current_user_requires_auth(self):
        assert APIClient().get("/api/auth/me/").status_code == 401


# ---------------------------------------------------------------------------
# Multi-tenancy isolation
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestMultiTenancyIsolation:
    def setup_method(self):
        self.clinic_a = ClinicFactory()
        self.clinic_b = ClinicFactory()
        self.user_a = AssistantUserFactory(clinic=self.clinic_a)
        self.user_b = AssistantUserFactory(clinic=self.clinic_b)

    def _results(self, res):
        return res.data.get("results", res.data)

    def test_patient_list_filtered_by_clinic(self):
        pa = PatientFactory(clinic=self.clinic_a)
        PatientFactory(clinic=self.clinic_b)
        res = auth_client(self.user_a).get("/api/patients/")
        ids = [p["id"] for p in self._results(res)]
        assert pa.pk in ids
        for pid in ids:
            assert Patient.objects.get(pk=pid).clinic == self.clinic_a

    def test_appointment_list_filtered_by_clinic(self):
        da = DoctorUserFactory(clinic=self.clinic_a)
        db = DoctorUserFactory(clinic=self.clinic_b)
        pa = PatientFactory(clinic=self.clinic_a)
        pb = PatientFactory(clinic=self.clinic_b)
        appt_a = AppointmentFactory(clinic=self.clinic_a, patient=pa, doctor=da)
        AppointmentFactory(clinic=self.clinic_b, patient=pb, doctor=db)
        res = auth_client(self.user_a).get("/api/appointments/")
        ids = [a["id"] for a in self._results(res)]
        assert appt_a.pk in ids
        for aid in ids:
            assert Appointment.objects.get(pk=aid).clinic == self.clinic_a

    def test_treatment_list_filtered_by_clinic(self):
        da = DoctorUserFactory(clinic=self.clinic_a)
        db = DoctorUserFactory(clinic=self.clinic_b)
        pa = PatientFactory(clinic=self.clinic_a)
        pb = PatientFactory(clinic=self.clinic_b)
        TreatmentFactory(clinic=self.clinic_a, patient=pa, doctor=da)
        TreatmentFactory(clinic=self.clinic_b, patient=pb, doctor=db)
        res = auth_client(self.user_a).get("/api/treatments/")
        for item in self._results(res):
            assert Treatment.objects.get(pk=item["id"]).clinic == self.clinic_a

    def test_payment_list_filtered_by_clinic(self):
        pa = PatientFactory(clinic=self.clinic_a)
        pb = PatientFactory(clinic=self.clinic_b)
        PaymentFactory(clinic=self.clinic_a, patient=pa)
        PaymentFactory(clinic=self.clinic_b, patient=pb)
        res = auth_client(self.user_a).get("/api/payments/")
        for item in self._results(res):
            assert Payment.objects.get(pk=item["id"]).clinic == self.clinic_a

    def test_perform_create_assigns_clinic_automatically(self):
        res = auth_client(self.user_a).post(
            "/api/patients/",
            {"first_name": "Test", "last_name": "Hasta", "phone": "05551234567"},
            format="json",
        )
        assert res.status_code == 201
        assert Patient.objects.get(pk=res.data["id"]).clinic == self.clinic_a


# ---------------------------------------------------------------------------
# Patient CRUD
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestPatientCRUD:
    def setup_method(self):
        self.clinic = ClinicFactory()
        self.user = AssistantUserFactory(clinic=self.clinic)
        self.client = auth_client(self.user)

    def _results(self, res):
        return res.data.get("results", res.data)

    def test_patient_list(self):
        PatientFactory.create_batch(3, clinic=self.clinic)
        assert len(self._results(self.client.get("/api/patients/"))) >= 3

    def test_patient_search_by_name(self):
        PatientFactory(clinic=self.clinic, first_name="Mehmet", last_name="Demir")
        PatientFactory(clinic=self.clinic, first_name="Fatma", last_name="Sahin")
        results = self._results(self.client.get("/api/patients/?search=Mehmet"))
        assert len(results) == 1 and results[0]["first_name"] == "Mehmet"

    def test_patient_search_by_phone(self):
        PatientFactory(clinic=self.clinic, phone="05550000001")
        PatientFactory(clinic=self.clinic, phone="05550000002")
        assert len(self._results(self.client.get("/api/patients/?search=05550000001"))) == 1

    def test_patient_create(self):
        res = self.client.post("/api/patients/", {"first_name": "Yeni", "last_name": "Hasta", "phone": "05551112233"}, format="json")
        assert res.status_code == 201

    def test_patient_detail(self):
        patient = PatientFactory(clinic=self.clinic)
        res = self.client.get(f"/api/patients/{patient.pk}/")
        assert res.status_code == 200 and res.data["id"] == patient.pk

    def test_patient_update(self):
        patient = PatientFactory(clinic=self.clinic, first_name="Eski")
        res = self.client.put(f"/api/patients/{patient.pk}/", {"first_name": "Yeni", "last_name": patient.last_name, "phone": patient.phone}, format="json")
        assert res.status_code == 200
        patient.refresh_from_db()
        assert patient.first_name == "Yeni"

    def test_patient_create_requires_auth(self):
        assert APIClient().post("/api/patients/", {"first_name": "A", "last_name": "B", "phone": "1"}, format="json").status_code == 401


# ---------------------------------------------------------------------------
# Appointment CRUD
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAppointmentCRUD:
    def setup_method(self):
        self.clinic = ClinicFactory()
        self.user = AssistantUserFactory(clinic=self.clinic)
        self.doctor = DoctorUserFactory(clinic=self.clinic)
        self.patient = PatientFactory(clinic=self.clinic)
        self.client = auth_client(self.user)

    def _payload(self, appt_date="2026-08-01", appt_time="09:00:00"):
        return {"patient": self.patient.pk, "doctor": self.doctor.pk, "date": appt_date, "time": appt_time, "status": "scheduled"}

    def _results(self, res):
        return res.data.get("results", res.data)

    def test_appointment_list_by_date(self):
        AppointmentFactory(clinic=self.clinic, patient=self.patient, doctor=self.doctor, date=date(2026, 8, 1))
        AppointmentFactory(clinic=self.clinic, patient=self.patient, doctor=self.doctor, date=date(2026, 8, 2), time="10:00:00")
        results = self._results(self.client.get("/api/appointments/?date=2026-08-01"))
        assert all(a["date"] == "2026-08-01" for a in results)

    def test_appointment_list_by_patient(self):
        other = PatientFactory(clinic=self.clinic)
        AppointmentFactory(clinic=self.clinic, patient=self.patient, doctor=self.doctor)
        AppointmentFactory(clinic=self.clinic, patient=other, doctor=self.doctor, time="11:00:00")
        results = self._results(self.client.get(f"/api/appointments/?patient={self.patient.pk}"))
        assert all(a["patient"] == self.patient.pk for a in results)

    def test_appointment_create(self):
        assert self.client.post("/api/appointments/", self._payload(), format="json").status_code == 201

    def test_appointment_conflict_returns_400(self):
        AppointmentFactory(clinic=self.clinic, patient=self.patient, doctor=self.doctor,
                           date=date(2026, 8, 1), time=time(9, 0), status=Appointment.Status.SCHEDULED)
        assert self.client.post("/api/appointments/", self._payload(), format="json").status_code == 400

    def test_appointment_status_update(self):
        appt = AppointmentFactory(clinic=self.clinic, patient=self.patient, doctor=self.doctor, status=Appointment.Status.SCHEDULED)
        res = self.client.patch(f"/api/appointments/{appt.pk}/", {"status": "completed"}, format="json")
        assert res.status_code == 200
        appt.refresh_from_db()
        assert appt.status == Appointment.Status.COMPLETED

    def test_appointment_delete(self):
        appt = AppointmentFactory(clinic=self.clinic, patient=self.patient, doctor=self.doctor)
        assert self.client.delete(f"/api/appointments/{appt.pk}/").status_code == 204
        assert not Appointment.objects.filter(pk=appt.pk).exists()


# ---------------------------------------------------------------------------
# Treatment Types — RBAC
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTreatmentTypeRBAC:
    def setup_method(self):
        self.clinic = ClinicFactory()
        self.admin = AdminUserFactory(clinic=self.clinic)
        self.doctor = DoctorUserFactory(clinic=self.clinic)
        self.assistant = AssistantUserFactory(clinic=self.clinic)

    def _payload(self):
        return {"name": "Yeni Tedavi", "default_price": "150.00", "is_active": True}

    def test_list_accessible_by_assistant(self):
        TreatmentTypeFactory(clinic=self.clinic)
        assert auth_client(self.assistant).get("/api/treatment-types/").status_code == 200

    def test_create_allowed_for_doctor(self):
        assert auth_client(self.doctor).post("/api/treatment-types/", self._payload(), format="json").status_code == 201

    def test_create_allowed_for_admin(self):
        assert auth_client(self.admin).post("/api/treatment-types/", self._payload(), format="json").status_code == 201

    def test_create_blocked_for_assistant(self):
        assert auth_client(self.assistant).post("/api/treatment-types/", self._payload(), format="json").status_code == 403

    def test_delete_blocked_for_assistant(self):
        tt = TreatmentTypeFactory(clinic=self.clinic)
        assert auth_client(self.assistant).delete(f"/api/treatment-types/{tt.pk}/").status_code == 403


# ---------------------------------------------------------------------------
# Clinic Settings — Admin only for writes
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestClinicSettings:
    def setup_method(self):
        self.clinic = ClinicFactory()
        self.admin = AdminUserFactory(clinic=self.clinic)
        self.doctor = DoctorUserFactory(clinic=self.clinic)
        self.assistant = AssistantUserFactory(clinic=self.clinic)

    def _payload(self):
        return {"work_start_time": "08:00:00", "work_end_time": "17:00:00", "work_days": [1, 2, 3, 4, 5]}

    def test_get_accessible_by_all_roles(self):
        for user in [self.admin, self.doctor, self.assistant]:
            assert auth_client(user).get("/api/settings/clinic/").status_code == 200

    def test_put_allowed_for_admin(self):
        assert auth_client(self.admin).put("/api/settings/clinic/", self._payload(), format="json").status_code == 200

    def test_put_blocked_for_doctor(self):
        assert auth_client(self.doctor).put("/api/settings/clinic/", self._payload(), format="json").status_code == 403

    def test_put_blocked_for_assistant(self):
        assert auth_client(self.assistant).put("/api/settings/clinic/", self._payload(), format="json").status_code == 403


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestDashboardView:
    def setup_method(self):
        from django.utils import timezone
        self.today = timezone.localdate()
        self.clinic = ClinicFactory()
        self.user = AssistantUserFactory(clinic=self.clinic)
        self.doctor = DoctorUserFactory(clinic=self.clinic)
        self.patient = PatientFactory(clinic=self.clinic)
        self.client = auth_client(self.user)

    def test_returns_only_today_appointments(self):
        AppointmentFactory(clinic=self.clinic, patient=self.patient, doctor=self.doctor, date=self.today, status=Appointment.Status.SCHEDULED)
        yesterday = self.today - timedelta(days=1)
        AppointmentFactory(clinic=self.clinic, patient=self.patient, doctor=self.doctor, date=yesterday, status=Appointment.Status.SCHEDULED, time="09:30:00")
        res = self.client.get("/api/dashboard/today/")
        assert res.status_code == 200
        for appt in res.data["today_appointments"]:
            assert appt["date"] == str(self.today)

    def test_excludes_cancelled_appointments(self):
        AppointmentFactory(clinic=self.clinic, patient=self.patient, doctor=self.doctor, date=self.today, status=Appointment.Status.CANCELLED)
        AppointmentFactory(clinic=self.clinic, patient=self.patient, doctor=self.doctor, date=self.today, time="11:00:00", status=Appointment.Status.SCHEDULED)
        res = self.client.get("/api/dashboard/today/")
        statuses = [a["status"] for a in res.data["today_appointments"]]
        assert "cancelled" not in statuses

    def test_counts_are_correct(self):
        PatientFactory.create_batch(2, clinic=self.clinic)
        AppointmentFactory(clinic=self.clinic, patient=self.patient, doctor=self.doctor, date=self.today, status=Appointment.Status.COMPLETED)
        AppointmentFactory(clinic=self.clinic, patient=self.patient, doctor=self.doctor, date=self.today, time="11:00:00", status=Appointment.Status.SCHEDULED)
        res = self.client.get("/api/dashboard/today/")
        assert res.data["today_completed"] == 1
        assert res.data["today_total"] == 2


# ---------------------------------------------------------------------------
# Doctor list
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestDoctorListView:
    def setup_method(self):
        self.clinic = ClinicFactory()
        self.user = AssistantUserFactory(clinic=self.clinic)

    def test_returns_only_doctors(self):
        doctor = DoctorUserFactory(clinic=self.clinic)
        AdminUserFactory(clinic=self.clinic)
        AssistantUserFactory(clinic=self.clinic)
        res = auth_client(self.user).get("/api/doctors/")
        assert res.status_code == 200 and len(res.data) == 1 and res.data[0]["id"] == doctor.pk

    def test_scoped_to_clinic(self):
        DoctorUserFactory(clinic=self.clinic)
        DoctorUserFactory(clinic=ClinicFactory())
        res = auth_client(self.user).get("/api/doctors/")
        assert res.status_code == 200 and len(res.data) == 1
