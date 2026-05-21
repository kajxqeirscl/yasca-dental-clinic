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
    AuditLogSerializer,
)
from .permissions import IsAdminUser, IsAdminOrDoctorUser


from .mixins import AuditLogMixin

from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.contenttypes.models import ContentType
import logging

logger = logging.getLogger(__name__)


class AuditedTokenObtainPairView(TokenObtainPairView):
    """
    JWT token alma işlemini sarmalayarak başarılı ve başarısız
    giriş denemelerini AuditLog tablosuna kaydeder.
    """

    def _get_client_ip(self, request):
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded:
            return x_forwarded.split(',')[0]
        return request.META.get('REMOTE_ADDR')

    def post(self, request, *args, **kwargs):
        ip = self._get_client_ip(request)
        username = request.data.get('username', '') or request.data.get('email', '')

        try:
            response = super().post(request, *args, **kwargs)
        except Exception:
            # Başarısız giriş denemesi
            AuditLog.objects.create(
                user=None,
                action=AuditLog.Action.CREATE,
                content_type=ContentType.objects.get_for_model(CustomUser),
                object_id=0,
                changes={"login": {"old": None, "new": f"BAŞARISIZ GİRİŞ: {username}"}},
                ip_address=ip
            )
            logger.warning(f"Başarısız giriş denemesi: {username} IP: {ip}")
            raise

        # Başarılı giriş
        user = CustomUser.objects.filter(username=username).first() or \
               CustomUser.objects.filter(email=username).first()
        if user:
            AuditLog.objects.create(
                user=user,
                action=AuditLog.Action.CREATE,
                content_type=ContentType.objects.get_for_model(user),
                object_id=user.pk,
                changes={"login": {"old": None, "new": f"BAŞARILI GİRİŞ: {user.username}"}},
                ip_address=ip
            )

        return response


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


class LogoutView(APIView):
    """Çıkış işlemini AuditLog'a kaydeder."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        ip = x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR')

        AuditLog.objects.create(
            user=user,
            action=AuditLog.Action.DELETE,
            content_type=ContentType.objects.get_for_model(user),
            object_id=user.pk,
            changes={"logout": {"old": user.username, "new": "ÇIKIŞ YAPILDI"}},
            ip_address=ip
        )
        return Response({"detail": "Çıkış kaydedildi."}, status=status.HTTP_200_OK)

class PatientViewSet(AuditLogMixin, viewsets.ModelViewSet):
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




class AppointmentViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """Randevu CRUD. F-006, F-007, F-008, F-009."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Appointment.objects.filter(is_active=True).select_related("patient", "doctor")
        if user.role == CustomUser.Role.DOCTOR and not user.is_superuser:
            qs = qs.filter(doctor=user)
        date = self.request.query_params.get("date")
        patient_id = self.request.query_params.get("patient")
        if date:
            qs = qs.filter(date=date)
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs.order_by("date", "time")




class TreatmentViewSet(AuditLogMixin, viewsets.ModelViewSet):
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




class TreatmentTypeViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """Tedavi türleri. F-020. Hekim ve Yönetici düzenleyebilir."""
    serializer_class = TreatmentTypeSerializer
    
    def get_permissions(self):
        if self.request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsAdminOrDoctorUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == CustomUser.Role.DOCTOR:
            return TreatmentType.objects.filter(doctor=user).order_by('name')
            # return TreatmentType.objects.filter(doctor=user, is_active=True).order_by('name')
        return TreatmentType.objects.all().order_by('name')

    def perform_create(self, serializer):
        user = self.request.user
        doctor = user if user.role == CustomUser.Role.DOCTOR else None
        instance = serializer.save(doctor=doctor)
        self.log_action(AuditLog.Action.CREATE, instance)

    def perform_destroy(self, instance):
        self.log_action(AuditLog.Action.DELETE, instance)
        instance.delete()

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

        # Eski değerleri kaydet
        old_data = {}
        for key in request.data.keys():
            if hasattr(obj, key):
                old_data[key] = getattr(obj, key)

        serializer = ClinicSettingsSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Değişenleri bul ve logla
        changes = {}
        for key, new_val in serializer.validated_data.items():
            old_val = old_data.get(key)
            if old_val != new_val:
                changes[key] = {"old": str(old_val), "new": str(new_val)}

        if changes:
            from django.contrib.contenttypes.models import ContentType
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR')
            AuditLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                action=AuditLog.Action.UPDATE,
                content_type=ContentType.objects.get_for_model(obj),
                object_id=obj.pk,
                changes=changes,
                ip_address=ip
            )

        return Response(serializer.data)


class PaymentViewSet(AuditLogMixin, viewsets.ModelViewSet):
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

class DocumentViewSet(AuditLogMixin, viewsets.ModelViewSet):
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
        self.log_action(AuditLog.Action.CREATE, instance)


class UserViewSet(AuditLogMixin, viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return CustomUser.objects.all().order_by('id')



class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Sadece yoneticilerin erisebilecegi islem gecmisi."""
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.select_related("user", "content_type").order_by("-created_at")
