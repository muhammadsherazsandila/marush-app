-- =============================================================================
-- Migration 009: backfill_and_repair_oauth_profile_creation
-- =============================================================================

-- 1. Ensure the auth.users trigger creates or links the public.profiles record
-- on EVERY user signup or metadata update, ensuring no user is left without a profile.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
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
            full_name = CASE WHEN v_is_bootstrap_admin THEN v_full_name ELSE COALESCE(profile.full_name, v_full_name) END,
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

-- 2. Backfill: ensure EVERY existing user in auth.users has a linked public.profiles record
DO $$
DECLARE
    auth_rec RECORD;
    v_full_name TEXT;
    v_avatar_url TEXT;
    v_phone TEXT;
    v_is_bootstrap_admin BOOLEAN;
    existing_profile_id UUID;
BEGIN
    FOR auth_rec IN SELECT id, email, email_confirmed_at, raw_user_meta_data FROM auth.users WHERE email IS NOT NULL LOOP
        v_full_name := COALESCE(
            auth_rec.raw_user_meta_data->>'full_name',
            auth_rec.raw_user_meta_data->>'name',
            split_part(auth_rec.email, '@', 1)
        );
        v_avatar_url := COALESCE(
            auth_rec.raw_user_meta_data->>'avatar_url',
            auth_rec.raw_user_meta_data->>'picture'
        );
        v_phone := NULLIF(auth_rec.raw_user_meta_data->>'phone', '');

        SELECT auth_rec.email_confirmed_at IS NOT NULL
           AND LOWER(setting.email) = LOWER(auth_rec.email)
        INTO v_is_bootstrap_admin
        FROM public.bootstrap_admin_settings AS setting
        WHERE setting.singleton = TRUE;
        v_is_bootstrap_admin := COALESCE(v_is_bootstrap_admin, FALSE);

        SELECT id
        INTO existing_profile_id
        FROM public.profiles
        WHERE LOWER(email) = LOWER(auth_rec.email)
        LIMIT 1;

        IF existing_profile_id IS NOT NULL THEN
            UPDATE public.profiles
            SET auth_user_id = auth_rec.id,
                full_name = CASE WHEN v_is_bootstrap_admin THEN v_full_name ELSE COALESCE(public.profiles.full_name, v_full_name) END,
                role = CASE WHEN v_is_bootstrap_admin THEN 'admin'::public.user_role ELSE public.profiles.role END,
                status = CASE WHEN v_is_bootstrap_admin THEN 'approved'::public.user_status ELSE public.profiles.status END,
                requested_role = CASE WHEN v_is_bootstrap_admin THEN NULL ELSE public.profiles.requested_role END,
                avatar_url = COALESCE(public.profiles.avatar_url, v_avatar_url),
                updated_at = now()
            WHERE id = existing_profile_id;
        ELSE
            INSERT INTO public.profiles (
                auth_user_id, email, full_name, role, status, phone, avatar_url
            ) VALUES (
                auth_rec.id,
                auth_rec.email,
                v_full_name,
                CASE WHEN v_is_bootstrap_admin THEN 'admin'::public.user_role ELSE 'employee'::public.user_role END,
                CASE WHEN v_is_bootstrap_admin THEN 'approved'::public.user_status ELSE 'pending'::public.user_status END,
                v_phone,
                v_avatar_url
            );
        END IF;
    END LOOP;
END;
$$;
