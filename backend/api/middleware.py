import threading
import logging
import time

_thread_locals = threading.local()

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

