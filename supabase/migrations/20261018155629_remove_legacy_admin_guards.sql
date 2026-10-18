-- These trigger functions were replaced by protect_profile_privileges() and
-- no longer back any trigger. Remove their stale public RPC entry points.
DROP FUNCTION IF EXISTS public.prevent_admin_profile_deletion();
DROP FUNCTION IF EXISTS public.prevent_admin_role_change();
