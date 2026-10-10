import { supabase, isSupabaseConfigured } from './supabase';
import type {
  UserProfile,
  UserRole,
  UserStatus,
  Program,
  ProgramStatus,
  ProgramCompletionMetrics,
  ProgramMember,
  ProgramMemberRole,
  ProgramAudit,
  AuditChecklistItem,
  ProgramMemberHistory,
  Database,
} from '../types';

// ==========================================
// SEEDED DEMO DATA STORE (In-Memory Fallback)
// ==========================================

const INITIAL_USERS: UserProfile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@marush.com.pk',
    fullName: 'Muhammad Sheraz (Administrator)',
    role: 'admin',
    status: 'approved',
    phone: '+92 42 111 627 874',
    employeeCode: 'MRSH-ADM-001',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'controller@marush.com.pk',
    fullName: 'Dr. Tariq Mahmood (Field Controller)',
    role: 'program_controller',
    status: 'approved',
    phone: '+92 300 4567890',
    employeeCode: 'MRSH-CTL-012',
    createdAt: '2026-02-01T09:30:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'auditor@marush.com.pk',
    fullName: 'Dr. Ayesha Malik (Quality Auditor)',
    role: 'program_auditor',
    status: 'approved',
    phone: '+92 321 9876543',
    employeeCode: 'MRSH-AUD-004',
    createdAt: '2026-02-10T11:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'ali.hassan@marush.com.pk',
    fullName: 'Ali Hassan',
    role: 'employee',
    status: 'approved',
    phone: '+92 312 3456781',
    employeeCode: 'MRSH-EMP-101',
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    email: 'usman.zafar@marush.com.pk',
    fullName: 'Usman Zafar',
    role: 'employee',
    status: 'approved',
    phone: '+92 312 3456782',
    employeeCode: 'MRSH-EMP-102',
    createdAt: '2026-03-02T10:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    email: 'bilal.ahmed@marush.com.pk',
    fullName: 'Bilal Ahmed',
    role: 'employee',
    status: 'approved',
    phone: '+92 312 3456783',
    employeeCode: 'MRSH-EMP-103',
    createdAt: '2026-03-03T10:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    email: 'hamza.khan@marush.com.pk',
    fullName: 'Hamza Khan (Pending Approval)',
    role: 'employee',
    status: 'pending',
    phone: '+92 312 3456784',
    employeeCode: 'MRSH-EMP-104',
    createdAt: '2026-10-10T09:15:00Z',
  },
];

const INITIAL_PROGRAMS: Program[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    programName: 'Hatchery Ceva ND In-Ovo Vaccination',
    hatcheryOrFarmName: 'Big Bird Hatcheries - Unit 4, Raiwind',
    flockSize: 50000,
    scheduledStartDate: '2026-09-18',
    scheduledStartTime: '08:00 AM',
    scheduledEndDate: '2026-09-18',
    scheduledEndTime: '04:00 PM',
    status: 'completed',
    controllerId: '00000000-0000-0000-0000-000000000002',
    controllerName: 'Dr. Tariq Mahmood (Field Controller)',
    teamMemberIds: ['00000000-0000-0000-0000-000000000004'],
    auditorId: '00000000-0000-0000-0000-000000000003',
    auditorName: 'Dr. Ayesha Malik (Quality Auditor)',
    completionMetrics: {
      birdsVaccinated: 49820,
      dosagePerBird: '0.05 ml via automated Ceva Egginject',
      batchNumber: 'VND-2026-PK98',
      vaccineType: 'Vectormune ND + Cevac Transmune',
      coldChainTempCelsius: 3.8,
      equipmentCheckPassed: true,
      farmFlockObservations: 'Optimal egg viability. Strict aseptic standards maintained throughout.',
    },
    completedAt: '2026-09-18T16:30:00Z',
    auditorRemarks: 'Excellent execution. Cold chain log verified at 3.8°C. Equipment sanitized per Ceva SOP.',
    auditScore: 98,
    auditedAt: '2026-09-19T09:00:00Z',
    createdAt: '2026-09-15T10:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    programName: 'Broiler Flock Day-One Spray Vaccination',
    hatcheryOrFarmName: 'Jadeed Farms - Flock Sector B, Okara',
    flockSize: 35000,
    scheduledStartDate: '2026-10-08',
    scheduledStartTime: '07:30 AM',
    scheduledEndDate: '2026-10-08',
    scheduledEndTime: '01:00 PM',
    status: 'completed',
    controllerId: '00000000-0000-0000-0000-000000000002',
    controllerName: 'Dr. Tariq Mahmood (Field Controller)',
    teamMemberIds: ['00000000-0000-0000-0000-000000000005'],
    auditorId: '00000000-0000-0000-0000-000000000003',
    auditorName: 'Dr. Ayesha Malik (Quality Auditor)',
    completionMetrics: {
      birdsVaccinated: 34950,
      dosagePerBird: 'Coarse spray 20ml per crate',
      batchNumber: 'CIB-5441-A',
      vaccineType: 'Cevac IBird',
      coldChainTempCelsius: 4.1,
      equipmentCheckPassed: true,
      farmFlockObservations: 'Flock lively. Droplet size calibrated at 150 microns.',
    },
    completedAt: '2026-10-08T13:45:00Z',
    auditorRemarks: 'Spray uniformity compliant. Vaccine titration confirmed post-application.',
    auditScore: 95,
    auditedAt: '2026-10-09T10:30:00Z',
    createdAt: '2026-10-05T11:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    programName: 'Layer Flock Marek & Gumboro Immunization',
    hatcheryOrFarmName: 'SB Feeds & Poultry - Kasur Hatchery',
    flockSize: 28000,
    scheduledStartDate: '2026-10-10',
    scheduledStartTime: '09:00 AM',
    scheduledEndDate: '2026-10-10',
    scheduledEndTime: '05:00 PM',
    status: 'active',
    controllerId: '00000000-0000-0000-0000-000000000002',
    controllerName: 'Dr. Tariq Mahmood (Field Controller)',
    teamMemberIds: ['00000000-0000-0000-0000-000000000004'],
    auditorId: '00000000-0000-0000-0000-000000000003',
    auditorName: 'Dr. Ayesha Malik (Quality Auditor)',
    createdAt: '2026-10-09T14:00:00Z',
  },
];

