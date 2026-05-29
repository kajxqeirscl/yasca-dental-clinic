---
marp: true
theme: default
paginate: true
header: 'Yaşca Dental Clinic — Test Stratejisi'
footer: 'Cihan Kurtbey · 2026'
---

<!-- _class: lead -->

# Yaşca Dental Clinic

## Kapsamlı Test Stratejisi ve Kalite Güvencesi

Multi-tenant SaaS Sağlık Yazılımı

**Cihan Kurtbey** · 2026

---

## Sunum Akışı

1. **Proje Tanıtımı** — Yaşca nedir, neden test kritik?
2. **Test Stratejisi** — Test piramidi, dual-mode yaklaşımı
3. **Kullanılan Teknolojiler** — Tool seçimi ve gerekçeleri
4. **Backend Testing** — pytest, factory-boy, django-tenants
5. **Frontend Testing** — Vitest, MSW, Testing Library
6. **E2E Testing** — Playwright ile gerçek browser
7. **Erişilebilirlik (A11y)** — WCAG 2.1 AA zero-tolerance
8. **Multi-tenant Test Zorlukları** — Schema isolation
9. **Mutation Testing** — Coverage rakamlarının yalanı
10. **CI/CD ve Quality Gates** — Pre-commit, GitHub Actions
11. **Sonuçlar ve Öğrenilen Dersler**

---

## 1. Proje Tanıtımı — Yaşca Nedir?

**Yaşca** açık kaynak, çok-kiracılı (multi-tenant) bir SaaS diş kliniği yönetim platformudur.

### Teknoloji Yığını
- **Backend:** Django 5.2 + DRF + django-tenants
- **Frontend:** React 18 + TypeScript + Vite + Tailwind
- **DB:** PostgreSQL (schema-per-tenant)
- **Deployment:** Docker, Render

