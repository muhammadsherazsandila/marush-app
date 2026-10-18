-- =============================================================================
-- Migration 20261018162152: enforce_admin_program_review_requirements
-- Created At: 2026-10-18T16:47:49.784Z
-- =============================================================================

-- Write your PostgreSQL DDL/DML statements below:

-- A persisted superadmin cannot authorize deletion of their own account,
-- even through a direct call to the trusted account deletion endpoint.
CREATE OR REPLACE FUNCTION public.authorize_profile_deletion(p_profile_id UUID)
RETURNS TABLE (profile_id UUID, auth_user_id UUID)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_target public.profiles%ROWTYPE;
BEGIN
    IF (SELECT auth.uid()) IS NULL OR NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only administrators can request account deletion.'
            USING ERRCODE = '42501';
    END IF;

    SELECT profile.*
    INTO v_target
    FROM public.profiles AS profile
    WHERE profile.id = p_profile_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'The account no longer exists.'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_target.is_super_admin IS TRUE
       AND v_target.auth_user_id = (SELECT auth.uid()) THEN
        RAISE EXCEPTION 'The superadmin account cannot delete itself.'
            USING ERRCODE = '42501';
    END IF;

    IF (v_target.role = 'admin'::public.user_role OR v_target.is_super_admin)
       AND NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Only the superadmin can delete an administrator account.'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY SELECT v_target.id, v_target.auth_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.authorize_profile_deletion(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.authorize_profile_deletion(UUID) TO authenticated;

-- Programs cannot enter the approved/completed state unless an approved
-- program auditor has been assigned first.
CREATE OR REPLACE FUNCTION public.require_assigned_auditor_for_program_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.status IN (
           'active'::public.program_status,
           'completed'::public.program_status
       )
       AND OLD.status IS DISTINCT FROM NEW.status THEN
        IF NEW.auditor_id IS NULL THEN
            RAISE EXCEPTION 'Assign a program auditor before approving or completing this program.'
                USING ERRCODE = '23514';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM public.profiles AS auditor
            WHERE auditor.id = NEW.auditor_id
              AND auditor.role = 'program_auditor'::public.user_role
              AND auditor.status = 'approved'::public.user_status
        ) THEN
            RAISE EXCEPTION 'The assigned auditor must be an approved program auditor.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_require_assigned_auditor_for_program_approval
    ON public.programs;
CREATE TRIGGER trg_require_assigned_auditor_for_program_approval
    BEFORE UPDATE OF status, auditor_id ON public.programs
    FOR EACH ROW
    EXECUTE FUNCTION public.require_assigned_auditor_for_program_approval();
