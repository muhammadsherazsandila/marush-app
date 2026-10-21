-- =============================================================================
-- Migration: Two-Stage Bootstrap (Developer + Superadmin) and Nullable Employee Email
--
-- 1. Alters profiles.email to be NULLABLE so field employees can be added without emails.
-- 2. Adds is_developer column to profiles to distinguish the developer super-user.
-- 3. Redesigns the initial bootstrap to support 2 accounts:
--    - Account 1 (First Login): Developer account with full superadmin privileges.
--    - Account 2 (Second Login): Super Admin account.
--    - Subsequent Logins: Bootstrap is disabled; new users receive standard pending accounts.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PROFILES TABLE ADJUSTMENTS
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
    ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_developer BOOLEAN NOT NULL DEFAULT FALSE;

-- -----------------------------------------------------------------------------
-- 2. BOOTSTRAP STATE ADJUSTMENTS
-- -----------------------------------------------------------------------------
ALTER TABLE public.first_admin_bootstrap_state
    ADD COLUMN IF NOT EXISTS developer_claimed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS developer_user_id UUID,
    ADD COLUMN IF NOT EXISTS superadmin_claimed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS superadmin_user_id UUID;

-- -----------------------------------------------------------------------------
-- 3. TWO-STAGE BOOTSTRAP CLAIM FUNCTION
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_two_stage_bootstrap(p_auth_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_dev_id UUID;
    v_sa_id UUID;
BEGIN
    IF p_auth_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Lock the singleton state row for concurrency safety
    SELECT developer_user_id, superadmin_user_id
    INTO v_dev_id, v_sa_id
    FROM public.first_admin_bootstrap_state
    WHERE singleton IS TRUE
    FOR UPDATE;

    -- If this exact user already claimed slot 1, return developer
    IF v_dev_id = p_auth_user_id THEN
        RETURN 'developer';
    END IF;

    -- If this exact user already claimed slot 2, return superadmin
    IF v_sa_id = p_auth_user_id THEN
        RETURN 'superadmin';
    END IF;

    -- Slot 1: Very first login -> Developer account
    IF v_dev_id IS NULL THEN
        UPDATE public.first_admin_bootstrap_state
        SET developer_claimed_at = clock_timestamp(),
            developer_user_id = p_auth_user_id
        WHERE singleton IS TRUE;
        RETURN 'developer';
    END IF;

    -- Slot 2: Second login -> Super Admin account (closes bootstrap)
    IF v_sa_id IS NULL THEN
        UPDATE public.first_admin_bootstrap_state
        SET superadmin_claimed_at = clock_timestamp(),
            superadmin_user_id = p_auth_user_id,
            claimed_at = clock_timestamp(),
            claimed_user_id = p_auth_user_id
        WHERE singleton IS TRUE;
        RETURN 'superadmin';
    END IF;

    -- Both slots have already been claimed: bootstrap is closed
    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_two_stage_bootstrap(UUID) FROM PUBLIC, anon, authenticated;

-- Maintain legacy function signature by delegating to claim_two_stage_bootstrap
CREATE OR REPLACE FUNCTION public.claim_first_superadmin(p_auth_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT (public.claim_two_stage_bootstrap(p_auth_user_id) IS NOT NULL);
$$;

REVOKE ALL ON FUNCTION public.claim_first_superadmin(UUID) FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. SUPERADMIN CHECK (Includes Developer)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles AS profile
        WHERE profile.auth_user_id = (SELECT auth.uid())
          AND (profile.is_super_admin IS TRUE OR profile.is_developer IS TRUE)
    );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- -----------------------------------------------------------------------------
-- 5. AUTH TRIGGERS FOR NEW USERS & CONFIRMATION
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    existing_profile_id UUID;
    v_full_name TEXT;
    v_avatar_url TEXT;
    v_phone TEXT;
    v_bootstrap_slot TEXT := NULL;
    v_is_super BOOLEAN := FALSE;
    v_is_dev BOOLEAN := FALSE;
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

    IF NEW.email_confirmed_at IS NOT NULL THEN
        v_bootstrap_slot := public.claim_two_stage_bootstrap(NEW.id);
    END IF;

    IF v_bootstrap_slot = 'developer' THEN
        v_is_super := TRUE;
        v_is_dev := TRUE;
    ELSIF v_bootstrap_slot = 'superadmin' THEN
        v_is_super := TRUE;
        v_is_dev := FALSE;
    END IF;

    SELECT profile.id
    INTO existing_profile_id
    FROM public.profiles AS profile
    WHERE profile.auth_user_id = NEW.id
    LIMIT 1
    FOR UPDATE;

    IF existing_profile_id IS NULL AND NEW.email IS NOT NULL THEN
        SELECT profile.id
        INTO existing_profile_id
        FROM public.profiles AS profile
        WHERE LOWER(profile.email) = LOWER(NEW.email)
        LIMIT 1
        FOR UPDATE;
    END IF;

    IF existing_profile_id IS NOT NULL THEN
        UPDATE public.profiles AS profile
        SET auth_user_id = NEW.id,
            full_name = CASE
                WHEN v_bootstrap_slot IS NOT NULL THEN v_full_name
                ELSE COALESCE(profile.full_name, v_full_name)
            END,
            role = CASE
                WHEN v_bootstrap_slot IS NOT NULL THEN 'admin'::public.user_role
                ELSE profile.role
            END,
            is_super_admin = CASE
                WHEN v_bootstrap_slot IS NOT NULL THEN v_is_super
                ELSE profile.is_super_admin
            END,
            is_developer = CASE
                WHEN v_bootstrap_slot IS NOT NULL THEN v_is_dev
                ELSE profile.is_developer
            END,
            status = CASE
                WHEN v_bootstrap_slot IS NOT NULL THEN 'approved'::public.user_status
                ELSE profile.status
            END,
            requested_role = CASE
                WHEN v_bootstrap_slot IS NOT NULL THEN NULL
                ELSE profile.requested_role
            END,
            phone = COALESCE(profile.phone, v_phone),
            avatar_url = COALESCE(profile.avatar_url, v_avatar_url),
            updated_at = clock_timestamp()
        WHERE profile.id = existing_profile_id;
    ELSE
        INSERT INTO public.profiles (
            auth_user_id,
            email,
            full_name,
            role,
            is_super_admin,
            is_developer,
            status,
            phone,
            avatar_url
        ) VALUES (
            NEW.id,
            NEW.email,
            v_full_name,
            CASE
                WHEN v_bootstrap_slot IS NOT NULL THEN 'admin'::public.user_role
                ELSE 'employee'::public.user_role
            END,
            v_is_super,
            v_is_dev,
            CASE
                WHEN v_bootstrap_slot IS NOT NULL THEN 'approved'::public.user_status
                ELSE 'pending'::public.user_status
            END,
            v_phone,
            v_avatar_url
        );
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.promote_first_admin_after_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_profile_id UUID;
    v_bootstrap_slot TEXT := NULL;
    v_is_super BOOLEAN := FALSE;
    v_is_dev BOOLEAN := FALSE;
BEGIN
    IF NEW.email_confirmed_at IS NULL THEN
        RETURN NEW;
    END IF;

    v_bootstrap_slot := public.claim_two_stage_bootstrap(NEW.id);
    IF v_bootstrap_slot IS NULL THEN
        RETURN NEW;
    END IF;

    IF v_bootstrap_slot = 'developer' THEN
        v_is_super := TRUE;
        v_is_dev := TRUE;
    ELSIF v_bootstrap_slot = 'superadmin' THEN
        v_is_super := TRUE;
        v_is_dev := FALSE;
    END IF;

    SELECT profile.id
    INTO v_profile_id
    FROM public.profiles AS profile
    WHERE profile.auth_user_id = NEW.id
       OR (NEW.email IS NOT NULL AND LOWER(profile.email) = LOWER(NEW.email))
    ORDER BY CASE WHEN profile.auth_user_id = NEW.id THEN 0 ELSE 1 END
    LIMIT 1
    FOR UPDATE;

    IF v_profile_id IS NULL THEN
        INSERT INTO public.profiles (
            auth_user_id,
            email,
            full_name,
            role,
            is_super_admin,
            is_developer,
            status,
            phone,
            avatar_url
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name',
                split_part(NEW.email, '@', 1)
            ),
            'admin'::public.user_role,
            v_is_super,
            v_is_dev,
            'approved'::public.user_status,
            NULLIF(NEW.raw_user_meta_data->>'phone', ''),
            COALESCE(
                NEW.raw_user_meta_data->>'avatar_url',
                NEW.raw_user_meta_data->>'picture'
            )
        );
    ELSE
        UPDATE public.profiles AS profile
        SET auth_user_id = NEW.id,
            full_name = COALESCE(
                NEW.raw_user_meta_data->>'full_name',
                NEW.raw_user_meta_data->>'name',
                split_part(NEW.email, '@', 1)
            ),
            role = 'admin'::public.user_role,
            is_super_admin = v_is_super,
            is_developer = v_is_dev,
            status = 'approved'::public.user_status,
            requested_role = NULL,
            avatar_url = COALESCE(
                profile.avatar_url,
                NEW.raw_user_meta_data->>'avatar_url',
                NEW.raw_user_meta_data->>'picture'
            ),
            updated_at = clock_timestamp()
        WHERE profile.id = v_profile_id;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_first_admin_after_confirmation() FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6. PRIVILEGE PROTECTION TRIGGER (Protects Superadmin and Developer)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
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

    IF (NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin OR NEW.is_developer IS DISTINCT FROM OLD.is_developer)
       AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'The superadmin or developer designation cannot be changed without superadmin privileges.'
            USING ERRCODE = '42501';
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Only the superadmin or developer can change administrator privileges.'
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