### Temel Özellikler
- Çoklu klinik yönetimi (her klinik kendi izole DB schema'sında)
- Hasta, randevu, tedavi, ödeme yönetimi
- Dental şema (FDI numaralandırma)
- Rol-bazlı yetkilendirme (Admin/Doktor/Asistan)
- Audit log (KVKK uyumluluğu)
- Türkçe/İngilizce i18n

---

## Neden Test Kritik?

### Sağlık Yazılımı + Multi-tenant SaaS = Yüksek Risk

| Risk | Sonuç |
|------|-------|
| Cross-tenant veri sızıntısı | KVKK ihlali, ticari felaket |
| Form validation hatası | Yanlış hasta verisi |
| A11y eksikliği | Yasal yaptırım (5378, EAA) |
| Auth/RBAC bug | Yetkisiz erişim |

### "Yeşil Test = Yeşil Production" Garantisi Olmalı

Sadece **çok sayıda** test yetmez — testlerin **doğru şeyleri** doğrulaması gerekir.

---

## 2. Test Stratejisi — Test Piramidi

```
            /\
           /E2E\         %10  Playwright, gerçek browser + backend
          /------\
         /Integ.  \      %20  pytest + APIClient (DB var, network yok)
        /----------\
       /   Unit     \    %70  vitest + MSW / pytest isolated
      /______________\
```

### Neden Bu Oran?

- **Unit testler hızlı** (5–200ms) → TDD döngüsünde çalıştırılır
- **E2E testler pahalı** (5–30s) → sadece kritik flow'lar
- **Integration testler** API contract'ı korur

### Yaşca'da Mevcut Durum (Sunum tarihinde)

**403 test** — 148 backend pytest + 151 frontend vitest + 83 E2E Playwright + 21 multi-tenant izolasyon

---

## 3. Kullanılan Teknolojiler

### Backend
| Tool | Görev | Seçim Gerekçesi |
|------|-------|-----------------|
| **pytest** | Test runner | Daha az boilerplate, parametrize, fixture |
| **pytest-django** | Django entegrasyonu | DB izolasyon, fixtures otomatik |
| **factory-boy + Faker** | Test data | Türkçe locale, override-able |
| **pytest-cov** | Coverage | XML/HTML rapor, threshold gate |
| **mutmut** | Mutation testing | Testlerin gerçek etkinliğini ölçer |

### Frontend
| Tool | Görev | Seçim Gerekçesi |
|------|-------|-----------------|
| **Vitest** | Test runner | Vite native, Jest'ten ~3x hızlı |
| **@testing-library/react** | Component test | Kullanıcı-odaklı sorgular |
| **MSW** | API mock | Network-layer interception |
| **Playwright** | E2E | Çoklu browser, trace viewer |
| **vitest-axe** | A11y unit | WCAG otomasyonu |
| **@axe-core/playwright** | A11y E2E | Browser-level a11y |

---

## Tooling Seçim Felsefesi

> **"Minimum boilerplate, maximum güvence"**

### Reddedilen Alternatifler
- ❌ **Jest** → Vitest daha hızlı, Vite ile native
- ❌ **Cypress** → Multi-tenant subdomain için Playwright daha esnek
- ❌ **Manuel fetch mock** → MSW endüstri standardı
- ❌ **RLS (Row-Level Security)** → Schema isolation daha güçlü

### ADR (Architecture Decision Records)
Tüm kritik test kararları dokümante edildi:
- `ADR-0001` Test tooling seçimi
- `ADR-0002` Multi-tenant isolation stratejisi
- `ADR-0003` A11y zero-tolerance politikası

---

## 4. Backend Testing — pytest + factory-boy

### Test Organizasyonu

```
backend/
├── api/tests/
│   ├── factories.py           # factory-boy modelleri
│   ├── conftest.py            # Shared fixtures
│   ├── test_models.py         # Unit: model properties
│   ├── test_serializers.py    # Unit: validation
│   ├── test_views.py          # Integration: APIClient
│   ├── test_middleware.py     # Unit: tenant resolution
│   ├── test_admin.py          # Smoke: admin registration
│   ├── test_mixins.py         # Unit: audit log mixin
│   └── test_tenant_isolation.py  # PG-only: schema isolation
└── customers/tests/
    ├── test_models.py         # Client/Domain modelleri
    └── test_register.py       # Tenant kayıt akışı
```

**Toplam:** 148 SQLite + 21 PostgreSQL = **169 backend test**

---

## Factory Pattern — DRY Test Data

### Klasik Yaklaşım (Tekrarlı)
```python
patient = Patient.objects.create(
    first_name="Ali",
    last_name="Yılmaz",
    phone="+905551234567",
    tckn="12345678901",
    # ... 10+ field
)
```

### factory-boy ile (Tek Satır)
```python
from api.tests.factories import PatientFactory

patient = PatientFactory()                              # Tüm field random
patient = PatientFactory(first_name="Ali")              # Override
patients = PatientFactory.create_batch(5)               # Batch
```

### Avantajları
- ✅ Türkçe locale `Faker("first_name", locale="tr_TR")`
- ✅ Sequence: `username = factory.Sequence(lambda n: f"user{n}")`
- ✅ İlişkili nesneler: `doctor = factory.SubFactory(DoctorUserFactory)`
- ✅ Test kodu **%70 daha kısa**

---

## Backend Test Örneği — RBAC

```python
@pytest.mark.django_db
class TestTreatmentTypeRBAC:
    """F-013: Tedavi türü yönetimi sadece admin/doktor."""

    def setup_method(self):
        self.admin = AdminUserFactory()
        self.doctor = DoctorUserFactory()
        self.assistant = AssistantUserFactory()

    def test_create_allowed_for_doctor(self):
        res = auth_client(self.doctor).post(
            "/api/treatment-types/",
            {"name": "Yeni", "default_price": "150"},
            format="json"
        )
        assert res.status_code == 201

    def test_create_blocked_for_assistant(self):
        res = auth_client(self.assistant).post(...)
        assert res.status_code == 403
```

→ **5 senaryo** her endpoint için: list, create(admin), create(doctor), create(assistant), delete(assistant)

---

## 5. Frontend Testing — Vitest + MSW

### Mimari

```
Test
  └─ Component (React)
       └─ fetchPatients()  ← MSW intercept
            └─ HTTP request → MSW mock cevap
                 (gerçek backend'e gitmez)
```

### Neden MSW (Mock Service Worker)?

- 🚀 **Hızlı**: Network roundtrip yok
- 🎯 **Deterministik**: Her test izole mock data
- 🔄 **Aynı handler'lar dev + test**: `src/mocks/handlers.ts`
- 🧪 **Test'e özel override**: `server.use(...)`

```typescript
server.use(
  http.get('/api/patients/', () =>
    HttpResponse.json({ count: 0, results: [] })
  )
);
```

---

## Frontend Test Altyapısı — Custom Helpers

### Sorun: Her test'te aynı boilerplate

```typescript
render(
  <MemoryRouter>
    <AuthProvider>
      <I18nextProvider i18n={i18n}>
        <MyComponent />
      </I18nextProvider>
    </AuthProvider>
  </MemoryRouter>
);
```

### Çözüm: `renderWithProviders`

```typescript
renderWithProviders(<MyComponent />, { authenticated: true });
```

### Ek Helper'lar
- `factories.ts` — `makePatient()`, `makeAppointment()`, vb.
- `setupTests.ts` — MSW auto-start, localStorage reset
- `vitest-axe matchers` — `expect(container).toHaveNoViolations()`

→ Test yazma maliyeti **dramatik düşer**.

---

## Frontend Component Test Örneği

```typescript
describe('PatientDialog — Validation', () => {
  it('10 haneli TCKN reddedilir', async () => {
    renderWithProviders(
      <PatientDialog
        isOpen
        onClose={vi.fn()}
        initialData={{
          first_name: 'X',
          last_name: 'Y',
          phone: '+905551234567',
          tckn: '1234567890', // 10 hane
        }}
      />,
      { authenticated: true },
    );

    await userEvent.click(screen.getByRole('button', { name: /Kaydet/ }));

    await waitFor(() => {
      expect(screen.getByText(/11 haneli/)).toBeInTheDocument();
    });
  });
});
```

→ **Kullanıcı davranışını** simüle eder, implementation detayına bağlı değildir.

---

## Test Kapsamı — Frontend

| Bileşen | Test Sayısı | Coverage |
|---------|-------------|----------|
| AuthContext | 8 | %97 |
| API Service | 22 | %42 |
| LoginPage | 6 | ~%80 |
| Dashboard | 5 | ~%75 |
| PatientSearch | 5 | ~%80 |
| Layout | 8 | ~%85 |
| ErrorBoundary | 5 | %95 |
| **AppointmentDialog** | 9 | %85 |
| **PatientDialog** | 9 | %85 |
| **PaymentDialog** | 8 | %85 |
| **TreatmentAddDialog** | 7 | %80 |
| **AppointmentDetailDialog** | 6 | %80 |
| A11y testleri (10 sayfa) | 10 | (WCAG 2.1 AA) |

**Toplam:** 151 frontend unit test

---

## 6. E2E Testing — Playwright

### Neden E2E?

Unit/integration testler **API contract'ı** doğrular. Ama:
- Login → Dashboard → Patient → Appointment akışı çalışıyor mu?
- Radix Dialog gerçek browser'da focus trap yapıyor mu?
- Multi-tenant subdomain routing **gerçek** Chrome'da çalışıyor mu?

→ Bu sorulara **sadece E2E** cevap verebilir.

### Playwright'in Üstünlükleri

- ✅ Çoklu browser (Chromium, Firefox, WebKit)
- ✅ **Trace viewer**: failure'da step-by-step replay
- ✅ **Interactive UI mode**: debug için ideal
- ✅ Auto-wait (flaky azaltır)
- ✅ `@axe-core/playwright` ile gerçek a11y scan

---

## E2E Test Suite — Yaşca

### 8 Spec Dosyası, 83 Test

| Spec | Test | Kapsamı |
|------|------|---------|
| auth.spec.ts | 14 | Login, RBAC, korumalı route |
| dashboard.spec.ts | 3 | Stats, filter |
| appointments.spec.ts | 10 | CRUD, conflict |
| patients.spec.ts | ~8 | Search, create, detail |
| treatments-payments.spec.ts | ~10 | Tedavi/ödeme akışı |
| settings.spec.ts | 6 | Klinik ayarları RBAC |
| public.spec.ts | 4 | Landing, register |
| **registration.spec.ts** | 3 | Tenant kayıt flow |
| **tenant-isolation.spec.ts** | 2 | Cross-tenant koruma |
| **subdomain-routing.spec.ts** | 4 | ali.localhost vs /app/ali |
| **a11y.spec.ts** | 4 | WCAG 2.1 AA |
| **keyboard-navigation.spec.ts** | 3 | Klavye-only kullanım |

---

## E2E Test Örneği — Cross-Tenant Isolation

```typescript
test('cross-tenant API isteği boş veya 4xx döner', async ({
  browser,
}) => {
  // Standard kliniğine login ol, JWT al
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await loginAs(page, 'tony', 'demo123!');

  const accessToken = await page.evaluate(() =>
    localStorage.getItem('access_token')
  );

  // Aynı token ile premium kliniğin API'sine istek
  const apiRequest = await request.newContext();
  const res = await apiRequest.get(
    'http://premium.localhost:8000/api/patients/',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  // Schema isolation çalışıyorsa: 401/403 veya farklı klinik verisi
  if (res.status() === 200) {
    const data = await res.json();
    expect(JSON.stringify(data)).not.toContain('Mustafa Öztürk');
  } else {
    expect([401, 403, 404]).toContain(res.status());
  }
});
```

---

## 7. Accessibility — Zero-Tolerance Politikası

### Neden Sağlık Yazılımında Kritik?

- **Kullanıcılar geniş yaş aralığında**, görme/işitme/motor kısıtlılığı olabilir
- **Türkiye**: 5378 sayılı Engelliler Hakkında Kanun
- **AB**: European Accessibility Act (2025'ten itibaren zorunlu)
- **Ticari**: Kurumsal müşteri tercih kriteri

### Yaşca Politikası

> **Tek bir WCAG 2.1 AA ihlali = build kırmızı.**
> Düzeltmeden merge yok. Waive etmek YASAK.

---

## A11y Test Mimarisi

### İki Katman

**Unit (vitest-axe)** — Component izole render
```typescript
const { container } = renderWithProviders(<LoginPage />);
const results = await axe(container, {
  runOnly: { type: 'tag',
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }
});
expect(results).toHaveNoViolations();
```

**E2E (@axe-core/playwright)** — Gerçek browser
```typescript
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();
expect(results.violations).toEqual([]);
```

### Klavye Navigasyonu
- Tab order doğru mu?
- Esc ile dialog kapanıyor mu?
- Enter ile form submit?

---

## A11y — Bulunan ve Düzeltilen İhlaller

İlk axe çalıştırmasında **şu ihlaller tespit edildi**:

| İhlal | Yer | Düzeltme |
|-------|-----|----------|
| Language `<select>` aria-label yok | LoginPage | `aria-label="Dil seçimi"` |
| Language `<select>` aria-label yok | Layout | `aria-label="Dil seçimi"` |
| Globe ikonu okuyucuyu karıştırıyor | LoginPage, Layout | `aria-hidden="true"` |

### Sonuç
**0 WCAG 2.1 AA violation** — tüm sayfalar yeşil ✅

### Tracking
- 10 unit a11y suite + 4 E2E spec
- `dialogs.a11y.test.tsx` — 5 dialog scan
- `keyboard-navigation.spec.ts` — Tab/Enter/Esc

---

## 8. Multi-tenant Test Zorlukları

### Sorun: django-tenants PostgreSQL gerektirir

```python
# Gerçek production:
Patient.objects.all()
# WHERE clinic_a schema'sında → sadece A'nın hastaları

# SQLite test ortamı:
Patient.objects.all()
# Tüm hastalar (schema kavramı yok)
```

### Yaşca'nın Çözümü: **Dual-Mode Strategy**

```
DATABASE_URL boş veya sqlite
  ↓
SQLite mode (hızlı TDD)
  • Shim: set_schema → no-op
  • TENANT_APPS → SHARED_APPS flatten
  • Middleware bypass

DATABASE_URL = postgres://...
  ↓
PostgreSQL mode (production fidelity)
  • Gerçek schema switching
  • Gerçek HeaderTenantMiddleware
  • requires_postgres marker'lı testler aktif
```

---

## Dual-Mode Implementasyon

### `backend/conftest.py`
```python
_db_url = os.environ.get("DATABASE_URL", "")
_is_sqlite_mode = not _db_url or "sqlite" in _db_url

if _is_sqlite_mode:
    # Sadece SQLite'da shim uygula
    BaseDatabaseWrapper.set_schema = _noop_set_schema
```

### `backend/core/settings_test.py`
```python
if _use_sqlite_shim:
    SHARED_APPS = list(SHARED_APPS) + TENANT_APPS
    MIDDLEWARE = [m for m in MIDDLEWARE
                  if m != "api.middleware.HeaderTenantMiddleware"]
# else: production-identical config
```

### CI Matrix
```yaml
strategy:
  matrix:
    db-mode: [sqlite, postgres]
```

→ **Her PR her iki modda da yeşil olmak zorunda**.

---

## Tenant Isolation Test Suite — 21 Test

### Kapsanan Senaryolar

**A) Schema İzolasyonu (6 test)** — Her model için ayrı
- Patient, Appointment, Treatment, Payment, AuditLog, ClinicSettings

**B) Middleware Resolution (3 test)**
- X-Tenant header: valid/invalid/empty

