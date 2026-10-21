-- =============================================================================
-- Migration: Supabase API Table Grants and Default Privileges
-- Purpose: Comply with Supabase Data API changes (effective October 30),
--          ensuring authenticated and service_role have explicit table permissions
--          and setting default schema privileges for future tables.
-- =============================================================================

-- 1. Ensure Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Explicit Grants for Application Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE 
    public.profiles,
    public.programs,
    public.program_members,
    public.program_audits
TO authenticated;

GRANT ALL PRIVILEGES ON TABLE 
    public.profiles,
    public.programs,
    public.program_members,
    public.program_audits
TO service_role;

-- 3. Explicit Grants for Sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- 4. Preserve Internal State Protection
-- Ensure internal bootstrap security tables remain inaccessible to API roles
REVOKE ALL ON TABLE public.first_admin_bootstrap_state FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.first_admin_bootstrap_state TO service_role;

-- 5. Default Privileges for Future Tables and Sequences
-- Ensures newly created tables in public automatically receive required grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;
