export type UserRole = 'admin' | 'program_controller' | 'employee' | 'program_auditor';

export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  employeeCode?: string;
  createdAt: string;
}

export type ProgramStatus =
  | 'draft'
  | 'pending_approval'
  | 'active'
  | 'pending_audit'
  | 'completed'
  | 'cancelled';

export interface ProgramCompletionMetrics {
  birdsVaccinated: number;
  dosagePerBird: string;
  batchNumber: string;
  vaccineType: string;
  coldChainTempCelsius: number;
  equipmentCheckPassed: boolean;
  farmFlockObservations: string;
}

export interface Program {
  id: string;
  programName: string;
  hatcheryOrFarmName: string;
  flockSize: number;
  scheduledStartDate: string;
  scheduledStartTime: string;
  scheduledEndDate: string;
  scheduledEndTime: string;
  status: ProgramStatus;
  controllerId: string;
  controllerName: string;
  teamMemberIds: string[];
  teamMembers?: UserProfile[];
  auditorId?: string;
  auditorName?: string;
  completionMetrics?: ProgramCompletionMetrics;
  completedAt?: string;
  auditorRemarks?: string;
  auditScore?: number;
  auditedAt?: string;
  createdAt: string;
}

export interface ProgramMemberHistory {
  programId: string;
  programName: string;
  hatcheryOrFarmName: string;
  startDate: string;
  endDate: string;
  roleInProgram: 'program_controller' | 'team_member';
  status: ProgramStatus;
  auditorRemarks?: string;
}