**C) Migration Shape (3 test)**
- TENANT_APPS public'te değil, SHARED_APPS sadece public'te

**D) Cross-Tenant API (3 test)**
- A'nın JWT'si B'nin endpoint'inde çalışmaz

**E) Negative Tests (2 test)**
- SQL injection denemesi, schema name injection

**F) Stress (3 test)**
- Nested context, rollback isolation, paralel tenant

---

## 9. Mutation Testing — Coverage'ın Yalanı

### Sorun

```python
def critical_function(x):
    if x > 10:
        return x * 2        # ← test buraya ulaşıyor
    return 0                # ← test buraya da ulaşıyor

# Test:
def test_critical():
    critical_function(5)
    critical_function(15)
```

**Coverage: %100** ✅
Ama hiçbir `assert` yok — bug olsa fark edilmez!

### Mutation Testing Çözümü

Aracın yaptığı:
1. Kodda kasıtlı mutasyon yapar: `if x > 10` → `if x >= 10`
2. Test'leri çalıştırır
3. Mutant **öldürüldü mü** (test fail)?
4. Hayır ise → **test boşluğu** raporlanır

---

## Yaşca Mutation Setup

### Backend (mutmut)

```ini
[mutmut]
paths_to_mutate=api/middleware.py,api/mixins.py,api/serializers.py,customers/views.py
runner=pytest -x --tb=no -q ...
```

