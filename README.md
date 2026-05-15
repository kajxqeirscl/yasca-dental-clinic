# Yaşca: Diş Kliniği Yönetim Sistemi

Yaşca, diş hekimliği kliniklerinin operasyonel iş akışlarını dijitalleştirmek, veri güvenliğini sağlamak ve klinik verimliliğini artırmak amacıyla geliştirilmiş, açık kaynaklı (FOSS) ve modern bir web uygulamasıdır.

## Kurulum ve Çalıştırma

### Gereksinimler
- **Node.js:** v20.18.0 veya üzeri
- **npm:** v10 veya üzeri
- **Python:** 3.13 veya üzeri (backend için)

---

### 1. Backend Kurulumu

Backend API servisini çalıştırmak için:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

`createsuperuser` komutu admin kullanıcısı oluşturur (kullanıcı adı, e-posta, şifre girin). Admin paneli için bu hesap gereklidir.

**Backend çalıştırma:**
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```
- API: http://localhost:8000
- Admin panel: http://localhost:8000/admin/

---

### 2. Frontend Kurulumu

Ana dizinden:

```powershell
npm run install:all
```

**Frontend çalıştırma:**
```powershell
npm run frontend
```
- Uygulama: http://localhost:5173

---

### 3. Tam Sistem Çalıştırma

Geliştirme sunucularını hızlıca ve aynı anda başlatmak için proje ana dizininde bulunan **`start-dev.ps1`** dosyasını çalıştırabilirsiniz:

```powershell
.\start-dev.ps1
```

Bu komut, backend ve frontend servislerini kendi ayrı terminal pencerelerinde çalıştıracaktır.

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000

---

### 4. Demo Verisi Oluşturma

Projeyi sunum için veya test amaçlı gerçekçi verilerle (klinik, doktor, hasta, randevular) doldurmak isterseniz ana dizinde bulunan **`run-demo.ps1`** dosyasını çalıştırabilirsiniz:

```powershell
.\run-demo.ps1
```

Bu komut size `admin`, `dr_ahmet`, ve `asistan_ayse` adlı test kullanıcılarının giriş bilgilerini (şifre: `demo123!`) konsolda verecektir.

---

### Teknik Notlar
- Stil yönetimi: Tailwind CSS v4 (Vite Engine)
- Path Aliasing: `src` klasörü için `@/` alias yapısı tanımlıdır.
- İkon kütüphanesi: Lucide-React

---

## Test

### Backend Testleri

Test bağımlılıklarını yükleyin (ilk seferinde):

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install pytest pytest-django pytest-cov factory-boy faker
```

Testleri çalıştırın:

```powershell
# Tüm testler
.\venv\Scripts\python -m pytest api/tests/ -v

# Kapsam raporu ile
.\venv\Scripts\python -m pytest api/tests/ --cov=api --cov-report=term-missing
```

**Test yapısı:**

| Dosya | Kapsam |
|---|---|
| `api/tests/test_models.py` | Model özellikleri, `__str__`, `ClinicSettings.get_settings` |
| `api/tests/test_permissions.py` | RBAC izin sınıfları (`IsAdminUser`, `IsAdminOrDoctorUser`) |
| `api/tests/test_serializers.py` | İç içe hasta/anamnez oluşturma, F-008 randevu çakışma kontrolü |
| `api/tests/test_views.py` | Auth, multi-tenancy izolasyonu, tüm CRUD, dashboard |
| `api/tests/test_signals.py` | Grup atama ve `is_staff` sinyal tetikleyicileri |

### Frontend Testleri

```powershell
cd frontend

# Tek seferlik çalıştırma
npm test

# İzleme modunda (geliştirme sırasında)
npm run test:watch

# Kapsam raporu ile
npm run test:coverage
```

**Test yapısı:**

| Dosya | Kapsam |
|---|---|
| `src/app/services/api.test.ts` | JWT saklama, token yenileme, sayfalama yönetimi |
| `src/app/contexts/AuthContext.test.tsx` | Auth durumu, giriş/çıkış, olay dinleyicisi |

> Mock API'ler için [MSW (Mock Service Worker)](https://mswjs.io/) kullanılmaktadır. `src/mocks/` dizininde tüm endpoint handler'ları tanımlıdır.

### E2E Testleri (Playwright)

Tüm sistemin uçtan uca testini yapmak için:

```powershell
cd frontend
# Sadece ilk kullanımda tarayıcıları kurmak için:
npx playwright install

# Testleri çalıştırmak için (geliştirme sunucuları açık olmalıdır)
npx playwright test
```

---

## CI/CD

Proje, GitHub Actions üzerinde otomatik bir CI pipeline'ı ile yapılandırılmıştır (`.github/workflows/ci.yml`).

Her `push` ve `pull_request` işleminde paralel olarak çalışır:

```
Push / PR
    ├── [backend] pytest --cov=api --cov-fail-under=80
    ├── [frontend] tsc --noEmit → eslint → vitest run --coverage
    └── [e2e] Playwright / Chromium  ← yalnızca backend + frontend geçerse
```

---

## Google Drive
Projenin analiz, tasarım ve raporlama süreçlerine ait tüm yaşayan dokümanlar Google Drive üzerinde tutulmaktadır:
- [Proje Ortak Drive Klasörü](https://drive.google.com/drive/folders/1MIkAUt22XlOlq_ApWenSi2XKufBu_92k)

---

## Proje Hakkında
Bu proje, yüksek lisans/abonelik maliyetleri ve karmaşık arayüzler gibi sektörel sorunlara "Radikal Basitlik" felsefesiyle çözüm sunmayı hedefler. Sadece klinik personeli (Hekim, Asistan, Yönetici) tarafından kullanılır.

### Kullanılan Teknolojiler (Tech Stack)
- **Frontend:** React.js, TypeScript, Vite
- **Backend:** Python 3.13, Django REST Framework
- **Database:** SQLite (geliştirme) / PostgreSQL (üretim)
- **Test (Backend):** pytest, pytest-django, factory-boy
- **Test (Frontend):** Vitest, Testing Library, MSW
- **CI/CD:** GitHub Actions

## Proje Yapısı (Monorepo)
- `/frontend`: React.js tabanlı kullanıcı arayüzü (SPA).
- `/backend`: Django tabanlı RESTful API servisleri.
- `/docs`: Dokümantasyon bilgilendirmeleri.

## Katılımcılar
- **Yaman Halloum**
- **Ali Üre**
- **Cihan Kurtbey**
- **Şükrü Yeşilmen**