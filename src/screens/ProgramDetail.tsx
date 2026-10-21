import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { Colors, Radii, Spacing, Type } from "../constants/design";
import { dataProvider } from "../services";
import { Program } from "../types";

interface ProgramDetailProps {
  program: Program;
  onBack: () => void;
}

const getStatusColor = (status: Program["status"]) => {
  switch (status) {
    case "active":
      return Colors.accent;
    case "completed":
      return Colors.success;
    case "cancelled":
      return Colors.danger;
    case "pending_approval":
    case "pending_audit":
    case "pending_admin_review":
      return Colors.warning;
    default:
      return Colors.textSecondary;
  }
};

const DetailMetric: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
}> = ({ icon, label, value }) => (
  <View
    style={{
      flex: 1,
      minWidth: 180,
      padding: Spacing.lg,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surfaceCard,
    }}
  >
    <View style={{ marginBottom: Spacing.md }}>{icon}</View>
    <Text
      style={{
        ...Type.eyebrow,
        fontSize: 10,
        color: Colors.textTertiary,
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        ...Type.bodyStrong,
        color: Colors.textPrimary,
        marginTop: Spacing.xs,
      }}
    >
      {value}
    </Text>
  </View>
);

export const ProgramDetail: React.FC<ProgramDetailProps> = ({
  program: initialProgram,
  onBack,
}) => {
  const [program, setProgram] = useState(initialProgram);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataProvider
      .getProgramById(initialProgram.id)
      .then((detail) => {
        if (detail) setProgram(detail);
      })
      .catch((error) =>
        Toast.show({
          type: "error",
          text1: "Unable to load program details",
          text2: error?.message || "Try again.",
        }),
      )
      .finally(() => setLoading(false));
  }, [initialProgram.id]);

  const members = program.teamMembers || [];
  const status = program.status.replace(/_/g, " ").toUpperCase();
  const statusColor = getStatusColor(program.status);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.surface }}
      contentContainerStyle={{ paddingBottom: Spacing["5xl"] }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1180,
          alignSelf: "center",
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing["2xl"],
          paddingBottom: Spacing["3xl"],
        }}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={onBack}
          style={{
            marginBottom: Spacing["2xl"],
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.sm,
            alignSelf: "flex-start",
          }}
        >
          <View
            style={{
              padding: Spacing.sm,
              borderRadius: Radii.md,
              borderWidth: 1,
              borderColor: Colors.border,
              backgroundColor: Colors.surfaceInput,
            }}
          >
            <ArrowLeft size={17} color={Colors.accent} />
          </View>
          <Text
            style={{
              ...Type.caption,
              fontWeight: "700",
              color: Colors.textSecondary,
            }}
          >
            Back to workspace
          </Text>
        </TouchableOpacity>

        {/* Header */}
        <View
          style={{
            marginBottom: Spacing["2xl"],
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: Spacing.lg,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                ...Type.eyebrow,
                color: Colors.accent,
                marginBottom: Spacing.sm,
              }}
            >
              PROGRAM / FIELD DETAIL
            </Text>
            <Text style={{ ...Type.h1, color: Colors.textPrimary }}>
              {program.programName}
            </Text>
            <View
              style={{
                marginTop: Spacing.md,
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.sm,
              }}
            >
              <MapPin size={15} color={Colors.textTertiary} />
              <Text style={{ ...Type.caption, color: Colors.textSecondary }}>
                {program.hatcheryOrFarmName}
              </Text>
            </View>
          </View>
          <View
            style={{
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
              borderRadius: Radii.md,
              borderWidth: 1,
              borderColor: `${statusColor}55`,
              backgroundColor: `${statusColor}1A`,
            }}
          >
            <Text
              style={{
                ...Type.eyebrow,
                fontSize: 10,
                color: statusColor,
              }}
            >
              {status}
            </Text>
          </View>
        </View>

        {/* Metrics Row */}
        <View
          style={{
            marginBottom: Spacing.xl,
            flexDirection: "row",
            flexWrap: "wrap",
            gap: Spacing.md,
          }}
        >
          <DetailMetric
            icon={<Users size={17} color={Colors.accent} />}
            label="Flock size"
            value={`${program.flockSize.toLocaleString()} birds`}
          />
          <DetailMetric
            icon={<CalendarDays size={17} color={Colors.info} />}
            label="Schedule"
            value={program.scheduledStartDate}
          />
          <DetailMetric
            icon={<Clock3 size={17} color={Colors.warning} />}
            label="Window"
            value={`${program.scheduledStartTime} - ${program.scheduledEndTime}`}
          />
        </View>

        {/* Main Content Layout */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: Spacing.lg,
          }}
        >
          {/* Left Column */}
          <View style={{ flex: 1, minWidth: 320, gap: Spacing.lg }}>
            {/* Assigned Team */}
            <View
              style={{
                padding: Spacing.xl,
                borderRadius: Radii.lg,
                borderWidth: 1,
                borderColor: Colors.border,
                backgroundColor: Colors.surfaceCard,
              }}
            >
              <View
                style={{
                  marginBottom: Spacing.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.md,
                }}
              >
                <View
                  style={{
                    padding: Spacing.sm,
                    borderRadius: Radii.sm,
                    backgroundColor: Colors.accentSubtle,
                    borderWidth: 1,
                    borderColor: Colors.accentBorder,
                  }}
                >
                  <Users size={18} color={Colors.accent} />
                </View>
                <View>
                  <Text style={{ ...Type.h3, color: Colors.textPrimary }}>
                    Assigned team
                  </Text>
                  <Text
                    style={{
                      ...Type.caption,
                      color: Colors.textSecondary,
                      marginTop: Spacing.xs,
                    }}
                  >
                    {members.length} people assigned to this program
                  </Text>
                </View>
              </View>

              {loading ? (
                <ActivityIndicator color={Colors.accent} />
              ) : members.length === 0 ? (
                <Text
                  style={{
                    ...Type.caption,
                    color: Colors.textTertiary,
                    textAlign: "center",
                    paddingVertical: Spacing["3xl"],
                  }}
                >
                  No team members are assigned.
                </Text>
              ) : (
                members.map((member) => (
                  <View
                    key={member.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.md,
                      borderTopWidth: 1,
                      borderTopColor: Colors.borderSubtle,
                      paddingVertical: Spacing.md,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: Radii.pill,
                        backgroundColor: Colors.accentSubtle,
                        borderWidth: 1,
                        borderColor: Colors.accentBorder,
                      }}
                    >
                      <Text
                        style={{
                          ...Type.eyebrow,
                          fontSize: 10,
                          color: Colors.accent,
                        }}
                      >
                        {member.fullName
                          .split(/\s+/)
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          ...Type.bodyStrong,
                          color: Colors.textPrimary,
                        }}
                      >
                        {member.fullName}
                      </Text>
                      <Text
                        style={{
                          ...Type.caption,
                          color: Colors.textTertiary,
                          marginTop: 2,
                        }}
                      >
                        {member.employeeCode || member.email}
                      </Text>
                    </View>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 9,
                        color: Colors.textSecondary,
                      }}
                    >
                      {member.role.replace(/_/g, " ")}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Program Notes */}
            <View
              style={{
                padding: Spacing.xl,
                borderRadius: Radii.lg,
                borderWidth: 1,
                borderColor: Colors.border,
                backgroundColor: Colors.surfaceCard,
              }}
            >
              <Text
                style={{
                  ...Type.h3,
                  color: Colors.textPrimary,
                  marginBottom: Spacing.md,
                }}
              >
                Program notes
              </Text>
              <Text
                style={{
                  ...Type.body,
                  color: Colors.textSecondary,
                  lineHeight: 24,
                }}
              >
                {program.controllerRemarks ||
                  "No operational notes have been added to this program."}
              </Text>
            </View>
          </View>

          {/* Right Column */}
          <View style={{ width: 340, maxWidth: "100%", gap: Spacing.lg }}>
            {/* Control Card */}
            <View
              style={{
                padding: Spacing.xl,
                borderRadius: Radii.lg,
                backgroundColor: Colors.surfaceElevated,
                borderWidth: 1,
                borderColor: Colors.border,
              }}
            >
              <View
                style={{
                  marginBottom: Spacing.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.sm,
                }}
              >
                <ShieldCheck size={18} color={Colors.accent} />
                <Text
                  style={{
                    ...Type.eyebrow,
                    fontSize: 10,
                    color: Colors.accent,
                  }}
                >
                  PROGRAM CONTROL
                </Text>
              </View>

              <Text
                style={{
                  ...Type.eyebrow,
                  fontSize: 9,
                  color: Colors.textTertiary,
                }}
              >
                CONTROLLER
              </Text>
              <Text
                style={{
                  ...Type.bodyStrong,
                  color: Colors.textPrimary,
                  marginTop: Spacing.xs,
                }}
              >
                {program.controllerName || "Unassigned"}
              </Text>

              <Text
                style={{
                  ...Type.eyebrow,
                  fontSize: 9,
                  color: Colors.textTertiary,
                  marginTop: Spacing.lg,
                }}
              >
                AUDITOR
              </Text>
              <Text
                style={{
                  ...Type.bodyStrong,
                  color: Colors.textPrimary,
                  marginTop: Spacing.xs,
                }}
              >
                {program.auditorName || "Not assigned"}
              </Text>
            </View>

            {/* Vaccines Card */}
            <View
              style={{
                padding: Spacing.xl,
                borderRadius: Radii.lg,
                borderWidth: 1,
                borderColor: Colors.border,
                backgroundColor: Colors.surfaceCard,
              }}
            >
              <View
                style={{
                  marginBottom: Spacing.md,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.sm,
                }}
              >
                <CheckCircle2 size={17} color={Colors.success} />
                <Text style={{ ...Type.h3, color: Colors.textPrimary }}>
                  Vaccines
                </Text>
              </View>
              {(program.vaccinesUsed || ["Not specified"]).map((vaccine) => (
                <Text
                  key={vaccine}
                  style={{
                    ...Type.body,
                    color: Colors.textSecondary,
                    borderTopWidth: 1,
                    borderTopColor: Colors.borderSubtle,
                    paddingVertical: Spacing.md,
                  }}
                >
                  {vaccine}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
