import { Program, UserProfile } from "../types";
import { WorkspaceTab } from "../components/BottomTabBar";

export type RouteName =
  | "service_unavailable"
  | "launch"
  | "auth"
  | "pending_approval"
  | "notifications"
  | "program_detail"
  | "profile"
  | "admin_employees"
  | "overview"
  | "admin_programs"
  | "controller_programs"
  | "auditor_programs"
  | "employee_inactive";

export interface NavigationState {
  isSupabaseConfigured: boolean;
  isLaunching: boolean;
  currentUser: UserProfile | null;
  activeTab: WorkspaceTab;
  selectedProgram: Program | null;
  showNotifications: boolean;
}

export interface RouteResolution {
  route: RouteName;
  title: string;
  canGoBack: boolean;
  allowedTabs: WorkspaceTab[];
}

/**
 * Returns available tabs based on user role.
 * Admins have access to the Employees management tab.
 */
export function getAllowedTabs(user: UserProfile | null): WorkspaceTab[] {
  if (user?.role === "admin") {
    return ["overview", "programs", "employees", "profile"];
  }
  if (user?.role === "program_auditor") {
    return ["overview", "profile"];
  }
  return ["overview", "programs", "profile"];
}

/**
 * Pure route resolver that determines the active screen and navigation state.
 */
export function resolveAppRoute(state: NavigationState): RouteResolution {
  // 1. Supabase configuration guard
  if (!state.isSupabaseConfigured) {
    return {
      route: "service_unavailable",
      title: "Service unavailable",
      canGoBack: false,
      allowedTabs: [],
    };
  }

  // 2. Launch splash guard
  if (state.isLaunching) {
    return {
      route: "launch",
      title: "Loading",
      canGoBack: false,
      allowedTabs: [],
    };
  }

  // 3. Unauthenticated auth screen
  if (!state.currentUser) {
    return {
      route: "auth",
      title: "Sign in",
      canGoBack: false,
      allowedTabs: [],
    };
  }

  // 4. Pending / Rejected approval guard
  if (
    state.currentUser.status === "pending" ||
    state.currentUser.status === "rejected"
  ) {
    return {
      route: "pending_approval",
      title: "Account pending",
      canGoBack: false,
      allowedTabs: [],
    };
  }

  const allowedTabs = getAllowedTabs(state.currentUser);

  // 5. Notifications screen modal
  if (state.showNotifications) {
    return {
      route: "notifications",
      title: "Notifications",
      canGoBack: true,
      allowedTabs,
    };
  }

  // 6. Program detail drill-down
  if (state.selectedProgram) {
    return {
      route: "program_detail",
      title: "Program detail",
      canGoBack: true,
      allowedTabs,
    };
  }

  // 7. Profile tab
  if (state.activeTab === "profile") {
    return {
      route: "profile",
      title: "Account & security",
      canGoBack: false,
      allowedTabs,
    };
  }

  // 8. Admin-only employees tab
  if (state.activeTab === "employees") {
    if (state.currentUser.role === "admin") {
      return {
        route: "admin_employees",
        title: "Employees",
        canGoBack: false,
        allowedTabs,
      };
    }
    // Unauthorized access falls back to overview
    return {
      route: "overview",
      title: "Overview",
      canGoBack: false,
      allowedTabs,
    };
  }

  // 9. Overview tab
  if (state.activeTab === "overview") {
    if (state.currentUser.role === "program_auditor") {
      return {
        route: "auditor_programs",
        title: "Overview",
        canGoBack: false,
        allowedTabs,
      };
    }
    return {
      route: "overview",
      title: "Overview",
      canGoBack: false,
      allowedTabs,
    };
  }

  // 10. Programs tab (role-specific dashboard)
  if (state.activeTab === "programs") {
    switch (state.currentUser.role) {
      case "admin":
        return {
          route: "admin_programs",
          title: "Programs",
          canGoBack: false,
          allowedTabs,
        };
      case "program_controller":
        return {
          route: "controller_programs",
          title: "Programs",
          canGoBack: false,
          allowedTabs,
        };
      case "program_auditor":
        // Fallback to overview since auditor only has overview and profile
        return {
          route: "auditor_programs",
          title: "Overview",
          canGoBack: false,
          allowedTabs,
        };
      case "employee":
      default:
        return {
          route: "employee_inactive",
          title: "Programs",
          canGoBack: false,
          allowedTabs,
        };
    }
  }

  // Default fallback
  return {
    route: "overview",
    title: "Overview",
    canGoBack: false,
    allowedTabs,
  };
}

export interface OAuthUrlTokens {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
}

/**
 * Parses deep links or redirect URLs for OAuth authentication parameters.
 */
export function parseOAuthCallbackUrl(url: string): OAuthUrlTokens | null {
  if (!url) return null;

  const hashIndex = url.indexOf("#");
  const queryIndex = url.indexOf("?");
  if (hashIndex === -1 && queryIndex === -1) return null;

  const params: Record<string, string> = {};

  if (hashIndex !== -1) {
    const hashStr = url.substring(hashIndex + 1);
    hashStr.split("&").forEach((part) => {
      const [k, v] = part.split("=");
      if (k && v) params[k] = decodeURIComponent(v);
    });
  }

  if (queryIndex !== -1) {
    const queryPart =
      hashIndex !== -1 && hashIndex > queryIndex
        ? url.substring(queryIndex + 1, hashIndex)
        : url.substring(queryIndex + 1);
    queryPart.split("&").forEach((part) => {
      const [k, v] = part.split("=");
      if (k && v) params[k] = decodeURIComponent(v);
    });
  }

  if (params.access_token && params.refresh_token) {
    return {
      accessToken: params.access_token,
      refreshToken: params.refresh_token,
    };
  }

  if (params.code) {
    return {
      code: params.code,
    };
  }

  return null;
}
