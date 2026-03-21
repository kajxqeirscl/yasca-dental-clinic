# Yaşca Backend Geliştirme Planı

Bu doküman, frontend tamamlandıktan sonra backend geliştirme sürecinde izlenecek adımları ve 4 kişilik ekip için görev dağılımını içerir.

---

## 1. Mevcut Durum Özeti

| Bileşen | Durum |
|---------|-------|
| Django projesi | ✅ Oluşturulmuş (`backend/`) |
| DRF + CORS | ✅ Yapılandırılmış |
| `api` uygulaması | ✅ Oluşturulmuş |
| Models | ❌ Boş |
| Views/API | ❌ Boş |
| JWT Kimlik Doğrulama | ❌ Yok |
| URL routing | ❌ Sadece admin |
| Veritabanı | SQLite (geliştirme) → PostgreSQL (prod) |

---

## 2. Adım Adım Backend Geliştirme Yol Haritası

### Faz 1: Temel Altyapı (1. Hafta)

#### Adım 1.1: Bağımlılıklar ve Ortam

```bash
# backend/requirements.txt oluştur/güncelle
Django>=5.2
djangorestframework>=3.14
djangorestframework-simplejwt>=5.3
django-cors-headers>=4.3
psycopg2-binary>=2.9
python-dotenv>=1.0
Pillow>=10.0Modeller, validasyonlar, K
django-filter>=23.0
```

- **Görev:** `requirements.txt` ve sanal ortam (venv) kurulumu
- **Sorumlu:** Şükrü (WP5 altyapı)

#### Adım 1.2: Özel Kullanıcı Modeli ve Roller

İstek analizine göre roller: **Admin, Doctor (Hekim), Assistant (Asistan)**

- Django'nun `User` modelini extend eden veya `AbstractUser` kullanan `CustomUser` modeli
- `role` alanı: `admin`, `doctor`, `assistant`
- `settings.py` içinde `AUTH_USER_MODEL = 'api.CustomUser'`

**Sorumlu:** Yaman (WP1/WP3 veri modeli)

#### Adım 1.3: JWT Kimlik Doğrulama

- `djangorestframework-simplejwt` kurulumu
- `core/urls.py` veya `api/urls.py`:
  - `POST /api/auth/token/` → access + refresh token
  - `POST /api/auth/token/refresh/` → yeni access token
- `REST_FRAMEWORK` ayarları: JWT authentication, permission classes
- Session timeout (NF-004): JWT refresh token süresi veya frontend tarafında 30 dk logout

**Sorumlu:** Yaman / Ali

---

### Faz 2: Veri Modelleri (1–2. Hafta)

#### Adım 2.1: Hasta (Patient) Modeli

```python
# Önerilen alanlar (F-003, F-005, frontend ile uyumlu)
- id (PK)
- first_name (Ad)
- last_name (Soyad)
- phone (Telefon) — zorunlu
- tckn (TC Kimlik No) — opsiyonel
- birth_date (Doğum Tarihi) — opsiyonel
- address — opsiyonel
- notes — opsiyonel
- created_at, updated_at
```

**Sorumlu:** Yaman

#### Adım 2.2: Anamnez (Anamnesis) Modeli

```python
# Patient ile 1-1 ilişki
- patient (FK)
- medical_history, allergies, medications
- chronic_diseases, surgical_history, family_history
- smoking, alcohol, pregnancy_status
- other_notes
```

**Sorumlu:** Yaman

#### Adım 2.3: Randevu (Appointment) Modeli

```python
# F-006, F-007, F-008, F-009, F-019, F-022
- id, patient (FK), doctor (FK → CustomUser)
- date, time (ör: "09:00")
- duration (dakika) — F-022 randevu aralığı ile uyumlu
- status: scheduled | completed | cancelled | no_show
- notes — F-019 randevu notu
- treatment_type — opsiyonel
- created_at, updated_at
```

**Sorumlu:** Ali / Yaman

#### Adım 2.4: Tedavi (Treatment) Modeli

```python
# F-010, F-011, F-018, F-020
- id, patient (FK), doctor (FK)
- treatment_type (FK → TreatmentType) veya text
- tooth_number (FDI formatında, örn: "16")
- status: planned | completed
- notes, date
```

