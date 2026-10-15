-- =============================================================================
-- Migration 004: Auto-Create and Link Profiles on Supabase Auth / OAuth Signup
-- =============================================================================

-- 1. Trigger function to sync auth.users with public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    existing_profile_id UUID;
    v_full_name TEXT;
    v_avatar_url TEXT;
BEGIN
    -- Extract full name and avatar from user metadata
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    v_avatar_url := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
    );

    -- Check if a profile with this email already exists
    SELECT id INTO existing_profile_id 
    FROM public.profiles 
    WHERE LOWER(email) = LOWER(NEW.email) 
    LIMIT 1;

    IF existing_profile_id IS NOT NULL THEN
        -- Link existing profile with auth_user_id
        UPDATE public.profiles
        SET 
            auth_user_id = NEW.id,
            avatar_url = COALESCE(public.profiles.avatar_url, v_avatar_url),
            updated_at = NOW()
        WHERE id = existing_profile_id;
    ELSE
        -- Create a new profile for this authenticated user
        INSERT INTO public.profiles (
            auth_user_id,
            email,
            full_name,
            role,
            status,
            avatar_url
        ) VALUES (
            NEW.id,
            NEW.email,
            v_full_name,
            'employee',
            'pending',
            v_avatar_url
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: Link or create profiles for any existing users in auth.users
DO $$
DECLARE
    u RECORD;
    existing_profile_id UUID;
    v_full_name TEXT;
    v_avatar_url TEXT;
BEGIN
    FOR u IN (SELECT id, email, raw_user_meta_data FROM auth.users WHERE email IS NOT NULL) LOOP
        SELECT id INTO existing_profile_id 
        FROM public.profiles 
        WHERE LOWER(email) = LOWER(u.email) 
        LIMIT 1;

        v_full_name := COALESCE(
            u.raw_user_meta_data->>'full_name',
            u.raw_user_meta_data->>'name',
            split_part(u.email, '@', 1)
        );
        v_avatar_url := COALESCE(
            u.raw_user_meta_data->>'avatar_url',
            u.raw_user_meta_data->>'picture'
        );

        IF existing_profile_id IS NOT NULL THEN
            UPDATE public.profiles
            SET 
                auth_user_id = u.id,
                avatar_url = COALESCE(public.profiles.avatar_url, v_avatar_url),
                updated_at = NOW()
            WHERE id = existing_profile_id;
        ELSE
            INSERT INTO public.profiles (
                auth_user_id,
                email,
                full_name,
                role,
                status,
                avatar_url
            ) VALUES (
                u.id,
                u.email,
                v_full_name,
                'employee',
                'pending',
                v_avatar_url
            )
            ON CONFLICT (email) DO NOTHING;
        END IF;
    END LOOP;
END $$;
