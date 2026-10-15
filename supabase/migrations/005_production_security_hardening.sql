-- =============================================================================
-- Migration 005: Production authorization and seeded-password hardening
-- Existing migration files are immutable; all production fixes are forward-only.
-- =============================================================================

-- Security-definer functions must never resolve objects from a caller-controlled
-- schema or a temporary schema before the trusted application schemas.
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
    SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
    SELECT role FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
    SELECT public.current_profile_role() = 'admin'::public.user_role;
$$;

CREATE OR REPLACE FUNCTION public.is_user_in_program(p_program_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.program_members
        WHERE program_id = p_program_id AND user_id = p_user_id
    );
$$;

CREATE OR REPLACE FUNCTION public.is_user_controller_or_auditor(p_program_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.programs
        WHERE id = p_program_id AND (controller_id = p_user_id OR auditor_id = p_user_id)
    );
$$;

-- Profile records are visible to their owner, administrators, and colleagues
-- who share at least one assigned program. This avoids exposing the company
-- directory and personal contact data to every authenticated employee.
CREATE OR REPLACE FUNCTION public.can_view_profile(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
    SELECT
        p_profile_id = public.current_profile_id()
        OR public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.programs AS program
            WHERE
                (
                    program.controller_id = public.current_profile_id()
                    OR program.auditor_id = public.current_profile_id()
                    OR EXISTS (
                        SELECT 1 FROM public.program_members AS viewer_membership
                        WHERE viewer_membership.program_id = program.id
                          AND viewer_membership.user_id = public.current_profile_id()
                    )
                )
                AND (
                    program.controller_id = p_profile_id
                    OR program.auditor_id = p_profile_id
                    OR EXISTS (
                        SELECT 1 FROM public.program_members AS target_membership
                        WHERE target_membership.program_id = program.id
                          AND target_membership.user_id = p_profile_id
                    )
                )
        );
$$;

DROP POLICY IF EXISTS "profiles_select_all_approved_or_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self_admin_or_program_colleague" ON public.profiles;
CREATE POLICY "profiles_select_self_admin_or_program_colleague" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.can_view_profile(id));

-- Only administrators can create or modify profile records. OAuth/email signup
-- uses the trusted auth.users trigger, which runs as the database owner.
DROP POLICY IF EXISTS "profiles_insert_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin_only" ON public.profiles;
CREATE POLICY "profiles_insert_admin_only" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin_only" ON public.profiles;
CREATE POLICY "profiles_update_admin_only" ON public.profiles
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Controllers may assign only active, approved employees/controllers. The RPC
-- intentionally returns no email or phone fields and enforces its caller role.
CREATE OR REPLACE FUNCTION public.get_available_employees()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    role public.user_role,
    employee_code TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    caller_role public.user_role;
    caller_profile_id UUID;
BEGIN
    caller_role := public.current_profile_role();
    IF caller_role IS DISTINCT FROM 'admin'::public.user_role
       AND caller_role IS DISTINCT FROM 'program_controller'::public.user_role THEN
        RAISE EXCEPTION 'Only administrators and program controllers can view available employees'
            USING ERRCODE = '42501';
    END IF;

    caller_profile_id := public.current_profile_id();

    RETURN QUERY
    SELECT profile.id, profile.full_name, profile.role, profile.employee_code, profile.created_at
    FROM public.profiles AS profile
    WHERE profile.status = 'approved'::public.user_status
      AND profile.role IN ('employee'::public.user_role, 'program_controller'::public.user_role)
      AND NOT EXISTS (
          SELECT 1
          FROM public.programs AS program
          WHERE program.status IN ('active'::public.program_status, 'pending_audit'::public.program_status)
            AND (
                program.controller_id = profile.id
                OR EXISTS (
                    SELECT 1 FROM public.program_members AS membership
                    WHERE membership.program_id = program.id AND membership.user_id = profile.id
                )
            )
      )
      AND (caller_role = 'admin'::public.user_role OR caller_profile_id IS NOT NULL);
END;
$$;

