import { describe, expect, it } from "vitest";
import {
  getAllowedTabs,
  NavigationState,
  parseOAuthCallbackUrl,
  resolveAppRoute,
} from "../src/navigation/routes";
import { Program, UserProfile } from "../src/types";

const mockAdminUser: UserProfile = {
  id: "admin-1",
  authUserId: "auth-admin-1",
  email: "admin@marush.com",
  fullName: "Admin User",
  role: "admin",
  status: "approved",
  isSuperAdmin: true,
  isDeveloper: false,
  createdAt: "2026-10-01T00:00:00Z",
};

const mockControllerUser: UserProfile = {
  id: "ctrl-1",
  authUserId: "auth-ctrl-1",
  email: "controller@marush.com",
  fullName: "Controller User",
  role: "program_controller",
  status: "approved",
  isSuperAdmin: false,
  isDeveloper: false,
  createdAt: "2026-10-01T00:00:00Z",
};

const mockAuditorUser: UserProfile = {
  id: "aud-1",
  authUserId: "auth-aud-1",
  email: "auditor@marush.com",
  fullName: "Auditor User",
  role: "program_auditor",
  status: "approved",
  isSuperAdmin: false,
  isDeveloper: false,
  createdAt: "2026-10-01T00:00:00Z",
};

const mockEmployeeUser: UserProfile = {
  id: "emp-1",
  fullName: "Field Employee",
  role: "employee",
  status: "approved",
  employeeCode: "MRSH-EMP-1001",
  isSuperAdmin: false,
  isDeveloper: false,
  createdAt: "2026-10-01T00:00:00Z",
};

const mockPendingUser: UserProfile = {
  id: "pending-1",
  authUserId: "auth-pending-1",
  email: "pending@marush.com",
  fullName: "Pending User",
  role: "program_controller",
  status: "pending",
  isSuperAdmin: false,
  isDeveloper: false,
  createdAt: "2026-10-01T00:00:00Z",
};

const mockRejectedUser: UserProfile = {
  id: "rejected-1",
  authUserId: "auth-rejected-1",
  email: "rejected@marush.com",
  fullName: "Rejected User",
  role: "program_auditor",
  status: "rejected",
  isSuperAdmin: false,
  isDeveloper: false,
  createdAt: "2026-10-01T00:00:00Z",
};

const mockProgram: Program = {
  id: "prog-1",
  programName: "Broiler Flocks Vaccination - Rawalpindi",
  hatcheryOrFarmName: "Rawalpindi Poultry Farm",
  flockSize: 5000,
  scheduledStartDate: "2026-10-01",
  scheduledStartTime: "08:00",
  scheduledEndDate: "2026-10-01",
  scheduledEndTime: "12:00",
  status: "active",
  controllerId: "ctrl-1",
  auditorId: "aud-1",
  teamMemberIds: ["emp-1"],
  createdAt: "2026-10-01T00:00:00Z",
};

const defaultBaseState: NavigationState = {
  isSupabaseConfigured: true,
  isLaunching: false,
  currentUser: mockAdminUser,
  activeTab: "overview",
  selectedProgram: null,
  showNotifications: false,
};

