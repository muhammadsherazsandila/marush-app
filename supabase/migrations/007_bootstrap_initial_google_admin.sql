-- Configure a single organization-owned bootstrap identity. The table is
-- intentionally inaccessible to application roles; only the auth trigger reads it.
CREATE TABLE IF NOT EXISTS public.bootstrap_admin_settings (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton IS TRUE),
    email TEXT NOT NULL
);

REVOKE ALL ON TABLE public.bootstrap_admin_settings FROM PUBLIC, anon, authenticated;

INSERT INTO public.bootstrap_admin_settings (singleton, email)
VALUES (TRUE, 'anonymousdominators@gmail.com')
ON CONFLICT (singleton) DO UPDATE
SET email = EXCLUDED.email;

-- Remove the replaced demo administrator and auth identity. Do not cascade away
-- operational assignments: stop the migration and require reassignment first.
DO $$
DECLARE
    legacy_profile_id UUID;
BEGIN
    SELECT id
    INTO legacy_profile_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER('admin@marush.com.pk')
    LIMIT 1
    FOR UPDATE;

    IF legacy_profile_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.programs WHERE controller_id = legacy_profile_id)
            OR EXISTS (SELECT 1 FROM public.programs WHERE auditor_id = legacy_profile_id)
            OR EXISTS (SELECT 1 FROM public.program_members WHERE user_id = legacy_profile_id)
            OR EXISTS (SELECT 1 FROM public.program_audits WHERE auditor_id = legacy_profile_id)
        THEN
            RAISE EXCEPTION 'Cannot remove the legacy administrator: reassign its program and audit records first.';
        END IF;

        DELETE FROM public.profiles WHERE id = legacy_profile_id;
    END IF;

    DELETE FROM auth.users
    WHERE LOWER(email) = LOWER('admin@marush.com.pk');
END;
$$;

-- A demo seed function from the initial schema must not recreate the removed
-- account on a later deployment or manual invocation.
DROP FUNCTION IF EXISTS public.seed_demo_data();

-- Google OAuth creates profiles in the database. The configured, verified
-- bootstrap email receives admin access; every other first-time profile stays
-- an unapproved employee regardless of client-supplied metadata.
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
    v_is_bootstrap_admin BOOLEAN;
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

    SELECT NEW.email_confirmed_at IS NOT NULL
       AND LOWER(setting.email) = LOWER(NEW.email)
    INTO v_is_bootstrap_admin
    FROM public.bootstrap_admin_settings AS setting
    WHERE setting.singleton = TRUE;
    v_is_bootstrap_admin := COALESCE(v_is_bootstrap_admin, FALSE);

    SELECT id
    INTO existing_profile_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;

    IF existing_profile_id IS NOT NULL THEN
        UPDATE public.profiles AS profile
        SET auth_user_id = NEW.id,
            full_name = CASE WHEN v_is_bootstrap_admin THEN v_full_name ELSE profile.full_name END,
            role = CASE WHEN v_is_bootstrap_admin THEN 'admin'::public.user_role ELSE profile.role END,
            status = CASE WHEN v_is_bootstrap_admin THEN 'approved'::public.user_status ELSE profile.status END,
            requested_role = CASE WHEN v_is_bootstrap_admin THEN NULL ELSE profile.requested_role END,
            avatar_url = COALESCE(profile.avatar_url, v_avatar_url),
            updated_at = now()
        WHERE profile.id = existing_profile_id;
    ELSE
        INSERT INTO public.profiles (
            auth_user_id, email, full_name, role, status, phone, avatar_url
        ) VALUES (
            NEW.id,
            NEW.email,
            v_full_name,
            CASE WHEN v_is_bootstrap_admin THEN 'admin'::public.user_role ELSE 'employee'::public.user_role END,
            CASE WHEN v_is_bootstrap_admin THEN 'approved'::public.user_status ELSE 'pending'::public.user_status END,
            v_phone,
            v_avatar_url
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Also promote the configured identity if it already completed Google sign-in
-- before this migration was deployed.
DO $$
DECLARE
    bootstrap_user RECORD;
    existing_profile_id UUID;
    v_full_name TEXT;
    v_avatar_url TEXT;
    v_phone TEXT;
BEGIN
    FOR bootstrap_user IN
        SELECT auth_user.id, auth_user.email, auth_user.raw_user_meta_data
        FROM auth.users AS auth_user
        INNER JOIN public.bootstrap_admin_settings AS setting
            ON LOWER(setting.email) = LOWER(auth_user.email)
        WHERE setting.singleton = TRUE
          AND auth_user.email_confirmed_at IS NOT NULL
    LOOP
        v_full_name := COALESCE(
            bootstrap_user.raw_user_meta_data->>'full_name',
            bootstrap_user.raw_user_meta_data->>'name',
            split_part(bootstrap_user.email, '@', 1)
        );
        v_avatar_url := COALESCE(
            bootstrap_user.raw_user_meta_data->>'avatar_url',
            bootstrap_user.raw_user_meta_data->>'picture'
        );
        v_phone := NULLIF(bootstrap_user.raw_user_meta_data->>'phone', '');

        SELECT id
        INTO existing_profile_id
        FROM public.profiles
        WHERE LOWER(email) = LOWER(bootstrap_user.email)
        LIMIT 1
        FOR UPDATE;

        IF existing_profile_id IS NULL THEN
            INSERT INTO public.profiles (
                auth_user_id, email, full_name, role, status, phone, avatar_url
            ) VALUES (
                bootstrap_user.id, bootstrap_user.email, v_full_name,
                'admin', 'approved', v_phone, v_avatar_url
            );
        ELSE
            UPDATE public.profiles
            SET auth_user_id = bootstrap_user.id,
                full_name = v_full_name,
                role = 'admin',
                status = 'approved',
                requested_role = NULL,
                phone = COALESCE(public.profiles.phone, v_phone),
                avatar_url = COALESCE(public.profiles.avatar_url, v_avatar_url),
                updated_at = now()
            WHERE id = existing_profile_id;
        END IF;
    END LOOP;
END;
$$;

-- Administrator access is policy-assigned; it is never a signup designation.
CREATE OR REPLACE FUNCTION public.request_profile_designation(
    p_requested_role public.user_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    updated BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication is required.' USING ERRCODE = '42501';
    END IF;

    IF p_requested_role = 'admin'::public.user_role THEN
        RAISE EXCEPTION 'Administrator access is provisioned by organization policy.' USING ERRCODE = '42501';
    END IF;

    UPDATE public.profiles
    SET requested_role = p_requested_role,
        updated_at = now()
    WHERE auth_user_id = auth.uid()
      AND status = 'pending'::public.user_status
    RETURNING true INTO updated;

    IF updated IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'Only pending accounts may request a designation.' USING ERRCODE = '42501';
    END IF;

    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.request_profile_designation(public.user_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_profile_designation(public.user_role) TO authenticated;
