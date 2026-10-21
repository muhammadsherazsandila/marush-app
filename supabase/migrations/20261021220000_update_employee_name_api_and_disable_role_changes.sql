-- =============================================================================
-- Migration: Update Employee Name API and Disable Role Changes
--
-- 1. Creates public.update_employee_name(p_employee_id UUID, p_full_name TEXT)
--    which allows authenticated administrators to update the full name of
--    strictly field employees (role = 'employee'). Controllers, auditors,
--    and administrators are explicitly rejected.
-- 2. Hardens public.protect_profile_privileges() to disallow changing user roles
--    after profile creation across all accounts.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. DEDICATED API: update_employee_name
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_employee_name(
    p_employee_id UUID,
    p_full_name TEXT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_profile public.profiles;
    v_trimmed_name TEXT;
BEGIN
    -- 1. Verify caller is an authenticated administrator
    IF (SELECT auth.uid()) IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can update employee names.'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Validate input name
    v_trimmed_name := TRIM(COALESCE(p_full_name, ''));
    IF v_trimmed_name = '' THEN
        RAISE EXCEPTION 'Employee name cannot be empty.'
            USING ERRCODE = '23514';
    END IF;

    -- 3. Fetch target profile with lock
    SELECT *
    INTO v_profile
    FROM public.profiles
    WHERE id = p_employee_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Employee record not found.'
            USING ERRCODE = 'P0002';
    END IF;

    -- 4. Enforce: strictly employees only (not controllers, auditors, or admins)
    IF v_profile.role <> 'employee'::public.user_role THEN
        RAISE EXCEPTION 'Only field employees may have their names updated by administrators. Controllers and auditors cannot be modified.'
            USING ERRCODE = '42501';
    END IF;

    -- 5. Update full_name and timestamp
    UPDATE public.profiles
    SET full_name = v_trimmed_name,
        updated_at = clock_timestamp()
    WHERE id = p_employee_id
    RETURNING * INTO v_profile;

    RETURN v_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.update_employee_name(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_employee_name(UUID, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- 2. DISABLE CHANGING USER ROLES
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Allow trusted triggers / service-role operations without an end-user JWT
    IF (SELECT auth.uid()) IS NULL THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF (NEW.role = 'admin'::public.user_role OR NEW.is_super_admin IS TRUE OR NEW.is_developer IS TRUE)
           AND NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Only the superadmin or developer can create an administrator account.'
                USING ERRCODE = '42501';
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        IF (OLD.role = 'admin'::public.user_role OR OLD.is_super_admin OR OLD.is_developer)
           AND NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Only the superadmin or developer can delete an administrator account.'
                USING ERRCODE = '42501';
        END IF;
        RETURN OLD;
    END IF;

    -- Role mutation is disabled across the board
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Changing user roles after creation is not permitted.'
            USING ERRCODE = '42501';
    END IF;

    IF (NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin OR NEW.is_developer IS DISTINCT FROM OLD.is_developer) THEN
        RAISE EXCEPTION 'Super user designations cannot be modified.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profile_privileges() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileges
    BEFORE INSERT OR UPDATE OF role, is_super_admin, is_developer OR DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_privileges();
