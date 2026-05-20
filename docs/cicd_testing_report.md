# CI/CD & Testing Audit Report

> **Project:** Yaşca Dental Clinic
> **Date:** 2026-05-20
> **Context:** The project recently migrated from SQLite to PostgreSQL with Docker. This report audits what is now broken or outdated.

---

## 🔴 Critical Issues

### 1. `TreatmentType.Category` Does Not Exist — Tests & Demo Seeding Are Broken

[factories.py](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/backend/api/tests/factories.py) and [seed_demo_data.py](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/backend/api/management/commands/seed_demo_data.py) both reference `TreatmentType.Category` choices (e.g., `Category.FILLING`, `Category.CANAL`, `Category.EXTRACTION`).

However, the actual [TreatmentType model](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/backend/api/models.py#L127-L150) has **no `Category` field or inner choices class**.

**Impact:**
- ❌ All backend tests crash on import → `AttributeError`
- ❌ `run-demo.ps1` crashes → `seed_demo_data.py` imports from `factories.py`
- ❌ CI pipeline fails on the backend test job

**Fix:** Either add a `Category` field/choices to the `TreatmentType` model, or remove all `Category` references from `factories.py` and `seed_demo_data.py`.

---

### 2. Test Dependencies Missing from `requirements.txt`

[requirements.txt](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/backend/requirements.txt) has no test dependencies. There is no `requirements-dev.txt` either.

| Package | Status | Used By |
|---|---|---|
| `pytest` | ❌ Missing | All backend tests |
| `pytest-django` | ❌ Missing | `@pytest.mark.django_db` |
| `pytest-cov` | ❌ Missing | CI coverage reports |
| `factory-boy` | ❌ Missing | `factories.py`, `seed_demo_data.py` |
| `faker` | ❌ Missing | `factories.py` (Turkish locale `tr_TR`) |

These are currently hardcoded in the CI YAML and installed at runtime by `run-demo.ps1` (lost on every container restart).

**Fix:** Create a `requirements-dev.txt` that extends `requirements.txt`. Update the Dockerfile and CI to use it.

---

### 3. Tests Run Against SQLite, Production Uses PostgreSQL

[settings_test.py](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/backend/core/settings_test.py) forces **SQLite in-memory** for all tests:

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}
```

[pytest.ini](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/backend/pytest.ini) points to this file via `DJANGO_SETTINGS_MODULE = core.settings_test`. The CI E2E job also uses `settings_test`, meaning the **entire CI pipeline runs against SQLite** — never PostgreSQL.

**Impact:** Subtle PostgreSQL-specific behaviors (`JSONField`, case sensitivity, constraint handling, date types) are **never tested**. Bugs can pass CI and break in production.

**Fix:** Update `settings_test.py` to use PostgreSQL (connect to the CI service container). Add a PostgreSQL service to the CI backend job.

---

### 4. Root `package.json` Still References `venv`

[package.json](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/package.json) scripts are completely outdated:

```json
"backend": "cd backend && .\\venv\\Scripts\\activate && python manage.py runserver",
"install:all": "npm install --prefix frontend && pip install -r backend/requirements.txt"
```

- ❌ `backend` script references `venv` which no longer exists in Docker
- ❌ `install:all` runs local `pip install` — should use Docker

---

## 🟡 Medium Issues

### 5. Python Version Mismatch

| Location | Python Version |
|---|---|
| [Dockerfile](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/backend/Dockerfile) | `python:3.12-slim` |
| [ci.yml](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/.github/workflows/ci.yml) | `python-version: '3.13'` |

Code could pass in CI but fail in Docker (or vice versa).

**Fix:** Align both to `3.12`.

---

### 6. E2E Tests Are Just a Placeholder

[dummy.spec.ts](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/e2e/dummy.spec.ts) only checks the page loads:

```typescript
test('has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/.*localhost.*/);
});
```

The CI pipeline has a **full E2E job** that runs this placeholder, giving false confidence.

**Fix:** Write real E2E scenarios or remove the E2E job from CI until ready.

---

### 7. No `conftest.py` — No Shared Test Fixtures

There is **no `conftest.py`** anywhere in `backend/`. Common patterns (clinic + admin + API client setup) are duplicated across test files.

**Fix:** Create `backend/api/tests/conftest.py` with shared fixtures.

---

### 8. No DB Health Check in `docker-compose.yml`

The backend `depends_on: db` only waits for the container to start, **not** for PostgreSQL to be ready to accept connections. This creates a **race condition** — the backend can crash on first boot if Postgres isn't ready yet.

**Fix:** Add a health check to the `db` service:

```yaml
db:
  image: postgres:15
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U postgres"]
    interval: 5s
    timeout: 5s
    retries: 5