### Frontend (Stryker)

```json
{
  "mutate": [
    "src/app/services/api.ts",
    "src/app/hooks/**",
    "src/app/components/AppointmentDialog.tsx",
    ...
  ],
  "thresholds": { "high": 80, "low": 60, "break": 60 }
}
```

### Hedefler

| Modül | Mutation Score |
|-------|----------------|
| middleware.py | ≥%85 |
| serializers.py | ≥%80 |
| api.ts (frontend) | ≥%80 |
| Dialog'lar | ≥%75 |

→ **Haftalık cron** ile çalışır, düşme olursa GitHub issue açılır.

---

## 10. CI/CD Pipeline

### `.github/workflows/ci.yml` — Her PR'da Çalışır

```
┌─────────────────────────────────────────────────┐
│ Backend Matrix                                  │
├──────────────────┬──────────────────────────────┤
│ SQLite mode      │ PostgreSQL mode              │
│ (hızlı, 148 test)│ (fidelity, +21 isolation)    │
└──────────────────┴──────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ Frontend Tests (vitest + coverage threshold)    │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ A11y Tests (WCAG 2.1 AA — zero-tolerance)       │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│ E2E Tests (Playwright, real DB + UI)            │
└─────────────────────────────────────────────────┘
```

**Hepsi yeşil olmadan merge yok** (required checks).

