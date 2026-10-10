-- =============================================================================
-- Migration 003: Fix RLS Mutual Recursion between programs and program_members
-- =============================================================================

-- Security definer helpers to break RLS query cycle
CREATE OR REPLACE FUNCTION public.is_user_in_program(p_program_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.program_members
        WHERE program_id = p_program_id AND user_id = p_user_id
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_user_controller_or_auditor(p_program_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.programs
        WHERE id = p_program_id AND (controller_id = p_user_id OR auditor_id = p_user_id)
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Recreate programs_select policy
DROP POLICY IF EXISTS "programs_select" ON public.programs;
CREATE POLICY "programs_select" ON public.programs
    FOR SELECT TO authenticated
    USING (
        public.is_admin()
        OR controller_id = public.current_profile_id()
        OR auditor_id = public.current_profile_id()
        OR public.is_user_in_program(id, public.current_profile_id())
    );

-- Recreate program_members policies
DROP POLICY IF EXISTS "pm_select" ON public.program_members;
CREATE POLICY "pm_select" ON public.program_members
    FOR SELECT TO authenticated
    USING (
        public.is_admin()
        OR user_id = public.current_profile_id()
        OR public.is_user_controller_or_auditor(program_id, public.current_profile_id())
    );

DROP POLICY IF EXISTS "pm_insert" ON public.program_members;
CREATE POLICY "pm_insert" ON public.program_members
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
        OR public.is_user_controller_or_auditor(program_id, public.current_profile_id())
    );

DROP POLICY IF EXISTS "pm_delete" ON public.program_members;
CREATE POLICY "pm_delete" ON public.program_members
    FOR DELETE TO authenticated
    USING (
        public.is_admin()
        OR public.is_user_controller_or_auditor(program_id, public.current_profile_id())
    );

-- Recreate program_audits policies
DROP POLICY IF EXISTS "pa_select" ON public.program_audits;
CREATE POLICY "pa_select" ON public.program_audits
    FOR SELECT TO authenticated
    USING (
        public.is_admin()
        OR auditor_id = public.current_profile_id()
        OR public.is_user_controller_or_auditor(program_id, public.current_profile_id())
    );
