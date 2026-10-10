-- =============================================================================
-- Marush (Pvt.) Ltd. — Poultry Vaccination & Flock Monitoring Mobile Application
-- Migration 001: Initial Schema, RBAC, Row Level Security, and Seed Data
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ENUMS / CUSTOM TYPES
-- -----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'program_controller', 'employee', 'program_auditor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE program_status AS ENUM ('draft', 'pending_approval', 'active', 'pending_audit', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- -----------------------------------------------------------------------------
-- 2. TABLES
-- -----------------------------------------------------------------------------

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    status user_status NOT NULL DEFAULT 'pending',
    phone TEXT,
    employee_code TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: programs
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_name TEXT NOT NULL,
    hatchery_or_farm_name TEXT NOT NULL,
    flock_size INTEGER NOT NULL CHECK (flock_size > 0),
    scheduled_start_date DATE NOT NULL,
    scheduled_start_time TIME NOT NULL,
    scheduled_end_date DATE NOT NULL,
    scheduled_end_time TIME NOT NULL,
    status program_status NOT NULL DEFAULT 'draft',
    controller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    auditor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    completion_metrics JSONB DEFAULT NULL,
    completed_at TIMESTAMPTZ,
    auditor_remarks TEXT,
    audit_score INTEGER CHECK (audit_score >= 0 AND audit_score <= 100),
    audited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: program_members
CREATE TABLE IF NOT EXISTS public.program_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_in_program TEXT NOT NULL DEFAULT 'team_member' CHECK (role_in_program IN ('team_member', 'program_controller')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_program_member UNIQUE(program_id, user_id)
);

-- Table: program_audits
CREATE TABLE IF NOT EXISTS public.program_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE UNIQUE,
    auditor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    checklist JSONB DEFAULT '[]'::jsonb,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    remarks TEXT,
    signed_off_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_auth_user_id ON public.profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

CREATE INDEX IF NOT EXISTS idx_programs_status ON public.programs(status);
CREATE INDEX IF NOT EXISTS idx_programs_controller_id ON public.programs(controller_id);
CREATE INDEX IF NOT EXISTS idx_programs_auditor_id ON public.programs(auditor_id);
CREATE INDEX IF NOT EXISTS idx_programs_created_at ON public.programs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_program_members_program_id ON public.program_members(program_id);
CREATE INDEX IF NOT EXISTS idx_program_members_user_id ON public.program_members(user_id);

CREATE INDEX IF NOT EXISTS idx_program_audits_program_id ON public.program_audits(program_id);
CREATE INDEX IF NOT EXISTS idx_program_audits_auditor_id ON public.program_audits(auditor_id);

-- -----------------------------------------------------------------------------
-- 4. TRIGGERS: auto-update updated_at timestamp
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_programs_updated_at ON public.programs;
CREATE TRIGGER trg_programs_updated_at
    BEFORE UPDATE ON public.programs
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_program_audits_updated_at ON public.program_audits;
CREATE TRIGGER trg_program_audits_updated_at
    BEFORE UPDATE ON public.program_audits
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID AS $$
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT (public.current_profile_role() = 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_audits ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES POLICIES ----
DROP POLICY IF EXISTS "profiles_select_all_approved_or_self" ON public.profiles;
CREATE POLICY "profiles_select_all_approved_or_self" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        auth.uid() = auth_user_id
        OR public.is_admin()
        OR status = 'approved'
    );

DROP POLICY IF EXISTS "profiles_insert_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_insert_self_or_admin" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = auth_user_id
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = auth_user_id
        OR public.is_admin()
    )
    WITH CHECK (
        auth.uid() = auth_user_id
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- ---- PROGRAMS POLICIES ----
DROP POLICY IF EXISTS "programs_select" ON public.programs;
CREATE POLICY "programs_select" ON public.programs
    FOR SELECT TO authenticated
    USING (
        public.is_admin()
        OR controller_id = public.current_profile_id()
        OR auditor_id = public.current_profile_id()
        OR id IN (
            SELECT program_id FROM public.program_members
            WHERE user_id = public.current_profile_id()
        )
    );

DROP POLICY IF EXISTS "programs_insert" ON public.programs;
CREATE POLICY "programs_insert" ON public.programs
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (
            public.current_profile_role() = 'program_controller'
            AND controller_id = public.current_profile_id()
        )
    );

DROP POLICY IF EXISTS "programs_update" ON public.programs;
CREATE POLICY "programs_update" ON public.programs
    FOR UPDATE TO authenticated
    USING (
        public.is_admin()
        OR (
            public.current_profile_role() = 'program_controller'
            AND controller_id = public.current_profile_id()
        )
        OR (
            public.current_profile_role() = 'program_auditor'
            AND auditor_id = public.current_profile_id()
        )
    );

