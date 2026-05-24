import threading
import logging
import time
from django.db import connection
from django_tenants.middleware.main import TenantMainMiddleware
from django_tenants.utils import get_tenant_model, get_tenant_domain_model

_thread_locals = threading.local()


# ---------------------------------------------------------------------------
# Custom Tenant Middleware: X-Tenant Header desteği (Canlı ortam için)
# ---------------------------------------------------------------------------
class HeaderTenantMiddleware(TenantMainMiddleware):
    """
    Standart django-tenants middleware'ini genişletir.
    
    Canlı ortamda (Render/Vercel) frontend tüm istekleri tek bir Render URL'ine
    gönderir ve 'X-Tenant: ali' gibi bir header ile hangi kliniğe ait olduğunu
    bildirir. Bu middleware o header'ı okuyarak doğru veritabanı şemasına
    (schema) yönlendirir.
    
    Lokal geliştirmede X-Tenant header yoksa, standart Host tabanlı çözümlemeye
    (ali.localhost gibi) geri döner.
    """
    
    def __call__(self, request):
        tenant_header = request.META.get('HTTP_X_TENANT', '').strip()
        
        if tenant_header:
            # X-Tenant header geldi -> doğrudan schema'ya bağlan
            TenantModel = get_tenant_model()
            try:
                tenant = TenantModel.objects.get(schema_name=tenant_header)
                request.tenant = tenant
                connection.set_tenant(tenant)
                # URL routing'i tenant URL'lerine yönlendir (public değil!)
                # django-tenants normalde bunu Host header'a göre yapar,
                # ama biz X-Tenant ile override ettiğimiz için elle ayarlıyoruz.
                from django.conf import settings
                request.urlconf = settings.ROOT_URLCONF  # core.urls (tenant)
                return self.get_response(request)
            except TenantModel.DoesNotExist:
                pass  # Header'daki tenant bulunamazsa standart yönteme devam et
        
        # Standart Host tabanlı çözümleme (lokal geliştirme)
        return super().__call__(request)

def get_current_request():
    """O anki aktif HTTP isteğini (request) thread bazında döner."""
    return getattr(_thread_locals, 'request', None)

def get_current_user():
    """Giriş yapmış aktif kullanıcıyı (CustomUser) döner."""
    request = get_current_request()
    if request and hasattr(request, 'user') and request.user.is_authenticated:
        return request.user
    return None


class ThreadLocalMiddleware:
    """
    Her HTTP isteğinde aktif request objesini thread-local hafızaya alır.
    Böylece sinyaller (signals) içerisinden giriş yapmış kullanıcıya erişilebilir.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.request = request
        try:
            response = self.get_response(request)
        finally:
            if hasattr(_thread_locals, 'request'):
                del _thread_locals.request
        return response


# ---------------------------------------------------------------------------
# Tenant-Aware Log Formatter
# ---------------------------------------------------------------------------

class TenantAwareFormatter(logging.Formatter):
    """
    Log satırlarına otomatik olarak [Tenant: ...] ve [User: ...] bilgilerini ekler.
    Örnek çıktı:
      [2026-05-22 15:30:00] ERROR [Tenant: yildizdental] [User: 42] [Path: /api/patients/15/] - Veritabanı hatası
    """

    def format(self, record):
        request = get_current_request()

        # Tenant bilgisi
        tenant_name = '-'
        if request and hasattr(request, 'tenant'):
            tenant_name = getattr(request.tenant, 'schema_name', '-')

        # Kullanıcı bilgisi
        user_id = '-'
        if request and hasattr(request, 'user') and hasattr(request.user, 'is_authenticated'):
            if request.user.is_authenticated:
                user_id = str(request.user.id)

        # İstek yolu
        path = '-'
        if request:
            path = getattr(request, 'path', '-')

        record.tenant = tenant_name
        record.user_id = user_id
        record.request_path = path

        return super().format(record)


# ---------------------------------------------------------------------------
# Request Logging Middleware (API istek süresi + durum kodu)
# ---------------------------------------------------------------------------

logger = logging.getLogger('api.request')


class RequestLoggingMiddleware:
    """
    Her API isteğinin süresini, durum kodunu ve yolunu loglar.
    Sadece /api/ ile başlayan istekleri loglar (statik dosyaları filtreler).

    Örnek log:
      [2026-05-22 15:30:00] INFO [Tenant: aliure] [User: 1] POST /api/treatments/ -> 201 (45ms)
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Sadece API isteklerini logla
        if not request.path.startswith('/api/'):
            return self.get_response(request)

        start_time = time.monotonic()

        response = self.get_response(request)

        duration_ms = int((time.monotonic() - start_time) * 1000)
        status_code = response.status_code

        # Log seviyesini durum koduna göre ayarla
        if status_code >= 500:
            log_fn = logger.error
        elif status_code >= 400:
            log_fn = logger.warning
        else:
            log_fn = logger.info

        log_fn(
            '%s %s -> %d (%dms)',
            request.method,
            request.path,
            status_code,
            duration_ms,
        )

        return response

