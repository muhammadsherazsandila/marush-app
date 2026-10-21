import {
  BriefcaseBusiness,
  LayoutDashboard,
  LucideIcon,
  UserRound,
  Users,
} from "lucide-react-native";
import React from "react";
import {
  Platform,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Colors, Radii, Shadows, Spacing, Type } from "../constants/design";
import { UserRole } from "../types";

export type WorkspaceTab = "overview" | "programs" | "employees" | "profile";

interface TabItem {
  id: WorkspaceTab;
  label: string;
  Icon: LucideIcon;
}

interface BottomTabBarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  isAdmin?: boolean;
  userRole?: UserRole;
}

const BASE_TABS: TabItem[] = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "programs", label: "Programs", Icon: BriefcaseBusiness },
  { id: "profile", label: "Profile", Icon: UserRound },
];

const ADMIN_EXTRA: TabItem = {
  id: "employees",
  label: "Employees",
  Icon: Users,
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabChange,
  isAdmin = false,
  userRole,
}) => {
  const { width } = useWindowDimensions();
  const effectiveRole = userRole || (isAdmin ? "admin" : undefined);

  let visibleTabs: TabItem[] = BASE_TABS;
  if (effectiveRole === "admin") {
    visibleTabs = [BASE_TABS[0], BASE_TABS[1], ADMIN_EXTRA, BASE_TABS[2]];
  } else if (effectiveRole === "program_auditor") {
    // Auditors only have Overview and Profile
    visibleTabs = [BASE_TABS[0], BASE_TABS[2]];
  }

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.surfaceElevated,
        ...Shadows.cardElevated,
        ...(Platform.OS === "web"
          ? ({
              backdropFilter: "blur(16px)",
              userSelect: "none",
            } as any)
          : {}),
      }}
    >
      <View
        accessibilityRole="tablist"
        style={{
          alignSelf: "center",
          width: "100%",
          maxWidth: width >= 900 ? 580 : undefined,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.xs + 2,
        }}
      >
        {visibleTabs.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => onTabChange(id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              activeOpacity={0.75}
              style={{
                minHeight: 50,
                minWidth: 0,
                flex: 1,
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: Spacing.xs,
                paddingHorizontal: Spacing.md + 2,
                paddingVertical: Spacing.sm,
                borderRadius: Radii.md,
                backgroundColor: active ? Colors.accentSubtle : "transparent",
                borderWidth: 1,
                borderColor: active ? Colors.accentBorder : "transparent",
                ...(Platform.OS === "web"
                  ? ({
                      tabIndex: 0,
                      transition:
                        "transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out",
                    } as any)
                  : {}),
              }}
            >
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon
                  size={19}
                  color={active ? Colors.accent : Colors.textSecondary}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </View>
              <Text
                style={{
                  ...Type.caption,
                  fontSize: 11,
                  letterSpacing: -0.1,
                  fontWeight: active ? "700" : "500",
                  color: active ? Colors.accent : Colors.textTertiary,
                }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
