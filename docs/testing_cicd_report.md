# Yaşca Dental — Testing & CI/CD Strategy Report

## Executive Summary

Yaşca is a **Django REST Framework + React/Vite** monorepo dental clinic management system with multi-tenancy, JWT authentication, and role-based access control. Currently, `backend/api/tests.py` contains only the Django scaffold stub (3 lines), and the frontend has **no test infrastructure whatsoever**. This report defines the full test toolchain, test categories, and a CI/CD pipeline to bring the project to a production-ready quality baseline.

---

## 1. Current State Assessment

| Area | Status |
|---|---|
| Backend unit tests | ❌ Empty stub only (`tests.py`, 63 bytes) |
| Frontend unit tests | ❌ No test runner, no test files |
| Frontend E2E tests | ❌ None |
| CI/CD pipeline | ❌ No `.github/workflows/` or equivalent |
| Code coverage tracking | ❌ None |
| Linting (frontend) | ⚠️ ESLint config exists but not wired to CI |
| Type checking (frontend) | ⚠️ TypeScript configured but not run in pipeline |

---

## 2. Recommended Toolchain

### 2.1 Backend (Python / Django)

| Tool | Purpose | Install |
|---|---|---|
| `pytest` | Modern test runner, much better than `unittest` | `pip install pytest pytest-django` |
| `pytest-cov` | Coverage reporting | `pip install pytest-cov` |
| `factory_boy` | Model factories for test data | `pip install factory-boy` |
| `faker` | Realistic fake data generation | `pip install faker` |
| `djangorestframework` | Built-in `APIClient` for endpoint testing | Already in `requirements.txt` |
| `pytest-django` | Django integration for pytest | `pip install pytest-django` |

**`pytest.ini` / `pyproject.toml` config** needed in `backend/`:
```ini
[pytest]
DJANGO_SETTINGS_MODULE = core.settings
python_files = tests.py test_*.py *_tests.py
```

### 2.2 Frontend (React / TypeScript / Vite)

| Tool | Purpose | Install |
|---|---|---|
| `vitest` | Vite-native test runner (replaces Jest) | `npm i -D vitest` |
| `@testing-library/react` | Component testing utilities | `npm i -D @testing-library/react` |
| `@testing-library/user-event` | Realistic user interaction simulation | `npm i -D @testing-library/user-event` |
| `@testing-library/jest-dom` | Custom DOM matchers | `npm i -D @testing-library/jest-dom` |
| `msw` (Mock Service Worker) | API mocking without real network calls | `npm i -D msw` |
| `jsdom` | Browser environment for Vitest | `npm i -D jsdom` |
| `@vitest/coverage-v8` | Coverage reporting | `npm i -D @vitest/coverage-v8` |

> [!IMPORTANT]
> Use **Vitest** (not Jest). The project uses Vite 6 and Vitest shares the same config. Adding Jest would require duplicating the entire transform/module resolution config.

### 2.3 End-to-End Tests

| Tool | Purpose |
|---|---|
| **Playwright** | Cross-browser E2E testing, excellent DX |
| `@playwright/test` | `npm i -D @playwright/test` |

> [!TIP]
> Playwright is preferred over Cypress here because: (1) the app uses JWT stored in `localStorage`, which Cypress blocks by default; (2) Playwright has first-class support for network interception, which is critical for testing the token refresh flow.

---

## 3. Test Categories & Specific Tests

### 3.1 Backend Unit Tests

#### 3.1.1 Model Tests — `backend/api/tests/test_models.py`

Tests for model behavior, properties, and constraints.

