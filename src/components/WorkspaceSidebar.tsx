import {
  BarChart3,
  BriefcaseBusiness,
  LayoutDashboard,
  LogOut,
  UserRound,
} from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors, Radii, Shadows, Spacing, Type } from "../constants/design";
import { UserRole } from "../types";
import { WorkspaceTab } from "./BottomTabBar";
import { MarushLogo } from "./MarushLogo";

interface WorkspaceSidebarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onLogout: () => void;
  userRole?: UserRole;
}

const TABS = [
  {
    id: "overview",
    label: "Overview",
    caption: "Operations at a glance",
    Icon: LayoutDashboard,
  },
  {
    id: "programs",
    label: "Programs",
    caption: "Manage field work",
    Icon: BriefcaseBusiness,
  },
  {
    id: "profile",
    label: "Profile",
    caption: "Account & security",
    Icon: UserRound,
  },
] as const;

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  userRole,
}) => {
  // If user is a program_auditor, only show Overview and Profile
  const visibleTabs =
    userRole === "program_auditor"
      ? TABS.filter((t) => t.id === "overview" || t.id === "profile")
      : TABS;

  return (
    <View
      style={{
        width: 264,
        flexDirection: "column",
        borderRightWidth: 1,
        borderRightColor: Colors.border,
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xl,
      }}
    >
      {/* Brand Header */}
      <View
        style={{
          marginBottom: Spacing["4xl"],
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.md,
          paddingHorizontal: Spacing.sm,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: Radii.md,
            backgroundColor: Colors.surfaceInput,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        >
          <MarushLogo size="sm" variant="mark" framed={false} theme="dark" />
        </View>
        <View>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "800",
              letterSpacing: 1.6,
              color: Colors.textPrimary,
            }}
          >
            MARUSH
          </Text>
          <Text
            style={{
              fontSize: 10,
              fontWeight: "500",
              color: Colors.textSecondary,
              marginTop: 2,
            }}
          >
            Operations workspace
          </Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <Text
        style={{
          marginBottom: Spacing.md,
          paddingHorizontal: Spacing.md,
          ...Type.eyebrow,
          fontSize: 10,
          letterSpacing: 1.5,
          color: Colors.textTertiary,
        }}
      >
        Workspace
      </Text>

      <View style={{ gap: Spacing.xs }}>
        {visibleTabs.map(({ id, label, caption, Icon }) => {
          const active = activeTab === id;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => onTabChange(id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.md,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.md,
                borderRadius: Radii.md,
                backgroundColor: active ? Colors.accentSubtle : "transparent",
                borderWidth: 1,
                borderColor: active ? Colors.accentBorder : "transparent",
                ...(active ? Shadows.card : {}),
              }}
            >
              <Icon
                size={18}
                color={active ? Colors.accent : Colors.textSecondary}
                strokeWidth={active ? 2.4 : 1.9}
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: active ? Colors.accent : Colors.textPrimary,
                  }}
                >
                  {label}
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontSize: 10,
                    color: active ? Colors.accent : Colors.textTertiary,
                    opacity: active ? 0.8 : 1,
                  }}
                >
                  {caption}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom Area: Status & Sign Out */}
      <View style={{ marginTop: "auto", gap: Spacing.md }}>
        {/* System Status Card */}
        <View
          style={{
            borderRadius: Radii.md,
            borderWidth: 1,
            borderColor: Colors.border,
            backgroundColor: Colors.surfaceCard,
            padding: Spacing.md,
          }}
        >
          <View
            style={{
              marginBottom: Spacing.sm,
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.sm,
            }}
          >
            <BarChart3 size={15} color={Colors.accent} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: Colors.textPrimary,
              }}
            >
              System status
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.sm,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: Radii.pill,
                backgroundColor: Colors.success,
              }}
            />
            <Text
              style={{
                fontSize: 11,
                color: Colors.textSecondary,
              }}
            >
              All services operational
            </Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={onLogout}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.md,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.md,
            borderRadius: Radii.md,
          }}
        >
          <LogOut size={17} color={Colors.danger} />
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: Colors.danger,
            }}
          >
            Sign out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