---

## Pre-commit Hook'ları — Husky

### Bozuk Kod Commit'e Bile Giremez

```
git commit
  ↓
.husky/commit-msg     → Conventional Commits format kontrol
  ↓
.husky/pre-commit     → lint-staged (eslint + prettier)
  ↓
git push
  ↓
.husky/pre-push       → Tam test suite
```

### Conventional Commits Zorunluluğu

❌ `git commit -m "düzeltme"`
✅ `git commit -m "fix(auth): X-Tenant header refresh'te kayboluyor"`

### `--no-verify` Yasak

Bypass yok. Acil durumda PR açıklamasında belirtilir.

---

## Flaky Test Karantinası

### Sorun: Test bazen geçer bazen geçmez

Sebepler:
- Race condition
- Date/time mock eksikliği
- Network timing

### Yaşca Politikası

```python
@pytest.mark.flaky    # 3 retry'da geçen testler
def test_something():
    ...
```

- Hafta sonu cron'la **flaky detection** çalışır
- Tespit edilen testler için **GitHub issue** açılır
- **1 hafta** içinde fix edilmezse → karantinaya alınır
- **2 hafta** içinde hâlâ flaky ise → silinir

### Slow Test Budget

- Unit: ≤200ms
- Integration: ≤2s
- E2E: ≤30s

