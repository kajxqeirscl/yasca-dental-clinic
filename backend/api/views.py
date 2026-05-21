from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Patient, Appointment, Treatment, TreatmentType, ClinicSettings, Payment, CustomUser, Document, AuditLog
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
    DocumentSerializer,
    UserSerializer,
)
from .permissions import IsAdminUser, IsAdminOrDoctorUser


class AuditMixin:
    def _log_action(self, action, instance):
        if not hasattr(instance, 'id'):
            return
        AuditLog.objects.create(
            user=self.request.user,
            action=action,
            model_name=instance.__class__.__name__,
            object_id=instance.id,
            object_repr=str(instance)[:255],
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        self._log_action(AuditLog.Action.UPDATE, instance)

    def perform_destroy(self, instance):
        if hasattr(instance, "is_active"):
            instance.is_active = False
            instance.save(update_fields=['is_active'])
            self._log_action(AuditLog.Action.SOFT_DELETE, instance)
        elif hasattr(instance, "status") and hasattr(instance.__class__, "Status") and hasattr(instance.__class__.Status, "CANCELLED"):
            instance.status = instance.__class__.Status.CANCELLED
            instance.save(update_fields=['status'])
            self._log_action(AuditLog.Action.SOFT_DELETE, instance)
        else:
            instance.delete()
            self._log_action(AuditLog.Action.DELETE, instance)


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


class PatientViewSet(AuditMixin, viewsets.ModelViewSet):
    """Hasta CRUD. F-003, F-004, F-005."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "list":
            return PatientListSerializer
        return PatientSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Patient.objects.all()
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(first_name__tr_icontains=search)
                | Q(last_name__tr_icontains=search)
                | Q(phone__tr_icontains=search)
                | Q(tckn__tr_icontains=search)
            )
        return qs.order_by("last_name", "first_name")

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_action(AuditLog.Action.CREATE, instance)


class AppointmentViewSet(AuditMixin, viewsets.ModelViewSet):
    """Randevu CRUD. F-006, F-007, F-008, F-009."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Appointment.objects.all().select_related("patient", "doctor")
        if user.role == CustomUser.Role.DOCTOR and not user.is_superuser:
            qs = qs.filter(doctor=user)
        date = self.request.query_params.get("date")
        patient_id = self.request.query_params.get("patient")
        if date:
            qs = qs.filter(date=date)
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs.order_by("date", "time")

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_action(AuditLog.Action.CREATE, instance)


class TreatmentViewSet(AuditMixin, viewsets.ModelViewSet):
    """Tedavi CRUD. F-010, F-011."""
    serializer_class = TreatmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Treatment.objects.all().select_related("patient", "doctor", "treatment_type")
        if user.role == CustomUser.Role.DOCTOR and not user.is_superuser:
            qs = qs.filter(doctor=user)
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs.filter(is_active=True).order_by("-date")

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_action(AuditLog.Action.CREATE, instance)


class TreatmentTypeViewSet(AuditMixin, viewsets.ModelViewSet):
    """Tedavi türleri. F-020. Hekim ve Yönetici düzenleyebilir."""
    serializer_class = TreatmentTypeSerializer
    
    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdminOrDoctorUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == CustomUser.Role.DOCTOR:
            return TreatmentType.objects.filter(doctor=user, is_active=True).order_by("name")
        return TreatmentType.objects.filter(is_active=True).order_by("name")

    def perform_create(self, serializer):
        user = self.request.user
        doctor = user if user.role == CustomUser.Role.DOCTOR else None
        instance = serializer.save(doctor=doctor)
        self._log_action(AuditLog.Action.CREATE, instance)


class ClinicSettingsView(APIView):
    """Klinik ayarları. F-022."""
    
    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]

    def get(self, request):
        obj = ClinicSettings.get_settings()
        if not obj:
            return Response({}, status=status.HTTP_404_NOT_FOUND)
        return Response(ClinicSettingsSerializer(obj).data)

    def put(self, request):
        obj = ClinicSettings.get_settings()
        if not obj:
            return Response({}, status=status.HTTP_404_NOT_FOUND)
        serializer = ClinicSettingsSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PaymentViewSet(AuditMixin, viewsets.ModelViewSet):
    """Ödeme kayıtları. F-014, F-015."""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.all().select_related("patient")
        if user.role == CustomUser.Role.DOCTOR and not user.is_superuser:
            qs = qs.filter(
                Q(patient__appointments__doctor=user) | Q(patient__treatments__doctor=user)
            ).distinct()
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs.filter(is_active=True).order_by("-payment_date")

    def perform_create(self, serializer):
        instance = serializer.save()
        self._log_action(AuditLog.Action.CREATE, instance)


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
        user = request.user
        today = timezone.localdate()
        appointments = Appointment.objects.filter(
            date=today
        ).exclude(status=Appointment.Status.CANCELLED)
        patients_qs = Patient.objects.all()
        if user.role == CustomUser.Role.DOCTOR and not user.is_superuser:
            appointments = appointments.filter(doctor=user)
            patients_qs = patients_qs.filter(
                Q(appointments__doctor=user) | Q(treatments__doctor=user)
            ).distinct()
        appointments = appointments.select_related("patient", "doctor").order_by("time")

        completed = appointments.filter(status=Appointment.Status.COMPLETED).count()
        total_patients = patients_qs.count()

        serializer = AppointmentSerializer(appointments, many=True)
        return Response({
            "today_appointments": serializer.data,
            "today_total": appointments.count(),
            "today_completed": completed,
            "total_patients": total_patients,
        })

class DocumentViewSet(AuditMixin, viewsets.ModelViewSet):
    """Hasta dokümanları için API."""
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        queryset = Document.objects.all()
        if user.role == CustomUser.Role.DOCTOR and not user.is_superuser:
            queryset = queryset.filter(
                Q(patient__appointments__doctor=user) | Q(patient__treatments__doctor=user)
            ).distinct()
        patient_id = self.request.query_params.get("patient")
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset.filter(is_active=True)

    def perform_create(self, serializer):
        instance = serializer.save(
            uploaded_by=self.request.user
        )
        self._log_action(AuditLog.Action.CREATE, instance)


class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return CustomUser.objects.all().order_by('id')

