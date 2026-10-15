-- =============================================================================
-- Migration 008: promote_bootstrap_admin_after_verification
-- Created At: 2026-10-11T10:59:18.626Z
-- =============================================================================

-- Write your PostgreSQL DDL/DML statements below:
-- Example:
-- ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS notes TEXT;

-- OAuth providers can create auth.users before email confirmation is recorded.
-- Promote the configured bootstrap account when Supabase later marks it verified.
CREATE OR REPLACE FUNCTION public.promote_bootstrap_admin_after_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    bootstrap_email TEXT;
BEGIN
    IF NEW.email_confirmed_at IS NULL OR NEW.email IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT setting.email
    INTO bootstrap_email
    FROM public.bootstrap_admin_settings AS setting
    WHERE setting.singleton = TRUE;

    IF bootstrap_email IS NULL OR LOWER(NEW.email) <> LOWER(bootstrap_email) THEN
        RETURN NEW;
    END IF;

    UPDATE public.profiles AS profile
    SET auth_user_id = NEW.id,
        role = 'admin'::public.user_role,
        status = 'approved'::public.user_status,
        requested_role = NULL,
        updated_at = NOW()
    WHERE LOWER(profile.email) = LOWER(NEW.email);

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_bootstrap_admin_after_confirmation() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_bootstrap_admin_confirmed ON auth.users;
CREATE TRIGGER on_bootstrap_admin_confirmed
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.promote_bootstrap_admin_after_confirmation();

-- Also repair the configured, verified bootstrap profile if it was created
-- before its email confirmation timestamp was written.
UPDATE public.profiles AS profile
SET auth_user_id = auth_user.id,
    role = 'admin'::public.user_role,
    status = 'approved'::public.user_status,
    requested_role = NULL,
    updated_at = NOW()
FROM auth.users AS auth_user
INNER JOIN public.bootstrap_admin_settings AS setting
    ON LOWER(setting.email) = LOWER(auth_user.email)
WHERE setting.singleton = TRUE
  AND auth_user.email_confirmed_at IS NOT NULL
  AND LOWER(profile.email) = LOWER(auth_user.email);

