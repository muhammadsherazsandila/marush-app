import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

interface OperationsHomeProps {
  currentUser: UserProfile;
  onOpenPrograms: () => void;
  onOpenProfile: () => void;
  onOpenProgram: (program: Program) => void;
}

const ROLE_COPY: Record<UserProfile["role"], string> = {
  admin: "Operations command center",
  program_controller: "Program delivery workspace",
  program_auditor: "Quality assurance workspace",
  employee: "Field operations workspace",
};

const STATUS_LABEL: Record<Program["status"], string> = {
  draft: "Draft",
  pending_approval: "Awaiting approval",
  active: "In field",
  pending_audit: "Awaiting audit",
  pending_admin_review: "Awaiting admin review",
  completed: "Completed",
  cancelled: "Cancelled",
};

/* ── Sub-components ──────────────────────────────────────────── */

const Metric: React.FC<{
  label: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
  accent: string;
}> = ({ label, value, detail, icon, accent }) => (
  <View
    style={{
      flex: 1,
      minWidth: 190,
      padding: Spacing.xl,
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surfaceCard,
      borderLeftWidth: 3,
      borderLeftColor: accent,
    }}
  >
    <View
      style={{
        marginBottom: Spacing.xl,
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
    >
      <Text
        style={{
          ...Type.caption,
          fontWeight: "700",
          color: Colors.textSecondary,
          flex: 1,
        }}
      >
        {label}
      </Text>
      <View
        style={{
          padding: Spacing.sm,
          borderRadius: Radii.sm,
          backgroundColor: `${accent}1A`,
        }}
      >
        {icon}
      </View>
    </View>
    <Text style={{ ...Type.number, color: accent }}>{value}</Text>
    <Text
      style={{
        ...Type.caption,
        color: Colors.textTertiary,
        marginTop: Spacing.xs,
      }}
    >
      {detail}
    </Text>
  </View>
);

const PanelHeader: React.FC<{
  title: string;
  subtitle: string;
  action?: string;
  onAction?: () => void;
}> = ({ title, subtitle, action, onAction }) => (
  <View
    style={{
      marginBottom: Spacing.lg,
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: Spacing.md,
    }}
  >
    <View style={{ flex: 1 }}>
      <Text
        style={{
          ...Type.bodyStrong,
          fontWeight: "700",
          color: Colors.textPrimary,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          ...Type.caption,
          color: Colors.textTertiary,
          marginTop: Spacing.xs,
        }}
      >
        {subtitle}
      </Text>
    </View>
    {action ? (
      <TouchableOpacity
        onPress={onAction}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.xs,
        }}
      >
        <Text
          style={{
            ...Type.caption,
            fontWeight: "700",
            color: Colors.accent,
          }}
        >
          {action}
        </Text>
        <ArrowUpRight size={14} color={Colors.accent} />
      </TouchableOpacity>
    ) : null}
  </View>
);

const ProgramRow: React.FC<{
  program: Program;
  compact?: boolean;
  onPress: () => void;
}> = ({ program, compact, onPress }) => {
  const isActive = program.status === "active";
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.md,
        paddingVertical: Spacing.md + 2,
        borderTopWidth: 1,
        borderTopColor: Colors.borderSubtle,
        ...(compact
          ? { paddingTop: Spacing.sm, borderTopColor: Colors.borderSubtle }
          : {}),
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: Radii.md,
          backgroundColor: isActive ? Colors.accentSubtle : Colors.surfaceInput,
          borderWidth: 1,
          borderColor: isActive ? Colors.accentBorder : Colors.borderSubtle,
        }}
      >
        <BriefcaseBusiness
          size={17}
          color={isActive ? Colors.accent : Colors.textTertiary}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{ ...Type.bodyStrong, color: Colors.textPrimary }}
          numberOfLines={1}
        >
          {program.programName}
        </Text>
        <Text
          style={{
            ...Type.caption,
            color: Colors.textTertiary,
            marginTop: Spacing.xs,
          }}
          numberOfLines={1}
        >
          {program.hatcheryOrFarmName} · {program.flockSize.toLocaleString()}{" "}
          birds
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: Spacing.xs }}>
        <Text
          style={{
            ...Type.eyebrow,
            fontSize: 9,
            color: isActive ? Colors.accent : Colors.textTertiary,
          }}
        >
          {STATUS_LABEL[program.status]}
        </Text>
        <ChevronRight size={15} color={Colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
};

const QuickAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: Colors.borderSubtle,
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
      {icon}
    </View>
    <Text
      style={{
        flex: 1,
        ...Type.bodyStrong,
        color: Colors.textPrimary,
      }}
    >
      {label}
    </Text>
    <ChevronRight size={15} color={Colors.textTertiary} />
  </TouchableOpacity>
);

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  body: string;
}> = ({ icon, title, body }) => (
  <View
    style={{
      alignItems: "center",
      paddingHorizontal: Spacing["2xl"],
      paddingVertical: Spacing["3xl"],
      borderRadius: Radii.md,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: Colors.border,
      backgroundColor: Colors.surfaceInput,
    }}
  >
    <View
      style={{
        padding: Spacing.md,
        borderRadius: Radii.md,
        backgroundColor: Colors.accentSubtle,
        borderWidth: 1,
        borderColor: Colors.accentBorder,
        marginBottom: Spacing.md,
      }}
    >
      {icon}
    </View>
    <Text
      style={{
        ...Type.bodyStrong,
        color: Colors.textPrimary,
        textAlign: "center",
      }}
    >
      {title}
    </Text>
    <Text
      style={{
        ...Type.caption,
        color: Colors.textSecondary,
        textAlign: "center",
        maxWidth: 280,
        marginTop: Spacing.xs,
      }}
    >
      {body}
    </Text>
  </View>
);

/* ── Screen ──────────────────────────────────────────────────── */