DROP POLICY IF EXISTS "programs_delete" ON public.programs;
CREATE POLICY "programs_delete" ON public.programs
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- ---- PROGRAM MEMBERS POLICIES ----
DROP POLICY IF EXISTS "pm_select" ON public.program_members;
CREATE POLICY "pm_select" ON public.program_members
    FOR SELECT TO authenticated
    USING (
        public.is_admin()
        OR user_id = public.current_profile_id()
        OR program_id IN (
            SELECT id FROM public.programs
            WHERE controller_id = public.current_profile_id()
               OR auditor_id = public.current_profile_id()
        )
    );

DROP POLICY IF EXISTS "pm_insert" ON public.program_members;
CREATE POLICY "pm_insert" ON public.program_members
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
        OR program_id IN (
            SELECT id FROM public.programs
            WHERE controller_id = public.current_profile_id()
        )
    );

DROP POLICY IF EXISTS "pm_delete" ON public.program_members;
CREATE POLICY "pm_delete" ON public.program_members
    FOR DELETE TO authenticated
    USING (
        public.is_admin()
        OR program_id IN (
            SELECT id FROM public.programs
            WHERE controller_id = public.current_profile_id()
        )
    );

-- ---- PROGRAM AUDITS POLICIES ----
DROP POLICY IF EXISTS "pa_select" ON public.program_audits;
CREATE POLICY "pa_select" ON public.program_audits
    FOR SELECT TO authenticated
    USING (
        public.is_admin()
        OR auditor_id = public.current_profile_id()
        OR program_id IN (
            SELECT id FROM public.programs
            WHERE controller_id = public.current_profile_id()
        )
    );

DROP POLICY IF EXISTS "pa_insert" ON public.program_audits;
CREATE POLICY "pa_insert" ON public.program_audits
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (
            public.current_profile_role() = 'program_auditor'
            AND auditor_id = public.current_profile_id()
        )
    );

DROP POLICY IF EXISTS "pa_update" ON public.program_audits;
CREATE POLICY "pa_update" ON public.program_audits
    FOR UPDATE TO authenticated
    USING (
        public.is_admin()
        OR (
            public.current_profile_role() = 'program_auditor'
            AND auditor_id = public.current_profile_id()
        )
    );

-- -----------------------------------------------------------------------------
-- 7. SEED DATA GENERATOR FUNCTION (Dev / Demo Support)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS VOID AS $$
DECLARE
    v_admin_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
    v_ctrl_id UUID := '00000000-0000-0000-0000-000000000002'::UUID;
    v_audit_id UUID := '00000000-0000-0000-0000-000000000003'::UUID;
    v_emp1_id UUID := '00000000-0000-0000-0000-000000000004'::UUID;
    v_emp2_id UUID := '00000000-0000-0000-0000-000000000005'::UUID;
    v_emp3_id UUID := '00000000-0000-0000-0000-000000000006'::UUID;
    v_emp4_id UUID := '00000000-0000-0000-0000-000000000007'::UUID;

    v_prog1_id UUID := '10000000-0000-0000-0000-000000000001'::UUID;
    v_prog2_id UUID := '10000000-0000-0000-0000-000000000002'::UUID;
    v_prog3_id UUID := '10000000-0000-0000-0000-000000000003'::UUID;
