import {
  Building2,
  CheckCircle2,
  ChevronRight,
  IdCard,
  LogOut,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react-native";
import React, { useCallback } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useConfirmDialog } from "../components/ConfirmDialog";
import { Colors, Radii, Shadows, Spacing, Type } from "../constants/design";
import { UserProfile } from "../types";

interface ProfileScreenProps {
  user: UserProfile;
  onLogout: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Executive Administrator",
  program_controller: "Program Controller",
  program_auditor: "Senior Quality Auditor",
  employee: "Field Vaccination Specialist",
};

const getAssignedRoleLabel = (u: UserProfile) => {
  if (u.isDeveloper) return "Super User (Developer)";
  if (u.isSuperAdmin) return "Super Administrator";
  return ROLE_LABELS[u.role] || "Field Specialist";
};

/* ── Sub-components ──────────────────────────────────────────── */

const StatusPill: React.FC<{ status: UserProfile["status"] }> = ({
  status,
}) => {
  const color =
    status === "approved"
      ? Colors.success
      : status === "rejected"
        ? Colors.danger
        : Colors.warning;

  const Icon = status === "rejected" ? ShieldAlert : CheckCircle2;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.xs + 2,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radii.pill,
        borderWidth: 1,
        borderColor: `${color}40`,
        backgroundColor: `${color}15`,
      }}
    >
      <Icon size={12} color={color} strokeWidth={2.5} />
      <Text
        style={{
          ...Type.eyebrow,
          fontSize: 10,
          color,
        }}
      >
        {status}
      </Text>
    </View>
  );
};

const DetailItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}> = ({ icon, label, value, mono }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.borderSubtle,
    }}
  >
    <View
      style={{
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: Radii.sm,
        backgroundColor: Colors.surfaceInput,
        borderWidth: 1,
        borderColor: Colors.border,
        marginTop: 2,
      }}
    >
      {icon}
    </View>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text
        style={{
          ...Type.eyebrow,
          fontSize: 9,
          color: Colors.textTertiary,
          marginBottom: 2,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          ...Type.bodyStrong,
          color: Colors.textPrimary,
          ...(mono ? { fontFamily: "monospace", fontSize: 13 } : {}),
        }}
        selectable
      >
        {value}
      </Text>
    </View>
  </View>
);

