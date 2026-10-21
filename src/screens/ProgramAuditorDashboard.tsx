import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { Colors, Radii, Shadows, Spacing, Type } from "../constants/design";
import { dataProvider } from "../services";
import { Program, UserProfile } from "../types";

interface ProgramAuditorDashboardProps {
  currentUser: UserProfile;
  activeArea: "overview" | "programs";
  onSelectProgram?: (program: Program) => void;
}

const getStatusBadge = (status: Program["status"]) => {
  switch (status) {
    case "completed":
      return {
        label: "COMPLETED",
        textColor: Colors.success,
        borderColor: Colors.successBorder,
        bgColor: Colors.successSubtle,
      };
    case "active":
      return {
        label: "ACTIVE IN FIELD",
        textColor: Colors.accent,
        borderColor: Colors.accentBorder,
        bgColor: Colors.accentSubtle,
      };
    case "pending_audit":
      return {
        label: "AWAITING AUDIT",
        textColor: Colors.warning,
        borderColor: Colors.warningBorder,
        bgColor: Colors.warningSubtle,
      };
    case "pending_admin_review":
      return {
        label: "ADMIN REVIEW",
        textColor: Colors.warning,
        borderColor: Colors.warningBorder,
        bgColor: Colors.warningSubtle,
      };
    case "pending_approval":
      return {
        label: "PENDING APPROVAL",
        textColor: Colors.textSecondary,
        borderColor: Colors.border,
        bgColor: Colors.surfaceInput,
      };
    case "cancelled":
      return {
        label: "CANCELLED",
        textColor: Colors.danger,
        borderColor: Colors.dangerBorder,
        bgColor: Colors.dangerSubtle,
      };
    default:
      return {
        label: (status || "UNKNOWN").toUpperCase(),
        textColor: Colors.textSecondary,
        borderColor: Colors.border,
        bgColor: Colors.surfaceInput,
      };
  }
};