BEGIN
    -- Seed Profiles
    INSERT INTO public.profiles (id, email, full_name, role, status, phone, employee_code, created_at)
    VALUES
        (v_admin_id, 'admin@marush.com.pk', 'Muhammad Sheraz (Administrator)', 'admin', 'approved', '+92 42 111 627 874', 'MRSH-ADM-001', '2026-01-15T08:00:00Z'),
        (v_ctrl_id, 'controller@marush.com.pk', 'Dr. Tariq Mahmood (Field Controller)', 'program_controller', 'approved', '+92 300 4567890', 'MRSH-CTL-012', '2026-02-01T09:30:00Z'),
        (v_audit_id, 'auditor@marush.com.pk', 'Dr. Ayesha Malik (Quality Auditor)', 'program_auditor', 'approved', '+92 321 9876543', 'MRSH-AUD-004', '2026-02-10T11:00:00Z'),
        (v_emp1_id, 'ali.hassan@marush.com.pk', 'Ali Hassan', 'employee', 'approved', '+92 312 3456781', 'MRSH-EMP-101', '2026-03-01T10:00:00Z'),
        (v_emp2_id, 'usman.zafar@marush.com.pk', 'Usman Zafar', 'employee', 'approved', '+92 312 3456782', 'MRSH-EMP-102', '2026-03-02T10:00:00Z'),
        (v_emp3_id, 'bilal.ahmed@marush.com.pk', 'Bilal Ahmed', 'employee', 'approved', '+92 312 3456783', 'MRSH-EMP-103', '2026-03-03T10:00:00Z'),
        (v_emp4_id, 'hamza.khan@marush.com.pk', 'Hamza Khan (Pending Approval)', 'employee', 'pending', '+92 312 3456784', 'MRSH-EMP-104', '2026-10-10T09:15:00Z')
    ON CONFLICT (id) DO NOTHING;

    -- Seed Programs
    INSERT INTO public.programs (
        id, program_name, hatchery_or_farm_name, flock_size,
        scheduled_start_date, scheduled_start_time, scheduled_end_date, scheduled_end_time,
        status, controller_id, auditor_id, completion_metrics, completed_at,
        auditor_remarks, audit_score, audited_at, created_at
    )
    VALUES
        (
            v_prog1_id,
            'Hatchery Ceva ND In-Ovo Vaccination',
            'Big Bird Hatcheries - Unit 4, Raiwind',
            50000,
            '2026-09-18', '08:00:00', '2026-09-18', '16:00:00',
            'completed',
            v_ctrl_id,
            v_audit_id,
            '{"birdsVaccinated": 49820, "dosagePerBird": "0.05 ml via automated Ceva Egginject", "batchNumber": "VND-2026-PK98", "vaccineType": "Vectormune ND + Cevac Transmune", "coldChainTempCelsius": 3.8, "equipmentCheckPassed": true, "farmFlockObservations": "Optimal egg viability. Strict aseptic standards maintained throughout."}'::jsonb,
            '2026-09-18T16:30:00Z',
            'Excellent execution. Cold chain log verified at 3.8°C. Equipment sanitized per Ceva SOP.',
            98,
            '2026-09-19T09:00:00Z',
            '2026-09-15T10:00:00Z'
        ),
        (
            v_prog2_id,
            'Broiler Flock Day-One Spray Vaccination',
            'Jadeed Farms - Flock Sector B, Okara',
            35000,
            '2026-10-08', '07:30:00', '2026-10-08', '13:00:00',
            'completed',
            v_ctrl_id,
            v_audit_id,
            '{"birdsVaccinated": 34950, "dosagePerBird": "Coarse spray 20ml per crate", "batchNumber": "CIB-5441-A", "vaccineType": "Cevac IBird", "coldChainTempCelsius": 4.1, "equipmentCheckPassed": true, "farmFlockObservations": "Flock lively. Droplet size calibrated at 150 microns."}'::jsonb,
            '2026-10-08T13:45:00Z',
            'Spray uniformity compliant. Vaccine titration confirmed post-application.',
            95,
            '2026-10-09T10:30:00Z',
            '2026-10-05T11:00:00Z'
        ),
        (
            v_prog3_id,
            'Layer Flock Marek & Gumboro Immunization',
            'SB Feeds & Poultry - Kasur Hatchery',
            28000,
            '2026-10-10', '09:00:00', '2026-10-10', '17:00:00',
            'active',
            v_ctrl_id,
            v_audit_id,
            NULL, NULL, NULL, NULL, NULL,
            '2026-10-09T14:00:00Z'
        )
    ON CONFLICT (id) DO NOTHING;

    -- Seed Program Members
    INSERT INTO public.program_members (program_id, user_id, role_in_program)
    VALUES
        (v_prog1_id, v_emp1_id, 'team_member'),
        (v_prog2_id, v_emp2_id, 'team_member'),
        (v_prog3_id, v_emp1_id, 'team_member')
    ON CONFLICT (program_id, user_id) DO NOTHING;

    -- Seed Program Audit records
    INSERT INTO public.program_audits (program_id, auditor_id, checklist, score, remarks, signed_off_at)
    VALUES
        (
            v_prog1_id,
            v_audit_id,
            '[{"item": "Cold chain verified (2-8°C)", "passed": true}, {"item": "Equipment sterilization certified", "passed": true}, {"item": "Dosage calibration check", "passed": true}]'::jsonb,
            98,
            'Excellent execution. Cold chain log verified at 3.8°C. Equipment sanitized per Ceva SOP.',
            '2026-09-19T09:00:00Z'
        ),
        (
            v_prog2_id,
            v_audit_id,
            '[{"item": "Cold chain verified (2-8°C)", "passed": true}, {"item": "Spray droplet uniformity check", "passed": true}, {"item": "Crate counts and mortality log", "passed": true}]'::jsonb,
            95,
            'Spray uniformity compliant. Vaccine titration confirmed post-application.',
            '2026-10-09T10:30:00Z'
        )
    ON CONFLICT (program_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
