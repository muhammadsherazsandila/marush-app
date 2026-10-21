// admin/EmployeeCard.tsx
import { Pencil, Trash2 } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors, Radii, Spacing, Type } from "../../constants/design";
import { UserProfile } from "../../types";

interface EmployeeCardProps {
  user: UserProfile;
  canEdit: boolean;
  canDelete: boolean;
  isSelf: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  user,
  canEdit,
  canDelete,
  isSelf,
  onEdit,
  onDelete,
}) => {
  const initial = user.fullName.trim().charAt(0).toUpperCase();

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
              {user.email || "No email (field staff)"}
            </Text>
            {user.isDeveloper ? (
              <Text
                style={{
                  ...Type.eyebrow,
                  fontSize: 9,
                  color: Colors.info,
                  marginTop: Spacing.xs,
                }}
              >
                Super User (Developer)
              </Text>
            ) : user.isSuperAdmin ? (
              <Text
                style={{
                  ...Type.eyebrow,
                  fontSize: 9,
                  color: Colors.accent,
                  marginTop: Spacing.xs,
                }}
              >
                Superadmin
              </Text>
            ) : null}
          </View>
        </View>

        <View style={{ alignItems: "flex-end", gap: Spacing.xs }}>
          <View
            style={{
              paddingHorizontal: Spacing.sm,
              paddingVertical: 2,
              borderRadius: Radii.pill,
              backgroundColor: Colors.accentSubtle,
              borderWidth: 1,
              borderColor: Colors.accentBorder,
            }}
          >
            <Text
              style={{
                ...Type.eyebrow,
                fontSize: 9,
                color: Colors.accent,
              }}
            >
              {user.role.replace(/_/g, " ")}
            </Text>
          </View>
          <View
            style={{
              paddingHorizontal: Spacing.sm,
              paddingVertical: 2,
              borderRadius: Radii.pill,
              borderWidth: 1,
              borderColor:
                user.status === "approved"
                  ? Colors.successBorder
                  : Colors.warningBorder,
              backgroundColor:
                user.status === "approved"
                  ? Colors.successSubtle
                  : Colors.warningSubtle,
            }}
          >
            <Text
              style={{
                ...Type.eyebrow,
                fontSize: 9,
                color:
                  user.status === "approved" ? Colors.success : Colors.warning,
              }}
            >
              {user.status}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={{
          marginTop: Spacing.md,
          paddingTop: Spacing.md,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: Spacing.md,
          borderTopWidth: 1,
          borderTopColor: Colors.borderSubtle,
        }}
      >
        <Text
          style={{
            ...Type.mono,
            fontSize: 10,
            color: Colors.textTertiary,
          }}
        >
          ID {user.employeeCode || "Not assigned"}
        </Text>
        {user.phone ? (
          <Text style={{ ...Type.caption, color: Colors.textSecondary }}>
            {user.phone}
          </Text>
        ) : null}
      </View>

      {(canEdit || canDelete) && (
        <View
          style={{
            marginTop: Spacing.md,
            paddingTop: Spacing.md,
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: Spacing.sm,
            borderTopWidth: 1,
            borderTopColor: Colors.borderSubtle,
          }}
        >
          {canEdit ? (
            <TouchableOpacity
              onPress={onEdit}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.xs,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                borderRadius: Radii.md,
                borderWidth: 1,
                borderColor: Colors.border,
                backgroundColor: Colors.surfaceInput,
              }}
            >
              <Pencil size={14} color={Colors.textSecondary} />
              <Text
                style={{
                  ...Type.caption,
                  fontWeight: "600",
                  color: Colors.textSecondary,
                }}
              >
                Edit Name
              </Text>
            </TouchableOpacity>
          ) : null}
          {canDelete ? (
            <TouchableOpacity
              onPress={onDelete}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.xs,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                borderRadius: Radii.md,
                borderWidth: 1,
                borderColor: Colors.dangerBorder,
                backgroundColor: Colors.dangerSubtle,
              }}
            >
              <Trash2 size={14} color={Colors.danger} />
              <Text
                style={{
                  ...Type.caption,
                  fontWeight: "700",
                  color: Colors.danger,
                }}
              >
                {isSelf ? "Delete My Account" : "Delete"}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
};