| Test | What it covers |
|---|---|
| `test_customuser_role_properties` | `is_hekim`, `is_asistan`, `is_yonetici` properties on `CustomUser` |
| `test_customuser_admin_is_yonetici_when_superuser` | Superuser with any role should pass `is_yonetici` |
| `test_patient_full_name_property` | `Patient.full_name` concatenates correctly |
| `test_clinic_settings_get_settings_creates_if_missing` | `ClinicSettings.get_settings(clinic)` upsert logic |
| `test_clinic_settings_get_settings_fallback` | Fallback to `pk=1` when clinic is `None` |
| `test_treatment_str_uses_type_name` | `Treatment.__str__` uses type name when type exists |
| `test_treatment_str_uses_treatment_name_fallback` | `Treatment.__str__` falls back to `treatment_name` |
| `test_patient_directory_path` | `patient_directory_path()` generates correct upload path |

#### 3.1.2 Permission Tests — `backend/api/tests/test_permissions.py`

Critical for the RBAC system.

| Test | What it covers |
|---|---|
| `test_is_admin_user_allows_admin` | Admin role passes `IsAdminUser` |
| `test_is_admin_user_blocks_doctor` | Doctor role fails `IsAdminUser` |
| `test_is_admin_user_blocks_assistant` | Assistant role fails `IsAdminUser` |
| `test_is_admin_user_blocks_unauthenticated` | Anonymous user fails `IsAdminUser` |
| `test_is_admin_or_doctor_allows_admin` | Admin passes `IsAdminOrDoctorUser` |
| `test_is_admin_or_doctor_allows_doctor` | Doctor passes `IsAdminOrDoctorUser` |
| `test_is_admin_or_doctor_blocks_assistant` | Assistant fails `IsAdminOrDoctorUser` |

#### 3.1.3 Serializer Tests — `backend/api/tests/test_serializers.py`

| Test | What it covers |
|---|---|
| `test_patient_serializer_creates_with_anamnesis` | Nested create: patient + anamnesis in one call |
| `test_patient_serializer_updates_anamnesis` | Nested update creates anamnesis if it doesn't exist |
| `test_appointment_serializer_conflict_validation` | F-008: duplicate doctor+date+time raises `ValidationError` |
| `test_appointment_serializer_conflict_skipped_on_update` | Update doesn't re-check conflict on existing instance |
| `test_appointment_create_serializer_conflict_validation` | Same conflict check on `AppointmentCreateSerializer` |
| `test_patient_list_serializer_last_visit_none` | `last_visit` is `None` when no completed appointments |
| `test_patient_list_serializer_last_visit_populated` | `last_visit` returns most recent completed appointment date |

#### 3.1.4 API / View Tests — `backend/api/tests/test_views.py`

Uses DRF's `APIClient`. These are the most critical tests.

**Authentication & User:**

| Test | Endpoint | What it covers |
|---|---|---|
| `test_login_returns_tokens` | `POST /api/auth/token/` | Returns `access` + `refresh` tokens |
| `test_login_invalid_credentials` | `POST /api/auth/token/` | Returns 401 on wrong password |
| `test_current_user_returns_correct_data` | `GET /api/auth/me/` | Returns `role`, `username`, etc. |
| `test_current_user_requires_auth` | `GET /api/auth/me/` | Returns 401 when unauthenticated |

**Multi-tenancy (Critical):**

| Test | What it covers |
|---|---|
| `test_patient_list_filtered_by_clinic` | Clinic A users cannot see Clinic B patients |
| `test_appointment_list_filtered_by_clinic` | Clinic isolation on appointments |
| `test_treatment_list_filtered_by_clinic` | Clinic isolation on treatments |
| `test_payment_list_filtered_by_clinic` | Clinic isolation on payments |
| `test_perform_create_assigns_clinic` | `perform_create` assigns `request.user.clinic` automatically |

**Patient CRUD:**

| Test | What it covers |
|---|---|
| `test_patient_list` | `GET /api/patients/` returns clinic-scoped list |
| `test_patient_search_by_name` | `?search=` filters by first/last name |
| `test_patient_search_by_phone` | `?search=` filters by phone |
| `test_patient_create` | `POST /api/patients/` creates patient |
| `test_patient_detail` | `GET /api/patients/{id}/` returns full detail |
| `test_patient_update` | `PUT /api/patients/{id}/` updates patient + anamnesis |
| `test_patient_create_requires_auth` | Returns 401 when unauthenticated |

