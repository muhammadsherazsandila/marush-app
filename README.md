# Marush (Pvt.) Ltd. — Poultry Vaccination & Flock Monitoring Mobile Application

Marush (Pvt.) Ltd. is the **exclusive sole distributor of Ceva Animal Health in Pakistan**, specializing in poultry vaccines, hatchery vaccination services, and farm flock monitoring.

---

## 🚀 Key Features

- **🔐 RBAC Authentication & Admin Verification Pipeline:**
  - Roles: `Admin`, `Program Controller`, `Employee` (default), `Program Auditor`.
  - Self-service registration defaults to `pending` status. Users are routed to a verified holding state until approved by the Administrator.
  - Email/Password and Google OAuth 2.0 supported.
  - Interactive Demo quick-login switchers for instant evaluation across all roles.

- **📊 Administrator Command Center:**
  - **Overview Tab:** Summary metrics for total programs done, currently active programs, pending approval queues, and staff counts.
  - **Programs Tab:** Master archive of completed programs with detailed metrics and auditor remarks.
  - **Active Programs Tab:** Live visibility into active teams, flock sizes, and scheduled timings.
  - **Employees Tab:** Full CRUD operations (Add, Edit role, Approve, Reject, Delete).
  - **Approvals Tab:** Single-click approval of new user accounts and initiated program teams with Auditor assignment.

- **👥 Program Controller Dynamic Team Builder:**
  - Program initiation form capturing program title, hatchery/farm location, flock size, start/end dates and times.
  - **Intelligent Availability Filter:** Automatically displays only personnel who are currently **available** (not active in any other concurrent field program).
  - Team submission to Admin for review.
  - Program completion form recording birds vaccinated, dosage per bird, vaccine batch number, cold-chain temperature logs (°C), and submitting directly to the Program Auditor.

- **🔍 Program Auditor Interface:**
  - Dedicated inspection queue for ended programs.
  - Review modal for quality metrics, temperature compliance, and flock observations.
  - Structured auditor remarks and score sign-off (marks program as `DONE`).

- **📱 Employee Personal History:**
  - Attended field programs overview.
  - Complete history highlighting the specific role played (Program Controller vs Team Member).

---

## 🛠️ Tech Stack & Workflow
- **Framework:** Expo (React Native & Web) with TypeScript
- **Styling:** Tailwind CSS / Native tokens matching official Marush brand colors (`#004F42`, `#16BAAF`, `#18333b`, `#fe5b2c`)
- **Backend:** Supabase with full offline/demo fallback mode
- **Package Manager:** `pnpm`
- **Agentic Tracking:** Superplan CLI
- **CI/CD & Releases:** GitHub Actions (`.github/workflows/ci.yml` & `.github/workflows/release.yml`)
  - Automated linting & type checks
  - Automated production web & mobile bundle packaging
  - Automated GitHub Releases triggered on version tags (`v*.*.*`)

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

### Typecheck
```bash
pnpm run typecheck
```

### Build Web Export
```bash
pnpm run build:web
```

---

## 🏷️ Release Automation
Create and push a git tag to trigger automated building, testing, and GitHub release creation:
```bash
git tag v1.0.0
git push origin v1.0.0
```
