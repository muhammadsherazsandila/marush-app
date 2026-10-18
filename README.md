# Marush (Pvt.) Ltd. — Poultry Vaccination & Flock Monitoring Mobile Application

Marush (Pvt.) Ltd. is the **exclusive sole distributor of Ceva Animal Health in Pakistan**, specializing in poultry vaccines, hatchery vaccination services, and farm flock monitoring.

---

## 🚀 Key Features

- **Authentication & Admin Verification Pipeline:**
  - Roles: `Admin`, `Program Controller`, `Employee` (default), `Program Auditor`.
  - Google OAuth is the only sign-in method. On a fresh installation, the first verified Google account becomes the approved administrator; later accounts start as pending employees until an administrator approves them.
  - Applicants can request employee, controller, or auditor designation during sign-in; administrator access is provisioned by database policy and cannot be requested by a new account.

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
- **Styling:** NativeWind utility classes (Tailwind CSS 3) with MARUSH green and teal tokens across all application screens
- **Backend:** Supabase PostgreSQL with row-level security and forward-only migrations
- **Package Manager:** `pnpm`
- **Agentic Tracking:** Superplan CLI
- **CI/CD & Releases:** GitHub Actions install from the frozen pnpm lockfile, typecheck, and export the web app; tagged releases publish a checksum-verified web archive

For new or updated UI, use NativeWind `className` utilities and the `marush-*` colors defined in `tailwind.config.js`. Use Lucide React Native components for interface icons.

---

## 📦 Getting Started

### Install Dependencies
```bash
pnpm install --frozen-lockfile
```

### Configure the app
Copy `.env.example` to `.env`, then set the Supabase project URL, public anon key, and Google web client ID. These `EXPO_PUBLIC_*` values are embedded in the client bundle and must never contain database passwords or Supabase service-role keys.

`DATABASE_URL` is a private migration-runner credential. Keep it only in a local ignored `.env` file or a secured CI secret, and never prefix it with `EXPO_PUBLIC_`.

Production tagged releases require the GitHub Actions secrets `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Configure the OAuth redirect URLs in Google Cloud and Supabase Auth for the deployed web domain.

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
# Check migration status against the configured database
pnpm migrate:status

# Create a new numbered migration file (e.g., supabase/migrations/007_add_flock_types.sql)
pnpm migrate:new <migration_name>

# Apply all pending migrations to the database
pnpm migrate:up

# Check for pending migrations (connects to the configured database)
pnpm migrate:check
```

Run migration checks against staging before production. `migrate:up`, `migrate:status`, and `migrate:check` connect to the database and may create the migration tracking table or baseline existing files; do not point them at production until the change has been reviewed and approved. Apply the pending migrations through `013_first_login_admin_bootstrap.sql` before delivering a fresh installation. Migration 013 replaces the fixed-email bootstrap with a one-time, database-serialized claim for the first verified Google account. After the target project is reset, have the designated administrator complete the first Google sign-in before inviting other users. Keep the historical migrations unchanged; migration 013 supersedes their legacy bootstrap behavior.

Migration `005_production_security_hardening.sql` limits profile reads to the account owner, administrators, and colleagues assigned to a shared program. Only administrators can create profiles or change roles and approval status; self-registration is linked by the Supabase Auth trigger. Migration 013 assigns administrator status only to the first verified account after the project bootstrap state is reset; subsequent signups start as pending employees. Other new users cannot request administrator access. Program controllers retrieve the limited staff roster through a role-checked RPC. Migration 005 also replaces the duplicate password hash used by migration 002 for its seeded accounts. Remove remaining sample profiles before go-live and verify the migration on staging first.

Before production rollout, verify in staging that an employee cannot change their role or approval status, cannot read unrelated employee profiles, and can read colleagues on an assigned program; verify that a program controller can load the available employee roster and that an administrator can approve accounts and assign roles. The migration runner now validates PostgreSQL TLS certificates; database connection URLs must use valid URL encoding for reserved characters in credentials.

### Build an Android APK with GitHub Actions
The manual **Build Android APK** workflow uses GitHub's Ubuntu runner, Expo Prebuild, and Gradle to build an installable APK directly on GitHub. It does not use Expo Application Services (EAS) and can also run automatically for tags matching `android-v*`.

Before running it, create or link the Expo project and add these GitHub repository secrets:

- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase public anon key

Run it from **GitHub → Actions → Build Android APK → Run workflow**. Download the generated APK from the workflow's **Artifacts** section.

The APK uses the `marushapp://auth/callback` deep link. Add that URL to Supabase Auth's allowed redirect URLs before testing Google sign-in. Expo Go's `exp://...` callback is only for local development.

Android builds also check the latest GitHub Release on startup. To publish an update, push a tag such as `android-v1.0.1`; the workflow publishes the APK as a release asset. Existing installations will prompt the user to download the APK. Android still requires the user to confirm the installation, and the APK must be signed with the same key as the installed version for an in-place update.

### Android signing setup

The Android workflow signs release APKs using a persistent keystore stored in GitHub Actions secrets. Generate the keystore once with JDK `keytool`, then add these repository secrets under **Settings → Secrets and variables → Actions**:

- `ANDROID_KEYSTORE_BASE64`: base64-encoded `.keystore` file
- `ANDROID_KEYSTORE_PASSWORD`: keystore password
- `ANDROID_KEY_ALIAS`: key alias
- `ANDROID_KEY_PASSWORD`: key password

Back up the keystore and passwords securely. Losing the keystore prevents future APKs from updating existing installations. The workflow refuses to build if any signing secret is missing.

### Release targets
GitHub tagged releases contain a production **web export**. The Android APK is built by the separate manual/tagged workflow and requires the repository secrets listed above for signed in-place updates.

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
