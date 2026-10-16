import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import type {
  AuditChecklistItem,
  Database,
  Program,
  ProgramAudit,
  ProgramCompletionMetrics,
  ProgramMemberHistory,
  ProgramMemberRole,
  UserProfile,
  UserRole,
  UserStatus,
} from "../types";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const REQUESTED_ROLE_KEY = "marush.requested-role";
type RequestedDesignation = Exclude<UserRole, "admin">;
const REQUESTABLE_DESIGNATIONS: RequestedDesignation[] = [
  "employee",
  "program_controller",
  "program_auditor",
];

const saveRequestedRole = async (role: RequestedDesignation) => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.sessionStorage.setItem(REQUESTED_ROLE_KEY, role);
    return;
  }
  await AsyncStorage.setItem(REQUESTED_ROLE_KEY, role);
};

const readRequestedRole = async (): Promise<RequestedDesignation | null> => {
  const value =
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.sessionStorage.getItem(REQUESTED_ROLE_KEY)
      : await AsyncStorage.getItem(REQUESTED_ROLE_KEY);
  return REQUESTABLE_DESIGNATIONS.includes(value as RequestedDesignation)
    ? (value as RequestedDesignation)
    : null;
};

const clearRequestedRole = async () => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.sessionStorage.removeItem(REQUESTED_ROLE_KEY);
    return;
  }
  await AsyncStorage.removeItem(REQUESTED_ROLE_KEY);
};

const backendFailure = <T>(_getValue: () => T, backendMessage?: string): T => {
  throw new Error(
    isSupabaseConfigured
      ? backendMessage ||
          "The request could not be completed. Check your connection and try again."
      : "The application service is not configured. Contact your administrator.",
  );
};

// ==========================================
// In-memory compatibility store (production data always comes from Supabase)
// ==========================================

let usersDb: UserProfile[] = [];
let programsDb: Program[] = [];
let currentSessionUser: UserProfile | null = null;

