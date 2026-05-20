# CI/CD & Testing Audit Report

> **Project:** Yaşca Dental Clinic
> **Date:** 2026-05-20
> **Context:** The project recently migrated from SQLite to PostgreSQL with Docker. This report audits what is now broken or outdated.

---

## ✅ Resolved Issues

### ~~1. `TreatmentType.Category` Does Not Exist~~ — FIXED

**What was wrong:** `factories.py` and `seed_demo_data.py` referenced `TreatmentType.Category` choices, but the model had no `Category` inner class. All backend tests and demo seeding crashed with `AttributeError`.

**Fix applied:** Added the `Category` TextChoices class and `category` field to the `TreatmentType` model in `models.py`. The migration (`0012_treatmenttype_category.py`) had already added the column to the database — only the model code was missing.

---

### ~~2. Test Dependencies Missing~~ — FIXED

**What was wrong:** `pytest`, `factory-boy`, `faker`, etc. were not in any requirements file. They were hardcoded in the CI YAML and installed at runtime by `run-demo.ps1`.

**Fix applied:** Created `backend/requirements-dev.txt` that extends `requirements.txt` with all test dependencies. CI now installs from `requirements-dev.txt`.

---

### ~~3. Tests Run Against SQLite~~ — FIXED

**What was wrong:** `settings_test.py` hardcoded SQLite in-memory. The entire CI pipeline ran against SQLite, never touching PostgreSQL.

**Fix applied:** Updated `settings_test.py` to read `DATABASE_URL` from the environment. When set (e.g., in CI), tests run against PostgreSQL. Falls back to SQLite for quick local runs when the env var is absent. Added a PostgreSQL 15 service container to the CI backend job.

---

### ~~4. Root `package.json` References `venv`~~ — FIXED

**What was wrong:** Scripts referenced `venv\\Scripts\\activate` and local `pip install`.

**Fix applied:** Replaced with Docker-based scripts: `dev` (docker-compose up), `dev:frontend` (local Vite), and `demo` (docker-compose run for seeding).

---

### ~~5. Python Version Mismatch~~ — FIXED

**What was wrong:** Dockerfile used Python 3.12, CI used Python 3.13.

**Fix applied:** Aligned CI to `python-version: '3.12'` to match the Dockerfile.

---

### ~~6. E2E Tests Are Just a Placeholder~~ — FIXED

**What was wrong:** The CI had a full E2E job running a single placeholder test (`dummy.spec.ts`) that only checked if the page loaded.

**Fix applied:** Removed the entire E2E job from `ci.yml`. The placeholder test file remains locally for future development, but no longer wastes CI resources or gives false confidence.

---

## 🟡 Open Medium Issues

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

README.md test instructions still say:

- Activate venv: `.\\venv\\Scripts\\Activate.ps1`
- Manual `pip install pytest pytest-django ...`
- Run tests via: `.\\venv\\Scripts\\python -m pytest`
- Tech stack lists: `Database: SQLite (geliştirme) / PostgreSQL (üretim)` — should say PostgreSQL for both

---

## 🟢 Open Low Issues

### 10. Obsolete `version` in `docker-compose.yml`

`docker-compose.yml` Line 1 has `version: '3.8'`, which prints a warning on every run.

**Fix:** Delete the line.

---

### 11. Old `db.sqlite3` Still Exists

`backend/db.sqlite3` (270KB) still exists in the project. Confirmed not tracked by git, but is clutter.

**Fix:** Delete the file.

---

### 12. Frontend Dockerfile Uses `npm install` Instead of `npm ci`

Frontend Dockerfile uses `npm install` which is less reproducible than `npm ci`.

**Fix:** Change to `npm ci` for deterministic builds.

---

### 13. Frontend Test Coverage is Thin

Only **2 frontend unit test files** exist (`api.test.ts`, `AuthContext.test.tsx`). No component or page-level tests. The MSW handlers in `frontend/src/mocks/handlers.ts` cover all API endpoints — great infrastructure, but unused by component tests.

---

### 14. `setupTests.ts` May Be Missing

`vitest.config.ts` references `./src/setupTests.ts` as a setup file. One research pass found this file exists (3 lines, imports `@testing-library/jest-dom`), but this should be verified — if missing, Vitest may warn or fail.

---

## Summary Table

| # | Issue | Status | Severity |
|---|---|---|---|
| 1 | `TreatmentType.Category` missing from model | ✅ Fixed | ~~Critical~~ |
| 2 | Test deps missing from requirements | ✅ Fixed | ~~Critical~~ |
| 3 | Tests ran against SQLite, not PostgreSQL | ✅ Fixed | ~~Critical~~ |
| 4 | Root `package.json` referenced `venv` | ✅ Fixed | ~~Critical~~ |
| 5 | Python version mismatch (3.12 vs 3.13) | ✅ Fixed | ~~Medium~~ |
| 6 | E2E placeholder wasting CI resources | ✅ Fixed | ~~Medium~~ |
| 7 | No `conftest.py` / shared fixtures | ⬜ Open | 🟡 Medium |
| 8 | No DB health check in docker-compose | ⬜ Open | 🟡 Medium |
| 9 | README test section references venv/SQLite | ⬜ Open | 🟡 Medium |
| 10 | Obsolete `version` in docker-compose | ⬜ Open | 🟢 Low |
| 11 | Old `db.sqlite3` still exists | ⬜ Open | 🟢 Low |
| 12 | Frontend Dockerfile: `npm install` vs `npm ci` | ⬜ Open | 🟢 Low |
| 13 | Frontend test coverage thin | ⬜ Open | 🟢 Low |
| 14 | `setupTests.ts` may be missing | ⬜ Open | 🟢 Low |
