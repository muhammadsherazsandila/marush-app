-- =============================================================================
-- Migration 012: Add Comprehensive Program Details and Audit Findings
-- =============================================================================

-- 1. Alter public.programs to include comprehensive farm, bird, vaccine, travel, return, and creation details
ALTER TABLE public.programs
    ADD COLUMN IF NOT EXISTS farm_address TEXT,
    ADD COLUMN IF NOT EXISTS farm_manager_name TEXT,
    ADD COLUMN IF NOT EXISTS bird_details JSONB DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS vaccines_used TEXT[] DEFAULT ARRAY[]::TEXT[],
    ADD COLUMN IF NOT EXISTS travel_departure_time TIME,
    ADD COLUMN IF NOT EXISTS travel_arrival_time TIME,
    ADD COLUMN IF NOT EXISTS return_departure_time TIME,
    ADD COLUMN IF NOT EXISTS return_arrival_time TIME,
    ADD COLUMN IF NOT EXISTS vaccination_started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS vaccination_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS controller_remarks TEXT;

-- 2. Alter public.program_audits to include comprehensive verification and assessment fields
ALTER TABLE public.program_audits
    ADD COLUMN IF NOT EXISTS bird_count_verified BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS vaccine_verified BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS timing_verified BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS vaccination_quality_assessment TEXT,
    ADD COLUMN IF NOT EXISTS uniform_compliance BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS vaccinator_behavior_assessment TEXT,
    ADD COLUMN IF NOT EXISTS overall_audit_result TEXT DEFAULT 'approved';

-- 3. Update create_program_with_members function with full support for new optional fields
CREATE OR REPLACE FUNCTION public.create_program_with_members(
    p_program_name TEXT,
    p_hatchery_or_farm_name TEXT,
    p_flock_size INTEGER,
    p_scheduled_start_date DATE,
    p_scheduled_start_time TIME,
    p_scheduled_end_date DATE,
    p_scheduled_end_time TIME,
    p_controller_id UUID,
    p_team_member_ids UUID[] DEFAULT ARRAY[]::UUID[],
    p_farm_address TEXT DEFAULT NULL,
    p_farm_manager_name TEXT DEFAULT NULL,
    p_bird_details JSONB DEFAULT NULL,
    p_vaccines_used TEXT[] DEFAULT ARRAY[]::TEXT[],
    p_travel_departure_time TIME DEFAULT NULL,
    p_travel_arrival_time TIME DEFAULT NULL,
    p_return_departure_time TIME DEFAULT NULL,
    p_return_arrival_time TIME DEFAULT NULL,
    p_vaccination_started_at TIMESTAMPTZ DEFAULT NULL,
    p_vaccination_completed_at TIMESTAMPTZ DEFAULT NULL,
    p_controller_remarks TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    created_program_id UUID;
BEGIN
    INSERT INTO public.programs (
        program_name, hatchery_or_farm_name, flock_size,
        scheduled_start_date, scheduled_start_time,
        scheduled_end_date, scheduled_end_time,
        controller_id, status,
        farm_address, farm_manager_name,
        bird_details, vaccines_used,
        travel_departure_time, travel_arrival_time,
        return_departure_time, return_arrival_time,
        vaccination_started_at, vaccination_completed_at,
        controller_remarks
    ) VALUES (
        p_program_name, p_hatchery_or_farm_name, p_flock_size,
        p_scheduled_start_date, p_scheduled_start_time,
        p_scheduled_end_date, p_scheduled_end_time,
        p_controller_id, 'pending_approval',
        p_farm_address, p_farm_manager_name,
        p_bird_details, COALESCE(p_vaccines_used, ARRAY[]::TEXT[]),
        p_travel_departure_time, p_travel_arrival_time,
        p_return_departure_time, p_return_arrival_time,
        p_vaccination_started_at, p_vaccination_completed_at,
        p_controller_remarks
    ) RETURNING id INTO created_program_id;

    INSERT INTO public.program_members (program_id, user_id, role_in_program)
    SELECT created_program_id, member_id, 'team_member'
    FROM (
        SELECT DISTINCT unnest(COALESCE(p_team_member_ids, ARRAY[]::UUID[])) AS member_id
    ) AS requested_members;

    RETURN created_program_id;
END;
$$;

-- 4. Update submit_program_audit function to record new audit fields
CREATE OR REPLACE FUNCTION public.submit_program_audit(
    p_program_id UUID,
    p_auditor_id UUID,
    p_remarks TEXT,
    p_score INTEGER,
    p_checklist JSONB,
    p_bird_count_verified BOOLEAN DEFAULT TRUE,
    p_vaccine_verified BOOLEAN DEFAULT TRUE,
    p_timing_verified BOOLEAN DEFAULT TRUE,
    p_vaccination_quality_assessment TEXT DEFAULT NULL,
    p_uniform_compliance BOOLEAN DEFAULT TRUE,
    p_vaccinator_behavior_assessment TEXT DEFAULT NULL,
    p_overall_audit_result TEXT DEFAULT 'approved'
)
RETURNS SETOF public.program_audits
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
    saved_audit public.program_audits%ROWTYPE;
    signed_at TIMESTAMPTZ := now();
BEGIN
    UPDATE public.programs
    SET status = 'completed'::public.program_status,
        auditor_remarks = p_remarks,
        audit_score = p_score,
        audited_at = signed_at
    WHERE id = p_program_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Program is unavailable for audit' USING ERRCODE = '42501';
    END IF;

    INSERT INTO public.program_audits (
        program_id, auditor_id, remarks, score, checklist, signed_off_at,
        bird_count_verified, vaccine_verified, timing_verified,
        vaccination_quality_assessment, uniform_compliance,
        vaccinator_behavior_assessment, overall_audit_result
    ) VALUES (
        p_program_id, p_auditor_id, p_remarks, p_score, COALESCE(p_checklist, '[]'::jsonb), signed_at,
        p_bird_count_verified, p_vaccine_verified, p_timing_verified,
        p_vaccination_quality_assessment, p_uniform_compliance,
        p_vaccinator_behavior_assessment, p_overall_audit_result
    )
    ON CONFLICT (program_id) DO UPDATE
    SET auditor_id = EXCLUDED.auditor_id,
        remarks = EXCLUDED.remarks,
        score = EXCLUDED.score,
        checklist = EXCLUDED.checklist,
        signed_off_at = EXCLUDED.signed_off_at,
        bird_count_verified = EXCLUDED.bird_count_verified,
        vaccine_verified = EXCLUDED.vaccine_verified,
        timing_verified = EXCLUDED.timing_verified,
        vaccination_quality_assessment = EXCLUDED.vaccination_quality_assessment,
        uniform_compliance = EXCLUDED.uniform_compliance,
        vaccinator_behavior_assessment = EXCLUDED.vaccinator_behavior_assessment,
        overall_audit_result = EXCLUDED.overall_audit_result,
        updated_at = now()
    RETURNING * INTO saved_audit;

    RETURN NEXT saved_audit;
END;
$$;
