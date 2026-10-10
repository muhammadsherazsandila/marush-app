-- =============================================================================
-- Migration 002: Seed Supabase Auth Users for Demo Profiles
-- =============================================================================

DO $$
DECLARE
    u RECORD;
    new_uid UUID;
    pwd_hash TEXT := crypt('Password123!', gen_salt('bf', 10));
BEGIN
    FOR u IN (SELECT id as profile_id, email, full_name FROM public.profiles WHERE auth_user_id IS NULL) LOOP
        new_uid := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000'::UUID, new_uid, 'authenticated', 'authenticated', u.email, pwd_hash,
            NOW(), '{"provider":"email","providers":["email"]}'::jsonb,
            json_build_object('sub', new_uid, 'email', u.email, 'full_name', u.full_name)::jsonb,
            NOW(), NOW()
        );

        INSERT INTO auth.identities (
            id, provider_id, user_id, identity_data, provider,
            last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), new_uid::text, new_uid,
            json_build_object('sub', new_uid, 'email', u.email)::jsonb,
            'email', NOW(), NOW(), NOW()
        );

        UPDATE public.profiles SET auth_user_id = new_uid WHERE id = u.profile_id;
    END LOOP;
END $$;
