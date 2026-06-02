"""
Test-specific Django settings.
Overrides core.settings for speed and isolation.
"""
from .settings import *  # noqa: F401, F403
import tempfile

# --- Speed: use the fastest available password hasher ---
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# --- Database: use PostgreSQL from DATABASE_URL, fallback to SQLite for quick local runs ---
import dj_database_url
import os

_db_url = os.environ.get("DATABASE_URL")
if _db_url:
    db_config = dj_database_url.parse(_db_url)
    db_config['ENGINE'] = 'django_tenants.postgresql_backend'
    DATABASES = {"default": db_config}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }


# --- Email: never hit a real SMTP server ---
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# --- JWT: short-lived tokens make refresh-flow tests fast ---
from datetime import timedelta  # noqa: E402
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(seconds=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(seconds=10),
}

# --- Media: redirect uploads to a temp dir so tests never write real files ---
MEDIA_ROOT = tempfile.mkdtemp()

# --- Silence migrations that are slow by using normal migration (pytest-django handles this) ---
# Set to True only if you need to skip migrations entirely:
# from django.test.utils import override_settings  (keep False for now)

# ---------------------------------------------------------------------------
# Multi-tenant settings shim — DUAL MODE
# ---------------------------------------------------------------------------
# Mod 1: SQLite (default, hızlı TDD için) — shim aktif.
#   - TENANT_APPS → SHARED_APPS'a flatten (tüm tablolar default schema'da)
#   - HeaderTenantMiddleware MIDDLEWARE'den çıkarılır
#   - django-tenants schema switching no-op (bkz. backend/conftest.py)
#
# Mod 2: PostgreSQL (DATABASE_URL set'liyse) — shim devre dışı.
#   - Gerçek SHARED_APPS / TENANT_APPS ayrımı korunur
#   - HeaderTenantMiddleware gerçek schema switching yapar
#   - Production davranışı ile birebir eşleşir
#
# CI bu sayede hem hızlı SQLite job'u hem de production-fidelity PG job'u
# paralel çalıştırır. PG mode'da `requires_postgres` marker'lı testler aktif.
_use_sqlite_shim = not _db_url or "sqlite" in _db_url

if _use_sqlite_shim:
    _tenant_extras = [app for app in TENANT_APPS if app not in SHARED_APPS]  # noqa: F405
    SHARED_APPS = list(SHARED_APPS) + _tenant_extras  # noqa: F405
    INSTALLED_APPS = list(SHARED_APPS)

    MIDDLEWARE = [  # noqa: F811
        m for m in MIDDLEWARE  # noqa: F405
        if m != "api.middleware.HeaderTenantMiddleware"
    ]
# else: PostgreSQL — settings.py'deki orijinal SHARED_APPS / TENANT_APPS /
# MIDDLEWARE konfigürasyonu olduğu gibi kullanılır. django-tenants gerçek
# schema-per-tenant izolasyonunu test ortamında da çalıştırır.
