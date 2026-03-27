from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from .models import Patient, Appointment, Treatment, TreatmentType, ClinicSettings, Payment, CustomUser
from .serializers import (
    PatientSerializer,
    PatientListSerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
    TreatmentSerializer,
    TreatmentTypeSerializer,
    ClinicSettingsSerializer,
    PaymentSerializer,
    DoctorMinimalSerializer,
)


class CurrentUserView(APIView):
    """Giriş yapmış kullanıcının bilgilerini döner."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
        })


class PatientViewSet(viewsets.ModelViewSet):
    """Hasta CRUD. F-003, F-004, F-005."""
    queryset = Patient.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return PatientListSerializer
        return PatientSerializer

    def get_queryset(self):
        qs = Patient.objects.all()
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(phone__icontains=search)
                | Q(tckn__icontains=search)
            )
        return qs.order_by("last_name", "first_name")


class AppointmentViewSet(viewsets.ModelViewSet):
    """Randevu CRUD. F-006, F-007, F-008, F-009."""
    queryset = Appointment.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_queryset(self):
        qs = Appointment.objects.select_related("patient", "doctor")
        date = self.request.query_params.get("date")
        if date:
            qs = qs.filter(date=date)
        return qs.order_by("date", "time")


class TreatmentViewSet(viewsets.ModelViewSet):
    """Tedavi CRUD. F-010, F-011."""
    queryset = Treatment.objects.all()
    serializer_class = TreatmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Treatment.objects.select_related("patient", "doctor", "treatment_type")
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs.order_by("-date")


class TreatmentTypeViewSet(viewsets.ModelViewSet):
    """Tedavi türleri. F-020. Admin için."""
    queryset = TreatmentType.objects.filter(is_active=True).order_by("name")
    serializer_class = TreatmentTypeSerializer
    permission_classes = [IsAuthenticated]


class ClinicSettingsView(APIView):
    """Klinik ayarları. F-022. Tek kayıt (Singleton)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        obj = ClinicSettings.get_settings()
        return Response(ClinicSettingsSerializer(obj).data)

    def put(self, request):
        obj = ClinicSettings.get_settings()
        serializer = ClinicSettingsSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PaymentViewSet(viewsets.ModelViewSet):
    """Ödeme kayıtları. F-014, F-015."""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Payment.objects.select_related("patient")
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs.order_by("-payment_date")


class DoctorListView(APIView):
    """Randevu oluştururken hekim listesi."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        doctors = CustomUser.objects.filter(role=CustomUser.Role.DOCTOR)
        return Response(DoctorMinimalSerializer(doctors, many=True).data)


class DashboardView(APIView):
    """F-013: Bugünün randevuları ve özet."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        appointments = Appointment.objects.filter(
            date=today
        ).exclude(status=Appointment.Status.CANCELLED).exclude(
            status=Appointment.Status.NO_SHOW
        ).select_related("patient", "doctor").order_by("time")

        completed = appointments.filter(status=Appointment.Status.COMPLETED).count()
        total_patients = Patient.objects.count()

        serializer = AppointmentSerializer(appointments, many=True)
        return Response({
            "today_appointments": serializer.data,
            "today_total": appointments.count(),
            "today_completed": completed,
            "total_patients": total_patients,
        })
