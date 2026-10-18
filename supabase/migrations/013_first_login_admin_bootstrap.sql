-- =============================================================================
-- Migration 013: first_login_admin_bootstrap
--
-- The first verified Google OAuth account on a fresh installation is granted
-- administrator access once. The claim is stored separately from profiles so
-- removing the first administrator cannot silently reopen bootstrap access.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.first_admin_bootstrap_state (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton IS TRUE),
    claimed_at TIMESTAMPTZ,
    claimed_user_id UUID
);

ALTER TABLE public.first_admin_bootstrap_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.first_admin_bootstrap_state FROM PUBLIC, anon, authenticated;

INSERT INTO public.first_admin_bootstrap_state (singleton, claimed_at, claimed_user_id)
VALUES (TRUE, NULL, NULL)
ON CONFLICT (singleton) DO NOTHING;

-- Preserve existing administrator ownership when this migration is installed
-- on a database that already has an administrator. The requested fresh start
-- explicitly resets this state after clearing application and Auth data.
UPDATE public.first_admin_bootstrap_state AS state
SET claimed_at = COALESCE(state.claimed_at, NOW()),
    claimed_user_id = COALESCE(
        state.claimed_user_id,
        (
            SELECT profile.auth_user_id
            FROM public.profiles AS profile
            WHERE profile.role = 'admin'::public.user_role
            ORDER BY profile.created_at, profile.id
            LIMIT 1
        )
    )
WHERE state.singleton IS TRUE
  AND state.claimed_at IS NULL
  AND EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.role = 'admin'::public.user_role
  );

CREATE OR REPLACE FUNCTION public.claim_first_admin(p_auth_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    v_claimed BOOLEAN;
BEGIN
    IF p_auth_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- This conditional UPDATE is the atomic one-time claim. Concurrent signups
    -- serialize on the singleton row; exactly one transaction can claim it.
    UPDATE public.first_admin_bootstrap_state AS state
    SET claimed_at = clock_timestamp(),
        claimed_user_id = p_auth_user_id
    WHERE state.singleton IS TRUE
      AND state.claimed_at IS NULL
    RETURNING TRUE INTO v_claimed;

    RETURN COALESCE(v_claimed, FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_first_admin(UUID) FROM PUBLIC, anon, authenticated;

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
    v_is_first_admin BOOLEAN := FALSE;
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
        v_is_first_admin := public.claim_first_admin(NEW.id);
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
                WHEN v_is_first_admin THEN v_full_name
                ELSE COALESCE(profile.full_name, v_full_name)
            END,
            role = CASE
                WHEN v_is_first_admin THEN 'admin'::public.user_role
                ELSE profile.role
            END,
            status = CASE
                WHEN v_is_first_admin THEN 'approved'::public.user_status
                ELSE profile.status
            END,
            requested_role = CASE
                WHEN v_is_first_admin THEN NULL
                ELSE profile.requested_role
            END,
            phone = COALESCE(profile.phone, v_phone),
            avatar_url = COALESCE(profile.avatar_url, v_avatar_url),
            updated_at = NOW()
        WHERE profile.id = existing_profile_id;
    ELSE
        INSERT INTO public.profiles (
            auth_user_id,
            email,
            full_name,
            role,
            status,
            phone,
            avatar_url
        ) VALUES (
            NEW.id,
            NEW.email,
            v_full_name,
            CASE
                WHEN v_is_first_admin THEN 'admin'::public.user_role
                ELSE 'employee'::public.user_role
            END,
            CASE
                WHEN v_is_first_admin THEN 'approved'::public.user_status
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

-- Google OAuth normally confirms email during signup. This also handles a
-- provider that records confirmation in a subsequent auth.users update.
DROP TRIGGER IF EXISTS on_bootstrap_admin_confirmed ON auth.users;
DROP FUNCTION IF EXISTS public.promote_bootstrap_admin_after_confirmation();

CREATE OR REPLACE FUNCTION public.promote_first_admin_after_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    v_profile_id UUID;
BEGIN
    IF NEW.email_confirmed_at IS NULL OR NEW.email IS NULL THEN
        RETURN NEW;
    END IF;

    IF NOT public.claim_first_admin(NEW.id) THEN
        RETURN NEW;
    END IF;

    SELECT profile.id
    INTO v_profile_id
    FROM public.profiles AS profile
    WHERE profile.auth_user_id = NEW.id
       OR LOWER(profile.email) = LOWER(NEW.email)
    ORDER BY CASE WHEN profile.auth_user_id = NEW.id THEN 0 ELSE 1 END
    LIMIT 1
    FOR UPDATE;

    IF v_profile_id IS NULL THEN
        INSERT INTO public.profiles (
            auth_user_id,
            email,
            full_name,
            role,
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
            status = 'approved'::public.user_status,
            requested_role = NULL,
            avatar_url = COALESCE(
                profile.avatar_url,
                NEW.raw_user_meta_data->>'avatar_url',
                NEW.raw_user_meta_data->>'picture'
            ),
            updated_at = NOW()
        WHERE profile.id = v_profile_id;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_first_admin_after_confirmation() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_first_admin_email_confirmed
    AFTER UPDATE OF email_confirmed_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
    EXECUTE FUNCTION public.promote_first_admin_after_confirmation();

-- The prior fixed-email setting is no longer used by any active auth trigger.
DROP TABLE IF EXISTS public.bootstrap_admin_settings;