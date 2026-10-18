-- Authenticated admins may manage ordinary users, but only the persisted
-- superadmin may create or change an administrator profile. The bootstrap
-- auth trigger runs without an end-user JWT and remains trusted.
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
        IF (NEW.role = 'admin'::public.user_role OR NEW.is_super_admin IS TRUE)
           AND NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Only the superadmin can create an administrator account.'
                USING ERRCODE = '42501';
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        IF (OLD.role = 'admin'::public.user_role OR OLD.is_super_admin)
           AND NOT public.is_super_admin() THEN
            RAISE EXCEPTION 'Only the superadmin can delete an administrator account.'
                USING ERRCODE = '42501';
        END IF;
        RETURN OLD;
    END IF;

    IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin THEN
        RAISE EXCEPTION 'The superadmin designation cannot be changed through the client API.'
            USING ERRCODE = '42501';
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Only the superadmin can change administrator privileges.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profile_privileges() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileges
    BEFORE INSERT OR UPDATE OF role, is_super_admin OR DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_privileges();
