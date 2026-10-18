-- Route controller completion submissions to an admin review queue and keep
-- program auditors read-only at the database boundary.
ALTER TYPE public.program_status
    ADD VALUE IF NOT EXISTS 'pending_admin_review';

DROP POLICY IF EXISTS "programs_update" ON public.programs;
CREATE POLICY "programs_update" ON public.programs
    FOR UPDATE TO authenticated
    USING (
        public.is_admin()
        OR (
            public.current_profile_role() = 'program_controller'
            AND controller_id = public.current_profile_id()
        )
    )
    WITH CHECK (
        public.is_admin()
        OR (
            public.current_profile_role() = 'program_controller'
            AND controller_id = public.current_profile_id()
        )
    );

DROP POLICY IF EXISTS "pm_insert" ON public.program_members;
CREATE POLICY "pm_insert" ON public.program_members
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
        OR (
            public.current_profile_role() = 'program_controller'
            AND EXISTS (
                SELECT 1
                FROM public.programs AS program
                WHERE program.id = program_id
                  AND program.controller_id = public.current_profile_id()
            )
        )
    );

DROP POLICY IF EXISTS "pm_delete" ON public.program_members;
CREATE POLICY "pm_delete" ON public.program_members
    FOR DELETE TO authenticated
    USING (
        public.is_admin()
        OR (
            public.current_profile_role() = 'program_controller'
            AND EXISTS (
                SELECT 1
                FROM public.programs AS program
                WHERE program.id = program_id
                  AND program.controller_id = public.current_profile_id()
            )
        )
    );

DROP POLICY IF EXISTS "pa_insert" ON public.program_audits;
CREATE POLICY "pa_insert" ON public.program_audits
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "pa_update" ON public.program_audits;
CREATE POLICY "pa_update" ON public.program_audits
    FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

REVOKE EXECUTE ON FUNCTION public.submit_program_audit(UUID, UUID, TEXT, INTEGER, JSONB)
    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.submit_program_audit(
    UUID, UUID, TEXT, INTEGER, JSONB, BOOLEAN, BOOLEAN, BOOLEAN,
    TEXT, BOOLEAN, TEXT, TEXT
) FROM PUBLIC, anon, authenticated;
