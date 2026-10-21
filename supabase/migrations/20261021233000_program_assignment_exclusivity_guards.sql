-- ============================================================================
-- Migration: Controller single-active-program & Auditor single-assignment guards
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_program_assignment_exclusivity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO ''
AS $$
DECLARE
    v_conflicting_prog RECORD;
BEGIN
    -- 1. Controller exclusivity: A controller cannot have more than one incomplete program.
    -- Incomplete programs are those with status NOT IN ('completed', 'cancelled').
    IF NEW.status NOT IN ('completed'::public.program_status, 'cancelled'::public.program_status) THEN
        SELECT id, program_name, status
        INTO v_conflicting_prog
        FROM public.programs
        WHERE controller_id = NEW.controller_id
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND status NOT IN ('completed'::public.program_status, 'cancelled'::public.program_status)
        LIMIT 1;

        IF FOUND THEN
            RAISE EXCEPTION 'A controller cannot initiate or hold a new program while having an incomplete program ("%", status: %). Complete the current program first.'
                , v_conflicting_prog.program_name, v_conflicting_prog.status
                USING ERRCODE = '23514';
        END IF;
    END IF;

    -- 2. Auditor exclusivity: An auditor cannot be assigned to more than one incomplete program at the same time.
    IF NEW.auditor_id IS NOT NULL 
       AND NEW.status NOT IN ('completed'::public.program_status, 'cancelled'::public.program_status) THEN
        SELECT id, program_name, status
        INTO v_conflicting_prog
        FROM public.programs
        WHERE auditor_id = NEW.auditor_id
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND status NOT IN ('completed'::public.program_status, 'cancelled'::public.program_status)
        LIMIT 1;

        IF FOUND THEN
            RAISE EXCEPTION 'This auditor is already assigned to another ongoing program ("%", status: %). An auditor cannot be part of multiple programs at the same time.'
                , v_conflicting_prog.program_name, v_conflicting_prog.status
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_program_assignment_exclusivity ON public.programs;

CREATE TRIGGER trg_enforce_program_assignment_exclusivity
BEFORE INSERT OR UPDATE OF controller_id, auditor_id, status ON public.programs
FOR EACH ROW EXECUTE FUNCTION public.enforce_program_assignment_exclusivity();