let usersDb: UserProfile[] = [...INITIAL_USERS];
let programsDb: Program[] = [...INITIAL_PROGRAMS];
let currentSessionUser: UserProfile | null = INITIAL_USERS[0];

// ==========================================
// MOCK STORE (Direct synchronous helper)
// ==========================================
export const mockStore = {
  getUsers: (): UserProfile[] => [...usersDb],

  getUserById: (id: string): UserProfile | undefined => usersDb.find(u => u.id === id),

  addUser: (user: Omit<UserProfile, 'id' | 'createdAt'>): UserProfile => {
    const newUser: UserProfile = {
      ...user,
      id: '00000000-0000-0000-0000-' + Math.random().toString(16).substring(2, 14).padEnd(12, '0'),
      createdAt: new Date().toISOString(),
    };
    usersDb.push(newUser);
    return newUser;
  },

  updateUserStatus: (id: string, status: UserProfile['status']): UserProfile | null => {
    const idx = usersDb.findIndex(u => u.id === id);
    if (idx === -1) return null;
    usersDb[idx] = { ...usersDb[idx], status };
    return usersDb[idx];
  },

  updateUserRole: (id: string, role: UserRole): UserProfile | null => {
    const idx = usersDb.findIndex(u => u.id === id);
    if (idx === -1) return null;
    usersDb[idx] = { ...usersDb[idx], role };
    return usersDb[idx];
  },

  deleteUser: (id: string): boolean => {
    const lenBefore = usersDb.length;
    usersDb = usersDb.filter(u => u.id !== id);
    return usersDb.length < lenBefore;
  },

  getActiveEmployeeIds: (): string[] => {
    const activePrograms = programsDb.filter(p => p.status === 'active' || p.status === 'pending_audit');
    const occupiedIds = new Set<string>();
    activePrograms.forEach(p => {
      p.teamMemberIds.forEach(id => occupiedIds.add(id));
      occupiedIds.add(p.controllerId);
    });
    return Array.from(occupiedIds);
  },

  getAvailableEmployees: (): UserProfile[] => {
    const occupied = new Set(mockStore.getActiveEmployeeIds());
    return usersDb.filter(
      u => (u.role === 'employee' || u.role === 'program_controller') &&
           u.status === 'approved' &&
           !occupied.has(u.id)
    );
  },

  getPrograms: (): Program[] => [...programsDb],

  getProgramById: (id: string): Program | undefined => programsDb.find(p => p.id === id),

  createProgram: (programData: Omit<Program, 'id' | 'createdAt' | 'status'>): Program => {
    const newProg: Program = {
      ...programData,
      id: '10000000-0000-0000-0000-' + Math.random().toString(16).substring(2, 14).padEnd(12, '0'),
      status: 'pending_approval',
      createdAt: new Date().toISOString(),
    };
    programsDb.unshift(newProg);
    return newProg;
  },

  approveProgramAndStart: (programId: string, auditorId: string): Program | null => {
    const idx = programsDb.findIndex(p => p.id === programId);
    if (idx === -1) return null;
    const auditor = usersDb.find(u => u.id === auditorId);
    programsDb[idx] = {
      ...programsDb[idx],
      status: 'active',
      auditorId,
      auditorName: auditor?.fullName || 'Assigned Auditor',
    };
    return programsDb[idx];
  },

  submitProgramCompletion: (programId: string, metrics: Program['completionMetrics']): Program | null => {
    const idx = programsDb.findIndex(p => p.id === programId);
    if (idx === -1) return null;
    programsDb[idx] = {
      ...programsDb[idx],
      status: 'pending_audit',
      completionMetrics: metrics,
      completedAt: new Date().toISOString(),
    };
    return programsDb[idx];
  },

  submitAuditorRemarks: (programId: string, remarks: string, score: number = 95): Program | null => {
    const idx = programsDb.findIndex(p => p.id === programId);
    if (idx === -1) return null;
    programsDb[idx] = {
      ...programsDb[idx],
      status: 'completed',
      auditorRemarks: remarks,
      auditScore: score,
      auditedAt: new Date().toISOString(),
    };
    return programsDb[idx];
  },

  getCurrentUser: (): UserProfile | null => currentSessionUser,

  setCurrentUser: (user: UserProfile | null) => {
    currentSessionUser = user;
  },
};