-- Keep multi-table business actions atomic while preserving caller RLS checks.
CREATE OR REPLACE FUNCTION public.create_program_with_members(
    p_program_name TEXT,
    p_hatchery_or_farm_name TEXT,
    p_flock_size INTEGER,
    p_scheduled_start_date DATE,
    p_scheduled_start_time TIME,
    p_scheduled_end_date DATE,
    p_scheduled_end_time TIME,
    p_controller_id UUID,
    p_team_member_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    created_program_id UUID;
BEGIN
    INSERT INTO public.programs (
        program_name, hatchery_or_farm_name, flock_size,
        scheduled_start_date, scheduled_start_time,
        scheduled_end_date, scheduled_end_time,
        controller_id, status
    ) VALUES (
        p_program_name, p_hatchery_or_farm_name, p_flock_size,
        p_scheduled_start_date, p_scheduled_start_time,
        p_scheduled_end_date, p_scheduled_end_time,
        p_controller_id, 'pending_approval'
    ) RETURNING id INTO created_program_id;

    INSERT INTO public.program_members (program_id, user_id, role_in_program)
    SELECT created_program_id, member_id, 'team_member'
    FROM (
        SELECT DISTINCT unnest(COALESCE(p_team_member_ids, ARRAY[]::UUID[])) AS member_id
    ) AS requested_members;

    RETURN created_program_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_program_audit(
    p_program_id UUID,
    p_auditor_id UUID,
    p_remarks TEXT,
    p_score INTEGER,
    p_checklist JSONB
)
RETURNS SETOF public.program_audits
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    saved_audit public.program_audits%ROWTYPE;
    signed_at TIMESTAMPTZ := now();
BEGIN
    UPDATE public.programs
    SET status = 'completed'::public.program_status,
        auditor_remarks = p_remarks,
        audit_score = p_score,
        audited_at = signed_at
    WHERE id = p_program_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Program is unavailable for audit' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.program_audits (
        program_id, auditor_id, remarks, score, checklist, signed_off_at
    ) VALUES (
        p_program_id, p_auditor_id, p_remarks, p_score,
        COALESCE(p_checklist, '[]'::JSONB), signed_at
    ) RETURNING * INTO saved_audit;

    RETURN NEXT saved_audit;
END;
$$;

-- Keep the auth trigger isolated from temporary objects and persist the
-- applicant's optional phone number. Role and approval state remain assigned
-- by trusted server-side defaults and administrator actions.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    existing_profile_id UUID;
    v_full_name TEXT;
    v_avatar_url TEXT;
    v_phone TEXT;
BEGIN
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    v_avatar_url := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
    );
    v_phone := NULLIF(NEW.raw_user_meta_data->>'phone', '');

    SELECT id INTO existing_profile_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;

    IF existing_profile_id IS NOT NULL THEN
        UPDATE public.profiles
        SET auth_user_id = NEW.id,
            avatar_url = COALESCE(public.profiles.avatar_url, v_avatar_url),
            updated_at = now()
        WHERE id = existing_profile_id;
    ELSE
        INSERT INTO public.profiles (
            auth_user_id, email, full_name, role, status, phone, avatar_url
        ) VALUES (
            NEW.id, NEW.email, v_full_name, 'employee', 'pending', v_phone, v_avatar_url
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Replace the shared demo password hash introduced by migration 002. That
-- migration assigned one identical bcrypt hash to every profile it provisioned;
-- identical password hashes across multiple linked accounts identify those
-- generated demo credentials without changing unrelated unique user passwords.
WITH duplicated_seed_hashes AS (
    SELECT encrypted_password
    FROM auth.users
    WHERE encrypted_password IS NOT NULL
    GROUP BY encrypted_password
    HAVING COUNT(*) > 1
)
UPDATE auth.users AS auth_user
SET encrypted_password = crypt(gen_random_uuid()::TEXT, gen_salt('bf', 12)),
    updated_at = now()
WHERE auth_user.encrypted_password IN (SELECT encrypted_password FROM duplicated_seed_hashes)
  AND EXISTS (
      SELECT 1 FROM public.profiles AS profile
      WHERE profile.auth_user_id = auth_user.id
  );

-- Prevent clients from re-running the development fixture loader.
REVOKE ALL ON FUNCTION public.seed_demo_data() FROM PUBLIC, anon, authenticated;

-- RLS policies execute as authenticated users and therefore need these helper
-- functions. They are unavailable to anonymous sessions.
REVOKE ALL ON FUNCTION public.current_profile_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_user_in_program(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_user_controller_or_auditor(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_view_profile(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_available_employees() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_program_with_members(TEXT, TEXT, INTEGER, DATE, TIME, DATE, TIME, UUID, UUID[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.submit_program_audit(UUID, UUID, TEXT, INTEGER, JSONB) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_in_program(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_controller_or_auditor(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_employees() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_program_with_members(TEXT, TEXT, INTEGER, DATE, TIME, DATE, TIME, UUID, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_program_audit(UUID, UUID, TEXT, INTEGER, JSONB) TO authenticated;

