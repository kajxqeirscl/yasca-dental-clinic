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
    DATABASES = {"default": dj_database_url.parse(_db_url)}
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