**Appointment CRUD:**

| Test | What it covers |
|---|---|
| `test_appointment_list_by_date` | `?date=YYYY-MM-DD` filter |
| `test_appointment_list_by_patient` | `?patient={id}` filter |
| `test_appointment_create` | Creates appointment successfully |
| `test_appointment_conflict_returns_400` | Duplicate slot returns 400 |
| `test_appointment_status_update` | PATCH updates status field |
| `test_appointment_delete` | DELETE removes appointment |

**Treatment Types — Role-Based Access:**

| Test | What it covers |
|---|---|
| `test_treatment_type_list_accessible_by_assistant` | Assistants can GET |
| `test_treatment_type_create_allowed_for_doctor` | Doctor can POST |
| `test_treatment_type_create_allowed_for_admin` | Admin can POST |
| `test_treatment_type_create_blocked_for_assistant` | Assistant gets 403 on POST |
| `test_treatment_type_delete_blocked_for_assistant` | Assistant gets 403 on DELETE |

**Clinic Settings — Admin Only:**

| Test | What it covers |
|---|---|
| `test_clinic_settings_get_accessible_by_all` | Any auth user can GET |
| `test_clinic_settings_put_allowed_for_admin` | Admin can PUT |
| `test_clinic_settings_put_blocked_for_doctor` | Doctor gets 403 on PUT |
| `test_clinic_settings_put_blocked_for_assistant` | Assistant gets 403 on PUT |

**Dashboard:**

| Test | What it covers |
|---|---|
| `test_dashboard_returns_today_appointments` | Only today's appointments in response |
| `test_dashboard_excludes_cancelled` | Cancelled appointments excluded |
| `test_dashboard_counts_are_correct` | `today_total`, `today_completed`, `total_patients` |

**Doctor List:**

| Test | What it covers |
|---|---|
| `test_doctor_list_returns_only_doctors` | Admins/Assistants not in doctor list |
| `test_doctor_list_scoped_to_clinic` | Cross-clinic isolation |

#### 3.1.5 Signal Tests — `backend/api/tests/test_signals.py`

| Test | What it covers |
|---|---|
| `test_admin_user_gets_is_staff_on_save` | Admin role → `is_staff=True` via signal |
| `test_doctor_user_assigned_to_hekim_group` | Doctor role → "Hekim" group |
| `test_assistant_user_assigned_to_asistan_group` | Assistant → "Asistan" group |
| `test_role_change_updates_group` | Changing role changes group membership |

---

### 3.2 Frontend Unit Tests

#### 3.2.1 API Service Tests — `frontend/src/app/services/api.test.ts`

Uses `msw` to mock `fetch`.

| Test | What it covers |
|---|---|
| `test_login_stores_tokens` | `login()` calls `setTokens` on success |
| `test_login_throws_on_failure` | `login()` throws with error message |
| `test_fetch_with_auth_includes_bearer_token` | All requests send `Authorization: Bearer ...` |
| `test_fetch_with_auth_refreshes_on_401` | 401 triggers token refresh and retries |
| `test_fetch_with_auth_clears_auth_on_refresh_failure` | Dispatches `auth-logout` event if refresh fails |
| `test_clear_auth_removes_tokens` | `clearAuth()` removes both tokens from localStorage |
| `test_fetch_patients_handles_paginated_response` | Extracts `.results` from paginated DRF response |
| `test_fetch_patients_handles_array_response` | Also works when response is plain array |

#### 3.2.2 AuthContext Tests — `frontend/src/app/contexts/AuthContext.test.tsx`

