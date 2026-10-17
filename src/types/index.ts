// ============================================
// Marush App — Supabase-Aligned Type System
// ============================================

// Enum types matching Supabase custom types
export type UserRole = 'admin' | 'program_controller' | 'employee' | 'program_auditor';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type ProgramStatus = 'draft' | 'pending_approval' | 'active' | 'pending_audit' | 'completed' | 'cancelled';

// ---- Profile ----
export interface UserProfile {
  id: string;
  authUserId?: string;
  email: string;
  fullName: string;
  role: UserRole;
  requestedRole?: UserRole;
  status: UserStatus;
  phone?: string;
  employeeCode?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

// ---- Program Completion Metrics (stored as JSONB) ----
export interface ProgramCompletionMetrics {
  birdsVaccinated: number;
  dosagePerBird: string;
  batchNumber: string;
  vaccineType: string;
  coldChainTempCelsius: number;
  equipmentCheckPassed: boolean;
  farmFlockObservations: string;
}

// ---- Bird Category Breakdown ----
export interface BirdCategoryCounts {
  b?: number; // Breeder
  l?: number; // Layer
  br?: number; // Broiler
  total?: number;
}

// ---- Program ----
export interface Program {
  id: string;
  programName: string;
  hatcheryOrFarmName: string;
  farmAddress?: string;
  farmManagerName?: string;
  flockSize: number;
  birdDetails?: BirdCategoryCounts;
  vaccinesUsed?: string[];
  scheduledStartDate: string;
  scheduledStartTime: string;
  scheduledEndDate: string;
  scheduledEndTime: string;
  travelDepartureTime?: string;
  travelArrivalTime?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  vaccinationStartedAt?: string;
  vaccinationCompletedAt?: string;
  controllerRemarks?: string;
  status: ProgramStatus;
  controllerId: string;
  controllerName?: string; // derived from join
  auditorId?: string;
  auditorName?: string; // derived from join
  teamMemberIds: string[]; // derived from program_members join
  teamMembers?: UserProfile[]; // populated on demand
  completionMetrics?: ProgramCompletionMetrics;
  completedAt?: string;
  auditorRemarks?: string;
  auditScore?: number;
  auditedAt?: string;
  auditDetails?: ProgramAudit;
  createdAt: string;
  updatedAt?: string;
}

export interface ProgramDraft {
  programName: string;
  hatcheryOrFarm: string;
  farmAddress: string;
  farmManagerName: string;
  birdBreeder: string;
  birdLayer: string;
  birdBroiler: string;
  flockSize: string;
  vaccinesUsed: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  travelDepartureTime: string;
  travelArrivalTime: string;
  vaccinationStartedAtTime: string;
  vaccinationCompletedAtTime: string;
  returnDepartureTime: string;
  returnArrivalTime: string;
  controllerRemarks: string;
  selectedEmpIds: string[];
  savedAt: string;
}

// ---- Program Member (join table) ----
export type ProgramMemberRole = 'team_member' | 'program_controller';

export interface ProgramMember {
  id: string;
  programId: string;
  userId: string;
  roleInProgram: ProgramMemberRole;
  joinedAt: string;
  user?: UserProfile;
}

// ---- Audit Checklist Item ----
export interface AuditChecklistItem {
  item: string;
  passed: boolean;
}

// ---- Program Audit ----
export interface ProgramAudit {
  id: string;
  programId: string;
  auditorId: string;
  birdCountVerified?: boolean;
  vaccineVerified?: boolean;
  timingVerified?: boolean;
  vaccinationQualityAssessment?: string;
  uniformCompliance?: boolean;
  vaccinatorBehaviorAssessment?: string;
  overallAuditResult?: string;
  checklist: AuditChecklistItem[];
  score?: number;
  remarks?: string;
  signedOffAt?: string;
  createdAt: string;
  updatedAt?: string;
  auditor?: UserProfile;
  program?: Program;
}

// ---- Program Member History (for Employee Dashboard) ----
export interface ProgramMemberHistory {
  programId: string;
  programName: string;
  hatcheryOrFarmName: string;
  startDate: string;
  endDate: string;
  roleInProgram: ProgramMemberRole;
  status: ProgramStatus;
  auditorRemarks?: string;
  auditScore?: number;
}

// ---- Supabase Database Schema Type (for supabase-js typed client) ----
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          full_name: string;
          role: UserRole;
          requested_role: UserRole | null;
          status: UserStatus;
          phone: string | null;
          employee_code: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email: string;
          full_name: string;
          role?: UserRole;
          requested_role?: UserRole | null;
          status?: UserStatus;
          phone?: string | null;
          employee_code?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string | null;
          email?: string;
          full_name?: string;
          role?: UserRole;
          requested_role?: UserRole | null;
          status?: UserStatus;
          phone?: string | null;
          employee_code?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      programs: {
        Row: {
          id: string;
          program_name: string;
          hatchery_or_farm_name: string;
          farm_address: string | null;
          farm_manager_name: string | null;
          flock_size: number;
          bird_details: BirdCategoryCounts | null;
          vaccines_used: string[] | null;
          scheduled_start_date: string;
          scheduled_start_time: string;
          scheduled_end_date: string;
          scheduled_end_time: string;
          travel_departure_time: string | null;
          travel_arrival_time: string | null;
          return_departure_time: string | null;
          return_arrival_time: string | null;
          vaccination_started_at: string | null;
          vaccination_completed_at: string | null;
          controller_remarks: string | null;
          status: ProgramStatus;
          controller_id: string;
          auditor_id: string | null;
          completion_metrics: ProgramCompletionMetrics | null;
          completed_at: string | null;
          auditor_remarks: string | null;
          audit_score: number | null;
          audited_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program_name: string;
          hatchery_or_farm_name: string;
          farm_address?: string | null;
          farm_manager_name?: string | null;
          flock_size: number;
          bird_details?: BirdCategoryCounts | null;
          vaccines_used?: string[] | null;
          scheduled_start_date: string;
          scheduled_start_time: string;
          scheduled_end_date: string;
          scheduled_end_time: string;
          travel_departure_time?: string | null;
          travel_arrival_time?: string | null;
          return_departure_time?: string | null;
          return_arrival_time?: string | null;
          vaccination_started_at?: string | null;
          vaccination_completed_at?: string | null;
          controller_remarks?: string | null;
          status?: ProgramStatus;
          controller_id: string;
          auditor_id?: string | null;
          completion_metrics?: ProgramCompletionMetrics | null;
          completed_at?: string | null;
          auditor_remarks?: string | null;
          audit_score?: number | null;
          audited_at?: string | null;
        };
        Update: {
          program_name?: string;
          hatchery_or_farm_name?: string;
          farm_address?: string | null;
          farm_manager_name?: string | null;
          flock_size?: number;
          bird_details?: BirdCategoryCounts | null;
          vaccines_used?: string[] | null;
          scheduled_start_date?: string;
          scheduled_start_time?: string;
          scheduled_end_date?: string;
          scheduled_end_time?: string;
          travel_departure_time?: string | null;
          travel_arrival_time?: string | null;
          return_departure_time?: string | null;
          return_arrival_time?: string | null;
          vaccination_started_at?: string | null;
          vaccination_completed_at?: string | null;
          controller_remarks?: string | null;
          status?: ProgramStatus;
          controller_id?: string;
          auditor_id?: string | null;
          completion_metrics?: ProgramCompletionMetrics | null;
          completed_at?: string | null;
          auditor_remarks?: string | null;
          audit_score?: number | null;
          audited_at?: string | null;
          updated_at?: string;
        };
      };
      program_members: {
        Row: {
          id: string;
          program_id: string;
          user_id: string;
          role_in_program: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          user_id: string;
          role_in_program?: string;
          joined_at?: string;
        };
        Update: {
          program_id?: string;
          user_id?: string;
          role_in_program?: string;
        };
      };
      program_audits: {
        Row: {
          id: string;
          program_id: string;
          auditor_id: string;
          bird_count_verified: boolean | null;
          vaccine_verified: boolean | null;
          timing_verified: boolean | null;
          vaccination_quality_assessment: string | null;
          uniform_compliance: boolean | null;
          vaccinator_behavior_assessment: string | null;
          overall_audit_result: string | null;
          checklist: AuditChecklistItem[];
          score: number | null;
          remarks: string | null;
          signed_off_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          auditor_id: string;
          bird_count_verified?: boolean | null;
          vaccine_verified?: boolean | null;
          timing_verified?: boolean | null;
          vaccination_quality_assessment?: string | null;
          uniform_compliance?: boolean | null;
          vaccinator_behavior_assessment?: string | null;
          overall_audit_result?: string | null;
          checklist?: AuditChecklistItem[];
          score?: number | null;
          remarks?: string | null;
          signed_off_at?: string | null;
        };
        Update: {
          bird_count_verified?: boolean | null;
          vaccine_verified?: boolean | null;
          timing_verified?: boolean | null;
          vaccination_quality_assessment?: string | null;
          uniform_compliance?: boolean | null;
          vaccinator_behavior_assessment?: string | null;
          overall_audit_result?: string | null;
          checklist?: AuditChecklistItem[];
          score?: number | null;
          remarks?: string | null;
          signed_off_at?: string | null;
          updated_at?: string;
        };
      };
    };
    Enums: {
      user_role: UserRole;
      user_status: UserStatus;
      program_status: ProgramStatus;
    };
  };
}