/* ── Screen ──────────────────────────────────────────────────── */

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  onLogout,
}) => {
  const { confirm, ConfirmDialogElement } = useConfirmDialog();

  const initials = user.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const handleLogoutPress = useCallback(() => {
    confirm({
      title: "Sign Out",
      message: `Are you sure you want to log out of your session as ${user.fullName}? You will need to sign in again to access the operations workspace.`,
      confirmText: "Sign Out",
      cancelText: "Stay Signed In",
      variant: "danger",
      icon: "logout",
      onConfirm: onLogout,
    });
  }, [confirm, onLogout, user.fullName]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.surface }}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: Spacing["5xl"] }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1000,
          alignSelf: "center",
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing["3xl"],
        }}
      >
        {/* Page Header */}
        <View style={{ marginBottom: Spacing["3xl"] }}>
          <Text style={{ ...Type.eyebrow, color: Colors.accent }}>
            Account Security & Identity
          </Text>
          <Text
            style={{
              ...Type.h1,
              color: Colors.textPrimary,
              marginTop: Spacing.xs,
            }}
          >
            My Profile
          </Text>
        </View>

        {/* 2-Column Layout (stacks on mobile) */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: Spacing["2xl"],
          }}
        >
          {/* ── LEFT COLUMN: Identity Card ────────────────────────────── */}
          <View style={{ flex: 1, minWidth: 300, gap: Spacing.lg }}>
            <View
              style={{
                padding: Spacing["2xl"],
                borderRadius: Radii["2xl"],
                borderWidth: 1,
                borderColor: Colors.border,
                backgroundColor: Colors.surfaceElevated,
                ...Shadows.cardElevated,
                overflow: "hidden",
              }}
            >
              {/* Subtle top accent line */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  backgroundColor: Colors.accent,
                }}
              />

              <View style={{ alignItems: "center", marginTop: Spacing.sm }}>
                {/* Avatar */}
                <View
                  style={{
                    width: 88,
                    height: 88,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: Radii.pill,
                    backgroundColor: Colors.accentSubtle,
                    borderWidth: 2,
                    borderColor: Colors.accentBorder,
                    marginBottom: Spacing.lg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      fontWeight: "700",
                      color: Colors.accent,
                      letterSpacing: 1,
                    }}
                  >
                    {initials || "U"}
                  </Text>
                </View>

                <Text
                  style={{
                    ...Type.h2,
                    color: Colors.textPrimary,
                    textAlign: "center",
                  }}
                >
                  {user.fullName}
                </Text>
                <Text
                  style={{
                    ...Type.bodyStrong,
                    color: Colors.textSecondary,
                    marginTop: Spacing.xs,
                    textAlign: "center",
                  }}
                >
                  {getAssignedRoleLabel(user)}
                </Text>

                <View style={{ marginTop: Spacing.lg }}>
                  <StatusPill status={user.status} />
                </View>
              </View>

              {/* Divider */}
              <View
                style={{
                  height: 1,
                  backgroundColor: Colors.border,
                  marginVertical: Spacing["2xl"],
                }}
              />

              {/* Corporate Affiliation */}
              <View style={{ gap: Spacing.md }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: Spacing.sm,
                  }}
                >
                  <ShieldCheck
                    size={16}
                    color={Colors.accent}
                    strokeWidth={2.2}
                  />
                  <Text
                    style={{
                      ...Type.caption,
                      fontWeight: "600",
                      color: Colors.textSecondary,
                    }}
                  >
                    SSO Verified Account
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: Spacing.sm,
                  }}
                >
                  <Building2
                    size={16}
                    color={Colors.accent}
                    strokeWidth={2.2}
                  />
                  <Text
                    style={{
                      ...Type.caption,
                      fontWeight: "600",
                      color: Colors.textSecondary,
                    }}
                  >
                    Marush Pvt. Ltd. (Ceva Pakistan)
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── RIGHT COLUMN: Details & Actions ───────────────────────── */}
          <View style={{ flex: 1.5, minWidth: 320, gap: Spacing["2xl"] }}>
            {/* Operational Details */}
            <View>
              <Text
                style={{
                  ...Type.eyebrow,
                  color: Colors.textTertiary,
                  marginBottom: Spacing.md,
                }}
              >
                Operational Details
              </Text>
              <View
                style={{
                  paddingHorizontal: Spacing.xl,
                  paddingVertical: Spacing.sm,
                  borderRadius: Radii.lg,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  backgroundColor: Colors.surfaceCard,
                }}
              >
                <DetailItem
                  icon={<Mail size={16} color={Colors.textSecondary} />}
                  label="Corporate Email"
                  value={user.email || "Not provided"}
                />
                <DetailItem
                  icon={<User size={16} color={Colors.textSecondary} />}
                  label="Assigned System Role"
                  value={getAssignedRoleLabel(user)}
                />
                {user.employeeCode && (
                  <DetailItem
                    icon={<IdCard size={16} color={Colors.textSecondary} />}
                    label="Staff Identification Code"
                    value={user.employeeCode}
                    mono
                  />
                )}
                {user.phone && (
                  <DetailItem
                    icon={<Phone size={16} color={Colors.textSecondary} />}
                    label="Direct Contact"
                    value={user.phone}
                  />
                )}
                <View style={{ borderBottomWidth: 0 }}>
                  <DetailItem
                    icon={<Building2 size={16} color={Colors.textSecondary} />}
                    label="Organization Entity"
                    value="Marush (Pvt.) Ltd. • Ceva Veterinary Health"
                  />
                </View>
              </View>
            </View>

            {/* Session / Danger Zone */}
            <View>
              <Text
                style={{
                  ...Type.eyebrow,
                  color: Colors.textTertiary,
                  marginBottom: Spacing.md,
                }}
              >
                Session Management
              </Text>
              <TouchableOpacity
                onPress={handleLogoutPress}
                activeOpacity={0.8}
                accessibilityRole="button"
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: Spacing.xl,
                  paddingVertical: Spacing.lg,
                  borderRadius: Radii.lg,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  backgroundColor: Colors.surfaceCard,
                  ...(Platform.OS === "web"
                    ? ({
                        transition:
                          "background-color 140ms ease-out, border-color 140ms ease-out",
                      } as any)
                    : {}),
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: Spacing.md,
                  }}
                >
                  <View
                    style={{
                      padding: Spacing.sm,
                      borderRadius: Radii.md,
                      backgroundColor: Colors.dangerSubtle,
                      borderWidth: 1,
                      borderColor: Colors.dangerBorder,
                    }}
                  >
                    <LogOut size={18} color={Colors.danger} strokeWidth={2.2} />
                  </View>
                  <View>
                    <Text
                      style={{
                        ...Type.bodyStrong,
                        color: Colors.danger,
                      }}
                    >
                      Sign Out of Session
                    </Text>
                    <Text
                      style={{
                        ...Type.caption,
                        color: Colors.textSecondary,
                        marginTop: 2,
                      }}
                    >
                      End active session securely on this device
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
      {ConfirmDialogElement}
    </ScrollView>
  );
};
