-- =============================================================================
-- Migration 006: requested designation workflow
-- Created At: 2026-10-11T09:34:40.897Z
-- =============================================================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS requested_role public.user_role;

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

