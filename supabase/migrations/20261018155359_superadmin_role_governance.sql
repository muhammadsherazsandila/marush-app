-- Distinguish the bootstrap superadmin from ordinary administrators and
-- enforce elevated role changes in Postgres, including direct Data API calls.

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Preserve current administrator ownership during a forward migration. Prefer
-- the account recorded by the existing bootstrap claim; otherwise use the
-- oldest administrator deterministically. A later explicit data reset clears
-- both profiles and the bootstrap claim.
UPDATE public.profiles AS profile
SET is_super_admin = TRUE
WHERE profile.id = (
    SELECT candidate.id
    FROM public.profiles AS candidate
    WHERE candidate.role = 'admin'::public.user_role
    ORDER BY
        CASE WHEN candidate.auth_user_id = (
            SELECT state.claimed_user_id
            FROM public.first_admin_bootstrap_state AS state
            WHERE state.singleton IS TRUE
        ) THEN 0 ELSE 1 END,
        candidate.created_at,
        candidate.id
    LIMIT 1
)
AND NOT EXISTS (
    SELECT 1 FROM public.profiles AS existing_superadmin
    WHERE existing_superadmin.is_super_admin IS TRUE
);

UPDATE public.first_admin_bootstrap_state AS state
SET claimed_at = COALESCE(state.claimed_at, clock_timestamp()),
    claimed_user_id = superadmin.auth_user_id
FROM public.profiles AS superadmin
WHERE state.singleton IS TRUE
  AND superadmin.is_super_admin IS TRUE;

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
          AND profile.is_super_admin IS TRUE
    );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.claim_first_superadmin(p_auth_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_claimed BOOLEAN;
BEGIN
    IF p_auth_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- The singleton row serializes concurrent claims. The existing profile
    -- check also repairs a cleared claim if a superadmin profile still exists.
    UPDATE public.first_admin_bootstrap_state AS state
    SET claimed_at = clock_timestamp(),
        claimed_user_id = p_auth_user_id
    WHERE state.singleton IS TRUE
      AND state.claimed_at IS NULL
      AND NOT EXISTS (
          SELECT 1
          FROM public.profiles AS profile
          WHERE profile.is_super_admin IS TRUE
      )
    RETURNING TRUE INTO v_claimed;

    RETURN COALESCE(v_claimed, FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_first_superadmin(UUID) FROM PUBLIC, anon, authenticated;

-- Keep the legacy internal function name callable by existing trusted auth
-- trigger definitions while routing its one-time claim to superadmin.
CREATE OR REPLACE FUNCTION public.claim_first_admin(p_auth_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT public.claim_first_superadmin(p_auth_user_id);
$$;

REVOKE ALL ON FUNCTION public.claim_first_admin(UUID) FROM PUBLIC, anon, authenticated;

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
    v_is_first_superadmin BOOLEAN := FALSE;
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
        v_is_first_superadmin := public.claim_first_superadmin(NEW.id);
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
                WHEN v_is_first_superadmin THEN v_full_name
                ELSE COALESCE(profile.full_name, v_full_name)
            END,
            role = CASE
                WHEN v_is_first_superadmin THEN 'admin'::public.user_role
                ELSE profile.role
            END,
            is_super_admin = CASE
                WHEN v_is_first_superadmin THEN TRUE
                ELSE profile.is_super_admin
            END,
            status = CASE
                WHEN v_is_first_superadmin THEN 'approved'::public.user_status
                ELSE profile.status
            END,
            requested_role = CASE
                WHEN v_is_first_superadmin THEN NULL
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
            status,
            phone,
            avatar_url
        ) VALUES (
            NEW.id,
            NEW.email,
            v_full_name,
            CASE
                WHEN v_is_first_superadmin THEN 'admin'::public.user_role
                ELSE 'employee'::public.user_role
            END,
            v_is_first_superadmin,
            CASE
                WHEN v_is_first_superadmin THEN 'approved'::public.user_status
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
BEGIN
    IF NEW.email_confirmed_at IS NULL OR NEW.email IS NULL THEN
        RETURN NEW;
    END IF;

    IF NOT public.claim_first_superadmin(NEW.id) THEN
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
            is_super_admin,
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
            TRUE,
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
            is_super_admin = TRUE,
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

CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    -- Auth triggers and trusted service-role operations have no end-user uid;
    -- direct authenticated clients are checked against the persisted profile.
    IF (SELECT auth.uid()) IS NULL THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
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

    IF (NEW.role IS DISTINCT FROM OLD.role
        OR NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin)
       AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Only the superadmin can change administrator privileges.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_admin_profile_deletion ON public.profiles;
DROP TRIGGER IF EXISTS trg_prevent_admin_role_change ON public.profiles;
DROP TRIGGER IF EXISTS trg_protect_profile_privileges ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileges
    BEFORE UPDATE OF role, is_super_admin OR DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_privileges();

DROP POLICY IF EXISTS profiles_delete_admin ON public.profiles;
CREATE POLICY profiles_delete_admin ON public.profiles
    FOR DELETE TO authenticated
    USING (
        public.is_admin()
        AND (role <> 'admin'::public.user_role OR public.is_super_admin())
    );

CREATE OR REPLACE FUNCTION public.reopen_superadmin_bootstrap_after_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF OLD.is_super_admin IS TRUE
       AND NOT EXISTS (
           SELECT 1
           FROM public.profiles AS profile
           WHERE profile.is_super_admin IS TRUE
       ) THEN
        UPDATE public.first_admin_bootstrap_state AS state
        SET claimed_at = NULL,
            claimed_user_id = NULL
        WHERE state.singleton IS TRUE;
    END IF;
    RETURN OLD;
END;
$$;

REVOKE ALL ON FUNCTION public.reopen_superadmin_bootstrap_after_delete() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_reopen_superadmin_bootstrap_after_delete ON public.profiles;
CREATE TRIGGER trg_reopen_superadmin_bootstrap_after_delete
    AFTER DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.reopen_superadmin_bootstrap_after_delete();