**Sorumlu:** Yaman

#### Adım 2.5: Tedavi Türü (TreatmentType) Modeli

```python
# F-020: Yönetici tedavi türlerini ve fiyatları tanımlar
- name (Dolgu, Kanal, Çekim vb.)
- default_price
- is_active
```

**Sorumlu:** Yaman

#### Adım 2.6: Klinik Ayarları (ClinicSettings) Modeli

```python
# F-022: Takvim başlangıç/bitiş saati, randevu aralığı
- work_start_time (09:00)
- work_end_time (18:00)
- appointment_interval_minutes (15)
# Tek kayıt yeterli (Singleton pattern)
```

**Sorumlu:** Şükrü / Yaman

#### Adım 2.7: Ödeme (Payment) ve Finansal Modeller

```python
# F-014, F-015
- id, patient (FK)
- amount, description
- payment_date
- created_at
```

**Sorumlu:** Cihan / Ali

#### Adım 2.8: Migrasyonlar

```bash
python manage.py makemigrations
python manage.py migrate
```

---

### Faz 3: API Uç Noktaları (2–3. Hafta)

#### Adım 3.1: URL Yapısı

```
/api/auth/token/           — JWT login
/api/auth/token/refresh/   — Token yenileme
/api/auth/me/              — Mevcut kullanıcı bilgisi
/api/patients/             — Hasta CRUD
/api/patients/?search=     — F-004 arama
/api/patients/{id}/        — Detay, güncelleme
/api/appointments/         — Randevu listesi, oluşturma
/api/appointments/?date=   — Tarihe göre filtreleme
/api/appointments/{id}/    — Güncelleme, iptal
/api/treatments/           — Tedavi listesi, oluşturma
/api/treatments/?patient=  — Hastaya göre
/api/treatment-types/      — F-020 tedavi türleri (Admin)
/api/settings/clinic/      — F-022 klinik ayarları
/api/dashboard/today/      — F-013 bugünün randevuları
/api/payments/             — Ödeme kayıtları
```

#### Adım 3.2: Serializer'lar

- `PatientSerializer`, `PatientListSerializer`
- `AppointmentSerializer`, `AppointmentCreateSerializer`
- `TreatmentSerializer`, `TreatmentTypeSerializer`
- `PaymentSerializer`

**Sorumlu:** Ali, Yaman

#### Adım 3.3: ViewSet'ler ve İzinler

- `PatientViewSet`: list, create, retrieve, update
- `AppointmentViewSet`: list, create, retrieve, update, destroy
- `TreatmentViewSet`, `TreatmentTypeViewSet`
- Permission: `IsAuthenticated`, Admin için `IsAdminUser` gerekli endpoint'lerde
- Doctor sadece kendi randevularını görebilir (Filtreleme)

**Sorumlu:** Ali, Cihan

#### Adım 3.4: Validasyonlar