export const ProgramAuditorDashboard: React.FC<ProgramAuditorDashboardProps> = ({
  currentUser,
  onSelectProgram,
}) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const allProgs = await dataProvider.getPrograms();
      setPrograms(allProgs);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Unable to load audit data",
        text2: error?.message || "Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auditor sees only programs in which he/she was assigned as auditor
  const myPrograms = programs.filter((p) => p.auditorId === currentUser.id);
  const completedCount = myPrograms.filter((p) => p.status === "completed").length;
  const activeCount = myPrograms.filter((p) => p.status === "active").length;
  const pendingAuditCount = myPrograms.filter(
    (p) => p.status === "pending_audit" || p.status === "pending_admin_review",
  ).length;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <ScrollView
        contentContainerStyle={{
          width: "100%",
          maxWidth: 1280,
          alignSelf: "center",
          padding: Spacing.xl,
          gap: Spacing.xl,
          paddingBottom: Spacing["5xl"],
        }}
      >
        {/* Header Section */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: Spacing.lg,
          }}
        >
          <View style={{ flex: 1, minWidth: 260 }}>
            <Text
              style={{
                ...Type.eyebrow,
                color: Colors.accent,
                marginBottom: Spacing.xs,
              }}
            >
              QUALITY AUDIT / VETERINARY COMPLIANCE
            </Text>
            <Text style={{ ...Type.h1, color: Colors.textPrimary }}>
              Auditor Overview
            </Text>
            <Text
              style={{
                ...Type.caption,
                color: Colors.textSecondary,
                marginTop: Spacing.sm,
                maxWidth: 620,
              }}
            >
              Programs where you are designated as the quality auditor. Tap any
              program to review field logs, cold chain verification, and detailed
              metrics.
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.xs,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                borderRadius: Radii.pill,
                borderWidth: 1,
                borderColor: Colors.border,
                backgroundColor: Colors.surfaceInput,
              }}
            >
              <ShieldCheck size={14} color={Colors.accent} strokeWidth={2.5} />
              <Text
                style={{
                  ...Type.caption,
                  fontWeight: "700",
                  color: Colors.accent,
                }}
              >
                Official Auditor
              </Text>
            </View>

            <TouchableOpacity
              onPress={refreshData}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Refresh programs"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.xs,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                borderRadius: Radii.pill,
                borderWidth: 1,
                borderColor: Colors.border,
                backgroundColor: Colors.surfaceInput,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.accent} />
              ) : (
                <>
                  <RefreshCw size={13} color={Colors.accent} strokeWidth={2.4} />
                  <Text
                    style={{
                      ...Type.caption,
                      fontWeight: "700",
                      color: Colors.accent,
                    }}
                  >
                    Refresh
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Metric Cards */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: Spacing.md,
          }}
        >
          <View
            style={{
              flex: 1,
              minWidth: 160,
              padding: Spacing.lg,
              borderRadius: Radii.lg,
              borderWidth: 1,
              borderColor: Colors.border,
              backgroundColor: Colors.surfaceCard,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  ...Type.eyebrow,
                  color: Colors.textSecondary,
                  fontSize: 10,
                }}
              >
                TOTAL ASSIGNED
              </Text>
              <Users size={16} color={Colors.accent} />
            </View>
            <Text
              style={{
                ...Type.h2,
                color: Colors.accent,
                marginTop: Spacing.sm,
              }}
            >
              {myPrograms.length}
            </Text>
            <Text
              style={{
                ...Type.caption,
                color: Colors.textTertiary,
                marginTop: Spacing.xs,
              }}
            >
              All assigned programs
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 160,
              padding: Spacing.lg,
              borderRadius: Radii.lg,
              borderWidth: 1,
              borderColor: Colors.border,
              backgroundColor: Colors.surfaceCard,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  ...Type.eyebrow,
                  color: Colors.textSecondary,
                  fontSize: 10,
                }}
              >
                ACTIVE / PENDING
              </Text>
              <Clock3 size={16} color={Colors.warning} />
            </View>
            <Text
              style={{
                ...Type.h2,
                color: Colors.warning,
                marginTop: Spacing.sm,
              }}
            >
              {activeCount + pendingAuditCount}
            </Text>
            <Text
              style={{
                ...Type.caption,
                color: Colors.textTertiary,
                marginTop: Spacing.xs,
              }}
            >
              Live or review stage
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              minWidth: 160,
              padding: Spacing.lg,
              borderRadius: Radii.lg,
              borderWidth: 1,
              borderColor: Colors.border,
              backgroundColor: Colors.surfaceCard,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  ...Type.eyebrow,
                  color: Colors.textSecondary,
                  fontSize: 10,
                }}
              >
                COMPLETED
              </Text>
              <CheckCircle2 size={16} color={Colors.success} />
            </View>
            <Text
              style={{
                ...Type.h2,
                color: Colors.success,
                marginTop: Spacing.sm,
              }}
            >
              {completedCount}
            </Text>
            <Text
              style={{
                ...Type.caption,
                color: Colors.textTertiary,
                marginTop: Spacing.xs,
              }}
            >
              Verified & completed
            </Text>
          </View>
        </View>

        {/* Section Heading */}
        <View style={{ marginTop: Spacing.sm }}>
          <Text style={{ ...Type.h2, color: Colors.textPrimary }}>
            Assigned Programs ({myPrograms.length})
          </Text>
          <Text
            style={{
              ...Type.caption,
              color: Colors.textSecondary,
              marginTop: 2,
            }}
          >
            Click any program below to view complete details, field logs, and team allocation.
          </Text>
        </View>

        {/* Program Cards List */}
        {myPrograms.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              padding: Spacing["4xl"],
              borderRadius: Radii.lg,
              borderWidth: 1,
              borderColor: Colors.border,
              borderStyle: "dashed",
              backgroundColor: Colors.surfaceInput,
            }}
          >
            <ShieldCheck size={32} color={Colors.textTertiary} />
            <Text
              style={{
                ...Type.bodyStrong,
                color: Colors.textPrimary,
                marginTop: Spacing.md,
              }}
            >
              No programs assigned yet
            </Text>
            <Text
              style={{
                ...Type.caption,
                color: Colors.textSecondary,
                textAlign: "center",
                marginTop: Spacing.xs,
                maxWidth: 360,
              }}
            >
              When an administrator assigns you as the auditor for a vaccination
              program, it will appear here.
            </Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.md }}>
            {myPrograms.map((prog) => {
              const badge = getStatusBadge(prog.status);
              return (
                <TouchableOpacity
                  key={prog.id}
                  activeOpacity={0.85}
                  onPress={() => onSelectProgram?.(prog)}
                  accessibilityRole="button"
                  accessibilityLabel={`View details for ${prog.programName}`}
                  style={{
                    padding: Spacing.xl,
                    borderRadius: Radii.lg,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    backgroundColor: Colors.surfaceCard,
                    ...Shadows.card,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: Spacing.sm,
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 200 }}>
                      <Text
                        style={{
                          ...Type.bodyStrong,
                          fontSize: 16,
                          fontWeight: "700",
                          color: Colors.textPrimary,
                        }}
                      >
                        {prog.programName}
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: Spacing.xs,
                          marginTop: 4,
                        }}
                      >
                        <MapPin size={13} color={Colors.textTertiary} />
                        <Text
                          style={{
                            ...Type.caption,
                            color: Colors.textSecondary,
                          }}
                        >
                          {prog.hatcheryOrFarmName}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        paddingHorizontal: Spacing.md,
                        paddingVertical: Spacing.xs,
                        borderRadius: Radii.pill,
                        borderWidth: 1,
                        borderColor: badge.borderColor,
                        backgroundColor: badge.bgColor,
                      }}
                    >
                      <Text
                        style={{
                          ...Type.eyebrow,
                          fontSize: 10,
                          color: badge.textColor,
                        }}
                      >
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  {/* Metadata Chips */}
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: Spacing.lg,
                      marginTop: Spacing.md,
                      padding: Spacing.md,
                      borderRadius: Radii.md,
                      backgroundColor: Colors.surfaceInput,
                      borderWidth: 1,
                      borderColor: Colors.borderSubtle,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
                      <Users size={13} color={Colors.accent} />
                      <Text style={{ ...Type.caption, color: Colors.textSecondary }}>
                        Flock:{" "}
                        <Text style={{ fontWeight: "700", color: Colors.textPrimary }}>
                          {prog.flockSize.toLocaleString()}
                        </Text>{" "}
                        birds
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
                      <CalendarDays size={13} color={Colors.accent} />
                      <Text style={{ ...Type.caption, color: Colors.textSecondary }}>
                        Date:{" "}
                        <Text style={{ fontWeight: "600", color: Colors.textPrimary }}>
                          {prog.scheduledStartDate}
                        </Text>{" "}
                        ({prog.scheduledStartTime})
                      </Text>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
                      <ShieldCheck size={13} color={Colors.accent} />
                      <Text style={{ ...Type.caption, color: Colors.textSecondary }}>
                        Controller:{" "}
                        <Text style={{ fontWeight: "600", color: Colors.textPrimary }}>
                          {prog.controllerName || "Field Lead"}
                        </Text>
                      </Text>
                    </View>
                  </View>

                  {/* Click to view detail banner */}
                  <View
                    style={{
                      marginTop: Spacing.md,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: Spacing.sm,
                      borderTopWidth: 1,
                      borderTopColor: Colors.borderSubtle,
                    }}
                  >
                    <Text
                      style={{
                        ...Type.caption,
                        fontWeight: "600",
                        color: Colors.accent,
                      }}
                    >
                      View Program Detail & Audit Records
                    </Text>
                    <ChevronRight size={16} color={Colors.accent} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