// ==========================================
// ROW MAPPERS (Supabase snake_case -> App camelCase)
// ==========================================

function mapProfileRow(row: Database['public']['Tables']['profiles']['Row']): UserProfile {
  return {
    id: row.id,
    authUserId: row.auth_user_id || undefined,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    phone: row.phone || undefined,
    employeeCode: row.employee_code || undefined,
    avatarUrl: row.avatar_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProgramRow(row: any): Program {
  return {
    id: row.id,
    programName: row.program_name,
    hatcheryOrFarmName: row.hatchery_or_farm_name,
    flockSize: row.flock_size,
    scheduledStartDate: row.scheduled_start_date,
    scheduledStartTime: row.scheduled_start_time,
    scheduledEndDate: row.scheduled_end_date,
    scheduledEndTime: row.scheduled_end_time,
    status: row.status,
    controllerId: row.controller_id,
    controllerName: row.controller?.full_name,
    auditorId: row.auditor_id || undefined,
    auditorName: row.auditor?.full_name,
    teamMemberIds: (row.program_members || []).map((m: any) => m.user_id),
    teamMembers: (row.program_members || [])
      .map((m: any) => m.user ? mapProfileRow(m.user) : undefined)
      .filter(Boolean),
    completionMetrics: row.completion_metrics || undefined,
    completedAt: row.completed_at || undefined,
    auditorRemarks: row.auditor_remarks || undefined,
    auditScore: row.audit_score || undefined,
    auditedAt: row.audited_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ==========================================
// UNIFIED DATA PROVIDER (Async Architecture)
// ==========================================

export const dataProvider = {
  // --- Auth ---
  signInWithEmail: async (
    email: string,
    password: string
  ): Promise<{ user: UserProfile | null; error: string | null }> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        return { user: null, error: error?.message || 'Authentication failed' };
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single();
      if (!profile) return { user: null, error: 'User profile not found' };
      const user = mapProfileRow(profile);
      mockStore.setCurrentUser(user);
      return { user, error: null };
    }

    const user = mockStore.getUsers().find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (user) {
      mockStore.setCurrentUser(user);
      return { user, error: null };
    }
    return { user: null, error: 'Invalid email or password' };
  },

  signUpWithEmail: async (
    email: string,
    password: string,
    profileData: { fullName: string; role: UserRole; phone?: string; employeeCode?: string }
  ): Promise<{ user: UserProfile | null; error: string | null }> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: profileData.fullName,
            role: profileData.role,
          },
        },
      });
      if (error || !data.user) {
        return { user: null, error: error?.message || 'Registration failed' };
      }

      const { data: newProfile, error: profileErr } = await supabase
        .from('profiles')
        .insert({
          auth_user_id: data.user.id,
          email,
          full_name: profileData.fullName,
          role: profileData.role,
          status: 'pending',
          phone: profileData.phone || null,
          employee_code: profileData.employeeCode || null,
        })
        .select()
        .single();

      if (profileErr || !newProfile) {
        return { user: null, error: profileErr?.message || 'Failed to create profile' };
      }

      const user = mapProfileRow(newProfile);
      mockStore.setCurrentUser(user);
      return { user, error: null };
    }

    const existing = mockStore.getUsers().find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      return { user: null, error: 'An account with this email already exists' };
    }
    const newUser = mockStore.addUser({
      email: email.trim(),
      fullName: profileData.fullName.trim(),
      role: profileData.role,
      status: 'pending',
      phone: profileData.phone?.trim(),
      employeeCode: profileData.employeeCode?.trim(),
    });
    mockStore.setCurrentUser(newUser);
    return { user: newUser, error: null };
  },

  signInWithGoogle: async (): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'marushapp://auth/callback' },
      });
      return { error: error?.message || null };
    }
    // Mock Google sign-in defaults to admin
    const admin = mockStore.getUsers()[0];
    mockStore.setCurrentUser(admin);
    return { error: null };
  },

  signOut: async (): Promise<void> => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    mockStore.setCurrentUser(null);
  },

  getCurrentUser: (): UserProfile | null => mockStore.getCurrentUser(),

  setCurrentUser: (user: UserProfile | null) => mockStore.setCurrentUser(user),

  // --- Users / Profiles ---
  getUsers: async (): Promise<UserProfile[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
      if (error || !data) return mockStore.getUsers();
      return data.map(mapProfileRow);
    }
    return mockStore.getUsers();
  },

  getUserById: async (id: string): Promise<UserProfile | null> => {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      return data ? mapProfileRow(data) : null;
    }
    return mockStore.getUserById(id) || null;
  },

  getUsersByRole: async (role: UserRole): Promise<UserProfile[]> => {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('profiles').select('*').eq('role', role);
      return (data || []).map(mapProfileRow);
    }
    return mockStore.getUsers().filter(u => u.role === role);
  },

  addUser: async (user: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          email: user.email,
          full_name: user.fullName,
          role: user.role,
          status: user.status,
          phone: user.phone || null,
          employee_code: user.employeeCode || null,
          avatar_url: user.avatarUrl || null,
        })
        .select()
        .single();
      if (data) return mapProfileRow(data);
    }
    return mockStore.addUser(user);
  },

  updateUserStatus: async (id: string, status: UserStatus): Promise<UserProfile | null> => {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('profiles').update({ status }).eq('id', id).select().single();
      if (data) return mapProfileRow(data);
    }
    return mockStore.updateUserStatus(id, status);
  },

  updateUserRole: async (id: string, role: UserRole): Promise<UserProfile | null> => {
    if (isSupabaseConfigured) {
      const { data } = await supabase.from('profiles').update({ role }).eq('id', id).select().single();
      if (data) return mapProfileRow(data);
    }
    return mockStore.updateUserRole(id, role);
  },

  deleteUser: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      return !error;
    }
    return mockStore.deleteUser(id);
  },

  // --- Programs ---
  getPrograms: async (): Promise<Program[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          controller:profiles!programs_controller_id_fkey(full_name),
          auditor:profiles!programs_auditor_id_fkey(full_name),
          program_members(user_id, role_in_program, user:profiles(*))
        `)
        .order('created_at', { ascending: false });
      if (error || !data) return mockStore.getPrograms();
      return data.map(mapProgramRow);
    }
    return mockStore.getPrograms();
  },

  getProgramById: async (id: string): Promise<Program | null> => {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('programs')
        .select(`
          *,
          controller:profiles!programs_controller_id_fkey(full_name),
          auditor:profiles!programs_auditor_id_fkey(full_name),
          program_members(user_id, role_in_program, user:profiles(*))
        `)
        .eq('id', id)
        .single();
      return data ? mapProgramRow(data) : null;
    }
    return mockStore.getProgramById(id) || null;
  },

  createProgram: async (
    data: Omit<Program, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'teamMembers' | 'controllerName' | 'auditorName'>
  ): Promise<Program> => {
    if (isSupabaseConfigured) {
      const { data: newRow, error } = await supabase
        .from('programs')
        .insert({
          program_name: data.programName,
          hatchery_or_farm_name: data.hatcheryOrFarmName,
          flock_size: data.flockSize,
          scheduled_start_date: data.scheduledStartDate,
          scheduled_start_time: data.scheduledStartTime,
          scheduled_end_date: data.scheduledEndDate,
          scheduled_end_time: data.scheduledEndTime,
          controller_id: data.controllerId,
          status: 'pending_approval',
        })
        .select()
        .single();

      if (newRow) {
        // Add members
        if (data.teamMemberIds && data.teamMemberIds.length > 0) {
          const memberRows = data.teamMemberIds.map(uid => ({
            program_id: newRow.id,
            user_id: uid,
            role_in_program: 'team_member',
          }));
          await supabase.from('program_members').insert(memberRows);
        }
        return mapProgramRow(newRow);
      }
    }
    return mockStore.createProgram(data);
  },

  approveProgramAndStart: async (programId: string, auditorId: string): Promise<Program | null> => {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('programs')
        .update({ status: 'active', auditor_id: auditorId })
        .eq('id', programId)
        .select()
        .single();
      if (data) return mapProgramRow(data);
    }
    return mockStore.approveProgramAndStart(programId, auditorId);
  },

  submitProgramCompletion: async (
    programId: string,
    metrics: ProgramCompletionMetrics
  ): Promise<Program | null> => {
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('programs')
        .update({
          status: 'pending_audit',
          completion_metrics: metrics,
          completed_at: new Date().toISOString(),
        })
        .eq('id', programId)
        .select()
        .single();
      if (data) return mapProgramRow(data);
    }
    return mockStore.submitProgramCompletion(programId, metrics);
  },

  submitAuditRemarks: async (
    programId: string,
    auditorId: string,
    remarks: string,
    score: number = 95,
    checklist?: AuditChecklistItem[]
  ): Promise<ProgramAudit | null> => {
    if (isSupabaseConfigured) {
      const now = new Date().toISOString();
      await supabase
        .from('programs')
        .update({
          status: 'completed',
          auditor_remarks: remarks,
          audit_score: score,
          audited_at: now,
        })
        .eq('id', programId);

      const { data: auditRow } = await supabase
        .from('program_audits')
        .insert({
          program_id: programId,
          auditor_id: auditorId,
          remarks,
          score,
          checklist: checklist || [],
          signed_off_at: now,
        })
        .select()
        .single();

      if (auditRow) {
        return {
          id: auditRow.id,
          programId: auditRow.program_id,
          auditorId: auditRow.auditor_id,
          checklist: auditRow.checklist,
          score: auditRow.score || undefined,
          remarks: auditRow.remarks || undefined,
          signedOffAt: auditRow.signed_off_at || undefined,
          createdAt: auditRow.created_at,
          updatedAt: auditRow.updated_at,
        };
      }
    }

    mockStore.submitAuditorRemarks(programId, remarks, score);
    return {
      id: 'audit-' + Math.random().toString(36).substring(2, 9),
      programId,
      auditorId,
      checklist: checklist || [],
      score,
      remarks,
      signedOffAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  },

  // --- Dynamic Availability Filter ---
  getActiveEmployeeIds: async (): Promise<string[]> => {
    if (isSupabaseConfigured) {
      const { data: activeProgs } = await supabase
        .from('programs')
        .select('id, controller_id, program_members(user_id)')
        .in('status', ['active', 'pending_audit']);
      const occupied = new Set<string>();
      (activeProgs || []).forEach((p: any) => {
        occupied.add(p.controller_id);
        (p.program_members || []).forEach((m: any) => occupied.add(m.user_id));
      });
      return Array.from(occupied);
    }
    return mockStore.getActiveEmployeeIds();
  },

  getAvailableEmployees: async (): Promise<UserProfile[]> => {
    if (isSupabaseConfigured) {
      const occupiedIds = await dataProvider.getActiveEmployeeIds();
      let query = supabase
        .from('profiles')
        .select('*')
        .in('role', ['employee', 'program_controller'])
        .eq('status', 'approved');
      if (occupiedIds.length > 0) {
        query = query.not('id', 'in', `(${occupiedIds.join(',')})`);
      }
      const { data } = await query;
      return (data || []).map(mapProfileRow);
    }
    return mockStore.getAvailableEmployees();
  },

  getEmployeeProgramHistory: async (userId: string): Promise<ProgramMemberHistory[]> => {
    const allProgs = await dataProvider.getPrograms();
    return allProgs
      .filter(p => p.controllerId === userId || p.teamMemberIds.includes(userId))
      .map(p => ({
        programId: p.id,
        programName: p.programName,
        hatcheryOrFarmName: p.hatcheryOrFarmName,
        startDate: p.scheduledStartDate,
        endDate: p.scheduledEndDate,
        roleInProgram: (p.controllerId === userId ? 'program_controller' : 'team_member') as ProgramMemberRole,
        status: p.status,
        auditorRemarks: p.auditorRemarks,
        auditScore: p.auditScore,
      }));
  },
};
