# Yaşca: Multi-Tenant Dental Clinic Management SaaS

Yaşca is an open-source, multi-tenant SaaS application designed to digitize operational workflows, ensure data security, and increase clinic efficiency for dental practices.

## System Architecture

Yaşca operates as a **SaaS platform** using **schema-based multi-tenancy** (powered by `django-tenants`). 
- Every registered clinic is a **Tenant** with its own isolated database schema.
- Clinics are accessed via **dynamic subdomains** (e.g., `premium.localhost` or `premium.yasca.com`).
- A `public` schema handles global SaaS routing, landing pages, and tenant management.

---

## Installation & Running Locally (Hybrid Development)

### Prerequisites
- **Docker Desktop** installed and running.
- **Node.js** (v18+) for local frontend development.
- Add `premium.localhost` and `ali.localhost` to your OS `hosts` file to resolve local subdomains:
  - **Windows**: `C:\Windows\System32\drivers\etc\hosts`
  - **macOS/Linux**: `/etc/hosts`
  - Add line: `127.0.0.1 premium.localhost standard.localhost localhost`

### 1. Starting the Services

The project uses Docker for the PostgreSQL database and Django Backend, while the React Frontend runs locally via Node.

Run the development startup script from the root directory:

```powershell
# Using npm
npm run dev

# OR using the PowerShell script
.\start-dev.ps1
```

**Services will be available at:**
- **Frontend SaaS Landing:** http://localhost:5173
- **Backend API:** http://localhost:8000

---

## Demo Data Generation

To fully evaluate the platform without manually creating clinics, patients, and treatments, we provide a robust demo seeding script. 

Run the following command while the Docker backend is running:

```powershell
.\run-demo.ps1
```

This script will intelligently seed the database by:
1. Creating the Public SaaS Tenant.
2. Generating two isolated clinic tenants (Premium & Standard).
3. Seeding each clinic with its own staff, randomized patients, treatments, and payments.

### 🌟 Demo Environment Map

Use the following credentials to explore the multi-tenant system. All generated users share the same password.

**Universal Password:** `demo123!`

| Clinic Name | Subdomain Access | Users (Username) | Roles |
| :--- | :--- | :--- | :--- |
| **Yıldız Premium Kliniği** | `http://premium.localhost:5173` | `kemal` <br> `dr_ahmet` <br> `asistan_ayse` | System Admin <br> Doctor <br> Assistant |
| **Stark Standard Clinic** | `http://standard.localhost:5173` | `tony` <br> `dr_steve` <br> `asistan_peter` | System Admin <br> Doctor <br> Assistant |

*(Note: The login process will automatically route requests based on the subdomain you are accessing).*

---

## Testing Setup

### Backend Tests

Test dependencies should be run within the Docker container.

```powershell
# Run basic tests
docker-compose run --rm backend sh -c "pip install -r requirements-dev.txt && pytest api/tests/ -v"

# Run tests with coverage report
docker-compose run --rm backend sh -c "pip install -r requirements-dev.txt && pytest api/tests/ --cov=api --cov-report=term-missing"
```

### Frontend Tests

```powershell
cd frontend

# Run once
npm test

# Watch mode (during development)
npm run test:watch

# Coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

To test the entire system end-to-end (including multi-tenant routing):

```powershell
cd frontend

# Install browsers (first time only)
npx playwright install

# Run tests (ensure dev servers are running!)
npx playwright test
```

---

## Tech Stack Overview

- **Frontend:** React.js, TypeScript, Vite, Tailwind CSS v4, Lucide-React
- **Backend:** Python 3.12, Django REST Framework, django-tenants
- **Database:** PostgreSQL (Schema-based isolation)
- **Testing:** pytest, factory-boy, Vitest, MSW, Playwright
- **CI/CD:** GitHub Actions

## Participants
- **Yaman Halloum**
- **Ali Üre**
- **Cihan Kurtbey**
- **Şükrü Yeşilmen**