Aşan testler `@pytest.mark.slow` ile ayrı job'da çalışır.

---

## 11. Test Metrikleri Dashboard

### `scripts/test-metrics.py` Otomatik Üretir

```
[*] Test sayilari toplaniyor...
  Backend (pytest):     169
  Frontend (vitest):    151
  E2E (Playwright):     83
  TOPLAM:               403
```

### `docs/TEST_METRICS.md` Auto-update

Her main push'tan sonra:
1. Script çalışır
2. Markdown rapor oluşturur
3. Otomatik PR açar
4. Review + merge

### İçerik

- Test sayıları (katman bazlı)
- Test pyramid görselleştirme
- Hedef vs mevcut oran
- Pyramid sağlık durumu

---

## 12. Dokümantasyon Suite

Tek README yetmez. **First-class deliverable**.

### Dosyalar
```
docs/
├── TESTING.md           # Test rehberi (5dk'da çalıştır)
├── CONTRIBUTING.md      # PR süreci, code review
├── TEST_PYRAMID.md      # Pyramid hedefi
├── TEST_METRICS.md      # AUTO-GENERATED metrik
└── adr/
    ├── 0001-test-strategy.md
    ├── 0002-multi-tenant-isolation.md
    └── 0003-a11y-zero-tolerance.md
```

### PR Template
- ☐ Backend testler yazıldı
- ☐ Multi-tenant değiştiyse: PG mode'da test edildi
- ☐ A11y test eklendi
- ☐ Coverage düşmedi
- ☐ Lint geçti

---

## 13. Sayısal Sonuçlar

### Test Sayıları (Başlangıç → Sonuç)

| | Başlangıç | Sonuç |
|---|-----------|-------|
| Backend test | 0 çalışan (77 kırık) | **169** |
| Frontend unit | 23 | **151** |
| Frontend E2E | 67 | **83** |
| A11y unit | 0 | **10** |
| A11y E2E | 0 | **4** |
| Tenant isolation | 0 | **21** |
| **TOPLAM** | **~90** | **403** |

### Coverage

| | Başlangıç | Sonuç |
|---|-----------|-------|
| Backend lines | %55 | **%78** |
| Frontend lines | %5 | **%57** |
| Frontend branches | %3 | **%46** |

---

## Kalite Gate'leri

### CI Required Checks

✅ Backend SQLite tests (148 PASS)
✅ Backend PostgreSQL tests (148 + 21 PG-only)
✅ Frontend lint (0 warnings)
✅ Frontend type-check (tsc --noEmit)
✅ Frontend tests + coverage threshold
✅ A11y tests (0 WCAG 2.1 AA violation)
✅ E2E tests (Playwright)

### Threshold'lar (asla düşmez)

```typescript
thresholds: {
  lines: 54,
  functions: 38,
  branches: 45,
  statements: 54,
}
```

```yaml
--cov-fail-under=78  # backend
```

---

## 14. Öğrenilen Dersler

### 1. **Coverage rakamı yalan söyler**
%80 coverage olsa bile mutation score düşükse testler işe yaramaz.

