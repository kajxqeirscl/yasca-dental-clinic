# Test Rehberi — Yaşca Dental Clinic

Bu rehber, projede test ekleme/çalıştırma/debug etme için tüm bilmen gereken şeyleri içerir.
Yeni katılan bir geliştirici 5 dakikada test çalıştırabilir, 15 dakikada test ekleyebilir.

## İçindekiler

1. [Quick Start](#quick-start)
2. [Backend: SQLite vs PostgreSQL Modu](#backend-sqlite-vs-postgresql-modu)
3. [Frontend Vitest](#frontend-vitest)
4. [E2E Playwright](#e2e-playwright)
5. [Naming Convention](#naming-convention)
6. [Factory Kullanımı](#factory-kullanımı)
7. [MSW Mock Pattern'leri](#msw-mock-patternleri)
8. [A11y Testleri](#a11y-testleri)
9. [Multi-tenant Test Yazma](#multi-tenant-test-yazma)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Backend (SQLite, hızlı)
```powershell
cd backend
pytest                              # Tüm testler
pytest -k test_middleware           # İsim filtreli
pytest --cov                        # Coverage ile
```

### Backend (PostgreSQL, production fidelity)
```powershell
# Tek komut helper (Docker container'ı yönetir):
cd backend
.\scripts\test-pg.ps1                       # Tüm testler PG mode
.\scripts\test-pg.ps1 -m requires_postgres  # Sadece izolasyon testleri
.\scripts\test-pg.ps1 -KeepRunning          # Container ayakta bırak
```

### Frontend Unit
```powershell
cd frontend
npm test                            # Tüm testler
npm test -- AppointmentDialog       # Tek dosya
npm run test:watch                  # Watch mode
npm run test:coverage               # Coverage + HTML rapor
```

### Frontend E2E (Playwright)
```powershell
cd frontend
npx playwright test                          # Tüm E2E
npx playwright test --grep @a11y             # Sadece a11y suite
npx playwright test --ui                     # Interactive UI mode (debug)
npx playwright test e2e/auth.spec.ts --debug # Step debugger
```

---

## Backend: SQLite vs PostgreSQL Modu

Proje **dual-mode** test stratejisi kullanır:

| | SQLite (default) | PostgreSQL |
|---|---|---|
| Hız | ⚡ ~2s | 🐢 ~15-20s startup |
| Tenant isolation | ❌ Test edilmez (shim aktif) | ✅ Gerçek schema switching |
| Migration | ❌ Atlanır | ✅ migrate_schemas çalışır |
| Use case | TDD, hızlı feedback | Pre-commit, CI, izolasyon |

### Mod nasıl seçilir?
`DATABASE_URL` env var:
- **Boş veya `sqlite` içerir** → SQLite mode. Shim'ler aktif (`backend/conftest.py`, `backend/core/settings_test.py`).
- **`postgres` içerir** → PostgreSQL mode. Gerçek django-tenants çalışır, `requires_postgres` marker'lı testler aktif olur.

### Ne zaman hangi mod?
- **Geliştirme döngüsü** (TDD): SQLite. Daha hızlı feedback.
- **Multi-tenant kod değiştirirken**: PostgreSQL. İzolasyon testleri zorunlu.
- **PR öncesi**: Her ikisi de geçmeli (CI matrix bunu zorunlu kılar).
- **`backend/api/middleware.py`, `customers/views.py` değişikliklerinde**: PostgreSQL **mutlaka**.

### `test-pg.ps1` script'i ne yapar?
1. `docker-compose.test.yml`'i çalıştırır (port 5433, ephemeral `yascadb_test`)
2. PostgreSQL'in hazır olmasını bekler
3. `DATABASE_URL` env var'ı export eder
4. pytest çalıştırır
5. Container'ı kapatır (`-KeepRunning` ile ayakta bırakılabilir)

---

## Frontend Vitest

Test dosyaları: `src/**/*.{test,spec}.{ts,tsx}`.

### Watch mode
```powershell
npm run test:watch  # Sadece etkilenen dosyalar çalışır
```

### Coverage HTML raporu
```powershell
npm run test:coverage
# Aç: frontend/coverage/index.html
```

### Threshold'lar (`vitest.config.ts`)
Şu an: lines 54%, branches 45%, functions 38%, statements 54%.
**Bu eşikler asla düşmemeli.** Yeni test eklendikçe yukarı çekilir.

### Yeni test eklerken
1. Component'in yanına `.test.tsx` dosyası oluştur.
2. `renderWithProviders` kullan (otomatik Router + Auth + i18n + MSW).
3. `import { http, HttpResponse } from 'msw'` + `server.use(...)` ile API mock'la.
4. **Türkçe** test description, **İngilizce** class/function adı.

Örnek minimal test:
```typescript
import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('isim render edilir', async () => {
    renderWithProviders(<MyComponent name="Ali" />);
    await waitFor(() => {
      expect(screen.getByText('Ali')).toBeInTheDocument();
    });
  });
});
```

---

## E2E Playwright

Test dosyaları: `frontend/e2e/*.spec.ts`.

### Interactive UI mode (debug için tavsiye)
```powershell
npx playwright test --ui
```
- Test'leri görsel olarak izle, step-by-step çalıştır.
- Time-travel debugger.
- Network/console panel.

### Tek test step-by-step
```powershell
npx playwright test e2e/auth.spec.ts --debug
```

### Trace viewer (CI'da failure inceleme)
CI artifact'ından `trace.zip` indir, sonra:
```powershell
npx playwright show-trace trace.zip
```

### A11y E2E
```powershell
npx playwright test --grep @a11y
```

### Tenant-specific E2E
E2E test'ler `standard.localhost:5173` hostname'ini kullanır.
- Windows'ta `hosts` dosyasına ekle:
  ```
  127.0.0.1 standard.localhost
  127.0.0.1 premium.localhost
  ```

---

## Naming Convention

| | Convention | Örnek |
|---|---|---|
| Test description (frontend) | **Türkçe**, kullanıcı dili | `'isOpen=true iken dialog görünür'` |
| Test description (backend) | İngilizce (pytest convention) | `def test_login_returns_tokens(self)` |
| describe/class adı | **İngilizce** kod dili | `describe('AppointmentDialog', ...)` veya `class TestLogin` |
| Test dosyası adı | `*.test.tsx` (component) / `test_*.py` (Django) | `AppointmentDialog.test.tsx` / `test_views.py` |
| A11y dosyası | `*.a11y.test.tsx` ayrı klasör | `src/app/components/__a11y__/LoginPage.a11y.test.tsx` |

---

## Factory Kullanımı

### Backend (factory-boy)
```python
from api.tests.factories import (
    PatientFactory, AppointmentFactory, DoctorUserFactory
)

# Default değerlerle:
patient = PatientFactory()

# Override:
patient = PatientFactory(first_name="Ali", phone="+905551234567")

# Batch:
patients = PatientFactory.create_batch(5)
```

### Frontend (manual factory functions)
```typescript
import { makePatient, makeAppointment } from '../../test/factories';

const patient = makePatient({ first_name: 'Veli' });
const appointment = makeAppointment({ status: 'completed', date: '2026-08-01' });
```

`frontend/src/test/factories.ts` dosyasında tüm factory tanımları.

---

## MSW Mock Pattern'leri

### Global handlers
`frontend/src/mocks/handlers.ts` — tüm test'ler için default endpoint cevapları.

### Per-test override
```typescript
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';

it('boş hasta listesi', async () => {
  server.use(
    http.get('http://localhost:8000/api/patients/', () =>
      HttpResponse.json({ count: 0, results: [] }),
    ),
  );
  // ...
});
```

`afterEach`'te otomatik `server.resetHandlers()` çalışır (`setupTests.ts`).

### Network error simülasyonu
```typescript
server.use(
  http.post('/api/patients/', () => HttpResponse.error()),
);
```

### Request inspect (POST body kontrolü)
```typescript
let capturedBody: any;
server.use(
  http.post('/api/patients/', async ({ request }) => {
    capturedBody = await request.json();
    return HttpResponse.json({ id: 1 }, { status: 201 });
  }),
);
// ... test çalıştırılır
expect(capturedBody.first_name).toBe('Ali');
```

---

## A11y Testleri

### Unit a11y (vitest-axe)
`frontend/src/app/components/__a11y__/*.a11y.test.tsx`.

```typescript
import { axe } from 'vitest-axe';

const { container } = renderWithProviders(<MyPage />);
const results = await axe(container, {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
});
expect(results).toHaveNoViolations();
```

### E2E a11y (@axe-core/playwright)
`frontend/e2e/a11y.spec.ts` — gerçek browser, gerçek backend.

```typescript
import AxeBuilder from '@axe-core/playwright';

const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .analyze();
expect(results.violations).toEqual([]);
```

### Violation çıkarsa ne yap?
1. **Önce düzelt** (waive etme!). Çoğu ihlal kolay fix: `aria-label`, `alt`, `<label>`, contrast.
2. UI primitive refactor gerekli ise: `disableRules` ile geçici skip + TODO comment + tracking issue.
3. Asla `expect(...).toHaveNoViolations.toEqual(false)` gibi yamalama yapma.

---

## Multi-tenant Test Yazma

### Ne zaman `TenantTestCase`?
- Gerçek schema switching test edilecek → `FastTenantTestCase` (django-tenants).
- Cross-tenant isolation doğrulanacak.
- Migration shape kontrolü.

### Ne zaman default `pytest.mark.django_db`?
- Tek tenant kontekstinde CRUD/RBAC.
- View/serializer/permission birim testi.
- SQLite mode'da çalışmasını isteyen testler.

### Marker kullanımı
```python
@pytest.mark.requires_postgres
class TestTenantIsolation(FastTenantTestCase):
    ...
```

SQLite mode'da otomatik skip edilir. PostgreSQL mode'da aktiftir.

### Örnek: cross-tenant isolation testi
Bkz: `backend/api/tests/test_tenant_isolation.py`

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'pytest'"
→ `pip install -r backend/requirements-dev.txt`

### "DATABASE_URL set but Postgres not reachable"
→ Docker container çalışıyor mu? `docker ps` ile kontrol et.
→ Port çakışması: `docker compose -f docker-compose.test.yml down` sonra tekrar başlat.

### Vitest tek test'te timeout
→ `vitest.config.ts`'te `testTimeout: 10000` zaten set.
→ Eğer test paralel run'da fail oluyor ama izole geçiyorsa: MSW handler race condition olabilir.

### Playwright "Browser not installed"
→ `npx playwright install chromium`

### A11y test "Element does not have label"
→ İlgili input/select/button'a `aria-label` veya wrapped `<label>` ekle.
→ İlgili icon'a `aria-hidden="true"` ekle (decorative ise).

### Frontend coverage düştü (CI kırmızı)
→ Yeni eklediğin kodun test'lerini de yaz.
→ Threshold'u düşürmek YASAK.

---

## Daha fazlası

- [CONTRIBUTING.md](CONTRIBUTING.md) — PR süreci, code review checklist
- [TEST_PYRAMID.md](TEST_PYRAMID.md) — proje için test piramidi hedefi
- [adr/](adr/) — Architecture Decision Records (test stratejisi gerekçeleri)
