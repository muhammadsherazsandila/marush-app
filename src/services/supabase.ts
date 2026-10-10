import { createClient } from '@supabase/supabase-js';
import { UserProfile, Program, ProgramStatus, UserRole } from '../types';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured =
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) &&
  process.env.EXPO_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// ==========================================
// SEEDED DEMO DATA STORE FOR IMMEDIATE USE
// ==========================================

const INITIAL_USERS: UserProfile[] = [
  {
    id: 'u-admin-1',
    email: 'admin@marush.com.pk',
    fullName: 'Muhammad Sheraz (Administrator)',
    role: 'admin',
    status: 'approved',
    phone: '+92 42 111 627 874',
    employeeCode: 'MRSH-ADM-001',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'u-ctrl-1',
    email: 'controller@marush.com.pk',
    fullName: 'Dr. Tariq Mahmood (Field Controller)',
    role: 'program_controller',
    status: 'approved',
    phone: '+92 300 4567890',
    employeeCode: 'MRSH-CTL-012',
    createdAt: '2026-02-01T09:30:00Z',
  },
  {
    id: 'u-audit-1',
    email: 'auditor@marush.com.pk',
    fullName: 'Dr. Ayesha Malik (Quality Auditor)',
    role: 'program_auditor',
    status: 'approved',
    phone: '+92 321 9876543',
    employeeCode: 'MRSH-AUD-004',
    createdAt: '2026-02-10T11:00:00Z',
  },
  {
    id: 'u-emp-1',
    email: 'ali.hassan@marush.com.pk',
    fullName: 'Ali Hassan',
    role: 'employee',
    status: 'approved',
    phone: '+92 312 3456781',
    employeeCode: 'MRSH-EMP-101',
    createdAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'u-emp-2',
    email: 'usman.zafar@marush.com.pk',
    fullName: 'Usman Zafar',
    role: 'employee',
    status: 'approved',
    phone: '+92 312 3456782',
    employeeCode: 'MRSH-EMP-102',
    createdAt: '2026-03-02T10:00:00Z',
  },
  {
    id: 'u-emp-3',
    email: 'bilal.ahmed@marush.com.pk',
    fullName: 'Bilal Ahmed',
    role: 'employee',
    status: 'approved',
    phone: '+92 312 3456783',
    employeeCode: 'MRSH-EMP-103',
    createdAt: '2026-03-03T10:00:00Z',
  },
  {
    id: 'u-emp-4',
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
    id: 'prog-001',
    programName: 'Hatchery Ceva ND In-Ovo Vaccination',
    hatcheryOrFarmName: 'Big Bird Hatcheries - Unit 4, Raiwind',
    flockSize: 50000,
    scheduledStartDate: '2026-09-18',
    scheduledStartTime: '08:00 AM',
    scheduledEndDate: '2026-09-18',
    scheduledEndTime: '04:00 PM',
    status: 'completed',
    controllerId: 'u-ctrl-1',
    controllerName: 'Dr. Tariq Mahmood (Field Controller)',
    teamMemberIds: ['u-emp-1'],
    auditorId: 'u-audit-1',
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
    id: 'prog-002',
    programName: 'Broiler Flock Day-One Spray Vaccination',
    hatcheryOrFarmName: 'Jadeed Farms - Flock Sector B, Okara',
    flockSize: 35000,
    scheduledStartDate: '2026-10-08',
    scheduledStartTime: '07:30 AM',
    scheduledEndDate: '2026-10-08',
    scheduledEndTime: '01:00 PM',
    status: 'completed',
    controllerId: 'u-ctrl-1',
    controllerName: 'Dr. Tariq Mahmood (Field Controller)',
    teamMemberIds: ['u-emp-2'],
    auditorId: 'u-audit-1',
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
    id: 'prog-003',
    programName: 'Layer Flock Marek & Gumboro Immunization',
    hatcheryOrFarmName: 'SB Feeds & Poultry - Kasur Hatchery',
    flockSize: 28000,
    scheduledStartDate: '2026-10-10',
    scheduledStartTime: '09:00 AM',
    scheduledEndDate: '2026-10-10',
    scheduledEndTime: '05:00 PM',
    status: 'active',
    controllerId: 'u-ctrl-1',
    controllerName: 'Dr. Tariq Mahmood (Field Controller)',
    teamMemberIds: ['u-emp-1'],
    auditorId: 'u-audit-1',
    auditorName: 'Dr. Ayesha Malik (Quality Auditor)',
    createdAt: '2026-10-09T14:00:00Z',
  },
];

// In-Memory state for mock/fallback mode
let usersDb: UserProfile[] = [...INITIAL_USERS];
let programsDb: Program[] = [...INITIAL_PROGRAMS];
let currentSessionUser: UserProfile | null = INITIAL_USERS[0]; // defaults to admin for demo preview

export const mockStore = {
  getUsers: (): UserProfile[] => [...usersDb],
  
  getUserById: (id: string): UserProfile | undefined => usersDb.find(u => u.id === id),

  addUser: (user: Omit<UserProfile, 'id' | 'createdAt'>): UserProfile => {
    const newUser: UserProfile = {
      ...user,
      id: 'u-' + Math.random().toString(36).substring(2, 9),
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

  // Active / Available Employee Logic
  getActiveEmployeeIds: (): string[] => {
    // An employee is active if they are in any program with status 'active' or 'pending_audit'
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
      id: 'prog-' + Math.random().toString(36).substring(2, 8),
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