export const OperationsHome: React.FC<OperationsHomeProps> = ({
  currentUser,
  onOpenPrograms,
  onOpenProfile,
  onOpenProgram,
}) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPrograms(await dataProvider.getPrograms());
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Unable to load workspace",
        text2: error?.message || "Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visiblePrograms = useMemo(() => {
    if (currentUser.role === "admin") return programs;
    return programs.filter(
      (program) =>
        program.controllerId === currentUser.id ||
        program.teamMemberIds.includes(currentUser.id),
    );
  }, [currentUser.id, currentUser.role, programs]);

  const active = visiblePrograms.filter((p) => p.status === "active");
  const review = visiblePrograms.filter(
    (p) => p.status === "pending_approval" || p.status === "pending_audit",
  );
  const completed = visiblePrograms.filter((p) => p.status === "completed");
  const birds = visiblePrograms.reduce((sum, p) => sum + p.flockSize, 0);
  const firstName = currentUser.fullName.trim().split(/\s+/)[0] || "there";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.surface }}
      contentContainerStyle={{ paddingBottom: Spacing["5xl"] }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1480,
          alignSelf: "center",
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing["2xl"],
          paddingBottom: Spacing["3xl"],
        }}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <View
          style={{
            marginBottom: Spacing["2xl"],
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-end",
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
              {ROLE_COPY[currentUser.role]}
            </Text>
            <Text style={{ ...Type.h1, color: Colors.textPrimary }}>
              Good morning, {firstName}.
            </Text>
          </View>
          <TouchableOpacity
            onPress={refresh}
            disabled={loading}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.sm,
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.md,
              borderRadius: Radii.md,
              borderWidth: 1,
              borderColor: Colors.border,
              backgroundColor: Colors.surfaceCard,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.accent} />
            ) : (
              <RefreshCw size={16} color={Colors.accent} />
            )}
            <Text
              style={{
                ...Type.caption,
                fontWeight: "700",
                color: Colors.textPrimary,
              }}
            >
              Refresh data
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Metrics row ─────────────────────────────────── */}
        <View
          style={{
            marginBottom: Spacing["2xl"],
            flexDirection: "row",
            flexWrap: "wrap",
            gap: Spacing.md,
          }}
        >
          <Metric
            label="Programs in field"
            value={active.length}
            detail="Live operations"
            icon={<Activity size={18} color={Colors.accent} />}
            accent={Colors.accent}
          />
          <Metric
            label="Awaiting action"
            value={review.length}
            detail="Reviews and approvals"
            icon={<Clock3 size={18} color={Colors.warning} />}
            accent={Colors.warning}
          />
          <Metric
            label="Completed"
            value={completed.length}
            detail="Signed off programs"
            icon={<CheckCircle2 size={18} color={Colors.success} />}
            accent={Colors.success}
          />
          <Metric
            label="Birds covered"
            value={birds.toLocaleString()}
            detail="Across visible programs"
            icon={<Users size={18} color={Colors.info} />}
            accent={Colors.info}
          />
        </View>

        {/* ── Panels ──────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: Spacing.lg,
          }}
        >
          {/* Main column */}
          <View
            style={{
              flex: 1,
              minWidth: 320,
              gap: Spacing.lg,
            }}
          >
            {/* Operational pulse */}
            <View
              style={{
                padding: Spacing.xl,
                borderRadius: Radii.lg,
                borderWidth: 1,
                borderColor: Colors.border,
                backgroundColor: Colors.surfaceCard,
              }}
            >
              <PanelHeader
                title="Operational pulse"
                subtitle="The latest activity across your workspace"
              />
              {active.length === 0 ? (
                <EmptyState
                  icon={<Activity size={22} color={Colors.accent} />}
                  title="No live programs right now"
                  body="When a vaccination program starts, its live status will appear here."
                />
              ) : (
                active
                  .slice(0, 4)
                  .map((program) => (
                    <ProgramRow
                      key={program.id}
                      program={program}
                      onPress={() => onOpenProgram(program)}
                    />
                  ))
              )}
            </View>

            {/* Recent programs */}
            <View
              style={{
                padding: Spacing.xl,
                borderRadius: Radii.lg,
                borderWidth: 1,
                borderColor: Colors.border,
                backgroundColor: Colors.surfaceCard,
              }}
            >
              <PanelHeader
                title="Recent programs"
                subtitle="Your latest field delivery records"
                action="View all"
                onAction={onOpenPrograms}
              />
              {visiblePrograms.length === 0 ? (
                <EmptyState
                  icon={<BriefcaseBusiness size={22} color={Colors.accent} />}
                  title="Your workspace is ready"
                  body="Programs will appear here as soon as they are assigned or created."
                />
              ) : (
                visiblePrograms
                  .slice(0, 4)
                  .map((program) => (
                    <ProgramRow
                      key={program.id}
                      program={program}
                      compact
                      onPress={() => onOpenProgram(program)}
                    />
                  ))
              )}
            </View>
          </View>

          {/* Side column */}
          <View style={{ width: 340, maxWidth: "100%", gap: Spacing.lg }}>
            {/* System status card — dark elevated */}
            <View
              style={{
                overflow: "hidden",
                padding: Spacing["2xl"],
                borderRadius: Radii.lg,
                backgroundColor: Colors.surfaceElevated,
                borderWidth: 1,
                borderColor: Colors.border,
                ...Shadows.card,
              }}
            >
              <View
                style={{
                  marginBottom: Spacing["3xl"],
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    padding: Spacing.sm + 2,
                    borderRadius: Radii.md,
                    backgroundColor: Colors.accentSubtle,
                    borderWidth: 1,
                    borderColor: Colors.accentBorder,
                  }}
                >
                  <ShieldCheck size={20} color={Colors.accent} />
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
                      ...Type.eyebrow,
                      fontSize: 10,
                      color: Colors.success,
                    }}
                  >
                    System healthy
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  ...Type.h2,
                  color: Colors.textPrimary,
                }}
              >
                Everything is under control.
              </Text>
              <Text
                style={{
                  ...Type.caption,
                  color: Colors.textSecondary,
                  marginTop: Spacing.sm,
                  lineHeight: 20,
                }}
              >
                Your workspace is synchronized with Marush field operations.
              </Text>
              <View
                style={{
                  marginTop: Spacing["2xl"],
                  paddingTop: Spacing.lg,
                  borderTopWidth: 1,
                  borderTopColor: Colors.borderSubtle,
                }}
              >
                <Text
                  style={{
                    ...Type.eyebrow,
                    fontSize: 10,
                    color: Colors.textTertiary,
                  }}
                >
                  Signed in as
                </Text>
                <Text
                  style={{
                    ...Type.bodyStrong,
                    color: Colors.textPrimary,
                    marginTop: Spacing.xs,
                  }}
                  numberOfLines={1}
                >
                  {currentUser.email || currentUser.fullName}
                </Text>
              </View>
            </View>

            {/* Quick actions */}
            <View
              style={{
                padding: Spacing.xl,
                borderRadius: Radii.lg,
                borderWidth: 1,
                borderColor: Colors.border,
                backgroundColor: Colors.surfaceCard,
              }}
            >
              <PanelHeader
                title="Quick actions"
                subtitle="Common workspace tasks"
              />
              <QuickAction
                icon={<BriefcaseBusiness size={17} color={Colors.accent} />}
                label="Browse programs"
                onPress={onOpenPrograms}
              />
              <QuickAction
                icon={<MapPin size={17} color={Colors.accent} />}
                label="Review field activity"
                onPress={onOpenPrograms}
              />
              <QuickAction
                icon={<ShieldCheck size={17} color={Colors.accent} />}
                label="Open account security"
                onPress={onOpenProfile}
              />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
