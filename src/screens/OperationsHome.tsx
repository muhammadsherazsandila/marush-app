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
import { Colors } from "../constants/colors";
import { dataProvider } from "../services";
import { Program, UserProfile } from "../types";

interface OperationsHomeProps {
  currentUser: UserProfile;
  onOpenPrograms: () => void;
  onOpenProfile: () => void;
  onOpenProgram: (program: Program) => void;
}

const roleCopy: Record<UserProfile["role"], string> = {
  admin: "Operations command center",
  program_controller: "Program delivery workspace",
  program_auditor: "Quality assurance workspace",
  employee: "Field operations workspace",
};

const statusLabel: Record<Program["status"], string> = {
  draft: "Draft",
  pending_approval: "Awaiting approval",
  active: "In field",
  pending_audit: "Awaiting audit",
  pending_admin_review: "Awaiting admin review",
  completed: "Completed",
  cancelled: "Cancelled",
};

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

  const active = visiblePrograms.filter(
    (program) => program.status === "active",
  );
  const review = visiblePrograms.filter(
    (program) =>
      program.status === "pending_approval" ||
      program.status === "pending_audit",
  );
  const completed = visiblePrograms.filter(
    (program) => program.status === "completed",
  );
  const birds = visiblePrograms.reduce(
    (total, program) => total + program.flockSize,
    0,
  );
  const firstName = currentUser.fullName.trim().split(/\s+/)[0] || "there";

  return (
    <ScrollView
      className="flex-1 bg-[#F4F6F7]"
      contentContainerClassName="pb-12"
    >
      <View className="mx-auto w-full max-w-[1480px] px-5 py-6 md:px-10 md:py-9">
        <View className="mb-7 flex-row flex-wrap items-end justify-between gap-5">
          <View className="min-w-0 flex-1">
            <Text className="mb-2 text-[11px] font-bold uppercase tracking-[2px] text-[#2D766D]">
              {roleCopy[currentUser.role]}
            </Text>
            <Text className="text-3xl font-black tracking-[-1px] text-[#152A35] md:text-4xl">
              Good morning, {firstName}.
            </Text>
          </View>
          <TouchableOpacity
            className="flex-row items-center gap-2 rounded-xl border border-[#D7E1E4] bg-white px-4 py-3"
            onPress={refresh}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <RefreshCw size={16} color={Colors.primary} />
            )}
            <Text className="text-xs font-bold text-[#294D55]">
              Refresh data
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-6 flex-row flex-wrap gap-3">
          <Metric
            label="Programs in field"
            value={active.length}
            detail="Live operations"
            icon={<Activity size={18} color="#2D766D" />}
          />
          <Metric
            label="Awaiting action"
            value={review.length}
            detail="Reviews and approvals"
            icon={<Clock3 size={18} color="#AF741A" />}
          />
          <Metric
            label="Completed"
            value={completed.length}
            detail="Signed off programs"
            icon={<CheckCircle2 size={18} color="#397A61" />}
          />
          <Metric
            label="Birds covered"
            value={birds.toLocaleString()}
            detail="Across visible programs"
            icon={<Users size={18} color="#4B71A4" />}
          />
        </View>

        <View className="flex-row flex-wrap items-start gap-5">
          <View className="min-w-0 flex-1 gap-5 md:min-w-[520px]">
            <View className="rounded-2xl border border-[#DCE4E7] bg-white p-5 md:p-6">
              <PanelHeader
                title="Operational pulse"
                subtitle="The latest activity across your workspace"
              />
              {active.length === 0 ? (
                <EmptyState
                  icon={<Activity size={22} color="#2D766D" />}
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

            <View className="rounded-2xl border border-[#DCE4E7] bg-white p-5 md:p-6">
              <PanelHeader
                title="Recent programs"
                subtitle="Your latest field delivery records"
                action="View all"
                onAction={onOpenPrograms}
              />
              {visiblePrograms.length === 0 ? (
                <EmptyState
                  icon={<BriefcaseBusiness size={22} color="#2D766D" />}
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

          <View className="w-full gap-5 md:w-[340px]">
            <View className="overflow-hidden rounded-2xl bg-[#152A35] p-6">
              <View className="mb-8 flex-row items-center justify-between">
                <View className="rounded-xl bg-[#2D766D] p-2.5">
                  <ShieldCheck size={20} color="white" />
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="h-2 w-2 rounded-full bg-[#7FE0B6]" />
                  <Text className="text-[11px] font-bold text-[#B9D8D5]">
                    SYSTEM HEALTHY
                  </Text>
                </View>
              </View>
              <Text className="text-xl font-black text-white">
                Everything is under control.
              </Text>
              <Text className="mt-2 text-sm leading-5 text-[#A8BEC1]">
                Your workspace is synchronized with Marush field operations.
              </Text>
              <View className="mt-7 border-t border-white/10 pt-4">
                <Text className="text-[11px] text-[#8FA8AC]">SIGNED IN AS</Text>
                <Text className="mt-1 text-sm font-bold text-white">
                  {currentUser.email}
                </Text>
              </View>
            </View>

            <View className="rounded-2xl border border-[#DCE4E7] bg-white p-5">
              <PanelHeader
                title="Quick actions"
                subtitle="Common workspace tasks"
              />
              <QuickAction
                icon={<BriefcaseBusiness size={17} color="#2D766D" />}
                label="Browse programs"
                onPress={onOpenPrograms}
              />
              <QuickAction
                icon={<MapPin size={17} color="#2D766D" />}
                label="Review field activity"
                onPress={onOpenPrograms}
              />
              <QuickAction
                icon={<ShieldCheck size={17} color="#2D766D" />}
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

const Metric: React.FC<{
  label: string;
  value: string | number;
  detail: string;
  icon: React.ReactNode;
}> = ({ label, value, detail, icon }) => (
  <View className="min-w-[190px] flex-1 rounded-2xl border border-[#DCE4E7] bg-white p-5">
    <View className="mb-5 flex-row items-start justify-between">
      <Text className="text-xs font-bold text-[#6D7D83]">{label}</Text>
      <View className="rounded-lg bg-[#EFF5F3] p-2">{icon}</View>
    </View>
    <Text className="text-3xl font-black tracking-[-1px] text-[#152A35]">
      {value}
    </Text>
    <Text className="mt-1 text-xs text-[#8A989C]">{detail}</Text>
  </View>
);

const PanelHeader: React.FC<{
  title: string;
  subtitle: string;
  action?: string;
  onAction?: () => void;
}> = ({ title, subtitle, action, onAction }) => (
  <View className="mb-5 flex-row items-start justify-between gap-3">
    <View>
      <Text className="text-base font-black text-[#152A35]">{title}</Text>
      <Text className="mt-1 text-xs text-[#8A989C]">{subtitle}</Text>
    </View>
    {action && (
      <TouchableOpacity
        onPress={onAction}
        className="flex-row items-center gap-1"
      >
        <Text className="text-xs font-bold text-[#2D766D]">{action}</Text>
        <ArrowUpRight size={14} color="#2D766D" />
      </TouchableOpacity>
    )}
  </View>
);

const ProgramRow: React.FC<{
  program: Program;
  compact?: boolean;
  onPress: () => void;
}> = ({ program, compact, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-row items-center gap-3 border-t border-[#EDF0F1] py-4 ${compact ? "first:border-t-0 first:pt-0" : ""}`}
  >
    <View
      className={`h-10 w-10 items-center justify-center rounded-xl ${program.status === "active" ? "bg-[#E3F3ED]" : "bg-[#F1F4F5]"}`}
    >
      <BriefcaseBusiness
        size={17}
        color={program.status === "active" ? "#2D766D" : "#809096"}
      />
    </View>
    <View className="min-w-0 flex-1">
      <Text className="text-sm font-bold text-[#203944]" numberOfLines={1}>
        {program.programName}
      </Text>
      <Text className="mt-1 text-xs text-[#8A989C]" numberOfLines={1}>
        {program.hatcheryOrFarmName} · {program.flockSize.toLocaleString()}{" "}
        birds
      </Text>
    </View>
    <View className="items-end">
      <Text
        className={`text-[10px] font-bold uppercase tracking-wide ${program.status === "active" ? "text-[#2D766D]" : "text-[#89989D]"}`}
      >
        {statusLabel[program.status]}
      </Text>
      <ChevronRight size={15} color="#A6B2B6" />
    </View>
  </TouchableOpacity>
);

const QuickAction: React.FC<{
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center gap-3 border-t border-[#EDF0F1] py-3.5 first:border-t-0"
  >
    <View className="rounded-lg bg-[#EFF5F3] p-2">{icon}</View>
    <Text className="flex-1 text-sm font-bold text-[#29434D]">{label}</Text>
    <ChevronRight size={15} color="#A6B2B6" />
  </TouchableOpacity>
);

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  body: string;
}> = ({ icon, title, body }) => (
  <View className="items-center rounded-xl border border-dashed border-[#DCE4E7] bg-[#FAFBFB] px-6 py-10">
    <View className="mb-3 rounded-xl bg-[#EFF5F3] p-3">{icon}</View>
    <Text className="text-sm font-bold text-[#29434D]">{title}</Text>
    <Text className="mt-1 max-w-[280px] text-center text-xs leading-5 text-[#8A989C]">
      {body}
    </Text>
  </View>
);
