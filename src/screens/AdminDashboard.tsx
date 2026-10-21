// AdminDashboard.tsx
import {
  Activity,
  Check,
  Clock3,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useConfirmDialog } from "../components/ConfirmDialog";
import { Colors, Radii, Spacing, Type } from "../constants/design";
import { dataProvider } from "../services";
import { Program, UserProfile, UserRole } from "../types";
import { PendingProgramCard, PendingUserCard } from "./admin/ApprovalCard";
import { AuditorAssignmentModal } from "./admin/AuditorAssignmentModal";
import { EmployeeCard } from "./admin/EmployeeCard";
import { EmployeeFormModal } from "./admin/EmployeeFormModal";
import { MetricCard } from "./admin/MetricCard";
import { ProgramCard } from "./admin/ProgramCard";
import { ProgramInspectionModal } from "./admin/ProgramInspectionModal";
import { S } from "./admin/styles";
import { TabBar, TabDef } from "./admin/TabBar";

interface AdminDashboardProps {
  currentUser: UserProfile;
  activeArea: "overview" | "programs" | "employees";
  onSelfDeleted?: () => void;
  onOpenProgram?: (program: Program) => void;
}

type TabType =
  | "overview"
  | "all_programs"
  | "programs"
  | "active_programs"
  | "pending_admin_review"
  | "employees"
  | "approvals";

