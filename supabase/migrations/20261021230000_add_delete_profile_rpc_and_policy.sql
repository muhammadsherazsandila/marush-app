-- ============================================================================
-- Migration: Add delete_profile RPC and RLS Delete Policy for Profiles
-- ============================================================================

-- 1. Create delete_profile RPC with full security checks
CREATE OR REPLACE FUNCTION public.delete_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    v_target public.profiles%ROWTYPE;
BEGIN
    IF (SELECT auth.uid()) IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can delete accounts.'
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

    IF v_target.auth_user_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = v_target.auth_user_id;
    END IF;

    DELETE FROM public.profiles WHERE id = v_target.id;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_profile(uuid) TO authenticated, service_role;

-- 2. Add RLS DELETE policy on public.profiles
DROP POLICY IF EXISTS profiles_delete_admin_only ON public.profiles;

CREATE POLICY profiles_delete_admin_only ON public.profiles
FOR DELETE TO authenticated
USING (
    public.is_admin()
    AND (
        (NOT (role = 'admin'::public.user_role OR is_super_admin IS TRUE OR is_developer IS TRUE))
        OR public.is_super_admin()
    )
);
