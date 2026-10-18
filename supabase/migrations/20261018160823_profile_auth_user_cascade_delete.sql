-- Keep application profiles in sync when an Auth account is removed through
-- the trusted account-management endpoint.
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_auth_user_id_fkey
    FOREIGN KEY (auth_user_id)
    REFERENCES auth.users (id)
    ON DELETE CASCADE;
