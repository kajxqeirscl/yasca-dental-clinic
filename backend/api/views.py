from django.db.models import Q, Count, Sum, Max, Value, DecimalField, IntegerField, OuterRef, Subquery, F
from django.db.models.functions import Coalesce, Concat
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError

from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings

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
from .pagination import StandardResultsSetPagination

from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.contenttypes.models import ContentType
import logging

logger = logging.getLogger(__name__)
security_logger = logging.getLogger('api.security')


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
            security_logger.warning('BAŞARISIZ GİRİŞ: kullanıcı=%s IP=%s', username, ip)
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
            security_logger.info('BAŞARILI GİRİŞ: kullanıcı=%s (id=%d) IP=%s', user.username, user.pk, ip)

        return response


class PublicClinicInfoView(APIView):
    """Giriş yapılmadan kliniğin genel bilgilerini (adını vb.) döner."""
    permission_classes = []

    def get(self, request):
        from django.db import connection
        tenant_name = connection.tenant.name if hasattr(connection, 'tenant') and connection.tenant else 'Yaşca'
        return Response({
            "clinic_name": tenant_name,
        })


class CurrentUserView(APIView):
    """Giriş yapmış kullanıcının bilgilerini döner."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db import connection
        user = request.user
        tenant_name = connection.tenant.name if hasattr(connection, 'tenant') and connection.tenant else 'Yaşca'
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "clinic_name": tenant_name,
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
        security_logger.info('ÇIKIŞ: kullanıcı=%s (id=%d) IP=%s', user.username, user.pk, ip)
        return Response({"detail": "Çıkış kaydedildi."}, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    """Şifre sıfırlama talebi alır ve e-posta gönderir."""
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Lütfen e-posta adresinizi giriniz."}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.filter(email=email).first() or CustomUser.objects.filter(username=email).first()
        if user:
            token_generator = PasswordResetTokenGenerator()
            token = token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Request'in geldiği host bilgisini kullanarak linki dinamik oluştur
            # örn: ali.localhost:5173 veya yasca-dental-clinic.onrender.com/app/ali
            # Eğer istek yasca-dental-clinic.onrender.com'a geliyorsa, ve tenant ali ise, 
            # path'li veya subdomain'li yapıyı dikkate almak gerekiyor. 
            # Bizim frontend yapımızda, reset linki doğrudan frontend domain'ine gitmeli.
            # Şimdilik origin header'ına bakabiliriz veya HTTP_HOST'a.
            origin = request.headers.get('Origin')
            if origin:
                base_url = origin
            else:
                scheme = request.scheme
                host = request.get_host()
                # Django backend portu 8000, React 5173'te çalışıyorsa lokaldeyiz demektir
                if 'localhost:8000' in host or '127.0.0.1:8000' in host:
                    host = host.replace('8000', '5173')
                base_url = f"{scheme}://{host}"
                
            # Eğer /app/tenant/ gibi path tabanlı çalışıyorsa (canlı ortam)
            # Linki doğru oluşturabilmek için tenant slug'ı ekliyoruz
            tenant = getattr(request, 'tenant', None)
            path_prefix = ""
            if tenant and tenant.schema_name != 'public':
                # Localhost'ta subdomain (ali.localhost) kullanıldığı için path'e gerek yok
                if 'localhost' not in base_url and '127.0.0.1' not in base_url:
                    path_prefix = f"/app/{tenant.schema_name}"
            
            reset_link = f"{base_url}{path_prefix}/reset-password/{uid}/{token}"
            
            message = f"Merhaba {user.first_name or user.username},\n\nŞifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:\n\n{reset_link}\n\nBu talebi siz yapmadıysanız bu e-postayı dikkate almayınız."
            try:
                send_mail(
                    subject="Şifre Sıfırlama Talebi",
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                return Response(
                    {"error": f"E-posta gönderilirken bir sorun oluştu. Lütfen SMTP ayarlarını kontrol edin. Detay: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # Her zaman aynı mesajı dönerek e-posta enumeration saldırılarını engelliyoruz.
        return Response({"detail": "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    """Token ve yeni şifreyi alarak şifreyi günceller."""
    permission_classes = []

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uidb64 or not token or not new_password:
            return Response({"error": "Eksik bilgi gönderildi."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = CustomUser.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, CustomUser.DoesNotExist):
            user = None

        if user is not None and PasswordResetTokenGenerator().check_token(user, token):
            user.set_password(new_password)
            user.save()
            
            # Log the action
            x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR')
            AuditLog.objects.create(
                user=user,
                action=AuditLog.Action.UPDATE,
                content_type=ContentType.objects.get_for_model(user),
                object_id=user.pk,
                changes={"password": {"old": "***", "new": "*** (Reset)"}},
                ip_address=ip
            )
            security_logger.info('ŞİFRE SIFIRLANDI: kullanıcı=%s IP=%s', user.username, ip)
            return Response({"detail": "Şifreniz başarıyla güncellendi."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Geçersiz veya süresi dolmuş bağlantı."}, status=status.HTTP_400_BAD_REQUEST)

class NullsLastOrderingFilter(filters.OrderingFilter):
    def filter_queryset(self, request, queryset, view):
        ordering = self.get_ordering(request, queryset, view)
        if ordering:
            order_fields = []
            for field in ordering:
                is_desc = field.startswith('-')
                field_name = field[1:] if is_desc else field
                if field_name in ['birth_date', 'last_visit_date']:
                    if is_desc:
                        order_fields.append(F(field_name).desc(nulls_last=True))
                    else:
                        order_fields.append(F(field_name).asc(nulls_last=True))
                else:
                    order_fields.append(field)
            return queryset.order_by(*order_fields)
        return queryset

class PatientViewSet(AuditLogMixin, viewsets.ModelViewSet):
    """Hasta CRUD. F-003, F-004, F-005."""
    permission_classes = [IsAuthenticated]
    filter_backends = [NullsLastOrderingFilter]
    ordering_fields = ['first_name', 'last_name', 'created_at', 'birth_date', 'phone', 'tckn', 'appointments_count', 'last_visit_date', 'total_payments', 'total_debt']
    pagination_class = StandardResultsSetPagination

    def get_serializer_class(self):
        if self.action == "list":
            return PatientListSerializer
        return PatientSerializer

    def get_queryset(self):
        user = self.request.user
        payments_subquery = Payment.objects.filter(
            patient=OuterRef('pk'), is_active=True
        ).values('patient').annotate(
            total=Sum('amount')
        ).values('total')
        
        treatments_subquery = Treatment.objects.filter(
            patient=OuterRef('pk'), is_active=True, status='completed'
        ).values('patient').annotate(
            total=Sum('price')
        ).values('total')
        
        last_visit_subquery = Appointment.objects.filter(
            patient=OuterRef('pk'), is_active=True, status='completed'
        ).values('patient').annotate(
            max_date=Max('date')
        ).values('max_date')

        qs = Patient.objects.filter(is_active=True).annotate(
            appointments_count=Count('appointments', filter=Q(appointments__is_active=True), distinct=True),
            last_visit_date=Subquery(last_visit_subquery),
            total_payments=Coalesce(Subquery(payments_subquery), Value(0, output_field=DecimalField())),
            total_treatments=Coalesce(Subquery(treatments_subquery), Value(0, output_field=DecimalField())),
        ).annotate(
            total_debt=Coalesce('total_treatments', Value(0, output_field=DecimalField())) - Coalesce('total_payments', Value(0, output_field=DecimalField()))
        )
        
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.annotate(
                search_full_name=Concat('first_name', Value(' '), 'last_name')
            )
            for term in search.split():
                qs = qs.filter(
                    Q(search_full_name__tr_icontains=term)
                    | Q(phone__tr_icontains=term)
                    | Q(tckn__tr_icontains=term)
                )
            
        # Default ordering is handled by NullsLastOrderingFilter, but we can set a fallback here if no ordering param is provided
        ordering = self.request.query_params.get("ordering")
        if not ordering:
            qs = qs.order_by("-created_at")
            
        return qs

    def perform_destroy(self, instance):
        # Kontrol: Aktif (planlanmış) randevu var mı?
        active_appointments = instance.appointments.filter(
            is_active=True, status='scheduled'
        ).count()
        if active_appointments:
            raise ValidationError(
                f"Bu hastanın {active_appointments} aktif randevusu var. Önce randevuları iptal edin."
            )
        # Kontrol: Ödenmemiş tedavi var mı?
        completed_treatments = instance.treatments.filter(is_active=True, status='completed')
        total_treatment_cost = sum(float(t.price) for t in completed_treatments)
        total_paid = sum(
            float(p.amount) for p in instance.payments.filter(is_active=True)
        )
        if total_treatment_cost > total_paid:
            raise ValidationError(
                "Bu hastanın ödenmemiş tedavi bakiyesi var. Önce ödemeleri tamamlayın."
            )
        self.log_action(AuditLog.Action.DELETE, instance)
        instance.is_active = False
        instance.save(update_fields=['is_active'])




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

    def perform_destroy(self, instance):
        self.log_action(AuditLog.Action.DELETE, instance)
        instance.is_active = False
        instance.save(update_fields=['is_active'])




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

    def perform_destroy(self, instance):
        # Kontrol: Bağlı aktif randevu var mı?
        linked_appointments = instance.appointments.filter(is_active=True).exclude(status='cancelled').count()
        if linked_appointments:
            raise ValidationError(
                f"Bu tedaviye bağlı {linked_appointments} adet randevu var. Önce randevuyu iptal edin veya silin."
            )

        # Kontrol: Bağlı ödeme var mı?
        linked_payments = instance.payments.filter(is_active=True).count()
        if linked_payments:
            raise ValidationError(
                f"Bu tedaviye bağlı {linked_payments} ödeme kaydı var. Önce ödemeleri silin."
            )
        self.log_action(AuditLog.Action.DELETE, instance)
        instance.is_active = False
        instance.save(update_fields=['is_active'])




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
            return TreatmentType.objects.filter(doctor=user, is_active=True).order_by('name')
        return TreatmentType.objects.filter(is_active=True).order_by('name')

    def perform_create(self, serializer):
        user = self.request.user
        doctor = user if user.role == CustomUser.Role.DOCTOR else None
        instance = serializer.save(doctor=doctor)
        self.log_action(AuditLog.Action.CREATE, instance)

    def perform_destroy(self, instance):
        # Kontrol: Bu türü kullanan aktif tedavi var mı?
        active_treatments = instance.treatments.filter(is_active=True).count()
        if active_treatments:
            raise ValidationError(
                f"Bu tedavi türünü kullanan {active_treatments} aktif tedavi var. Önce tedavileri silin veya türünü değiştirin."
            )
        self.log_action(AuditLog.Action.DELETE, instance)
        instance.is_active = False
        instance.save(update_fields=['is_active'])

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

    def perform_destroy(self, instance):
        self.log_action(AuditLog.Action.DELETE, instance)
        instance.is_active = False
        instance.save(update_fields=['is_active'])




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
            date=today,
            is_active=True
        ).exclude(status=Appointment.Status.CANCELLED)
        patients_qs = Patient.objects.filter(is_active=True)
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

    def perform_destroy(self, instance):
        self.log_action(AuditLog.Action.DELETE, instance)
        instance.is_active = False
        instance.save(update_fields=['is_active'])


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
    pagination_class = StandardResultsSetPagination
    queryset = AuditLog.objects.select_related("user", "content_type").order_by("-created_at")
