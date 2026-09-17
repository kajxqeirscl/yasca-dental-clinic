# Yaşca — Project Standards & Agent Context

> This file is read automatically by AI coding agents (Claude, Antigravity, Cursor, etc.).
> Keep it up-to-date as the project evolves.

---

## Project Overview

**Yaşca** is a multi-tenant dental clinic SaaS.
- Each clinic is an isolated PostgreSQL schema (via `django-tenants`).
- Clinics are accessed via dynamic subdomains (e.g. `premium.yasca.com`).
- A shared `public` schema handles tenant routing and global SaaS concerns.

**Active development branch:** `rimahalloum`
Always work on this branch and push to `origin/rimahalloum`.

---

## ⚠️ Critical Rules for Agents

### 1. Never run the backend locally
The backend is **deployed on Render**. Do not run `python manage.py runserver`, `docker-compose up`, or any local backend server. The local Docker setup in the repo is outdated and not in active use.

- **Backend URL (production/staging):** managed by Render, auto-deployed on push.
- If you need to test backend changes, push to `rimahalloum` and check Render logs.

### 2. Never force-push or touch `main` directly
All work goes to `rimahalloum`. Open a PR when merging to `main`.

---

## Infrastructure

### Database — PostgreSQL on Supabase
- **Host:** Supabase (cloud PostgreSQL)
- **Multi-tenancy:** `django-tenants` — each clinic tenant gets its own schema
- **Schema structure:**
  - `public` schema: tenant routing, global SaaS tables
  - Per-clinic schemas (e.g. `premium`, `standard`): all clinic-specific data
- Connection string is in the backend environment variables on Render (never committed).
- Do **not** run local migrations against production — migrations run on Render deploy.

### Backend — Django REST Framework on Render
- **Framework:** Python 3.12, Django REST Framework, `django-tenants`, SimpleJWT for auth
- **Deployment:** Render web service, CI/CD auto-deploys on push to the configured branch
- **Migrations:** Applied automatically on deploy (`release` command in Render)
- **Logs:** Check Render dashboard for runtime errors
- **Auth:** JWT tokens (access + refresh), subdomain determines tenant context

### Frontend — Next.js on Render
- **Framework:** Next.js (React), TypeScript, Tailwind CSS v4, shadcn/ui, Lucide icons
- **Deployment:** Render static site / web service, CI/CD auto-deploys on push
- **i18n:** `i18next` for translations
- **State:** React hooks + context (no Redux/Zustand)

---

## Development Workflow

### Making changes
1. Work on branch `rimahalloum`
2. Edit frontend in `frontend/`, backend in `backend/`
3. Run frontend tests locally before pushing (see Testing below)
4. Commit with `--no-verify`, push to `origin/rimahalloum`
5. Render picks up the push and deploys automatically

### Adding a new currency
Adding a currency requires changes in **two** places:

**Frontend** — `frontend/src/app/utils/currency.ts`:
```ts
export const SUPPORTED_CURRENCIES: Currency[] = [
  // Add your new currency here:
  { code: "EUR", symbol: "€", label: "Euro" },
];
```
This automatically propagates to all `<CurrencySelect />` dropdowns and `formatCurrency`.

**Backend** — `backend/api/models.py`:
```python
class Currency(models.TextChoices):
    # Add your new currency here:
    EUR = "EUR", "Euro"
```
Then generate and commit a migration:
```bash
cd backend
python manage.py makemigrations --name "add_<currency>_choice"
```
Commit the migration file. It runs automatically on Render deploy.

---

## Testing

### Frontend (Vitest + MSW + Testing Library)
```bash
cd frontend

# Run all tests once
npx vitest run

# Run a specific file
npx vitest run src/app/components/PatientSearch.test.tsx

# Watch mode (local dev)
npx vitest

# Coverage
npm run test:coverage
```

**Known Radix UI quirk in jsdom:** Radix `<Select>` throws `hasPointerCapture is not a function`. Mocks are already in `frontend/src/setupTests.ts`. When writing tests for Radix Select interactions, use `fireEvent.pointerDown` + `fireEvent.keyDown` + `fireEvent.click` (not `userEvent.click`).

### Backend (Pytest + factory_boy)
Backend tests require a running PostgreSQL instance. They run on Render CI or via Docker:
```bash
# Via Docker (only if Docker is available locally):
docker-compose run --rm backend sh -c "pip install -r requirements-dev.txt && pytest api/tests/ -v"
```
Do **not** run `cd backend && pytest` directly — it requires the full DB connection.

Test factories live in `backend/api/tests/factories.py`.

---

## Key File Locations

| What | Where |
|------|-------|
| Currency config (frontend) | `frontend/src/app/utils/currency.ts` |
| Reusable currency dropdown | `frontend/src/app/components/ui/CurrencySelect.tsx` |
| API service layer | `frontend/src/app/services/api.ts` |
| Test setup / polyfills | `frontend/src/setupTests.ts` |
| Test factories (frontend) | `frontend/src/test/factories.ts` |
| Django models | `backend/api/models.py` |
| DRF serializers | `backend/api/serializers.py` |
| DRF views / viewsets | `backend/api/views.py` |
| Test factories (backend) | `backend/api/tests/factories.py` |
| DB migrations | `backend/api/migrations/` |
| GitHub Actions CI | `.github/workflows/` |
| Agent skills | `.agents/skills/` |

---

## Architecture Decisions

### Multi-currency (no exchange rates)
Currencies are tracked **independently** — no conversion between them. Each `Treatment`, `Payment`, and `TreatmentType` has its own `currency` field. `total_debt` and `total_payments` are always computed within a single currency. This is intentional; do not introduce cross-currency arithmetic.

### PatientViewSet query design
`PatientViewSet.get_queryset` (`backend/api/views.py`) accepts a `?currency=` query param (defaults to the clinic''s `default_currency`). Two correlated subqueries filter payments and treatments by that currency before summing — this ensures single-currency math for ordering/sorting.

### shadcn/ui component library
UI components come from shadcn/ui (built on Radix UI primitives). Add new components with:
```bash
cd frontend
npx shadcn@latest add <component-name>
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend framework | Next.js (React 18), TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Icons | Lucide React |
| i18n | i18next |
| Frontend tests | Vitest, MSW, Testing Library, Playwright |
| Backend framework | Django REST Framework (Python 3.12) |
| Multi-tenancy | django-tenants |
| Auth | SimpleJWT |
| Database | PostgreSQL (Supabase, schema-per-tenant) |
| Backend tests | Pytest, factory_boy |
| Backend deployment | Render (auto CI/CD) |
| Frontend deployment | Render (auto CI/CD) |
| Source control | Git — active branch: `rimahalloum` |
