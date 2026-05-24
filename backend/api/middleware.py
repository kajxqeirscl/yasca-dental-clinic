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
class HeaderTenantMiddleware:
    """
    Tüm tenant çözümleme mantığını tek bir yerde toplar:
    
    1. X-Tenant header varsa → o tenant'a bağlan (canlı ortam)
    2. Host header'da bilinen subdomain varsa → o tenant'a bağlan (lokal geliştirme)
    3. Hiçbiri değilse → public tenant'a bağlan (ana site)
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        from django.conf import settings
        TenantModel = get_tenant_model()
        DomainModel = get_tenant_domain_model()
        
        tenant = None
        
        # 1. X-Tenant header ile tenant çözümleme (canlı ortam)
        tenant_header = request.META.get('HTTP_X_TENANT', '').strip()
        if tenant_header:
            try:
                tenant = TenantModel.objects.get(schema_name=tenant_header)
            except TenantModel.DoesNotExist:
                pass
        
        # 2. Host header ile tenant çözümleme (lokal geliştirme)
        if not tenant:
            hostname = request.get_host().split(':')[0]  # Port'u çıkar
            try:
                domain_obj = DomainModel.objects.select_related('tenant').get(domain=hostname)
                tenant = domain_obj.tenant
            except DomainModel.DoesNotExist:
                pass
        
        # 3. Fallback: public tenant (ana site veya bilinmeyen domain)
        if not tenant:
            try:
                tenant = TenantModel.objects.get(schema_name='public')
            except TenantModel.DoesNotExist:
                # public tenant bile yoksa kritik hata
                from django.http import HttpResponse
                return HttpResponse('Sistem başlatılmadı. Public tenant bulunamadı.', status=500)
        
        # Tenant'ı ayarla
        request.tenant = tenant
        connection.set_tenant(tenant)
        request.urlconf = settings.ROOT_URLCONF
        
        return self.get_response(request)


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

