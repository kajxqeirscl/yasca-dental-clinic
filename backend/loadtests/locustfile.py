"""
Load Testing — Locust (Faz 9)

NEDEN?
Sistem 1 kullanıcıyla çalışır; peki aynı anda 500 klinik istek atarsa?
Multi-tenant SaaS'ta bu gerçek bir risk. Locust yüzlerce sahte kullanıcıyı
aynı anda sisteme saldırtır; nerede yavaşladığını/çöktüğünü ölçeriz.

ÇOK-TENANT SİMÜLASYONU:
Her sanal kullanıcı rastgele bir tenant seçer ve isteklerine 'X-Tenant'
header'ı ekler (HeaderTenantMiddleware bunu okuyup ilgili schema'ya geçer).
Böylece sadece yük değil, schema switching maliyetini de ölçeriz.

ÇALIŞTIRMA:
    pip install locust          # requirements-dev.txt içinde
    # Backend PostgreSQL modunda ayakta olmalı (gerçek schema isolation için):
    #   $env:DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/yascadb"
    #   python manage.py runserver

    # İnteraktif (web arayüzü http://localhost:8089):
    locust -f loadtests/locustfile.py --host http://localhost:8000

    # Headless (CI / otomatik), 50 kullanıcı, saniyede 5 spawn, 1 dakika:
    locust -f loadtests/locustfile.py --host http://localhost:8000 \
           --headless -u 50 -r 5 -t 1m --csv loadtests/results

ÖN KOŞUL: Demo veri seed'lenmiş olmalı (python manage.py seed_demo_data).
"""

import os
import random

from locust import HttpUser, between, task

# Yük altında test edilecek tenant'lar. seed_demo_data ile oluşan kliniklere
# göre güncelle. X-Tenant header backend'de HeaderTenantMiddleware tarafından okunur.
TENANTS = os.environ.get("LOADTEST_TENANTS", "standard,premium").split(",")

# Her tenant için geçerli demo kullanıcısı (admin). Tümü aynı parolayı kullanır.
DEMO_PASSWORD = os.environ.get("LOADTEST_PASSWORD", "demo123!")
DEMO_USERS = {
    "standard": "tony",
    "premium": "kemal",
}


class ClinicUser(HttpUser):
    """Tek bir klinik kullanıcısının tipik oturum davranışını taklit eder."""

    # Gerçekçi düşünme süresi: istekler arası 1-3 sn bekle
    wait_time = between(1, 3)

    def on_start(self):
        """Sanal kullanıcı başlarken: tenant seç + login ol + token sakla."""
        self.tenant = random.choice(TENANTS)
        self.username = DEMO_USERS.get(self.tenant, "tony")
        self.token = None
        self._login()

    def _tenant_headers(self, with_auth=True):
        headers = {"X-Tenant": self.tenant}
        if with_auth and self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _login(self):
        with self.client.post(
            "/api/auth/token/",
            json={"username": self.username, "password": DEMO_PASSWORD},
            headers=self._tenant_headers(with_auth=False),
            name="POST /api/auth/token/ (login)",
            catch_response=True,
        ) as res:
            if res.status_code == 200:
                self.token = res.json().get("access")
                res.success()
            else:
                # Login başarısızsa kullanıcı işe yaramaz; net hata raporla
                res.failure(
                    f"Login failed for {self.username}@{self.tenant}: "
                    f"{res.status_code}"
                )

    # ── Tipik okuma-ağırlıklı trafik (gerçek kullanım: çok okuma, az yazma) ──

    @task(5)
    def view_dashboard(self):
        self.client.get(
            "/api/dashboard/today/",
            headers=self._tenant_headers(),
            name="GET /api/dashboard/today/",
        )

    @task(4)
    def list_patients(self):
        self.client.get(
            "/api/patients/",
            headers=self._tenant_headers(),
            name="GET /api/patients/",
        )

    @task(3)
    def list_appointments(self):
        self.client.get(
            "/api/appointments/",
            headers=self._tenant_headers(),
            name="GET /api/appointments/",
        )

    @task(2)
    def list_treatments(self):
        self.client.get(
            "/api/treatments/",
            headers=self._tenant_headers(),
            name="GET /api/treatments/",
        )

    @task(1)
    def search_patients(self):
        self.client.get(
            "/api/patients/?search=a",
            headers=self._tenant_headers(),
            name="GET /api/patients/?search=",
        )
