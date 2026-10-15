-- =============================================================================
-- Migration 011: prevent_admin_role_change
-- =============================================================================

-- Database trigger to prevent demoting or changing the role of any administrator
-- account, ensuring system integrity and preventing accidental self-demotion.
CREATE OR REPLACE FUNCTION public.prevent_admin_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
AS $$
BEGIN
    -- If the profile is currently an admin and an attempt is made to change the role
    IF OLD.role = 'admin'::public.user_role AND NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Administrator role cannot be changed from the application interface. Contact the developer for assistance.'
            USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_admin_role_change ON public.profiles;
CREATE TRIGGER trg_prevent_admin_role_change
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_admin_role_change();