| Test | What it covers |
|---|---|
| `test_initial_loading_state` | `isLoading=true` initially |
| `test_authenticated_when_token_exists` | Sets `user` when token + `/me` resolves |
| `test_unauthenticated_when_no_token` | `user=null` when no localStorage token |
| `test_login_sets_user` | `login()` fetches user and sets state |
| `test_logout_clears_user` | `logout()` sets `user=null` |
| `test_auth_logout_event_clears_user` | Window `auth-logout` event clears user state |
| `test_use_auth_throws_outside_provider` | `useAuth()` throws without `AuthProvider` |

#### 3.2.3 Component Tests (selected key components)

**`LoginPage.test.tsx`:**
| Test | What it covers |
|---|---|
| `test_renders_login_form` | Username + password fields present |
| `test_shows_error_on_failed_login` | Error message shown on bad credentials |
| `test_redirects_after_successful_login` | Redirects to `/` after login |

**`Dashboard.test.tsx`:**
| Test | What it covers |
|---|---|
| `test_renders_today_appointment_count` | Stat cards render with mocked data |
| `test_empty_state_when_no_appointments` | Empty state shown when list is empty |

**`PatientSearch.test.tsx`:**
| Test | What it covers |
|---|---|
| `test_search_input_triggers_api_call` | Typing in search calls `fetchPatients` |
| `test_debounce_limits_api_calls` | Multiple keystrokes → single API call |

---

### 3.3 End-to-End Tests (Playwright)

Located in `e2e/` at the project root.

| Test file | Scenario |
|---|---|
| `e2e/auth.spec.ts` | Login with valid creds, login with bad creds, logout flow, token refresh on page reload |
| `e2e/dashboard.spec.ts` | Dashboard loads, today's appointments display, stat counts are correct |
| `e2e/patients.spec.ts` | Patient list loads, search filters, create new patient, view patient profile |
| `e2e/appointments.spec.ts` | Create appointment, conflict prevents duplicate slot, update appointment status, delete appointment |
| `e2e/rbac.spec.ts` | Assistant cannot access treatment type management, admin can access clinic settings, role labels display correctly |
| `e2e/clinic-settings.spec.ts` | Admin can update work hours, non-admin gets blocked |

---

## 4. Test Data Strategy

### Factory Pattern (Backend)

Use `factory_boy` to define factories in `backend/api/tests/factories.py`:

```python
# Example structure
class ClinicFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Clinic
    name = factory.Faker('company')

class CustomUserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CustomUser
    username = factory.Faker('user_name')
    role = CustomUser.Role.ASSISTANT
    clinic = factory.SubFactory(ClinicFactory)

class PatientFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Patient
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    phone = factory.Faker('phone_number')
    clinic = factory.SubFactory(ClinicFactory)
```

### MSW Handlers (Frontend)

Define `frontend/src/mocks/handlers.ts` with handlers for all API endpoints, reused across unit and E2E tests.

---

## 5. Coverage Targets

| Layer | Target | Rationale |
|---|---|---|
| Backend models | 95%+ | Pure Python, easy to test |
| Backend permissions | 100% | Security-critical |
| Backend serializers | 90%+ | Validation logic is critical |
| Backend views | 80%+ | Focus on auth + multi-tenancy paths |
| Frontend API service | 85%+ | Token refresh logic is fragile |
| Frontend contexts | 85%+ | Auth state management |
| Frontend components | 60%+ | Focus on form validation + state |
| E2E critical paths | 100% of listed scenarios | Smoke test coverage |

---

## 6. CI/CD Pipeline Design

### Proposed: GitHub Actions

