-- =============================================================================
-- Migration 010: prevent_admin_deletion_and_restore
-- =============================================================================

-- 1. Restore the bootstrap administrator profile for anonymousdominators@gmail.com
INSERT INTO public.profiles (
    auth_user_id,
    email,
    full_name,
    role,
    status,
    avatar_url
)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'Anonymous Dominators'),
    'admin'::public.user_role,
    'approved'::public.user_status,
    raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE LOWER(email) = LOWER('anonymousdominators@gmail.com')
ON CONFLICT (email) DO UPDATE
SET auth_user_id = EXCLUDED.auth_user_id,
    role = 'admin'::public.user_role,
    status = 'approved'::public.user_status,
    updated_at = NOW();

-- 2. Trigger to block deletion of any user with the 'admin' role in public.profiles.
-- Deleting an administrator requires direct database access or contacting the developer.
CREATE OR REPLACE FUNCTION public.prevent_admin_profile_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
BEGIN
    IF OLD.role = 'admin'::public.user_role THEN
        RAISE EXCEPTION 'Administrator accounts cannot be deleted from the application interface. Contact the developer for assistance.'
            USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_admin_profile_deletion ON public.profiles;
CREATE TRIGGER trg_prevent_admin_profile_deletion
    BEFORE DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_admin_profile_deletion();
