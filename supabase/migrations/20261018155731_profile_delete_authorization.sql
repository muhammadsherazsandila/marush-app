-- Profile removal is performed by the trusted account-removal endpoint, which
-- removes the Auth user and application profile as one controlled workflow.
DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;
REVOKE DELETE ON TABLE public.profiles FROM authenticated;

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

    IF (v_target.role = 'admin'::public.user_role OR v_target.is_super_admin)
       AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Only the superadmin can delete an administrator account.'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY SELECT v_target.id, v_target.auth_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.authorize_profile_deletion(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.authorize_profile_deletion(UUID) TO authenticated;