// ==========================================
// MOCK STORE (Direct synchronous helper)
// ==========================================
const mockStore = {
  getUsers: (): UserProfile[] => [...usersDb],

  getUserById: (id: string): UserProfile | undefined =>
    usersDb.find((u) => u.id === id),

  addUser: (user: Omit<UserProfile, "id" | "createdAt">): UserProfile => {
    const newUser: UserProfile = {
      ...user,
      id:
        "00000000-0000-0000-0000-" +
        Math.random().toString(16).substring(2, 14).padEnd(12, "0"),
      createdAt: new Date().toISOString(),
    };
    usersDb.push(newUser);
    return newUser;
  },

  updateUserStatus: (
    id: string,
    status: UserProfile["status"],
  ): UserProfile | null => {
    const idx = usersDb.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    usersDb[idx] = { ...usersDb[idx], status };
    return usersDb[idx];
  },

  updateUserRole: (id: string, role: UserRole): UserProfile | null => {
    const idx = usersDb.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    usersDb[idx] = { ...usersDb[idx], role };
    return usersDb[idx];
  },

  deleteUser: (id: string): boolean => {
    const lenBefore = usersDb.length;
    usersDb = usersDb.filter((u) => u.id !== id);
    return usersDb.length < lenBefore;
  },

  getActiveEmployeeIds: (): string[] => {
    const activePrograms = programsDb.filter(
      (p) => p.status === "active" || p.status === "pending_audit",
    );
    const occupiedIds = new Set<string>();
    activePrograms.forEach((p) => {
      p.teamMemberIds.forEach((id) => occupiedIds.add(id));
      occupiedIds.add(p.controllerId);
    });
    return Array.from(occupiedIds);
  },

  getAvailableEmployees: (): UserProfile[] => {
    const occupied = new Set(mockStore.getActiveEmployeeIds());
    return usersDb.filter(
      (u) =>
        (u.role === "employee" || u.role === "program_controller") &&
        u.status === "approved" &&
        !occupied.has(u.id),
    );
  },

  getPrograms: (): Program[] => [...programsDb],

  getProgramById: (id: string): Program | undefined =>
    programsDb.find((p) => p.id === id),

  createProgram: (
    programData: Omit<Program, "id" | "createdAt" | "status">,
  ): Program => {
    const newProg: Program = {
      ...programData,
      id:
        "10000000-0000-0000-0000-" +
        Math.random().toString(16).substring(2, 14).padEnd(12, "0"),
      status: "pending_approval",
      createdAt: new Date().toISOString(),
    };
    programsDb.unshift(newProg);
    return newProg;
  },

  approveProgramAndStart: (
    programId: string,
    auditorId: string,
  ): Program | null => {
    const idx = programsDb.findIndex((p) => p.id === programId);
    if (idx === -1) return null;
    const auditor = usersDb.find((u) => u.id === auditorId);
    programsDb[idx] = {
      ...programsDb[idx],
      status: "active",
      auditorId,
      auditorName: auditor?.fullName || "Assigned Auditor",
    };
    return programsDb[idx];
  },

  submitProgramCompletion: (
    programId: string,
    metrics: Program["completionMetrics"],
  ): Program | null => {
    const idx = programsDb.findIndex((p) => p.id === programId);
    if (idx === -1) return null;
    programsDb[idx] = {
      ...programsDb[idx],
      status: "pending_audit",
      completionMetrics: metrics,
      completedAt: new Date().toISOString(),
    };
    return programsDb[idx];
  },

  submitAuditorRemarks: (
    programId: string,
    remarks: string,
    score: number = 95,
  ): Program | null => {
    const idx = programsDb.findIndex((p) => p.id === programId);
    if (idx === -1) return null;
    programsDb[idx] = {
      ...programsDb[idx],
      status: "completed",
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

function mapProfileRow(
  row: Database["public"]["Tables"]["profiles"]["Row"],
): UserProfile {
  return {
    id: row.id,
    authUserId: row.auth_user_id || undefined,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    requestedRole: row.requested_role || undefined,
    status: row.status,
    phone: row.phone || undefined,
    employeeCode: row.employee_code || undefined,
    avatarUrl: row.avatar_url || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProgramRow(row: any): Program {
  const auditRow = Array.isArray(row.program_audits) ? row.program_audits[0] : row.program_audits;
  return {
    id: row.id,
    programName: row.program_name,
    hatcheryOrFarmName: row.hatchery_or_farm_name,
    farmAddress: row.farm_address || undefined,
    farmManagerName: row.farm_manager_name || undefined,
    flockSize: row.flock_size,
    birdDetails: row.bird_details || undefined,
    vaccinesUsed: row.vaccines_used || undefined,
    scheduledStartDate: row.scheduled_start_date,
    scheduledStartTime: row.scheduled_start_time,
    scheduledEndDate: row.scheduled_end_date,
    scheduledEndTime: row.scheduled_end_time,
    travelDepartureTime: row.travel_departure_time || undefined,
    travelArrivalTime: row.travel_arrival_time || undefined,
    returnDepartureTime: row.return_departure_time || undefined,
    returnArrivalTime: row.return_arrival_time || undefined,
    vaccinationStartedAt: row.vaccination_started_at || undefined,
    vaccinationCompletedAt: row.vaccination_completed_at || undefined,
    controllerRemarks: row.controller_remarks || undefined,
    status: row.status,
    controllerId: row.controller_id,
    controllerName: row.controller?.full_name,
    auditorId: row.auditor_id || undefined,
    auditorName: row.auditor?.full_name,
    teamMemberIds: (row.program_members || []).map((m: any) => m.user_id),
    teamMembers: (row.program_members || [])
      .map((m: any) => (m.user ? mapProfileRow(m.user) : undefined))
      .filter(Boolean),
    completionMetrics: row.completion_metrics || undefined,
    completedAt: row.completed_at || undefined,
    auditorRemarks: row.auditor_remarks || undefined,
    auditScore: row.audit_score || undefined,
    auditedAt: row.audited_at || undefined,
    auditDetails: auditRow ? {
      id: auditRow.id,
      programId: auditRow.program_id,
      auditorId: auditRow.auditor_id,
      birdCountVerified: auditRow.bird_count_verified ?? undefined,
      vaccineVerified: auditRow.vaccine_verified ?? undefined,
      timingVerified: auditRow.timing_verified ?? undefined,
      vaccinationQualityAssessment: auditRow.vaccination_quality_assessment || undefined,
      uniformCompliance: auditRow.uniform_compliance ?? undefined,
      vaccinatorBehaviorAssessment: auditRow.vaccinator_behavior_assessment || undefined,
      overallAuditResult: auditRow.overall_audit_result || undefined,
      checklist: auditRow.checklist || [],
      score: auditRow.score ?? undefined,
      remarks: auditRow.remarks || undefined,
      signedOffAt: auditRow.signed_off_at || undefined,
      createdAt: auditRow.created_at,
      updatedAt: auditRow.updated_at,
    } : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ==========================================
// UNIFIED DATA PROVIDER (Async Architecture)
// ==========================================

export const dataProvider = {
  // --- Auth ---
  syncProfileForAuthUser: async (authUser: {
    id: string;
    email?: string;
    user_metadata?: Record<string, any>;
  }): Promise<UserProfile | null> => {
    if (!isSupabaseConfigured) return null;

    // The auth.users trigger creates and links profiles. Clients may read only
    // the signed-in user's profile and cannot link or create profiles directly.
    const { data: profile } = await getSupabaseClient()
      .from("profiles")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (profile) {
      const user = mapProfileRow(profile);
      if (user.status === "pending") {
        const requestedRole = await readRequestedRole();
        if (requestedRole) {
          const { error } = await getSupabaseClient().rpc(
            "request_profile_designation",
            {
              p_requested_role: requestedRole,
            },
          );
          if (error) {
            console.error(
              "[Auth] Could not save requested designation:",
              error.message,
            );
          } else {
            user.requestedRole = requestedRole;
            await clearRequestedRole();
          }
        }
      } else {
        await clearRequestedRole();
      }
      mockStore.setCurrentUser(user);
      return user;
    }

    return null;
  },

  signInWithGoogle: async (
    requestedRole: RequestedDesignation = "employee",
  ): Promise<{ user: UserProfile | null; error: string | null }> => {
    if (isSupabaseConfigured) {
      try {
        await saveRequestedRole(requestedRole);
        // Start OAuth through Supabase so its PKCE verifier and GoTrue session
        // remain authoritative on both web and native platforms.
        const isWeb = Platform.OS === "web" && typeof window !== "undefined";
        const configuredWebRedirectUrl =
          process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL?.trim();
        const nativeRedirectUrl = Linking.createURL("auth/callback", {
          scheme: "marushapp",
        });
        const redirectUrl = isWeb
          ? configuredWebRedirectUrl || window.location.origin
          : nativeRedirectUrl || AuthSession.makeRedirectUri({
              scheme: "marushapp",
              path: "auth/callback",
              preferLocalhost: false,
            });

        if (__DEV__) {
          console.info("[Auth] OAuth redirect URI:", redirectUrl);
        }

        const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: redirectUrl,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });

        if (error) {
          console.error("[Auth] Google OAuth error:", error.message);
          return { user: null, error: error.message };
        }

        // On Web: redirect current window to Google OAuth page
        if (isWeb && data?.url && typeof window !== "undefined") {
          window.location.href = data.url;
          return { user: null, error: null };
        }

        // On Native, Expo AuthSession supplies the app deep link and Expo's
        // browser auth session returns the OAuth code to the GoTrue client.
        if (data?.url) {
          if (__DEV__) {
            const requestedRedirect = new URL(data.url).searchParams.get("redirect_to");
            console.info("[Auth] Supabase OAuth redirect_to:", requestedRedirect || "not present");
          }
          const authResult = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl,
            {
              showInRecents: false,
              createTask: false,
            },
          );

          if (authResult.type !== "success") {
            return { user: null, error: null };
          }

          const callbackUrl = new URL(authResult.url);
          const code = callbackUrl.searchParams.get("code");
          if (!code) {
            const oauthError =
              callbackUrl.searchParams.get("error_description") ||
              callbackUrl.searchParams.get("error");
            if (oauthError) return { user: null, error: oauthError };
            return {
              user: null,
              error:
                "Google sign-in returned without an authorization code. Please try again.",
            };
          }

          const { data: sessionData, error: sessionErr } =
            await getSupabaseClient().auth.exchangeCodeForSession(code);
          if (sessionErr) {
            return { user: null, error: sessionErr.message };
          }

          if (sessionData?.user) {
            const user = await dataProvider.syncProfileForAuthUser(
              sessionData.user,
            );
            return { user, error: null };
          }
        }

        return { user: null, error: null };
      } catch (err: any) {
        console.error("[Auth] Google OAuth exception:", err);
        return {
          user: null,
          error: err?.message || "Failed to authenticate with Google",
        };
      }
    }

    return {
      user: null,
      error:
        "The application service is not configured. Contact your administrator.",
    };
  },

  signOut: async (): Promise<void> => {
    if (isSupabaseConfigured) {
      await getSupabaseClient().auth.signOut();
    }
    mockStore.setCurrentUser(null);
  },

  getCurrentUser: (): UserProfile | null => mockStore.getCurrentUser(),

  setCurrentUser: (user: UserProfile | null) => mockStore.setCurrentUser(user),

  /** Re-fetch the current user's profile from Supabase to pick up
   *  server-side changes (e.g. admin role/status updates). */
  refreshCurrentUserProfile: async (): Promise<UserProfile | null> => {
    const existing = mockStore.getCurrentUser();
    if (!existing || !isSupabaseConfigured) return existing;

    const { data, error } = await getSupabaseClient()
      .from("profiles")
      .select("*")
      .eq("id", existing.id)
      .maybeSingle();

    if (error || !data) return existing;

    const refreshed = mapProfileRow(data);
    mockStore.setCurrentUser(refreshed);
    return refreshed;
  },

  // --- Users / Profiles ---
  getUsers: async (): Promise<UserProfile[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await getSupabaseClient()
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true });
      if (error || !data)
        return backendFailure(() => mockStore.getUsers(), error?.message);
      return data.map(mapProfileRow);
    }
    return backendFailure(() => mockStore.getUsers());
  },

  getUserById: async (id: string): Promise<UserProfile | null> => {
    if (isSupabaseConfigured) {
      const { data, error } = await getSupabaseClient()
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapProfileRow(data) : null;
    }
    return backendFailure(() => mockStore.getUserById(id) || null);
  },

  getUsersByRole: async (role: UserRole): Promise<UserProfile[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await getSupabaseClient()
        .from("profiles")
        .select("*")
        .eq("role", role);
      if (error) throw new Error(error.message);
      return (data || []).map(mapProfileRow);
    }
    return backendFailure(() =>
      mockStore.getUsers().filter((u) => u.role === role),
    );
  },

  addUser: async (
    user: Omit<UserProfile, "id" | "createdAt" | "updatedAt">,
  ): Promise<UserProfile> => {
    if (isSupabaseConfigured) {
      const { data, error } = await getSupabaseClient()
        .from("profiles")
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
      if (error) throw new Error(error.message);
      if (data) return mapProfileRow(data);
    }
    return backendFailure(() => mockStore.addUser(user));
  },

  updateUserStatus: async (
    id: string,
    status: UserStatus,
  ): Promise<UserProfile | null> => {
    if (isSupabaseConfigured) {
      const { data, error } = await getSupabaseClient()
        .from("profiles")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (data) return mapProfileRow(data);
    }
    return backendFailure(() => mockStore.updateUserStatus(id, status));
  },

  updateUserRole: async (
    id: string,
    role: UserRole,
  ): Promise<UserProfile | null> => {
    if (isSupabaseConfigured) {
      const { data: targetUser } = await getSupabaseClient()
        .from("profiles")
        .select("role")
        .eq("id", id)
        .maybeSingle();

      if (targetUser?.role === "admin" && role !== "admin") {
        throw new Error("Administrator role cannot be changed. Contact the developer for assistance.");
      }

      const { data, error } = await getSupabaseClient()
        .from("profiles")
        .update({ role })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      if (data) return mapProfileRow(data);
    }
    const target = mockStore.getUserById(id);
    if (target?.role === "admin" && role !== "admin") {
      throw new Error("Administrator role cannot be changed. Contact the developer for assistance.");
    }
    return backendFailure(() => mockStore.updateUserRole(id, role));
  },

  getPendingUsers: async (): Promise<UserProfile[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await getSupabaseClient()
        .from("profiles")
        .select("*")
        .eq("status", "pending");
      if (error) throw new Error(error.message);
      return (data || []).map(mapProfileRow);
    }
    return backendFailure(() =>
      mockStore.getUsers().filter((u) => u.status === "pending"),
    );
  },

  deleteUser: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      // Guard: fetch profile to check if it's an admin before attempting delete
      const { data: targetUser } = await getSupabaseClient()
        .from("profiles")
        .select("role, email")
        .eq("id", id)
        .maybeSingle();

      if (targetUser?.role === "admin") {
        throw new Error("Administrator accounts cannot be deleted. Contact the developer for assistance.");
      }

      const { error } = await getSupabaseClient()
        .from("profiles")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
      return !error;
    }
    const target = mockStore.getUserById(id);
    if (target?.role === "admin") {
      throw new Error("Administrator accounts cannot be deleted. Contact the developer for assistance.");
    }
    return backendFailure(() => mockStore.deleteUser(id));
  },

  // --- Programs ---
  getPrograms: async (): Promise<Program[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await getSupabaseClient()
        .from("programs")
        .select(
          `
          *,
          controller:profiles!programs_controller_id_fkey(full_name),
          auditor:profiles!programs_auditor_id_fkey(full_name),
          program_members(user_id, role_in_program, user:profiles(*)),
          program_audits(*)
        `,
        )
        .order("created_at", { ascending: false });
      if (error || !data)
        return backendFailure(() => mockStore.getPrograms(), error?.message);
      return data.map(mapProgramRow);
    }
    return backendFailure(() => mockStore.getPrograms());
  },

  getProgramById: async (id: string): Promise<Program | null> => {
    if (isSupabaseConfigured) {
      const { data, error } = await getSupabaseClient()
        .from("programs")
        .select(
          `
          *,
          controller:profiles!programs_controller_id_fkey(full_name),
          auditor:profiles!programs_auditor_id_fkey(full_name),
          program_members(user_id, role_in_program, user:profiles(*)),
          program_audits(*)
        `,
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data ? mapProgramRow(data) : null;
    }
    return backendFailure(() => mockStore.getProgramById(id) || null);
  },

  createProgram: async (
    data: Omit<
      Program,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "status"
      | "teamMembers"
      | "controllerName"
      | "auditorName"
    >,
  ): Promise<Program> => {
    if (isSupabaseConfigured) {
      const { data: programId, error } = await getSupabaseClient().rpc(
        "create_program_with_members",
        {
          p_program_name: data.programName,
          p_hatchery_or_farm_name: data.hatcheryOrFarmName,
          p_flock_size: data.flockSize,
          p_scheduled_start_date: data.scheduledStartDate,
          p_scheduled_start_time: data.scheduledStartTime,
          p_scheduled_end_date: data.scheduledEndDate,
          p_scheduled_end_time: data.scheduledEndTime,
          p_controller_id: data.controllerId,
          p_team_member_ids: data.teamMemberIds || [],
          p_farm_address: data.farmAddress || null,
          p_farm_manager_name: data.farmManagerName || null,
          p_bird_details: data.birdDetails || null,
          p_vaccines_used: data.vaccinesUsed || [],
          p_travel_departure_time: data.travelDepartureTime || null,
          p_travel_arrival_time: data.travelArrivalTime || null,
          p_return_departure_time: data.returnDepartureTime || null,
          p_return_arrival_time: data.returnArrivalTime || null,
          p_vaccination_started_at: data.vaccinationStartedAt || null,
          p_vaccination_completed_at: data.vaccinationCompletedAt || null,
          p_controller_remarks: data.controllerRemarks || null,
        },
      );
      if (error) throw new Error(error.message);
      if (!programId) throw new Error("The program could not be created.");
      const createdProgram = await dataProvider.getProgramById(programId);
      if (!createdProgram)
        throw new Error("The program was created but could not be loaded.");
      return createdProgram;
    }
    return backendFailure(() => mockStore.createProgram(data));
  },

  approveProgramAndStart: async (
    programId: string,
    auditorId: string,
  ): Promise<Program | null> => {
    if (isSupabaseConfigured) {
      const { data, error } = await getSupabaseClient()
        .from("programs")
        .update({ status: "active", auditor_id: auditorId })
        .eq("id", programId)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data) return mapProgramRow(data);
    }
    return backendFailure(() =>
      mockStore.approveProgramAndStart(programId, auditorId),
    );
  },

  submitProgramCompletion: async (
    programId: string,
    metrics: ProgramCompletionMetrics,
  ): Promise<Program | null> => {
    if (isSupabaseConfigured) {
      const { data, error } = await getSupabaseClient()
        .from("programs")
        .update({
          status: "pending_audit",
          completion_metrics: metrics,
          completed_at: new Date().toISOString(),
        })
        .eq("id", programId)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (data) return mapProgramRow(data);
    }
    return backendFailure(() =>
      mockStore.submitProgramCompletion(programId, metrics),
    );
  },

  submitAuditRemarks: async (
    programId: string,
    auditorId: string,
    remarks: string,
    score: number = 95,
    checklist?: AuditChecklistItem[],
    auditFindings?: {
      birdCountVerified?: boolean;
      vaccineVerified?: boolean;
      timingVerified?: boolean;
      vaccinationQualityAssessment?: string;
      uniformCompliance?: boolean;
      vaccinatorBehaviorAssessment?: string;
      overallAuditResult?: string;
    },
  ): Promise<ProgramAudit | null> => {
    if (isSupabaseConfigured) {
      const { data: auditRows, error: auditError } =
        await getSupabaseClient().rpc("submit_program_audit", {
          p_program_id: programId,
          p_auditor_id: auditorId,
          p_remarks: remarks,
          p_score: score,
          p_checklist: checklist || [],
          p_bird_count_verified: auditFindings?.birdCountVerified ?? true,
          p_vaccine_verified: auditFindings?.vaccineVerified ?? true,
          p_timing_verified: auditFindings?.timingVerified ?? true,
          p_vaccination_quality_assessment: auditFindings?.vaccinationQualityAssessment ?? null,
          p_uniform_compliance: auditFindings?.uniformCompliance ?? true,
          p_vaccinator_behavior_assessment: auditFindings?.vaccinatorBehaviorAssessment ?? null,
          p_overall_audit_result: auditFindings?.overallAuditResult ?? "approved",
        });
      if (auditError) throw new Error(auditError.message);
      const auditRow = auditRows?.[0];

      if (auditRow) {
        return {
          id: auditRow.id,
          programId: auditRow.program_id,
          auditorId: auditRow.auditor_id,
          birdCountVerified: auditRow.bird_count_verified ?? undefined,
          vaccineVerified: auditRow.vaccine_verified ?? undefined,
          timingVerified: auditRow.timing_verified ?? undefined,
          vaccinationQualityAssessment: auditRow.vaccination_quality_assessment || undefined,
          uniformCompliance: auditRow.uniform_compliance ?? undefined,
          vaccinatorBehaviorAssessment: auditRow.vaccinator_behavior_assessment || undefined,
          overallAuditResult: auditRow.overall_audit_result || undefined,
          checklist: auditRow.checklist,
          score: auditRow.score || undefined,
          remarks: auditRow.remarks || undefined,
          signedOffAt: auditRow.signed_off_at || undefined,
          createdAt: auditRow.created_at,
          updatedAt: auditRow.updated_at,
        };
      }
    }

    backendFailure(() =>
      mockStore.submitAuditorRemarks(programId, remarks, score),
    );
    return {
      id: "audit-" + Math.random().toString(36).substring(2, 9),
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
      const { data: activeProgs, error } = await getSupabaseClient()
        .from("programs")
        .select("id, controller_id, program_members(user_id)")
        .in("status", ["active", "pending_audit"]);
      if (error) throw new Error(error.message);
      const occupied = new Set<string>();
      (activeProgs || []).forEach((p: any) => {
        occupied.add(p.controller_id);
        (p.program_members || []).forEach((m: any) => occupied.add(m.user_id));
      });
      return Array.from(occupied);
    }
    return backendFailure(() => mockStore.getActiveEmployeeIds());
  },

  getAvailableEmployees: async (): Promise<UserProfile[]> => {
    if (isSupabaseConfigured) {
      const { data, error } = await getSupabaseClient().rpc(
        "get_available_employees",
      );
      if (error) throw new Error(error.message);
      return (data || []).map(
        (row: {
          id: string;
          full_name: string;
          role: UserRole;
          employee_code: string | null;
          created_at: string;
        }) => ({
          id: row.id,
          email: "",
          fullName: row.full_name,
          role: row.role,
          status: "approved" as UserStatus,
          employeeCode: row.employee_code || undefined,
          createdAt: row.created_at,
        }),
      );
    }
    return backendFailure(() => mockStore.getAvailableEmployees());
  },

  getEmployeeProgramHistory: async (
    userId: string,
  ): Promise<ProgramMemberHistory[]> => {
    const allProgs = await dataProvider.getPrograms();
    return allProgs
      .filter(
        (p) => p.controllerId === userId || p.teamMemberIds.includes(userId),
      )
      .map((p) => ({
        programId: p.id,
        programName: p.programName,
        hatcheryOrFarmName: p.hatcheryOrFarmName,
        startDate: p.scheduledStartDate,
        endDate: p.scheduledEndDate,
        roleInProgram: (p.controllerId === userId
          ? "program_controller"
          : "team_member") as ProgramMemberRole,
        status: p.status,
        auditorRemarks: p.auditorRemarks,
        auditScore: p.auditScore,
      }));
  },
};