### 2. **Test ortamı production'a benzemeli**
SQLite shim'i hızlı ama fidelity yok. Dual-mode strateji şart.

### 3. **A11y bir sonradan ekleme değil**
Baştan WCAG 2.1 AA hedeflemek, sonradan refactor'dan ucuzdur.

### 4. **Smoke test ≠ Test**
"Render olmuyor mu?" yetmez. Validation, error path, edge case zorunlu.

### 5. **Pre-commit hook hayat kurtarır**
Bozuk kod commit'e giremezse, CI'da hata yakalanmaz.

### 6. **Factory pattern test kodunu kısaltır**
factory-boy + frontend factories → **%70 daha az boilerplate**.

### 7. **Multi-tenant test = ayrı bir disiplin**
Schema-per-tenant testlerinin kendi araçları, mark'ları, mode'ları var.

---

## Yapılan Pre-existing Bug Fix

### Tespit Edilen Sorun

Önceki test suite'inde **77 backend test kırıktı**:

- `ClinicFactory` import ediliyordu ama tanımsızdı
- `clinic=...` kwarg'ı geçiyordu ama model'de field yok
- django-tenants migrasyonu sırasında temizlenmemişti

### Çözüm

- 6 dosya temizlendi (conftest, factories, 4 test dosyası)
- `clinic=` referansları kaldırıldı
- `TestMultiTenancyIsolation` sınıfı E2E katmanına taşındı
- Boş placeholder'lar silindi

### Sonuç

**77 ölü test → 148 yaşayan test** (PostgreSQL mode'da +21 daha)

---

## Geliştirilmesi Gereken Alanlar

### Şu An İyi
- ✅ Multi-tenant isolation testleri
- ✅ A11y zero-tolerance
- ✅ Dual-mode test stratejisi
- ✅ CI matrix (SQLite + PG)
- ✅ Pre-commit gate

### Sonraki Adımlar (Faz 9+)
- 🔜 Visual regression (Playwright screenshot diff)
- 🔜 Performance budget (Lighthouse CI)
- 🔜 Contract testing (Pact)
- 🔜 Load testing (Locust) — çok-tenant yük altı
- 🔜 Mutation score'u kademeli %85'e çıkarma

---

## Demo (İsteğe Bağlı)

### Hızlı Komutlar

**Backend SQLite testler:**
```powershell
cd backend
pytest -q
# 148 passed, 21 skipped in 3.82s
```

**Backend PostgreSQL mode:**
```powershell
cd backend
.\scripts\test-pg.ps1
# Docker container başlatır, 169 test çalıştırır
```

**Frontend testler:**
```powershell
cd frontend
npm run test:coverage
# 151 tests passed, coverage HTML üretir
```

**A11y testler:**
```powershell
cd frontend
npm test -- __a11y__
# 10 a11y testi, 0 violation
```

---

## Sayısal Özet — Tek Slide

```
┌────────────────────────────────────────────┐
│                                            │
│         YAŞCA TEST İSTATİSTİKLERİ          │
│                                            │
│  📊 Toplam Test:          403             │
│                                            │
│  🐍 Backend (pytest):     169             │
│  ⚛️  Frontend (vitest):   151             │
│  🌐 E2E (Playwright):     83              │
│                                            │
│  ♿ A11y Violation:        0 (WCAG 2.1 AA)│
│                                            │
│  📈 Backend Coverage:     %78             │
│  📈 Frontend Coverage:    %57             │
│                                            │
│  🔧 CI Required Checks:   7               │
│  📚 Dokümantasyon:        7 dosya         │
│                                            │
│  🚀 PR'dan Production'a:  ~5 dakika       │
│                                            │
└────────────────────────────────────────────┘
```

---

<!-- _class: lead -->

# Teşekkürler

## Sorular?

**Proje:** github.com/yaman-halloum/yasca-dental-clinic
**Dokümantasyon:** `docs/TESTING.md`

### İlgili Belgeler
- ADR-0001: Test stratejisi
- ADR-0002: Multi-tenant isolation
- ADR-0003: A11y zero-tolerance

### Katkıda Bulunanlar
Yaman Halloum · Ali Üre · **Cihan Kurtbey** · Şükrü Yeşilmen