const PROGRAM_VIEW_TABS: TabType[] = [
  "all_programs",
  "active_programs",
  "pending_admin_review",
  "programs",
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeArea,
  currentUser,
  onSelfDeleted,
  onOpenProgram,
}) => {
  // ── Data
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState<
    "all" | UserRole
  >("all");

  // ── Employee modal
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<UserProfile | null>(null);
  const [empFullName, setEmpFullName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empRole, setEmpRole] = useState<UserRole>("employee");
  const [empPhone, setEmpPhone] = useState("");
  const [empCode, setEmpCode] = useState("");

  // ── Program modals / detail navigation
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const handleProgramClick = (prog: Program) => {
    if (onOpenProgram) {
      onOpenProgram(prog);
    } else {
      setSelectedProgram(prog);
    }
  };
  const [programForAuditorAssignment, setProgramForAuditorAssignment] =
    useState<Program | null>(null);
  const [selectedAuditorId, setSelectedAuditorId] = useState("");
  const [savingAuditor, setSavingAuditor] = useState(false);

  const { confirm, ConfirmDialogElement } = useConfirmDialog();
  const isSuperUser = !!(currentUser.isSuperAdmin || currentUser.isDeveloper);

  // ── Load
  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [latestUsers, latestPrograms] = await Promise.all([
        dataProvider.getUsers(),
        dataProvider.getPrograms(),
      ]);
      setUsers(latestUsers);
      setPrograms(latestPrograms);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Unable to load administration data",
        text2: error?.message || "Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    setActiveTab(
      activeArea === "employees"
        ? "employees"
        : activeArea === "programs"
          ? "all_programs"
          : "overview",
    );
    setSearchQuery("");
  }, [activeArea]);

  // ── Derived lists
  const completedPrograms = useMemo(
    () => programs.filter((p) => p.status === "completed"),
    [programs],
  );
  const activeProgramsList = useMemo(
    () => programs.filter((p) => p.status === "active"),
    [programs],
  );
  const pendingTeamPrograms = useMemo(
    () => programs.filter((p) => p.status === "pending_approval"),
    [programs],
  );
  const pendingAdminReviewPrograms = useMemo(
    () =>
      programs.filter(
        (p) =>
          p.status === "pending_admin_review" || p.status === "pending_audit",
      ),
    [programs],
  );
  const pendingUsers = useMemo(
    () => users.filter((u) => u.status === "pending"),
    [users],
  );
  const availableAuditors = useMemo(
    () =>
      users.filter(
        (u) => u.role === "program_auditor" && u.status === "approved",
      ),
    [users],
  );

  const busyAuditorMap = useMemo(() => {
    const map = new Map<string, string>();
    programs.forEach((p) => {
      if (
        p.auditorId &&
        p.status !== "completed" &&
        p.status !== "cancelled"
      ) {
        map.set(p.auditorId, p.programName);
      }
    });
    return map;
  }, [programs]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.employeeCode && u.employeeCode.toLowerCase().includes(q)),
    );
  }, [users, searchQuery]);

  const visibleEmployees = useMemo(
    () =>
      filteredUsers.filter(
        (u) => employeeRoleFilter === "all" || u.role === employeeRoleFilter,
      ),
    [filteredUsers, employeeRoleFilter],
  );

  const filteredCompletedPrograms = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return completedPrograms.filter(
      (p) =>
        p.programName.toLowerCase().includes(q) ||
        p.hatcheryOrFarmName.toLowerCase().includes(q) ||
        (p.controllerName && p.controllerName.toLowerCase().includes(q)),
    );
  }, [completedPrograms, searchQuery]);

  const approvedEmployeeCount = users.filter(
    (u) => u.status === "approved",
  ).length;
  const pendingEmployeeCount = users.filter(
    (u) => u.status === "pending",
  ).length;

  // ── Tabs
  const isProgramView =
    activeArea === "programs" || PROGRAM_VIEW_TABS.includes(activeTab);

  const tabs: TabDef[] = isProgramView
    ? [
        { id: "all_programs", label: `All (${programs.length})` },
        {
          id: "active_programs",
          label: `Active (${activeProgramsList.length})`,
        },
        {
          id: "approvals",
          label: `Awaiting approval (${pendingTeamPrograms.length})`,
        },
        {
          id: "pending_admin_review",
          label: `Awaiting completion (${pendingAdminReviewPrograms.length})`,
        },
        { id: "programs", label: `Completed (${completedPrograms.length})` },
        { id: "employees", label: `Employees (${users.length})` },
      ]
    : [
        { id: "overview", label: "Overview" },
        { id: "employees", label: `Employees (${users.length})` },
        {
          id: "approvals",
          label: `Access requests (${pendingUsers.length})`,
        },
      ];

  // ── Employee CRUD
  const handleOpenAddEmp = () => {
    setEditingEmp(null);
    setEmpFullName("");
    setEmpEmail("");
    setEmpRole("employee");
    setEmpPhone("");
    setEmpCode(`MRSH-EMP-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsEmpModalOpen(true);
  };

  const handleOpenEditEmp = (emp: UserProfile) => {
    if (emp.role !== "employee") {
      Toast.show({
        type: "error",
        text1: "Action Not Permitted",
        text2: "Only field employee names can be edited.",
      });
      return;
    }
    setEditingEmp(emp);
    setEmpFullName(emp.fullName);
    setEmpEmail(emp.email || "");
    setEmpRole(emp.role);
    setEmpPhone(emp.phone || "");
    setEmpCode(emp.employeeCode || "");
    setIsEmpModalOpen(true);
  };

  const handleSaveEmployee = async () => {
    if (!empFullName.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Full name is required.",
      });
      return;
    }
    if (empRole !== "employee" && !empEmail.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Email is required for this role.",
      });
      return;
    }

    if (editingEmp) {
      if (editingEmp.role !== "employee") {
        Toast.show({
          type: "error",
          text1: "Action Not Permitted",
          text2: "Only field employee names can be edited.",
        });
        return;
      }
      try {
        await dataProvider.updateEmployeeName(editingEmp.id, empFullName.trim());
        Toast.show({
          type: "success",
          text1: "Name Updated",
          text2: `Employee name updated to "${empFullName.trim()}".`,
        });
      } catch (err: any) {
        Toast.show({
          type: "error",
          text1: "Update Failed",
          text2: err?.message || "Could not update employee name.",
        });
        return;
      }
    } else {
      const assignedCode =
        empCode.trim() || `MRSH-EMP-${Math.floor(1000 + Math.random() * 9000)}`;
      await dataProvider.addUser({
        fullName: empFullName.trim(),
        email: empEmail.trim() || undefined,
        role: empRole,
        status: "approved",
        phone: empPhone.trim() || undefined,
        employeeCode: assignedCode,
      });
      Toast.show({
        type: "success",
        text1: "Employee Added",
        text2: `${empFullName} registered with ID ${assignedCode}.`,
      });
    }

    setIsEmpModalOpen(false);
    refreshData();
  };

  const handleDeleteEmployee = (targetUser: UserProfile) => {
    const isSelf = targetUser.id === currentUser.id;
    if (isSelf && (currentUser.isSuperAdmin || currentUser.isDeveloper)) {
      Toast.show({
        type: "error",
        text1: "Action Not Permitted",
        text2: "Super user accounts cannot delete themselves.",
      });
      return;
    }
    if (
      (targetUser.role === "admin" ||
        targetUser.isSuperAdmin ||
        targetUser.isDeveloper) &&
      !isSuperUser
    ) {
      Toast.show({
        type: "error",
        text1: "Action Not Permitted",
        text2:
          "Administrator accounts cannot be deleted. Contact the developer.",
      });
      return;
    }

    confirm({
      title:
        targetUser.role === "admin"
          ? "Delete Administrator"
          : "Delete Employee",
      message: `Are you sure you want to permanently delete "${targetUser.fullName || targetUser.email}"? This action cannot be undone.`,
      confirmText:
        targetUser.role === "admin"
          ? "Delete Administrator"
          : "Delete Employee",
      cancelText: "Cancel",
      variant: "danger",
      icon: "trash",
      onConfirm: async () => {
        try {
          await dataProvider.deleteUser(targetUser.id);
          if (isSelf) {
            Toast.show({
              type: "info",
              text1: "Account deleted",
              text2: "You have been signed out.",
            });
            onSelfDeleted?.();
            return;
          }
          Toast.show({
            type: "info",
            text1: "Deleted",
            text2: `${targetUser.fullName || "Employee"} removed.`,
          });
          refreshData();
        } catch (err: any) {
          Toast.show({
            type: "error",
            text1: "Deletion Failed",
            text2: err?.message || "Could not delete employee.",
          });
        }
      },
    });
  };

  // ── Approvals
  const handleApproveUser = (targetUser: UserProfile) => {
    confirm({
      title: "Approve User Access",
      message: `Grant access to "${targetUser.fullName || targetUser.email}" with role "${(targetUser.requestedRole || targetUser.role).replace(/_/g, " ").toUpperCase()}"?`,
      confirmText: "Approve Access",
      cancelText: "Cancel",
      variant: "primary",
      icon: "user-check",
      onConfirm: async () => {
        await dataProvider.updateUserStatus(targetUser.id, "approved");
        Toast.show({
          type: "success",
          text1: "User Approved",
          text2: `${targetUser.fullName} account verified.`,
        });
        refreshData();
      },
    });
  };

  const handleRejectUser = (targetUser: UserProfile) => {
    confirm({
      title: "Decline User Access",
      message: `Are you sure you want to reject the registration request for "${targetUser.fullName || targetUser.email}"?`,
      confirmText: "Reject Request",
      cancelText: "Cancel",
      variant: "danger",
      icon: "user-x",
      onConfirm: async () => {
        await dataProvider.updateUserStatus(targetUser.id, "rejected");
        Toast.show({
          type: "error",
          text1: "User Rejected",
          text2: `${targetUser.fullName} account access declined.`,
        });
        refreshData();
      },
    });
  };

  // ── Auditor assignment
  const openAuditorAssignment = (program: Program) => {
    setProgramForAuditorAssignment(program);
    setSelectedAuditorId(program.auditorId || "");
  };

  const saveAuditorAssignment = async () => {
    if (!programForAuditorAssignment || !selectedAuditorId) return;
    const busyProg = busyAuditorMap.get(selectedAuditorId);
    if (busyProg && programForAuditorAssignment.auditorId !== selectedAuditorId) {
      Toast.show({
        type: "error",
        text1: "Auditor Unavailable",
        text2: `This auditor is already assigned to ongoing program "${busyProg}".`,
      });
      return;
    }
    setSavingAuditor(true);
    try {
      await dataProvider.assignProgramAuditor(
        programForAuditorAssignment.id,
        selectedAuditorId,
      );
      Toast.show({
        type: "success",
        text1: "Auditor Assigned",
        text2: "The program is ready for admin approval.",
      });
      setProgramForAuditorAssignment(null);
      refreshData();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Unable to assign auditor",
        text2: error?.message || "Try again.",
      });
    } finally {
      setSavingAuditor(false);
    }
  };

  const handleApproveAndStartProgram = (program: Program) => {
    if (!program.auditorId) {
      Toast.show({
        type: "error",
        text1: "Auditor Required",
        text2:
          "Assign an approved program auditor before approving this program.",
      });
      return;
    }
    const busyProg = busyAuditorMap.get(program.auditorId);
    if (busyProg && busyProg !== program.programName) {
      Toast.show({
        type: "error",
        text1: "Auditor Unavailable",
        text2: `Assigned auditor is already active on "${busyProg}". An auditor cannot be on multiple programs at the same time.`,
      });
      return;
    }
    confirm({
      title: "Approve & Start Program",
      message: `Approve "${program.programName}" and start its field team with ${program.auditorName || "the assigned auditor"}?`,
      confirmText: "Approve & Start",
      cancelText: "Cancel",
      variant: "primary",
      icon: "check",
      onConfirm: async () => {
        try {
          await dataProvider.approveProgramAndStart(
            program.id,
            program.auditorId!,
          );
          Toast.show({
            type: "success",
            text1: "Program Approved",
            text2: `${program.programName} is now active.`,
          });
          refreshData();
        } catch (error: any) {
          Toast.show({
            type: "error",
            text1: "Unable to approve program",
            text2: error?.message || "Assign an auditor and try again.",
          });
        }
      },
    });
  };

  const handleCompleteProgramReview = (prog: Program) => {
    confirm({
      title: "Complete Program Review",
      message: `Mark "${prog.programName}" as completed?`,
      confirmText: "Mark Completed",
      cancelText: "Cancel",
      variant: "primary",
      icon: "check",
      onConfirm: async () => {
        try {
          await dataProvider.completeProgramReview(prog.id);
          Toast.show({
            type: "success",
            text1: "Program Completed",
            text2: `${prog.programName} was marked as completed.`,
          });
          setSelectedProgram(null);
          refreshData();
        } catch (error: any) {
          Toast.show({
            type: "error",
            text1: "Unable to complete program",
            text2: error?.message || "Please try again.",
          });
        }
      },
    });
  };

  // ── Render
  return (
    <View style={S.container}>
      <TabBar
        tabs={tabs}
        activeTab={activeTab}
        loading={loading}
        onTabPress={(id) => {
          setActiveTab(id as TabType);
          setSearchQuery("");
        }}
        onRefresh={refreshData}
      />

      <ScrollView contentContainerStyle={S.content}>
        {/* ── OVERVIEW ─────────────────────────────────────── */}
        {activeTab === "overview" && (
          <View style={S.tabSection}>
            <View style={S.pageHeader}>
              <View style={S.pageHeaderCopy}>
                <Text style={S.eyebrow}>ADMINISTRATION / OVERVIEW</Text>
                <Text style={S.sectionHeading}>Good morning, Admin</Text>
                <Text style={S.sectionDescription}>
                  Here is what is happening across your vaccination operations
                  today.
                </Text>
              </View>
              <View style={S.statusPill}>
                <Activity size={14} color={Colors.accent} strokeWidth={2.5} />
                <Text style={S.statusPillText}>Live overview</Text>
              </View>
            </View>

            <View style={S.metricsGrid}>
              <MetricCard
                icon={
                  <Check size={16} color={Colors.accent} strokeWidth={2.5} />
                }
                trendLabel="Completed"
                value={completedPrograms.length}
                supportingText="Programs completed"
                accent={Colors.accent}
                onPress={() => setActiveTab("programs")}
                accessibilityLabel="View completed programs"
              />
              <MetricCard
                icon={
                  <Activity size={16} color={Colors.accent} strokeWidth={2.5} />
                }
                trendLabel="In progress"
                value={activeProgramsList.length}
                supportingText="Programs active now"
                accent={Colors.accent}
                onPress={() => setActiveTab("active_programs")}
                accessibilityLabel="View active programs"
              />
              <MetricCard
                icon={
                  <Users size={16} color={Colors.warning} strokeWidth={2.5} />
                }
                trendLabel="Needs review"
                value={pendingTeamPrograms.length}
                supportingText="Team approvals pending"
                accent={Colors.warning}
                onPress={() => setActiveTab("approvals")}
                accessibilityLabel="View pending team approvals"
              />
              <MetricCard
                icon={
                  <ShieldCheck
                    size={16}
                    color={Colors.info}
                    strokeWidth={2.5}
                  />
                }
                trendLabel="Access"
                value={pendingUsers.length}
                supportingText="Staff signups pending"
                accent={Colors.info}
                onPress={() => setActiveTab("approvals")}
                accessibilityLabel="View pending staff access requests"
              />
            </View>

            <View style={S.recentSection}>
              <View style={S.sectionHeaderRow}>
                <View>
                  <Text style={S.subHeading}>Active programs in the field</Text>
                  <Text style={S.sectionCaption}>
                    A quick view of current operations
                  </Text>
                </View>
                {activeProgramsList.length > 0 && (
                  <Text style={S.countCaption}>
                    {activeProgramsList.length} active
                  </Text>
                )}
              </View>
              {activeProgramsList.length === 0 ? (
                <View style={S.emptyBox}>
                  <Activity size={20} color={Colors.accent} />
                  <Text style={[S.emptyTitle, { marginTop: Spacing.sm }]}>
                    No active programs yet
                  </Text>
                  <Text style={S.emptyText}>
                    When a program starts, its live status will appear here.
                  </Text>
                </View>
              ) : (
                activeProgramsList.map((prog) => (
                  <ProgramCard key={prog.id} program={prog} />
                ))
              )}
            </View>
          </View>
        )}

        {/* ── ALL PROGRAMS ─────────────────────────────────── */}
        {activeTab === "all_programs" && (
          <View style={S.tabSection}>
            <Text style={S.sectionHeading}>All programs</Text>
            {programs.length === 0 ? (
              <View style={S.emptyBox}>
                <Text style={S.emptyText}>
                  No programs have been created yet.
                </Text>
              </View>
            ) : (
              programs.map((prog) => (
                <ProgramCard
                  key={prog.id}
                  program={prog}
                  onPress={() => handleProgramClick(prog)}
                />
              ))
            )}
          </View>
        )}

        {/* ── ACTIVE PROGRAMS ──────────────────────────────── */}
        {activeTab === "active_programs" && (
          <View style={S.tabSection}>
            <Text style={S.sectionHeading}>Currently Active Programs</Text>
            {activeProgramsList.length === 0 ? (
              <View style={S.emptyBox}>
                <Text style={S.emptyText}>
                  No programs are currently running.
                </Text>
              </View>
            ) : (
              activeProgramsList.map((prog) => (
                <ProgramCard
                  key={prog.id}
                  program={prog}
                  showAuditor
                  footer={
                    <View style={S.progDetailBox}>
                      <Text style={S.progDetailText}>
                        <Text style={S.bold}>Scheduled:</Text>{" "}
                        {prog.scheduledStartDate} ({prog.scheduledStartTime} –{" "}
                        {prog.scheduledEndTime})
                      </Text>
                      <Text style={S.progDetailText}>
                        <Text style={S.bold}>Assigned Staff:</Text>{" "}
                        {prog.teamMemberIds.length} members
                      </Text>
                    </View>
                  }
                />
              ))
            )}
          </View>
        )}

        {/* ── PENDING ADMIN REVIEW ─────────────────────────── */}
        {activeTab === "pending_admin_review" && (
          <View style={S.tabSection}>
            <Text style={S.sectionHeading}>
              Completed programs awaiting admin review
            </Text>
            {pendingAdminReviewPrograms.length === 0 ? (
              <View style={S.emptyBox}>
                <Text style={S.emptyText}>
                  No completed programs are awaiting review.
                </Text>
              </View>
            ) : (
              pendingAdminReviewPrograms.map((prog) => (
                <ProgramCard
                  key={prog.id}
                  program={prog}
                  onPress={() => handleProgramClick(prog)}
                  showAuditor
                  footer={
                    <TouchableOpacity
                      onPress={() => handleCompleteProgramReview(prog)}
                      style={{
                        marginTop: Spacing.md,
                        paddingVertical: Spacing.sm + 2,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.accent,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          ...Type.caption,
                          fontWeight: "700",
                          color: Colors.white,
                        }}
                      >
                        Mark Completed
                      </Text>
                    </TouchableOpacity>
                  }
                />
              ))
            )}
          </View>
        )}

        {/* ── COMPLETED PROGRAMS ───────────────────────────── */}
        {activeTab === "programs" && (
          <View style={S.tabSection}>
            <Text style={S.sectionHeading}>Completed Programs Archive</Text>
            <TextInput
              style={S.searchBar}
              placeholder="Search programs by name, location, or controller..."
              placeholderTextColor={Colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {filteredCompletedPrograms.length === 0 ? (
              <View style={S.emptyBox}>
                <Text style={S.emptyText}>
                  No matching completed programs found.
                </Text>
              </View>
            ) : (
              filteredCompletedPrograms.map((prog) => (
                <ProgramCard
                  key={prog.id}
                  program={prog}
                  onPress={() => handleProgramClick(prog)}
                  showAuditor
                  showScore
                  showRemarks
                />
              ))
            )}
          </View>
        )}

        {/* ── EMPLOYEES ────────────────────────────────────── */}
        {activeTab === "employees" && (
          <View style={S.tabSection}>
            <View style={S.pageHeader}>
              <View style={S.pageHeaderCopy}>
                <Text style={S.eyebrow}>PEOPLE / DIRECTORY</Text>
                <Text style={S.sectionHeading}>Employee directory</Text>
                <Text style={S.sectionDescription}>
                  Manage team access, roles, and employee records across Marush
                  operations.
                </Text>
              </View>
              <TouchableOpacity onPress={handleOpenAddEmp} style={S.addButton}>
                <Plus size={15} color={Colors.white} />
                <Text style={S.addButtonText}>Add employee</Text>
              </TouchableOpacity>
            </View>

            <View style={S.directorySummary}>
              <View style={S.directorySummaryItem}>
                <Text style={S.directorySummaryValue}>{users.length}</Text>
                <Text style={S.directorySummaryLabel}>Total people</Text>
              </View>
              <View style={S.directorySummaryDivider} />
              <View style={S.directorySummaryItem}>
                <Text
                  style={{
                    ...Type.h2,
                    color: Colors.success,
                  }}
                >
                  {approvedEmployeeCount}
                </Text>
                <Text style={S.directorySummaryLabel}>Approved</Text>
              </View>
              <View style={S.directorySummaryDivider} />
              <View style={S.directorySummaryItem}>
                <Text
                  style={{
                    ...Type.h2,
                    color: Colors.warning,
                  }}
                >
                  {pendingEmployeeCount}
                </Text>
                <Text style={S.directorySummaryLabel}>Pending</Text>
              </View>
            </View>

            <View style={S.directoryToolbar}>
              <View style={S.searchWrapper}>
                <Search size={16} color={Colors.textTertiary} />
                <TextInput
                  style={S.searchInput}
                  placeholder="Search name, email, or employee code"
                  placeholderTextColor={Colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={S.filterScroll}
              >
                {(
                  [
                    ["all", "All people"],
                    ["employee", "Employees"],
                    ["program_controller", "Controllers"],
                    ["program_auditor", "Auditors"],
                    ["admin", "Admins"],
                  ] as const
                ).map(([role, label]) => {
                  const active = employeeRoleFilter === role;
                  return (
                    <TouchableOpacity
                      key={role}
                      onPress={() => setEmployeeRoleFilter(role)}
                      style={[S.filterChip, active && S.filterChipActive]}
                    >
                      <Text
                        style={[
                          S.filterChipText,
                          active && S.filterChipTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {visibleEmployees.length === 0 ? (
              <View style={S.directorySummary}>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Users size={22} color={Colors.accent} />
                  <Text style={[S.emptyTitle, { marginTop: Spacing.sm }]}>
                    {searchQuery || employeeRoleFilter !== "all"
                      ? "No matching employees"
                      : "No employees yet"}
                  </Text>
                  <Text style={S.emptyText}>
                    {searchQuery || employeeRoleFilter !== "all"
                      ? "Try a different search term or clear the role filter."
                      : "Add your first employee to start building the directory."}
                  </Text>
                </View>
              </View>
            ) : (
              visibleEmployees.map((emp) => {
                const isSelf = emp.id === currentUser.id;
                const isProtectedAdmin =
                  emp.isDeveloper || emp.isSuperAdmin || emp.role === "admin";
                // Only field employees can have their name edited; controllers, auditors, and admins cannot.
                const canEdit = emp.role === "employee";
                const canDelete = !isSelf && (!isProtectedAdmin || isSuperUser);
                return (
                  <EmployeeCard
                    key={emp.id}
                    user={emp}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    isSelf={isSelf}
                    onEdit={() => handleOpenEditEmp(emp)}
                    onDelete={() => handleDeleteEmployee(emp)}
                  />
                );
              })
            )}
          </View>
        )}
        {/* ── APPROVALS ────────────────────────────────────── */}
        {activeTab === "approvals" && (
          <View style={S.tabSection}>
            {/* Top Summary Banner */}
            <View style={S.requestSummary}>
              <View style={S.requestSummaryIcon}>
                <Clock3 size={18} color={Colors.warning} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.requestSummaryTitle}>
                  {pendingUsers.length === 0 && pendingTeamPrograms.length === 0
                    ? "Review queue is clear"
                    : "Action required"}
                </Text>
                <Text style={S.requestSummaryText}>
                  {pendingUsers.length === 0 && pendingTeamPrograms.length === 0
                    ? "There are no pending access requests or program approvals right now."
                    : "You have pending program teams and new user registrations waiting for review."}
                </Text>
              </View>
            </View>

            {/* ── Section 1: Pending Program Teams ────────────────── */}
            <View style={{ marginTop: Spacing.lg }}>
              <View style={S.sectionHeaderRow}>
                <View>
                  <Text style={S.subHeading}>Program Approvals</Text>
                  <Text style={S.sectionCaption}>
                    Start field operations by approving submitted programs.
                  </Text>
                </View>
                {pendingTeamPrograms.length > 0 && (
                  <Text style={S.countCaption}>
                    {pendingTeamPrograms.length} pending
                  </Text>
                )}
              </View>

              {pendingTeamPrograms.length === 0 ? (
                <View style={S.compactEmptyState}>
                  <Text style={S.emptyTitle}>
                    No program teams awaiting approval
                  </Text>
                </View>
              ) : (
                <View style={{ gap: Spacing.md }}>
                  {pendingTeamPrograms.map((prog) => (
                    <PendingProgramCard
                      key={prog.id}
                      program={prog}
                      onAssignAuditor={() => openAuditorAssignment(prog)}
                      onApprove={() => handleApproveAndStartProgram(prog)}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* ── Section 2: New User Registrations ───────────────── */}
            <View style={{ marginTop: Spacing["2xl"] }}>
              <View style={S.sectionHeaderRow}>
                <View>
                  <Text style={S.subHeading}>Access Requests</Text>
                  <Text style={S.sectionCaption}>
                    Verify identity and grant access to the workspace.
                  </Text>
                </View>
                {pendingUsers.length > 0 && (
                  <Text style={S.countCaption}>
                    {pendingUsers.length} pending
                  </Text>
                )}
              </View>

              {pendingUsers.length === 0 ? (
                <View style={S.compactEmptyState}>
                  <UserCheck size={20} color={Colors.accent} />
                  <Text style={[S.emptyTitle, { marginTop: Spacing.sm }]}>
                    No new user registrations
                  </Text>
                </View>
              ) : (
                <View style={{ gap: Spacing.md }}>
                  {pendingUsers.map((user) => (
                    <PendingUserCard
                      key={user.id}
                      user={user}
                      onApprove={() => handleApproveUser(user)}
                      onReject={() => handleRejectUser(user)}
                    />
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Modals ─────────────────────────────────────────── */}
      <ProgramInspectionModal
        program={selectedProgram}
        onClose={() => setSelectedProgram(null)}
      />
      <AuditorAssignmentModal
        program={programForAuditorAssignment}
        availableAuditors={availableAuditors}
        selectedAuditorId={selectedAuditorId}
        saving={savingAuditor}
        busyAuditors={busyAuditorMap}
        onSelect={setSelectedAuditorId}
        onCancel={() => setProgramForAuditorAssignment(null)}
        onSave={saveAuditorAssignment}
      />
      <EmployeeFormModal
        visible={isEmpModalOpen}
        editing={editingEmp}
        isSuperUser={isSuperUser}
        fullName={empFullName}
        email={empEmail}
        phone={empPhone}
        code={empCode}
        role={empRole}
        onChangeFullName={setEmpFullName}
        onChangeEmail={setEmpEmail}
        onChangePhone={setEmpPhone}
        onChangeCode={setEmpCode}
        onChangeRole={setEmpRole}
        onCancel={() => setIsEmpModalOpen(false)}
        onSave={handleSaveEmployee}
      />

      {ConfirmDialogElement}
    </View>
  );
};