backend:
  depends_on:
    db:
      condition: service_healthy
```

---

### 9. README Test Section Still References `venv` and SQLite

[README.md](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/README.md) test instructions still say:

- Activate venv: `.\\venv\\Scripts\\Activate.ps1`
- Manual `pip install pytest pytest-django ...`
- Run tests via: `.\\venv\\Scripts\\python -m pytest`
- Tech stack lists: `Database: SQLite (geliştirme) / PostgreSQL (üretim)` — should say PostgreSQL for both

---

## 🟢 Low Issues

### 10. Obsolete `version` in `docker-compose.yml`

[docker-compose.yml](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/docker-compose.yml) Line 1 has `version: '3.8'`, which prints a warning on every run.

**Fix:** Delete the line.

---

### 11. Old `db.sqlite3` Still Exists

`backend/db.sqlite3` (270KB) still exists in the project. The `.gitignore` has `*.sqlite3` but the file may already be tracked in git history.

**Fix:** Remove and add to `.gitignore` if not already (verify with `git ls-files`).

---

### 12. Frontend Dockerfile Uses `npm install` Instead of `npm ci`

[Frontend Dockerfile](file:///d:/laian/Desktop/Yaman/projects/yasca-dental/frontend/Dockerfile) uses `npm install` which is less reproducible than `npm ci`.

**Fix:** Change to `npm ci` for deterministic builds.

---

### 13. Frontend Test Coverage is Thin

Only **2 frontend unit test files** exist (`api.test.ts`, `AuthContext.test.tsx`). No component or page-level tests. The MSW handlers in `frontend/src/mocks/handlers.ts` cover all API endpoints — great infrastructure, but unused by component tests.

---

### 14. `setupTests.ts` May Be Missing

`vitest.config.ts` references `./src/setupTests.ts` as a setup file. One research pass found this file exists (3 lines, imports `@testing-library/jest-dom`), but this should be verified — if missing, Vitest may warn or fail.

---

## Summary Table

| # | Issue | Severity | Files Affected |
|---|---|---|---|
| 1 | `TreatmentType.Category` doesn't exist | 🔴 Critical | `factories.py`, `seed_demo_data.py`, `models.py` |
| 2 | Test deps missing from `requirements.txt` | 🔴 Critical | `requirements.txt`, `Dockerfile`, `ci.yml` |
| 3 | Tests use SQLite, prod uses PostgreSQL | 🔴 Critical | `settings_test.py`, `pytest.ini`, `ci.yml` |
| 4 | Root `package.json` references `venv` | 🔴 Critical | `package.json` |
| 5 | Python version mismatch (3.12 vs 3.13) | 🟡 Medium | `Dockerfile`, `ci.yml` |
| 6 | E2E tests are just a placeholder | 🟡 Medium | `dummy.spec.ts`, `ci.yml` |
| 7 | No `conftest.py` / shared fixtures | 🟡 Medium | `backend/api/tests/` |
| 8 | No DB health check in docker-compose | 🟡 Medium | `docker-compose.yml` |
| 9 | README test section references venv/SQLite | 🟡 Medium | `README.md` |
| 10 | Obsolete `version` in docker-compose | 🟢 Low | `docker-compose.yml` |
| 11 | Old `db.sqlite3` still exists | 🟢 Low | `backend/db.sqlite3` |
| 12 | Frontend Dockerfile: `npm install` vs `npm ci` | 🟢 Low | `frontend/Dockerfile` |
| 13 | Frontend test coverage thin | 🟢 Low | `frontend/src/` |
| 14 | `setupTests.ts` may be missing | 🟢 Low | `frontend/vitest.config.ts` |