-- -----------------------------------------------------------------------------
-- 7. REOPEN BOOTSTRAP SLOTS AFTER ACCOUNT DELETION
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reopen_superadmin_bootstrap_after_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF OLD.is_developer IS TRUE
       AND NOT EXISTS (
           SELECT 1
           FROM public.profiles AS profile
           WHERE profile.is_developer IS TRUE
       ) THEN
        UPDATE public.first_admin_bootstrap_state AS state
        SET developer_claimed_at = NULL,
            developer_user_id = NULL
        WHERE state.singleton IS TRUE;
    END IF;

    IF OLD.is_super_admin IS TRUE
       AND OLD.is_developer IS NOT TRUE
       AND NOT EXISTS (
           SELECT 1
           FROM public.profiles AS profile
           WHERE profile.is_super_admin IS TRUE AND profile.is_developer IS NOT TRUE
       ) THEN
        UPDATE public.first_admin_bootstrap_state AS state
        SET superadmin_claimed_at = NULL,
            superadmin_user_id = NULL,
            claimed_at = NULL,
            claimed_user_id = NULL
        WHERE state.singleton IS TRUE;
    END IF;

    RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.reopen_superadmin_bootstrap_after_delete() FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 8. AUTHORIZE PROFILE DELETION (Includes Developer Protection)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.authorize_profile_deletion(p_profile_id UUID)
RETURNS TABLE (profile_id UUID, auth_user_id UUID)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_target public.profiles%ROWTYPE;
BEGIN
    IF (SELECT auth.uid()) IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can request account deletion.'
            USING ERRCODE = '42501';
    END IF;

    SELECT profile.*
    INTO v_target
    FROM public.profiles AS profile
    WHERE profile.id = p_profile_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'The account no longer exists.'
            USING ERRCODE = 'P0002';
    END IF;

    IF (v_target.is_super_admin IS TRUE OR v_target.is_developer IS TRUE)
       AND v_target.auth_user_id = (SELECT auth.uid()) THEN
        RAISE EXCEPTION 'Super user accounts cannot delete themselves.'
            USING ERRCODE = '42501';
    END IF;

    IF (v_target.role = 'admin'::public.user_role OR v_target.is_super_admin OR v_target.is_developer)
       AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Only the superadmin or developer can delete an administrator account.'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY SELECT v_target.id, v_target.auth_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.authorize_profile_deletion(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.authorize_profile_deletion(UUID) TO authenticated;
