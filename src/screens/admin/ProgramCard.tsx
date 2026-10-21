// admin/ProgramCard.tsx
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors, Radii, Spacing, Type } from "../../constants/design";
import { Program } from "../../types";

interface ProgramCardProps {
  program: Program;
  onPress?: () => void;
  footer?: React.ReactNode;
  showAuditor?: boolean;
  showScore?: boolean;
  showRemarks?: boolean;
}

const StatusBadge: React.FC<{ status: Program["status"] }> = ({ status }) => {
  const label = status.replace(/_/g, " ").toUpperCase();
  const color =
    status === "completed"
      ? Colors.success
      : status === "active"
        ? Colors.accent
        : status === "pending_approval" ||
            status === "pending_audit" ||
            status === "pending_admin_review"
          ? Colors.warning
          : Colors.textSecondary;

  return (
    <View
      style={{
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radii.pill,
        borderWidth: 1,
        borderColor: `${color}55`,
        backgroundColor: `${color}1A`,
      }}
    >
      <Text
        style={{
          ...Type.eyebrow,
          fontSize: 9,
          letterSpacing: 1,
          color,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

export const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  onPress,
  footer,
  showAuditor,
  showScore,
  showRemarks,
}) => (
  <TouchableOpacity
    activeOpacity={onPress ? 0.85 : 1}
    onPress={onPress}
    disabled={!onPress}
    style={{
      marginBottom: Spacing.md,
      padding: Spacing.xl,
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surfaceCard,
      gap: Spacing.sm,
    }}
  >
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: Spacing.sm,
      }}
    >
      <Text
        style={{
          ...Type.bodyStrong,
          color: Colors.textPrimary,
          flex: 1,
          minWidth: 0,
        }}
        numberOfLines={2}
      >
        {program.programName}
      </Text>
      <StatusBadge status={program.status} />
    </View>

    <Text style={{ ...Type.caption, color: Colors.textSecondary }}>
      {program.hatcheryOrFarmName}
    </Text>

    <Text style={{ ...Type.caption, color: Colors.textTertiary }}>
      Controller: {program.controllerName || "Unassigned"} ·{" "}
      {program.flockSize.toLocaleString()} birds
      {showAuditor ? ` · Auditor: ${program.auditorName || "Unassigned"}` : ""}
    </Text>

    {showScore && program.auditScore != null ? (
      <Text
        style={{
          ...Type.caption,
          fontWeight: "700",
          color: Colors.success,
          marginTop: Spacing.xs,
        }}
      >
        Quality Score: {program.auditScore}/100
      </Text>
    ) : null}

    {showRemarks && program.auditorRemarks ? (
      <View
        style={{
          marginTop: Spacing.sm,
          padding: Spacing.md,
          borderRadius: Radii.md,
          backgroundColor: Colors.surfaceInput,
          borderWidth: 1,
          borderColor: Colors.borderSubtle,
        }}
      >
        <Text
          style={{
            ...Type.caption,
            fontStyle: "italic",
            color: Colors.textSecondary,
          }}
          numberOfLines={2}
        >
          "{program.auditorRemarks}"
        </Text>
      </View>
    ) : null}

    {footer}
  </TouchableOpacity>
);
