"""
Pact Provider Verification (Faz 9) — Backend, sözleşmeye uyuyor mu?

Frontend'in ürettiği pact dosyası (frontend/pacts/...json) bir "sözleşme"dir:
"GET /api/patients/ şu şekilde bir cevap döndürmeli." Bu script, AYAKTA olan
gerçek backend'e o istekleri tekrar atar ve cevabın sözleşmeye uyup uymadığını
kanıtlar. Backend bir alan adını değiştirirse → verification FAIL.

ÖN KOŞULLAR:
  1. pip install pact-python        (requirements-dev.txt içinde)
  2. Backend PostgreSQL modunda + seed verisiyle ayakta olmalı:
       $env:DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/yascadb"
       python manage.py migrate_schemas
       python manage.py seed_demo_data
       python manage.py runserver
  3. Frontend consumer testi çalışmış ve pact dosyasını üretmiş olmalı:
       cd ../frontend && npm run test:pact

AUTH NOTU (önemli):
  Sözleşmedeki Authorization header'ı örnek/sahte bir token içerir. Gerçek
  backend bunu reddeder (401). Bu yüzden verification sırasında GEÇERLİ bir
  token'ı custom_provider_headers ile enjekte ediyoruz. Token'ı çalıştırmadan
  önce ortam değişkeninden alıyoruz:
       $env:PACT_VERIFY_TOKEN = "<standard tenant admin access token>"

  Token üretmek için (örnek):
       curl -X POST http://localhost:8000/api/auth/token/ \
            -H "X-Tenant: standard" \
            -H "Content-Type: application/json" \
            -d '{"username":"tony","password":"demo123!"}'

ÇALIŞTIRMA:
  cd backend
  python contracts/verify_provider.py
"""

import os
import sys
from pathlib import Path

try:
    from pact import Verifier
except ImportError:
    sys.exit(
        "pact-python kurulu değil. Çalıştır: pip install pact-python\n"
        "(requirements-dev.txt içinde tanımlı)"
    )

PROVIDER_BASE_URL = os.environ.get("PACT_PROVIDER_URL", "http://localhost:8000")
PACT_FILE = (
    Path(__file__).resolve().parent.parent.parent
    / "frontend"
    / "pacts"
    / "yasca-frontend-yasca-api.json"
)
TOKEN = os.environ.get("PACT_VERIFY_TOKEN", "")


def main() -> int:
    if not PACT_FILE.exists():
        print(f"[HATA] Pact dosyası yok: {PACT_FILE}")
        print("Önce frontend consumer testini çalıştır: npm run test:pact")
        return 1

    if not TOKEN:
        print(
            "[UYARI] PACT_VERIFY_TOKEN tanımlı değil. Korumalı endpoint'ler "
            "401 dönecek ve verification FAIL olacak. Token üretip ver."
        )

    verifier = Verifier(
        "yasca-api",
        PROVIDER_BASE_URL,
    )

    # Geçerli token'ı ve X-Tenant'ı her isteğe enjekte et (sözleşmedeki sahte
    # token yerine). Böylece auth katmanını geçip asıl cevap şeklini doğrularız.
    custom_headers = {"X-Tenant": "standard"}
    if TOKEN:
        custom_headers["Authorization"] = f"Bearer {TOKEN}"

    success, _ = verifier.verify_pacts(
        str(PACT_FILE),
        custom_provider_headers=[f"{k}: {v}" for k, v in custom_headers.items()],
        # Provider state ("...has at least one patient") seed_demo_data ile
        # sağlanır. İleride dinamik state kurulumu için bir _pact/setup
        # endpoint'i eklenip provider_states_setup_url verilebilir.
    )

    if success == 0:
        print("[OK] Provider sözleşmeye uyuyor ✅")
        return 0
    print("[FAIL] Provider sözleşmeyi ihlal ediyor ❌")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
