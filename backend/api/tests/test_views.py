"""
Integration tests for all API views/endpoints.
Uses DRF's APIClient. Covers auth, CRUD, RBAC, dashboard, doctor list.

NOT: Önceki ``Clinic`` modeli django-tenants'a geçişte kaldırıldı. Çok-kiracılı
izolasyon artık PostgreSQL schema-per-tenant (django-tenants) ile sağlanır;
view seviyesinde test edilemez. Cross-tenant isolation E2E test'lerle
(frontend/e2e/) doğrulanır. Bu dosya tek schema üzerinde CRUD/RBAC kapsar.
"""
import pytest
from datetime import date, time, timedelta

from rest_framework.test import APIClient

from api.models import Appointment
from api.tests.factories import (
    AdminUserFactory,
    AppointmentFactory,
    AssistantUserFactory,
    DoctorUserFactory,
    PatientFactory,
    TreatmentTypeFactory,
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
        res = client.post(
            "/api/auth/token/",
            {"username": user.username, "password": "testpass123!"},
            format="json",
        )
        assert res.status_code == 200
        assert "access" in res.data and "refresh" in res.data

    def test_login_invalid_credentials_returns_401(self):
        user = AssistantUserFactory()
        client = APIClient()
        res = client.post(
            "/api/auth/token/",
            {"username": user.username, "password": "wrong"},
            format="json",
        )
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
# Patient CRUD
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestPatientCRUD:
    def setup_method(self):
        self.user = AssistantUserFactory()
        self.client = auth_client(self.user)

    def _results(self, res):
        return res.data.get("results", res.data)

    def test_patient_list(self):
        PatientFactory.create_batch(3)
        assert len(self._results(self.client.get("/api/patients/"))) >= 3

    def test_patient_search_by_name(self):
        PatientFactory(first_name="Mehmet", last_name="Demir")
        PatientFactory(first_name="Fatma", last_name="Sahin")
        results = self._results(self.client.get("/api/patients/?search=Mehmet"))
        assert len(results) == 1 and results[0]["first_name"] == "Mehmet"

    def test_patient_search_by_phone(self):
        PatientFactory(phone="05550000001")
        PatientFactory(phone="05550000002")
        assert (
            len(self._results(self.client.get("/api/patients/?search=05550000001")))
            == 1
        )

    def test_patient_create(self):
        res = self.client.post(
            "/api/patients/",
            {"first_name": "Yeni", "last_name": "Hasta", "phone": "05551112233"},
            format="json",
        )
        assert res.status_code == 201

    def test_patient_detail(self):
        patient = PatientFactory()
        res = self.client.get(f"/api/patients/{patient.pk}/")
        assert res.status_code == 200 and res.data["id"] == patient.pk

    def test_patient_update(self):
        patient = PatientFactory(first_name="Eski")
        res = self.client.put(
            f"/api/patients/{patient.pk}/",
            {
                "first_name": "Yeni",
                "last_name": patient.last_name,
                "phone": patient.phone,
            },
            format="json",
        )
        assert res.status_code == 200
        patient.refresh_from_db()
        assert patient.first_name == "Yeni"

    def test_patient_create_requires_auth(self):
        assert (
            APIClient()
            .post(
                "/api/patients/",
                {"first_name": "A", "last_name": "B", "phone": "1"},
                format="json",
            )
            .status_code
            == 401
        )


# ---------------------------------------------------------------------------
# Appointment CRUD
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAppointmentCRUD:
    def setup_method(self):
        self.user = AssistantUserFactory()
        self.doctor = DoctorUserFactory()
        self.patient = PatientFactory()
        self.client = auth_client(self.user)

    def _payload(self, appt_date="2026-08-01", appt_time="09:00:00"):
        return {
            "patient": self.patient.pk,
            "doctor": self.doctor.pk,
            "date": appt_date,
            "time": appt_time,
            "status": "scheduled",
        }

    def _results(self, res):
        return res.data.get("results", res.data)

    def test_appointment_list_by_date(self):
        AppointmentFactory(patient=self.patient, doctor=self.doctor, date=date(2026, 8, 1))
        AppointmentFactory(
            patient=self.patient,
            doctor=self.doctor,
            date=date(2026, 8, 2),
            time="10:00:00",
        )
        results = self._results(self.client.get("/api/appointments/?date=2026-08-01"))
        assert all(a["date"] == "2026-08-01" for a in results)

    def test_appointment_list_by_patient(self):
        other = PatientFactory()
        AppointmentFactory(patient=self.patient, doctor=self.doctor)
        AppointmentFactory(patient=other, doctor=self.doctor, time="11:00:00")
        results = self._results(
            self.client.get(f"/api/appointments/?patient={self.patient.pk}")
        )
        assert all(a["patient"] == self.patient.pk for a in results)

    def test_appointment_create(self):
        assert (
            self.client.post("/api/appointments/", self._payload(), format="json").status_code
            == 201
        )

    def test_appointment_conflict_returns_400(self):
        AppointmentFactory(
            patient=self.patient,
            doctor=self.doctor,
            date=date(2026, 8, 1),
            time=time(9, 0),
            status=Appointment.Status.SCHEDULED,
        )
        assert (
            self.client.post("/api/appointments/", self._payload(), format="json").status_code
            == 400
        )

    def test_appointment_status_update(self):
        appt = AppointmentFactory(
            patient=self.patient,
            doctor=self.doctor,
            status=Appointment.Status.SCHEDULED,
        )
        res = self.client.patch(
            f"/api/appointments/{appt.pk}/", {"status": "completed"}, format="json"
        )
        assert res.status_code == 200
        appt.refresh_from_db()
        assert appt.status == Appointment.Status.COMPLETED

    def test_appointment_delete(self):
        appt = AppointmentFactory(patient=self.patient, doctor=self.doctor)
        assert self.client.delete(f"/api/appointments/{appt.pk}/").status_code == 204
        appt.refresh_from_db()
        assert appt.is_active is False


# ---------------------------------------------------------------------------
# Treatment Types — RBAC
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTreatmentTypeRBAC:
    def setup_method(self):
        self.admin = AdminUserFactory()
        self.doctor = DoctorUserFactory()
        self.assistant = AssistantUserFactory()

    def _payload(self):
        return {"name": "Yeni Tedavi", "default_price": "150.00", "is_active": True}

    def test_list_accessible_by_assistant(self):
        TreatmentTypeFactory()
        assert auth_client(self.assistant).get("/api/treatment-types/").status_code == 200

    def test_create_allowed_for_doctor(self):
        assert (
            auth_client(self.doctor)
            .post("/api/treatment-types/", self._payload(), format="json")
            .status_code
            == 201
        )

    def test_create_allowed_for_admin(self):
        assert (
            auth_client(self.admin)
            .post("/api/treatment-types/", self._payload(), format="json")
            .status_code
            == 201
        )

    def test_create_blocked_for_assistant(self):
        assert (
            auth_client(self.assistant)
            .post("/api/treatment-types/", self._payload(), format="json")
            .status_code
            == 403
        )

    def test_delete_blocked_for_assistant(self):
        tt = TreatmentTypeFactory()
        assert (
            auth_client(self.assistant)
            .delete(f"/api/treatment-types/{tt.pk}/")
            .status_code
            == 403
        )


# ---------------------------------------------------------------------------
# Clinic Settings — Admin only for writes
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestClinicSettings:
    def setup_method(self):
        self.admin = AdminUserFactory()
        self.doctor = DoctorUserFactory()
        self.assistant = AssistantUserFactory()

    def _payload(self):
        return {
            "work_start_time": "08:00:00",
            "work_end_time": "17:00:00",
            "work_days": [1, 2, 3, 4, 5],
        }

    def test_get_accessible_by_all_roles(self):
        for user in [self.admin, self.doctor, self.assistant]:
            assert auth_client(user).get("/api/settings/clinic/").status_code == 200

    def test_put_allowed_for_admin(self):
        assert (
            auth_client(self.admin)
            .put("/api/settings/clinic/", self._payload(), format="json")
            .status_code
            == 200
        )

    def test_put_blocked_for_doctor(self):
        assert (
            auth_client(self.doctor)
            .put("/api/settings/clinic/", self._payload(), format="json")
            .status_code
            == 403
        )

    def test_put_blocked_for_assistant(self):
        assert (
            auth_client(self.assistant)
            .put("/api/settings/clinic/", self._payload(), format="json")
            .status_code
            == 403
        )


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestDashboardView:
    def setup_method(self):
        from django.utils import timezone

        self.today = timezone.localdate()
        self.user = AssistantUserFactory()
        self.doctor = DoctorUserFactory()
        self.patient = PatientFactory()
        self.client = auth_client(self.user)

    def test_returns_only_today_appointments(self):
        AppointmentFactory(
            patient=self.patient,
            doctor=self.doctor,
            date=self.today,
            status=Appointment.Status.SCHEDULED,
        )
        yesterday = self.today - timedelta(days=1)
        AppointmentFactory(
            patient=self.patient,
            doctor=self.doctor,
            date=yesterday,
            status=Appointment.Status.SCHEDULED,
            time="09:30:00",
        )
        res = self.client.get("/api/dashboard/today/")
        assert res.status_code == 200
        for appt in res.data["today_appointments"]:
            assert appt["date"] == str(self.today)

    def test_excludes_cancelled_appointments(self):
        AppointmentFactory(
            patient=self.patient,
            doctor=self.doctor,
            date=self.today,
            status=Appointment.Status.CANCELLED,
        )
        AppointmentFactory(
            patient=self.patient,
            doctor=self.doctor,
            date=self.today,
            time="11:00:00",
            status=Appointment.Status.SCHEDULED,
        )
        res = self.client.get("/api/dashboard/today/")
        statuses = [a["status"] for a in res.data["today_appointments"]]
        assert "cancelled" not in statuses

    def test_counts_are_correct(self):
        PatientFactory.create_batch(2)
        AppointmentFactory(
            patient=self.patient,
            doctor=self.doctor,
            date=self.today,
            status=Appointment.Status.COMPLETED,
        )
        AppointmentFactory(
            patient=self.patient,
            doctor=self.doctor,
            date=self.today,
            time="11:00:00",
            status=Appointment.Status.SCHEDULED,
        )
        res = self.client.get("/api/dashboard/today/")
        assert res.data["today_completed"] == 1
        assert res.data["today_total"] == 2


# ---------------------------------------------------------------------------
# Doctor list
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestDoctorListView:
    def setup_method(self):
        self.user = AssistantUserFactory()

    def test_returns_only_doctors(self):
        doctor = DoctorUserFactory()
        AdminUserFactory()
        AssistantUserFactory()
        res = auth_client(self.user).get("/api/doctors/")
        assert res.status_code == 200
        # Sadece bir tane doktor: yeni oluşturulan
        doctor_ids = [d["id"] for d in res.data]
        assert doctor.pk in doctor_ids
        # admin ve assistant doktor değil
        assert all(d["id"] != self.user.pk for d in res.data)
