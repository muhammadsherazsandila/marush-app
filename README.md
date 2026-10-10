# Marush (Pvt.) Ltd. — Poultry Vaccination & Flock Monitoring Mobile Application

Marush (Pvt.) Ltd. is the **exclusive sole distributor of Ceva Animal Health in Pakistan**, specializing in poultry vaccines, hatchery vaccination services, and farm flock monitoring.

---

## 🚀 Key Features

- **🔐 RBAC Authentication & Admin Verification Pipeline:**
  - Roles: `Admin`, `Program Controller`, `Employee` (default), `Program Auditor`.
  - Self-service registration defaults to `pending` status. Users are routed to a verified holding state until approved by the Administrator.
  - Email/Password and Google OAuth 2.0 supported via `dataProvider`.
  - Interactive Demo quick-login switchers for instant evaluation across all roles.

- **📊 Administrator Command Center:**
  - **Overview Tab:** Summary metrics for total programs done, currently active programs, pending approval queues, and staff counts.
  - **Active Programs Tab:** Live visibility into active teams, flock sizes, and scheduled timings.
  - **Completed Programs Tab:** Master archive of completed programs with detailed metrics and auditor remarks.
  - **Employees Tab:** Full CRUD operations (Add with custom codes, Edit role, Approve, Reject, Delete) with instant search filtering.
  - **Approvals Tab:** Single-click approval of new user accounts and initiated program teams with Auditor assignment.

- **👥 Program Controller Dynamic Team Builder:**
  - Program initiation form capturing program title, hatchery/farm location, flock size, start/end dates and times.
  - **Intelligent Availability Filter:** Automatically displays and allows selecting only personnel who are currently **available** (not active in any other concurrent field program).
  - Team submission to Admin for review.
  - Program completion form recording birds vaccinated, dosage per bird, vaccine batch number, cold-chain temperature logs (°C), equipment checks, and submitting directly to the Program Auditor.

- **🔍 Program Auditor Interface:**
  - Dedicated inspection queue for ended programs in `pending_audit` status.
  - **5-Point Verification Checklist:** Cold-chain log, vaccine batch & seal, equipment sterilization, dosage calibration, and flock condition.
  - Structured auditor remarks and score sign-off (marks program as `DONE`).

- **📱 Employee Personal History:**
  - Attended field programs overview.
  - Complete history highlighting the specific role played (`PROGRAM CONTROLLER` vs `TEAM MEMBER`).
  - Cold-chain compliance log and Auditor quality score reviews.

---

## 🛠️ Tech Stack & Workflow
- **Framework:** Expo (React Native & Web) with TypeScript
- **Styling:** Tailwind CSS / Native tokens matching official Marush brand colors (`#004F42`, `#16BAAF`, `#18333b`, `#fe5b2c`)
- **Backend:** Supabase PostgreSQL with strict RLS policies, migrations, and full offline/demo fallback mode
- **Package Manager:** `pnpm`
- **Agentic Tracking:** Superplan CLI
- **CI/CD & Releases:** GitHub Actions (`.github/workflows/ci.yml` & `.github/workflows/release.yml`)

---

## 📦 Getting Started

### Install Dependencies
```bash
pnpm install
```

### Run Locally
```bash
# Start development server
pnpm start

# Run web version
pnpm run web
```

### Typecheck & Verify
```bash
pnpm run typecheck
```

### Build Production Web Export
```bash
pnpm run build:web
```

### 🗄️ Database Migrations
Manage Supabase PostgreSQL migrations using the built-in migration runner:

```bash
# Check current migration status against Supabase database
pnpm migrate:status

# Create a new numbered migration file (e.g., supabase/migrations/004_add_flock_types.sql)
pnpm migrate:new <migration_name>

# Apply all pending migrations to the database
pnpm migrate:up

# CI check: Verify no migrations are pending (exits with code 1 if unapplied)
pnpm migrate:check
```

---

## 🏷️ Release Milestones

| Version | Release Scope |
|:---:|---|
| **`v0.1.0`** | Phase 1: Project Setup, Expo Scaffolding & GitHub CI/CD Pipeline |
| **`v0.2.0`** | Phase 2: Supabase Database Schema, RLS Policies & Unified DataProvider |
| **`v0.3.0`** | Phase 3: Brand Identity, Animated Launch Screen & RBAC Authentication Flow |
| **`v0.4.0`** | Phase 4: Admin Dashboard, Live Sync, Employee CRUD & Approvals Queue |
| **`v0.5.0`** | Phase 5: Program Controller Experience & Dynamic Available-Employee Filter |
| **`v0.6.0`** | Phase 6: Program Auditor Quality Sign-off & Employee History Dashboard |
| **`v1.0.0`** | Phase 7: Production Release & End-to-End System Verification |