- **F-008:** Aynı hekime aynı saatte randevu engelleme (serializer veya view'da `validate`)
- **F-003:** Ad, Soyad, Telefon zorunluluğu
- TC Kimlik 11 hane kontrolü (opsiyonel)

**Sorumlu:** Yaman, Ali

---

### Faz 4: Frontend Entegrasyonu (3. Hafta)

#### Adım 4.1: API Servis Katmanı (Frontend)

- `frontend/src/services/api.ts` veya benzeri:
  - Axios/fetch instance, base URL: `http://localhost:8000/api`
  - JWT token'ı header'a ekleme
  - 401 durumunda login sayfasına yönlendirme

**Sorumlu:** Ali, Cihan

#### Adım 4.2: Mock Verilerden API'ye Geçiş

- `PatientSearch.tsx`: `mockPatients` → `GET /api/patients/?search=`
- `PatientDialog.tsx`: `handleSave` → `POST /api/patients/`
- `AppointmentCalendar.tsx`: `mockAppointments` → `GET /api/appointments/?date=...`
- `AppointmentDialog.tsx`: `handleSave` → `POST /api/appointments/`
- `PatientProfile.tsx`: `patientData` → `GET /api/patients/{id}/`
- `Dashboard.tsx`: `todayAppointments` → `GET /api/dashboard/today/`

**Sorumlu:** Ali, Cihan (WP2, WP4)

#### Adım 4.3: Gerçek Login

- `LoginPage.tsx`: E-posta + şifre → `POST /api/auth/token/`
- Token'ı localStorage veya cookie'de saklama
- `App.tsx`: token varsa `isAuthenticated=true`

**Sorumlu:** Ali

---

### Faz 5: Ek Özellikler ve Güvenlik (4. Hafta)

#### Adım 5.1: Doküman Yükleme (F-016)

- `Document` modeli: patient FK, file (FileField), document_type
- `MEDIA_ROOT`, `MEDIA_URL` ayarları
- JPEG/PNG validasyonu

**Sorumlu:** Cihan

#### Adım 5.2: KVKK Uyumu (NF-003)

- Hassas alanlar için veritabanında şifreleme (django-fernet-fields veya benzeri)
- Alternatif: Sadece HTTPS ve erişim kontrolü ile başlayıp, ileride şifreleme eklenebilir

**Sorumlu:** Yaman

#### Adım 5.3: Admin Paneli

- `CustomUser`, `Patient`, `Appointment`, `Treatment`, `TreatmentType`, `Payment` için `admin.py` kayıtları
- İlk superuser oluşturma: `python manage.py createsuperuser`

**Sorumlu:** Şükrü, Yaman

#### Adım 5.4: PostgreSQL ve Docker (WP5)

- `docker-compose.yml`: Django, PostgreSQL, (opsiyonel) Nginx
- `DATABASES` ortam değişkenleri ile yapılandırma

**Sorumlu:** Şükrü

---

## 3. Ekip Görev Dağılımı (Özet)

| Kişi | Ana Sorumluluklar |
|------|-------------------|
| **Ali** | JWT auth, Appointment API, Frontend-Backend entegrasyonu, Patient API |
| **Yaman** | Modeller (Patient, Anamnesis, Appointment, Treatment, TreatmentType), Validasyonlar, KVKK |
| **Cihan** | Dashboard API, Payment API, Doküman yükleme, Frontend API servis katmanı |
| **Şükrü** | ClinicSettings, Docker, PostgreSQL, Admin paneli, Dağıtım |

---

## 4. Öncelik Sırası (MVP)

1. **Kritik (İlk 2 hafta):**
   - CustomUser + JWT
   - Patient modeli + CRUD API
   - Appointment modeli + CRUD API + çakışma kontrolü
   - Frontend’te mock → API geçişi (hastalar, randevular)
   - Login

2. **Orta (3. hafta):**
   - Treatment, TreatmentType modelleri
   - Dashboard API
   - PatientProfile API (hasta detayı, tedavi geçmişi)
   - Klinik ayarları (F-022)

3. **Düşük (4. hafta ve sonrası):**
   - Payment API
   - Doküman yükleme
   - WhatsApp bildirimi (F-012)
   - PostgreSQL + Docker

---

## 5. Test Stratejisi

- Her model için `api/tests.py` veya `api/tests/test_*.py`
- API endpoint’leri için `APITestCase` (DRF)
- Örnek: `POST /api/patients/` ile hasta oluşturma, `GET` ile listeleme

**Sorumlu:** Tüm ekip (WP4)

---

## 6. Dokümantasyon

- API dokümantasyonu: DRF’in built-in browsable API veya **drf-spectacular** (OpenAPI/Swagger)
- `README` güncellemesi: Backend kurulumu, `.env` örnekleri

**Sorumlu:** Şükrü, Ali

---

## 7. Hızlı Başlangıç Komutları

```bash
# Backend dizinine geç
cd backend

# Sanal ortam aktifleştir (Windows)
.\venv\Scripts\activate

# Bağımlılıkları yükle
pip install -r requirements.txt

# Migrasyonlar
python manage.py makemigrations
python manage.py migrate

# Superuser oluştur
python manage.py createsuperuser

# Sunucuyu başlat
python manage.py runserver
# http://localhost:8000
```

---

*Bu plan, İster Analizi Dokümanı (F-001–F-022, NF-001–NF-010) ve mevcut frontend yapısına göre hazırlanmıştır. Sprint sırasında gerektiğinde güncellenebilir.*
