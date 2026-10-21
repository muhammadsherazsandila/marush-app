// admin/ApprovalCard.tsx  (continued — full file, from the top)
import { Check, ShieldCheck, X } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors, Radii, Spacing, Type } from "../../constants/design";
import { Program, UserProfile } from "../../types";

// ── Pending program team card ─────────────────────────────────────

interface PendingProgramCardProps {
  program: Program;
  onAssignAuditor: () => void;
  onApprove: () => void;
}

export const PendingProgramCard: React.FC<PendingProgramCardProps> = ({
  program,
  onAssignAuditor,
  onApprove,
}) => (
  <View
    style={{
      marginBottom: Spacing.md,
      padding: Spacing.xl,
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surfaceCard,
      gap: Spacing.xs,
    }}
  >
    <Text style={{ ...Type.bodyStrong, color: Colors.textPrimary }}>
      {program.programName}
    </Text>
    <Text style={{ ...Type.caption, color: Colors.textSecondary }}>
      {program.hatcheryOrFarmName}
    </Text>
    <Text style={{ ...Type.caption, color: Colors.textTertiary }}>
      Controller: {program.controllerName || "Unassigned"} · Team:{" "}
      {program.teamMemberIds.length} members
    </Text>
    <Text style={{ ...Type.caption, color: Colors.textTertiary }}>
      Auditor: {program.auditorName || "Not assigned"}
    </Text>

    <TouchableOpacity
      onPress={onAssignAuditor}
      style={{
        marginTop: Spacing.sm,
        paddingVertical: Spacing.sm + 2,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.accentBorder,
        backgroundColor: Colors.accentSubtle,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          ...Type.caption,
          fontWeight: "700",
          color: Colors.accent,
        }}
      >
        {program.auditorId ? "Change Auditor" : "Assign Auditor"}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      onPress={onApprove}
      disabled={!program.auditorId}
      style={{
        marginTop: Spacing.xs,
        paddingVertical: Spacing.sm + 2,
        borderRadius: Radii.md,
        backgroundColor: program.auditorId
          ? Colors.accent
          : "rgba(1,156,223,0.35)",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.xs + 2,
      }}
    >
      <ShieldCheck size={15} color={Colors.white} />
      <Text
        style={{
          ...Type.caption,
          fontWeight: "700",
          color: Colors.white,
        }}
      >
        Approve & Start Program
      </Text>
    </TouchableOpacity>
  </View>
);

// ── Pending user request card ─────────────────────────────────────

interface PendingUserCardProps {
  user: UserProfile;
  onApprove: () => void;
  onReject: () => void;
}

export const PendingUserCard: React.FC<PendingUserCardProps> = ({
  user,
  onApprove,
  onReject,
}) => {
  const initial = user.fullName.trim().charAt(0).toUpperCase();
  const requestedRole = (user.requestedRole || user.role).replace(/_/g, " ");
  const currentRole = user.role.replace(/_/g, " ");

  return (
    <View
      style={{
        marginBottom: Spacing.md,
        padding: Spacing.xl,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surfaceCard,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: Spacing.md,
        }}
      >
        <View style={{ flexDirection: "row", gap: Spacing.md, flex: 1 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: Radii.md,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: Colors.accentSubtle,
              borderWidth: 1,
              borderColor: Colors.accentBorder,
            }}
          >
            <Text
              style={{
                ...Type.bodyStrong,
                fontWeight: "700",
                color: Colors.accent,
              }}
            >
              {initial}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{ ...Type.bodyStrong, color: Colors.textPrimary }}
              numberOfLines={1}
            >
              {user.fullName}
            </Text>
            <Text
              style={{ ...Type.caption, color: Colors.textSecondary }}
              numberOfLines={1}
            >
              {user.email}
            </Text>
          </View>
        </View>
        <View
          style={{
            paddingHorizontal: Spacing.sm,
            paddingVertical: 2,
            borderRadius: Radii.pill,
            borderWidth: 1,
            borderColor: Colors.warningBorder,
            backgroundColor: Colors.warningSubtle,
          }}
        >
          <Text
            style={{
              ...Type.eyebrow,
              fontSize: 9,
              color: Colors.warning,
            }}
          >
            Pending
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: Spacing.md,
          paddingTop: Spacing.md,
          flexDirection: "row",
          gap: Spacing["2xl"],
          borderTopWidth: 1,
          borderTopColor: Colors.borderSubtle,
        }}
      >
        <View>
          <Text
            style={{
              ...Type.eyebrow,
              fontSize: 9,
              color: Colors.textTertiary,
            }}
          >
            Requested access
          </Text>
          <Text
            style={{
              ...Type.caption,
              fontWeight: "600",
              color: Colors.textPrimary,
              textTransform: "capitalize",
              marginTop: 2,
            }}
          >
            {requestedRole}
          </Text>
        </View>
        <View>
          <Text
            style={{
              ...Type.eyebrow,
              fontSize: 9,
              color: Colors.textTertiary,
            }}
          >
            Current access
          </Text>
          <Text
            style={{
              ...Type.caption,
              fontWeight: "600",
              color: Colors.textPrimary,
              textTransform: "capitalize",
              marginTop: 2,
            }}
          >
            {currentRole}
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: Spacing.md,
          flexDirection: "row",
          gap: Spacing.sm,
        }}
      >
        <TouchableOpacity
          onPress={onApprove}
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: Spacing.xs,
            paddingVertical: Spacing.sm + 2,
            borderRadius: Radii.md,
            backgroundColor: Colors.accent,
          }}
        >
          <Check size={15} color={Colors.white} />
          <Text
            style={{
              ...Type.caption,
              fontWeight: "700",
              color: Colors.white,
            }}
          >
            Approve Account
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onReject}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: Spacing.xs,
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm + 2,
            borderRadius: Radii.md,
            borderWidth: 1,
            borderColor: Colors.dangerBorder,
            backgroundColor: Colors.dangerSubtle,
          }}
        >
          <X size={15} color={Colors.danger} />
          <Text
            style={{
              ...Type.caption,
              fontWeight: "700",
              color: Colors.danger,
            }}
          >
            Reject
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