**File: `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend:
    name: Backend Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.13'
          cache: pip

      - name: Install dependencies
        run: pip install -r requirements.txt pytest pytest-django pytest-cov factory-boy faker

      - name: Run tests with coverage
        run: pytest --cov=api --cov-report=xml --cov-fail-under=80

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: backend/coverage.xml

  frontend:
    name: Frontend Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Lint
        run: npx eslint src

      - name: Run unit tests with coverage
        run: npx vitest run --coverage

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [backend, frontend]  # Only run if unit tests pass

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.13'
      - name: Start backend
        run: |
          cd backend
          pip install -r requirements.txt
          python manage.py migrate
          python manage.py loaddata test_fixtures.json
          python manage.py runserver &
        env:
          DJANGO_SETTINGS_MODULE: core.settings_test

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install frontend deps
        run: cd frontend && npm ci

      - name: Install Playwright browsers
        run: cd frontend && npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: cd frontend && npx playwright test

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

### Pipeline Stages Summary

```
Push / PR
    │
    ├── [backend job]
    │     ├─ Install Python deps
    │     ├─ pytest (unit + integration)
    │     ├─ Coverage gate (≥80%)
    │     └─ Upload to Codecov
    │
    ├── [frontend job]
    │     ├─ Install Node deps
    │     ├─ tsc --noEmit (type check)
    │     ├─ eslint (lint)
    │     └─ vitest run --coverage
    │
    └── [e2e job] (runs after backend + frontend pass)
          ├─ Start Django dev server with test fixtures
          ├─ Build/serve frontend
          └─ playwright test (Chromium)
```

---

## 7. Required Configuration Files

| File | Purpose |
|---|---|
| `backend/pytest.ini` | Pytest + Django settings configuration |
| `backend/api/tests/__init__.py` | Make tests a package |
| `backend/api/tests/factories.py` | `factory_boy` model factories |
| `backend/api/tests/test_models.py` | Model unit tests |
| `backend/api/tests/test_permissions.py` | Permission unit tests |
| `backend/api/tests/test_serializers.py` | Serializer unit tests |
| `backend/api/tests/test_views.py` | API endpoint tests |
| `backend/api/tests/test_signals.py` | Signal tests |
| `backend/core/settings_test.py` | Test-specific settings (in-memory SQLite, fast passwords) |
| `frontend/vitest.config.ts` | Vitest configuration |
| `frontend/src/setupTests.ts` | `@testing-library/jest-dom` setup |
| `frontend/src/mocks/handlers.ts` | MSW request handlers |
| `frontend/src/mocks/server.ts` | MSW Node server setup |
| `frontend/e2e/` | Playwright test directory |
| `frontend/playwright.config.ts` | Playwright configuration |
| `.github/workflows/ci.yml` | GitHub Actions pipeline |

---

## 8. Test Settings File

A dedicated `core/settings_test.py` should override:
- `PASSWORD_HASHERS`: Use `MD5PasswordHasher` (100x faster for tests)
- `DATABASES`: Keep SQLite (in-memory via `:memory:` is optional, file-based is fine for `pytest-django`)
- `EMAIL_BACKEND`: `django.core.mail.backends.locmem.EmailBackend`
- `SIMPLE_JWT.ACCESS_TOKEN_LIFETIME`: Very short (e.g., 5 seconds) for refresh token tests
- Disable `MEDIA_ROOT` file writes for document upload tests

---

## 9. Prioritized Implementation Roadmap

| Phase | Work | Effort |
|---|---|---|
| **Phase 1** | Setup test infra (pytest.ini, factories, vitest.config) + CI yml | ~1 day |
| **Phase 2** | Backend permission + serializer tests (highest risk areas) | ~1 day |
| **Phase 3** | Backend view tests (multi-tenancy + CRUD flows) | ~2 days |
| **Phase 4** | Frontend API service + AuthContext tests | ~1 day |
| **Phase 5** | Key component tests (Login, Dashboard) | ~1 day |
| **Phase 6** | Playwright E2E for auth + appointment flows | ~1-2 days |

> [!NOTE]
> Phase 2 (permissions + serializers) should be prioritized because the appointment conflict validation (F-008) and the multi-tenancy clinic isolation are the highest-risk business logic with no current test coverage.