describe("App Routes & Route Resolution", () => {
  describe("System & Auth Routes", () => {
    it("resolves to service_unavailable route when Supabase is not configured", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        isSupabaseConfigured: false,
      });

      expect(res.route).toBe("service_unavailable");
      expect(res.title).toBe("Service unavailable");
      expect(res.canGoBack).toBe(false);
      expect(res.allowedTabs).toEqual([]);
    });

    it("resolves to launch route when app is in launching / splash phase", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        isLaunching: true,
      });

      expect(res.route).toBe("launch");
      expect(res.title).toBe("Loading");
      expect(res.canGoBack).toBe(false);
      expect(res.allowedTabs).toEqual([]);
    });

    it("resolves to auth route when no user is logged in", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        currentUser: null,
      });

      expect(res.route).toBe("auth");
      expect(res.title).toBe("Sign in");
      expect(res.canGoBack).toBe(false);
      expect(res.allowedTabs).toEqual([]);
    });

    it("resolves to pending_approval route when user status is pending", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        currentUser: mockPendingUser,
      });

      expect(res.route).toBe("pending_approval");
      expect(res.title).toBe("Account pending");
      expect(res.canGoBack).toBe(false);
      expect(res.allowedTabs).toEqual([]);
    });

    it("resolves to pending_approval route when user status is rejected", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        currentUser: mockRejectedUser,
      });

      expect(res.route).toBe("pending_approval");
      expect(res.title).toBe("Account pending");
      expect(res.canGoBack).toBe(false);
      expect(res.allowedTabs).toEqual([]);
    });
  });

  describe("Authenticated Workspace Routes", () => {
    it("resolves to overview route on overview tab", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        activeTab: "overview",
      });

      expect(res.route).toBe("overview");
      expect(res.title).toBe("Overview");
      expect(res.canGoBack).toBe(false);
      expect(res.allowedTabs).toContain("overview");
    });

    it("resolves to profile route on profile tab", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        activeTab: "profile",
      });

      expect(res.route).toBe("profile");
      expect(res.title).toBe("Account & security");
      expect(res.canGoBack).toBe(false);
      expect(res.allowedTabs).toContain("profile");
    });

    it("resolves to notifications route when notifications overlay is active", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        showNotifications: true,
      });

      expect(res.route).toBe("notifications");
      expect(res.title).toBe("Notifications");
      expect(res.canGoBack).toBe(true);
    });

    it("resolves to program_detail route when a program is selected", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        selectedProgram: mockProgram,
      });

      expect(res.route).toBe("program_detail");
      expect(res.title).toBe("Program detail");
      expect(res.canGoBack).toBe(true);
    });
  });

  describe("Role-Based Dashboard & Access Control Routes", () => {
    it("resolves admin to admin_programs route on programs tab", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        currentUser: mockAdminUser,
        activeTab: "programs",
      });

      expect(res.route).toBe("admin_programs");
      expect(res.title).toBe("Programs");
      expect(res.canGoBack).toBe(false);
    });

    it("resolves program_controller to controller_programs route on programs tab", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        currentUser: mockControllerUser,
        activeTab: "programs",
      });

      expect(res.route).toBe("controller_programs");
      expect(res.title).toBe("Programs");
      expect(res.canGoBack).toBe(false);
    });

    it("resolves program_auditor on overview tab to auditor_programs route", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        currentUser: mockAuditorUser,
        activeTab: "overview",
      });

      expect(res.route).toBe("auditor_programs");
      expect(res.title).toBe("Overview");
      expect(res.canGoBack).toBe(false);
      expect(res.allowedTabs).toEqual(["overview", "profile"]);
    });

    it("resolves employee to employee_inactive route on programs tab (field dashboard disabled)", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        currentUser: mockEmployeeUser,
        activeTab: "programs",
      });

      expect(res.route).toBe("employee_inactive");
      expect(res.title).toBe("Programs");
      expect(res.canGoBack).toBe(false);
    });

    it("allows admin to access admin_employees route on employees tab", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        currentUser: mockAdminUser,
        activeTab: "employees",
      });

      expect(res.route).toBe("admin_employees");
      expect(res.title).toBe("Employees");
      expect(res.canGoBack).toBe(false);
      expect(res.allowedTabs).toContain("employees");
    });

    it("guards non-admin from employees tab and redirects to overview", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        currentUser: mockControllerUser,
        activeTab: "employees",
      });

      expect(res.route).toBe("overview");
      expect(res.title).toBe("Overview");
      expect(res.allowedTabs).not.toContain("employees");
    });
  });

  describe("Route Precedence & Priority Hierarchy", () => {
    it("service_unavailable overrides active user and active notifications", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        isSupabaseConfigured: false,
        showNotifications: true,
        selectedProgram: mockProgram,
      });

      expect(res.route).toBe("service_unavailable");
    });

    it("launching state overrides active user and active notifications", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        isLaunching: true,
        showNotifications: true,
      });

      expect(res.route).toBe("launch");
    });

    it("unauthenticated auth route overrides tabs and selected program", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        currentUser: null,
        activeTab: "programs",
        selectedProgram: mockProgram,
      });

      expect(res.route).toBe("auth");
    });

    it("pending status overrides tabs and notifications", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        currentUser: mockPendingUser,
        showNotifications: true,
        activeTab: "programs",
      });

      expect(res.route).toBe("pending_approval");
    });

    it("notifications route overrides active program detail and active tab", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        showNotifications: true,
        selectedProgram: mockProgram,
        activeTab: "programs",
      });

      expect(res.route).toBe("notifications");
      expect(res.canGoBack).toBe(true);
    });

    it("program detail overrides underlying tab", () => {
      const res = resolveAppRoute({
        ...defaultBaseState,
        selectedProgram: mockProgram,
        activeTab: "programs",
      });

      expect(res.route).toBe("program_detail");
      expect(res.canGoBack).toBe(true);
    });
  });

  describe("Allowed Tab Navigation Per Role", () => {
    it("grants admin all four tabs including employees", () => {
      const tabs = getAllowedTabs(mockAdminUser);
      expect(tabs).toEqual(["overview", "programs", "employees", "profile"]);
    });

    it("grants controller three tabs excluding employees", () => {
      const tabs = getAllowedTabs(mockControllerUser);
      expect(tabs).toEqual(["overview", "programs", "profile"]);
    });

    it("grants auditor two tabs: overview and profile", () => {
      const tabs = getAllowedTabs(mockAuditorUser);
      expect(tabs).toEqual(["overview", "profile"]);
    });

    it("grants employee three tabs excluding employees", () => {
      const tabs = getAllowedTabs(mockEmployeeUser);
      expect(tabs).toEqual(["overview", "programs", "profile"]);
    });

    it("returns standard three tabs when user is null", () => {
      const tabs = getAllowedTabs(null);
      expect(tabs).toEqual(["overview", "programs", "profile"]);
    });
  });

  describe("OAuth Deep Link & Callback Route Parsing", () => {
    it("parses access_token and refresh_token from URL hash fragment", () => {
      const url =
        "marush://auth#access_token=test-access-token-123&refresh_token=test-refresh-token-456&token_type=bearer";
      const result = parseOAuthCallbackUrl(url);

      expect(result).toEqual({
        accessToken: "test-access-token-123",
        refreshToken: "test-refresh-token-456",
      });
    });

    it("parses OAuth authorization code from query parameters", () => {
      const url = "https://app.marush.com/auth/callback?code=oauth-auth-code-789";
      const result = parseOAuthCallbackUrl(url);

      expect(result).toEqual({
        code: "oauth-auth-code-789",
      });
    });

    it("handles URL encoded characters in tokens", () => {
      const url =
        "https://app.marush.com/#access_token=token%2Bwith%2Bspecial%3Dchars&refresh_token=refresh%2Bval";
      const result = parseOAuthCallbackUrl(url);

      expect(result).toEqual({
        accessToken: "token+with+special=chars",
        refreshToken: "refresh+val",
      });
    });

    it("returns null for URLs without auth tokens or code", () => {
      expect(parseOAuthCallbackUrl("https://app.marush.com/dashboard")).toBeNull();
      expect(parseOAuthCallbackUrl("")).toBeNull();
      expect(parseOAuthCallbackUrl("marush://overview?tab=programs")).toBeNull();
    });
  });
});
