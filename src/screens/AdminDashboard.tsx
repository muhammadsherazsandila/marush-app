import {
  Activity,
  Check,
  ClipboardCheck,
  Clock3,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useConfirmDialog } from "../components/ConfirmDialog";
import { Colors } from "../constants/colors";
import { dataProvider } from "../services";
import { Program, UserProfile, UserRole } from "../types";

interface AdminDashboardProps {
  currentUser: UserProfile;
  activeArea: "overview" | "programs" | "employees";
  onSelfDeleted?: () => void;
}

type TabType =
  | "overview"
  | "all_programs"
  | "programs"
  | "active_programs"
  | "pending_audit"
  | "pending_admin_review"
  | "employees"
  | "approvals";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeArea,
  currentUser,
  onSelfDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState<
    "all" | UserRole
  >("all");

  // Employee CRUD Modal State
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<UserProfile | null>(null);
  const [empFullName, setEmpFullName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empRole, setEmpRole] = useState<UserRole>("employee");
  const [empPhone, setEmpPhone] = useState("");
  const [empCode, setEmpCode] = useState("");

  // Program Detail / Inspection Modal
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [programForAuditorAssignment, setProgramForAuditorAssignment] =
    useState<Program | null>(null);
  const [selectedAuditorId, setSelectedAuditorId] = useState("");
  const [savingAuditor, setSavingAuditor] = useState(false);

  const { confirm, ConfirmDialogElement } = useConfirmDialog();

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

  const completedPrograms = programs.filter((p) => p.status === "completed");
  const activeProgramsList = programs.filter((p) => p.status === "active");
  const pendingTeamPrograms = programs.filter(
    (p) => p.status === "pending_approval",
  );
  const pendingAdminReviewPrograms = programs.filter(
    (p) => p.status === "pending_admin_review" || p.status === "pending_audit",
  );
  const pendingUsers = users.filter((u) => u.status === "pending");
  const availableAuditors = users.filter(
    (user) => user.role === "program_auditor" && user.status === "approved",
  );

  // Filtered lists for search
  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.employeeCode &&
        u.employeeCode.toLowerCase().includes(searchQuery.toLowerCase())),
  );
  const visibleEmployees = filteredUsers.filter(
    (user) => employeeRoleFilter === "all" || user.role === employeeRoleFilter,
  );
  const approvedEmployeeCount = users.filter(
    (user) => user.status === "approved",
  ).length;
  const pendingEmployeeCount = users.filter(
    (user) => user.status === "pending",
  ).length;

  const filteredCompletedPrograms = completedPrograms.filter(
    (p) =>
      p.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hatcheryOrFarmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.controllerName &&
        p.controllerName.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Employee CRUD Actions
  const handleOpenAddEmp = () => {
    setEditingEmp(null);
    setEmpFullName("");
    setEmpEmail("");
    setEmpRole("employee");
    setEmpPhone("");
    setEmpCode(`MRSH-EMP-${Math.floor(100 + Math.random() * 900)}`);
    setIsEmpModalOpen(true);
  };

  const handleOpenEditEmp = (emp: UserProfile) => {
    if (emp.isSuperAdmin || (emp.role === "admin" && !currentUser.isSuperAdmin)) {
      Toast.show({
        type: "error",
        text1: "Action Not Permitted",
        text2:
          "Administrator role cannot be changed. Contact the developer for assistance.",
      });
      return;
    }
    setEditingEmp(emp);
    setEmpFullName(emp.fullName);
    setEmpEmail(emp.email);
    setEmpRole(emp.role);
    setEmpPhone(emp.phone || "");
    setEmpCode(emp.employeeCode || "");
    setIsEmpModalOpen(true);
  };

  const handleSaveEmployee = async () => {
    if (!empFullName.trim() || !empEmail.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Name and email are required.",
      });
      return;
    }

    if (editingEmp) {
      if (
        editingEmp.isSuperAdmin ||
        ((editingEmp.role === "admin" || empRole === "admin") &&
          !currentUser.isSuperAdmin)
      ) {
        Toast.show({
          type: "error",
          text1: "Action Not Permitted",
          text2:
            "Administrator role cannot be changed. Contact the developer for assistance.",
        });
        return;
      }
      try {
        await dataProvider.updateUserRole(editingEmp.id, empRole);
        Toast.show({
          type: "success",
          text1: "Updated",
          text2: `${empFullName} role updated.`,
        });
      } catch (err: any) {
        Toast.show({
          type: "error",
          text1: "Update Failed",
          text2: err?.message || "Could not update role.",
        });
        return;
      }
    } else {
      await dataProvider.addUser({
        fullName: empFullName.trim(),
        email: empEmail.trim(),
        role: empRole,
        status: "approved",
        phone: empPhone.trim() || undefined,
        employeeCode:
          empCode.trim() || `MRSH-EMP-${Math.floor(100 + Math.random() * 900)}`,
      });
      Toast.show({
        type: "success",
        text1: "Employee Added",
        text2: `${empFullName} registered.`,
      });
    }

    setIsEmpModalOpen(false);
    refreshData();
  };

  const handleDeleteEmployee = (targetUser: UserProfile) => {
    const isSelf = targetUser.id === currentUser.id;
    if (isSelf && currentUser.isSuperAdmin) {
      Toast.show({
        type: "error",
        text1: "Action Not Permitted",
        text2: "The superadmin account cannot delete itself.",
      });
      return;
    }
    if (
      (targetUser.role === "admin" || targetUser.isSuperAdmin) &&
      !currentUser.isSuperAdmin
    ) {
      Toast.show({
        type: "error",
        text1: "Action Not Permitted",
        text2:
          "Administrator accounts cannot be deleted. Contact the developer for assistance.",
      });
      return;
    }

    confirm({
      title: targetUser.role === "admin"
          ? "Delete Administrator"
          : "Delete Employee",
      message: `Are you sure you want to permanently delete "${targetUser.fullName || targetUser.email}"? This action cannot be undone and will revoke all access immediately.`,
      confirmText: targetUser.role === "admin"
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
            text2: `${targetUser.fullName || "Employee"} removed from system.`,
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

  const handleApproveUser = (targetUser: UserProfile) => {
    confirm({
      title: "Approve User Access",
      message: `Grant access to "${targetUser.fullName || targetUser.email}" with role "${(targetUser.requestedRole || targetUser.role).replace("_", " ").toUpperCase()}"?`,
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

  const openAuditorAssignment = (program: Program) => {
    setProgramForAuditorAssignment(program);
    setSelectedAuditorId(program.auditorId || "");
  };

  const saveAuditorAssignment = async () => {
    if (!programForAuditorAssignment || !selectedAuditorId) return;
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

  const handleOpenTeamApproval = (program: Program) => {
    openAuditorAssignment(program);
  };

  const handleApproveAndStartProgram = (program: Program) => {
    if (!program.auditorId) {
      Toast.show({
        type: "error",
        text1: "Auditor Required",
        text2: "Assign an approved program auditor before approving this program.",
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
          await dataProvider.approveProgramAndStart(program.id, program.auditorId!);
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

  const isProgramView =
    activeArea === "programs" ||
    ["all_programs", "active_programs", "pending_audit", "pending_admin_review", "programs"].includes(
      activeTab,
    );

  return (
    <View className={styles.container}>
      {/* Tab Navigation & Refresh */}
      <View className={styles.navTabs}>
        <View className={styles.navInner}>
          <ScrollView
            className="min-w-0 flex-1"
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName={styles.tabsScroll}
          >
            {(isProgramView
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
                  {
                    id: "programs",
                    label: `Completed (${completedPrograms.length})`,
                  },
                  { id: "employees", label: `Employees (${users.length})` },
                ]
              : [
                  { id: "overview", label: "Overview" },
                  { id: "employees", label: `Employees (${users.length})` },
                  {
                    id: "approvals",
                    label: `Access requests (${pendingUsers.length})`,
                  },
                ]
            ).map((tab) => (
              <TouchableOpacity
                key={tab.id}
                className={`${styles.tabItem} ${activeTab === tab.id ? styles.activeTabItem : ""}`}
                onPress={() => {
                  setActiveTab(tab.id as TabType);
                  setSearchQuery("");
                }}
              >
                <Text
                  className={`${styles.tabItemText} ${activeTab === tab.id ? styles.activeTabItemText : ""}`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            className={styles.refreshBtn}
            onPress={refreshData}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <View className="flex-row items-center gap-1.5">
                <RefreshCw size={15} color={Colors.primary} />
                <Text className={styles.refreshBtnText}>Refresh</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerClassName={styles.content}>
        {activeTab === "all_programs" && (
          <View className={styles.tabSection}>
            <Text className={styles.sectionHeading}>All programs</Text>
            {programs.length === 0 ? (
              <View className={styles.emptyBox}>
                <Text className={styles.emptyText}>
                  No programs have been created yet.
                </Text>
              </View>
            ) : (
              programs.map((prog) => (
                <TouchableOpacity
                  key={prog.id}
                  className={styles.programCard}
                  onPress={() => setSelectedProgram(prog)}
                >
                  <View className={styles.progHeaderRow}>
                    <Text className={styles.progTitle}>{prog.programName}</Text>
                    <View className={styles.activeTag}>
                      <Text className={styles.activeTagText}>
                        {prog.status.replace("_", " ").toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text className={styles.progLocation}>
                    {prog.hatcheryOrFarmName}
                  </Text>
                  <Text className={styles.progMeta}>
                    Controller: {prog.controllerName || "Unassigned"} ·{" "}
                    {prog.flockSize.toLocaleString()} birds
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <View className={styles.tabSection}>
            <View className={styles.pageHeader}>
              <View className={styles.pageHeaderCopy}>
                <Text className={styles.eyebrow}>
                  ADMINISTRATION / OVERVIEW
                </Text>
                <Text className={styles.sectionHeading}>
                  Good morning, Admin
                </Text>
                <Text className={styles.sectionDescription}>
                  Here is what is happening across your vaccination operations
                  today.
                </Text>
              </View>
              <View className={styles.statusPill}>
                <Activity size={14} color={Colors.primary} strokeWidth={2.5} />
                <Text className={styles.statusPillText}>Live overview</Text>
              </View>
            </View>

            <View className={styles.metricsGrid}>
              <TouchableOpacity
                className={`${styles.metricCard} border-l-marush-primary active:opacity-80`}
                onPress={() => setActiveTab("programs")}
                accessibilityRole="button"
                accessibilityLabel="View completed programs"
              >
                <View className={styles.metricCardHeader}>
                  <View className="rounded-lg bg-marush-primary-subtle p-2">
                    <Check size={16} color={Colors.primary} strokeWidth={2.5} />
                  </View>
                  <Text className={styles.metricTrend}>Completed</Text>
                </View>
                <Text className={`${styles.metricValue} text-marush-primary`}>
                  {completedPrograms.length}
                </Text>
                <Text className={styles.metricSupporting}>
                  Programs completed
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`${styles.metricCard} border-l-marush-secondary active:opacity-80`}
                onPress={() => setActiveTab("active_programs")}
                accessibilityRole="button"
                accessibilityLabel="View active programs"
              >
                <View className={styles.metricCardHeader}>
                  <View className="rounded-lg bg-marush-subtle p-2">
                    <Activity
                      size={16}
                      color={Colors.secondaryDark}
                      strokeWidth={2.5}
                    />
                  </View>
                  <Text className={styles.metricTrend}>In progress</Text>
                </View>
                <Text className={`${styles.metricValue} text-marush-secondary`}>
                  {activeProgramsList.length}
                </Text>
                <Text className={styles.metricSupporting}>
                  Programs active now
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`${styles.metricCard} border-l-amber-500 active:opacity-80`}
                onPress={() => setActiveTab("approvals")}
                accessibilityRole="button"
                accessibilityLabel="View pending team approvals"
              >
                <View className={styles.metricCardHeader}>
                  <View className="rounded-lg bg-amber-50 p-2">
                    <Users size={16} color="#B45309" strokeWidth={2.5} />
                  </View>
                  <Text className={styles.metricTrend}>Needs review</Text>
                </View>
                <Text className="text-[28px] font-extrabold text-amber-700">
                  {pendingTeamPrograms.length}
                </Text>
                <Text className={styles.metricSupporting}>
                  Team approvals pending
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`${styles.metricCard} border-l-blue-500 active:opacity-80`}
                onPress={() => setActiveTab("approvals")}
                accessibilityRole="button"
                accessibilityLabel="View pending staff access requests"
              >
                <View className={styles.metricCardHeader}>
                  <View className="rounded-lg bg-blue-50 p-2">
                    <ShieldCheck size={16} color="#2563EB" strokeWidth={2.5} />
                  </View>
                  <Text className={styles.metricTrend}>Access</Text>
                </View>
                <Text className="text-[28px] font-extrabold text-blue-700">
                  {pendingUsers.length}
                </Text>
                <Text className={styles.metricSupporting}>
                  Staff signups pending
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Action: Recently Active */}
            <View className={styles.recentSection}>
              <View className={styles.sectionHeaderRow}>
                <View>
                  <Text className={styles.subHeading}>
                    Active programs in the field
                  </Text>
                  <Text className={styles.sectionCaption}>
                    A quick view of current operations
                  </Text>
                </View>
                {activeProgramsList.length > 0 && (
                  <Text className={styles.countCaption}>
                    {activeProgramsList.length} active
                  </Text>
                )}
              </View>
              {activeProgramsList.length === 0 ? (
                <View className={styles.emptyBox}>
                  <View className="mb-2 rounded-full bg-marush-subtle p-3">
                    <Activity size={20} color={Colors.primary} />
                  </View>
                  <Text className={styles.emptyTitle}>
                    No active programs yet
                  </Text>
                  <Text className={styles.emptyText}>
                    When a program starts, its live status will appear here.
                  </Text>
                </View>
              ) : (
                activeProgramsList.map((prog) => (
                  <View key={prog.id} className={styles.programCard}>
                    <View className={styles.progHeaderRow}>
                      <Text className={styles.progTitle}>
                        {prog.programName}
                      </Text>
                      <View className={styles.activeTag}>
                        <Text className={styles.activeTagText}>
                          IN PROGRESS
                        </Text>
                      </View>
                    </View>
                    <Text className={styles.progLocation}>
                      {prog.hatcheryOrFarmName}
                    </Text>
                    <Text className={styles.progMeta}>
                      Flock: {prog.flockSize.toLocaleString()} birds ·
                      Controller: {prog.controllerName}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ACTIVE PROGRAMS TAB */}
        {activeTab === "active_programs" && (
          <View className={styles.tabSection}>
            <Text className={styles.sectionHeading}>
              Currently Active Programs
            </Text>
            {activeProgramsList.length === 0 ? (
              <View className={styles.emptyBox}>
                <Text className={styles.emptyText}>
                  No programs are currently running.
                </Text>
              </View>
            ) : (
              activeProgramsList.map((prog) => (
                <View key={prog.id} className={styles.programCard}>
                  <View className={styles.progHeaderRow}>
                    <Text className={styles.progTitle}>{prog.programName}</Text>
                    <View className={styles.activeTag}>
                      <Text className={styles.activeTagText}>ACTIVE</Text>
                    </View>
                  </View>
                  <Text className={styles.progLocation}>
                    {prog.hatcheryOrFarmName}
                  </Text>
                  <View className={styles.progDetailBox}>
                    <Text className={styles.progDetailText}>
                      <Text className={styles.bold}>Controller:</Text>{" "}
                      {prog.controllerName}
                    </Text>
                    <Text className={styles.progDetailText}>
                      <Text className={styles.bold}>Auditor:</Text>{" "}
                      {prog.auditorName || "Pending"}
                    </Text>
                    <Text className={styles.progDetailText}>
                      <Text className={styles.bold}>Scheduled:</Text>{" "}
                      {prog.scheduledStartDate} ({prog.scheduledStartTime} -{" "}
                      {prog.scheduledEndTime})
                    </Text>
                    <Text className={styles.progDetailText}>
                      <Text className={styles.bold}>Assigned Staff:</Text>{" "}
                      {prog.teamMemberIds.length} members
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {(activeTab === "pending_admin_review" || activeTab === "pending_audit") && (
          <View className={styles.tabSection}>
            <Text className={styles.sectionHeading}>
              Completed programs awaiting admin review
            </Text>
            {pendingAdminReviewPrograms.length === 0 ? (
              <View className={styles.emptyBox}>
                <Text className={styles.emptyText}>
                  No completed programs are awaiting review.
                </Text>
              </View>
            ) : (
              pendingAdminReviewPrograms.map((prog) => (
                <View key={prog.id} className={styles.programCard}>
                  <TouchableOpacity onPress={() => setSelectedProgram(prog)}>
                  <View className={styles.progHeaderRow}>
                    <Text className={styles.progTitle}>{prog.programName}</Text>
                    <View className={styles.activeTag}>
                      <Text className={styles.activeTagText}>
                        AWAITING ADMIN REVIEW
                      </Text>
                    </View>
                  </View>
                  <Text className={styles.progLocation}>
                    {prog.hatcheryOrFarmName}
                  </Text>
                  <Text className={styles.progMeta}>
                    Controller: {prog.controllerName || "Unassigned"} · Auditor:{" "}
                    {prog.auditorName || "Unassigned"}
                  </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={styles.approveTeamBtn}
                    onPress={() => handleCompleteProgramReview(prog)}
                  >
                    <Text className={styles.approveTeamBtnText}>Mark Completed</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* ALL PROGRAMS DONE TAB */}
        {activeTab === "programs" && (
          <View className={styles.tabSection}>
            <View className={styles.sectionHeaderRow}>
              <Text className={styles.sectionHeading}>
                Completed Programs Archive
              </Text>
            </View>

            <TextInput
              className={styles.searchBar}
              placeholder="Search programs by name, location, or controller..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {filteredCompletedPrograms.length === 0 ? (
              <View className={styles.emptyBox}>
                <Text className={styles.emptyText}>
                  No matching completed programs found.
                </Text>
              </View>
            ) : (
              filteredCompletedPrograms.map((prog) => (
                <TouchableOpacity
                  key={prog.id}
                  className={styles.programCard}
                  onPress={() => setSelectedProgram(prog)}
                >
                  <View className={styles.progHeaderRow}>
                    <Text className={styles.progTitle}>{prog.programName}</Text>
                    <View className={styles.completedTag}>
                      <Text className={styles.completedTagText}>DONE</Text>
                    </View>
                  </View>
                  <Text className={styles.progLocation}>
                    {prog.hatcheryOrFarmName}
                  </Text>
                  <Text className={styles.progMeta}>
                    Controller: {prog.controllerName} · Auditor:{" "}
                    {prog.auditorName}
                  </Text>
                  {prog.auditScore ? (
                    <Text className={styles.scoreText}>
                      Quality Score: {prog.auditScore}/100
                    </Text>
                  ) : null}
                  {prog.auditorRemarks ? (
                    <View className={styles.remarksSnippet}>
                      <Text className={styles.remarksText} numberOfLines={2}>
                        "{prog.auditorRemarks}"
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* EMPLOYEES TAB (CRUD) */}
        {activeTab === "employees" && (
          <View className={styles.tabSection}>
            <View className={styles.pageHeader}>
              <View className={styles.pageHeaderCopy}>
                <Text className={styles.eyebrow}>PEOPLE / DIRECTORY</Text>
                <Text className={styles.sectionHeading}>
                  Employee directory
                </Text>
                <Text className={styles.sectionDescription}>
                  Manage team access, roles, and employee records across Marush
                  operations.
                </Text>
              </View>
              <TouchableOpacity
                className={styles.addButton}
                onPress={handleOpenAddEmp}
              >
                <View className="flex-row items-center gap-1.5">
                  <Plus size={15} color={Colors.white} />
                  <Text className={styles.addButtonText}>Add employee</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View className={styles.directorySummary}>
              <View className={styles.directorySummaryItem}>
                <Text className={styles.directorySummaryValue}>
                  {users.length}
                </Text>
                <Text className={styles.directorySummaryLabel}>
                  Total people
                </Text>
              </View>
              <View className={styles.directorySummaryDivider} />
              <View className={styles.directorySummaryItem}>
                <Text className="text-lg font-extrabold text-marush-primary">
                  {approvedEmployeeCount}
                </Text>
                <Text className={styles.directorySummaryLabel}>Approved</Text>
              </View>
              <View className={styles.directorySummaryDivider} />
              <View className={styles.directorySummaryItem}>
                <Text className="text-lg font-extrabold text-amber-700">
                  {pendingEmployeeCount}
                </Text>
                <Text className={styles.directorySummaryLabel}>Pending</Text>
              </View>
            </View>

            <View className={styles.directoryToolbar}>
              <View className={styles.searchWrapper}>
                <Search size={16} color={Colors.textMuted} />
                <TextInput
                  className={styles.searchInput}
                  placeholder="Search name, email, or employee code"
                  placeholderTextColor={Colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName={styles.filterScroll}
              >
                {(
                  [
                    ["all", "All people"],
                    ["employee", "Employees"],
                    ["program_controller", "Controllers"],
                    ["program_auditor", "Auditors"],
                    ["admin", "Admins"],
                  ] as const
                ).map(([role, label]) => (
                  <TouchableOpacity
                    key={role}
                    className={styles.filterChip}
                    style={{
                      backgroundColor:
                        employeeRoleFilter === role
                          ? Colors.primary
                          : Colors.white,
                      borderColor:
                        employeeRoleFilter === role
                          ? Colors.primary
                          : Colors.border,
                    }}
                    onPress={() => setEmployeeRoleFilter(role)}
                  >
                    <Text
                      className={styles.filterChipText}
                      style={{
                        color:
                          employeeRoleFilter === role
                            ? Colors.white
                            : Colors.textSecondary,
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {visibleEmployees.length === 0 ? (
              <View className={styles.directoryEmptyState}>
                <View className="mb-3 rounded-full bg-marush-subtle p-3">
                  <Users size={22} color={Colors.primary} />
                </View>
                <Text className={styles.emptyTitle}>
                  {searchQuery || employeeRoleFilter !== "all"
                    ? "No matching employees"
                    : "No employees yet"}
                </Text>
                <Text className={styles.emptyText}>
                  {searchQuery || employeeRoleFilter !== "all"
                    ? "Try a different search term or clear the role filter."
                    : "Add your first employee to start building the operations directory."}
                </Text>
              </View>
            ) : (
              visibleEmployees.map((emp) => (
                <View key={emp.id} className={styles.employeeCard}>
                  <View className={styles.empHeader}>
                    <View className={styles.employeeIdentity}>
                      <View className={styles.employeeAvatar}>
                        <Text className={styles.employeeAvatarText}>
                          {emp.fullName.trim().slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text className={styles.empName}>{emp.fullName}</Text>
                        <Text className={styles.empEmail}>{emp.email}</Text>
                        {emp.isSuperAdmin ? (
                          <Text className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-marush-primary">
                            Superadmin
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <View className={styles.empBadgeGroup}>
                      <View
                        className={`${styles.roleBadge} bg-marush-primary-light`}
                      >
                        <Text className={styles.roleBadgeText}>
                          {emp.role.replace("_", " ").toUpperCase()}
                        </Text>
                      </View>
                      <View
                        className={`${styles.statusBadge} ${emp.status === "approved" ? "bg-marush-primary-subtle" : "bg-amber-50"}`}
                      >
                        <Text
                          className={`${styles.statusBadgeText} ${emp.status === "approved" ? "text-marush-primary" : "text-amber-700"}`}
                        >
                          {emp.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View className={styles.employeeDetails}>
                    <Text className={styles.empCode}>
                      ID {emp.employeeCode || "Not assigned"}
                    </Text>
                    {emp.phone ? (
                      <Text className={styles.empPhone}>{emp.phone}</Text>
                    ) : null}
                  </View>

                  <View className={styles.empActionRow}>
                    {!emp.isSuperAdmin &&
                      (emp.role !== "admin" || currentUser.isSuperAdmin) && (
                        <TouchableOpacity
                          className={styles.editBtn}
                          onPress={() => handleOpenEditEmp(emp)}
                        >
                          <View className="flex-row items-center gap-1.5">
                            <Pencil size={14} color={Colors.primary} />
                            <Text className={styles.editBtnText}>Edit Role</Text>
                          </View>
                        </TouchableOpacity>
                      )}
                    {emp.id !== currentUser.id && ((emp.role !== "admin" && !emp.isSuperAdmin) ||
                      (currentUser.isSuperAdmin &&
                        (emp.role === "admin" || emp.isSuperAdmin))) ? (
                        <TouchableOpacity
                          className={styles.deleteBtn}
                          onPress={() => handleDeleteEmployee(emp)}
                        >
                          <View className="flex-row items-center gap-1.5">
                            <Trash2 size={14} color={Colors.danger} />
                            <Text className={styles.deleteBtnText}>
                              {emp.id === currentUser.id ? "Delete My Account" : "Delete"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* APPROVALS TAB */}
        {activeTab === "approvals" && (
          <View className={styles.tabSection}>
            <View className={styles.pageHeader}>
              <View className={styles.pageHeaderCopy}>
                <Text className={styles.eyebrow}>ACCESS / REVIEW QUEUE</Text>
                <Text className={styles.sectionHeading}>Access requests</Text>
                <Text className={styles.sectionDescription}>
                  Review new team access requests and approve the right people
                  for your operations.
                </Text>
              </View>
              <View className="rounded-full bg-amber-50 px-3 py-2">
                <Text className="text-[11px] font-bold text-amber-700">
                  {pendingUsers.length} awaiting review
                </Text>
              </View>
            </View>

            <View className={styles.requestSummary}>
              <View className={styles.requestSummaryIcon}>
                <Clock3 size={18} color="#B45309" strokeWidth={2.5} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className={styles.requestSummaryTitle}>
                  {pendingUsers.length === 0
                    ? "All access requests are up to date"
                    : "Requests need your attention"}
                </Text>
                <Text className={styles.requestSummaryText}>
                  {pendingUsers.length === 0
                    ? "New registration requests will appear here for review."
                    : "Verify each applicant’s designation before approving account access."}
                </Text>
              </View>
            </View>

            <View className={styles.sectionHeaderRow}>
              <View>
                <Text className={styles.subHeading}>Pending program teams</Text>
                <Text className={styles.sectionCaption}>
                  Approve program requests and start field teams
                </Text>
              </View>
              {pendingTeamPrograms.length > 0 && (
                <Text className={styles.countCaption}>
                  {pendingTeamPrograms.length} pending
                </Text>
              )}
            </View>
            {pendingTeamPrograms.length === 0 ? (
              <View className={styles.compactEmptyState}>
                <Text className={styles.emptyTitle}>
                  No teams awaiting approval
                </Text>
                <Text className={styles.emptyText}>
                  Approved program teams will appear here.
                </Text>
              </View>
            ) : (
              pendingTeamPrograms.map((prog) => (
                <View key={prog.id} className={styles.approvalCard}>
                  <Text className={styles.approvalTitle}>
                    {prog.programName}
                  </Text>
                  <Text className={styles.progLocation}>
                    {prog.hatcheryOrFarmName}
                  </Text>
                  <Text className={styles.progMeta}>
                    Controller: {prog.controllerName} · Team:{" "}
                    {prog.teamMemberIds.length} members
                  </Text>
                  <TouchableOpacity
                    className="mt-3 rounded-xl border border-marush-primary px-3 py-2.5"
                    onPress={() => handleOpenTeamApproval(prog)}
                  >
                    <Text className="text-center text-xs font-bold text-marush-primary">
                      {prog.auditorId ? "Change Auditor" : "Assign Auditor"}
                    </Text>
                  </TouchableOpacity>
                  <Text className={styles.progMeta}>
                    Auditor: {prog.auditorName || "Not assigned"}
                  </Text>
                  <TouchableOpacity
                    className={`${styles.approveTeamBtn} mt-2 ${!prog.auditorId ? "opacity-40" : ""}`}
                    disabled={!prog.auditorId}
                    onPress={() => handleApproveAndStartProgram(prog)}
                  >
                    <View className="flex-row items-center justify-center gap-2">
                      <ShieldCheck size={15} color={Colors.white} />
                      <Text className={styles.approveTeamBtnText}>
                        Approve & Start Program
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            )}

            <View className="mt-5">
              <View className={styles.sectionHeaderRow}>
                <View>
                  <Text className={styles.subHeading}>
                    New user registrations
                  </Text>
                  <Text className={styles.sectionCaption}>
                    Confirm identity and requested access level
                  </Text>
                </View>
                {pendingUsers.length > 0 && (
                  <Text className={styles.countCaption}>
                    {pendingUsers.length} pending
                  </Text>
                )}
              </View>
            </View>
            {pendingUsers.length === 0 ? (
              <View className={styles.compactEmptyState}>
                <View className="mb-2 rounded-full bg-marush-primary-subtle p-2.5">
                  <UserCheck size={18} color={Colors.primary} />
                </View>
                <Text className={styles.emptyTitle}>No new registrations</Text>
                <Text className={styles.emptyText}>
                  New access requests will appear here.
                </Text>
              </View>
            ) : (
              pendingUsers.map((user) => (
                <View key={user.id} className={styles.approvalCard}>
                  <View className={styles.requestCardHeader}>
                    <View className={styles.employeeIdentity}>
                      <View className={styles.employeeAvatar}>
                        <Text className={styles.employeeAvatarText}>
                          {user.fullName.trim().slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text className={styles.approvalTitle}>
                          {user.fullName}
                        </Text>
                        <Text className={styles.progLocation}>
                          {user.email}
                        </Text>
                      </View>
                    </View>
                    <View className="rounded-full bg-amber-50 px-2.5 py-1">
                      <Text className="text-[10px] font-bold text-amber-700">
                        PENDING
                      </Text>
                    </View>
                  </View>
                  <View className={styles.requestDetails}>
                    <View>
                      <Text className={styles.requestDetailLabel}>
                        Requested access
                      </Text>
                      <Text className={styles.requestDetailValue}>
                        {(user.requestedRole || user.role).replace("_", " ")}
                      </Text>
                    </View>
                    <View>
                      <Text className={styles.requestDetailLabel}>
                        Current access
                      </Text>
                      <Text className={styles.requestDetailValue}>
                        {user.role.replace("_", " ")}
                      </Text>
                    </View>
                  </View>
                  <View className={styles.approvalBtnRow}>
                    <TouchableOpacity
                      className={styles.approveUserBtn}
                      onPress={() => handleApproveUser(user)}
                    >
                      <View className="flex-row items-center justify-center gap-1.5">
                        <Check size={15} color={Colors.white} />
                        <Text className={styles.approveUserBtnText}>
                          Approve Account
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={styles.rejectUserBtn}
                      onPress={() => handleRejectUser(user)}
                    >
                      <View className="flex-row items-center justify-center gap-1.5">
                        <X size={15} color={Colors.white} />
                        <Text className={styles.rejectUserBtnText}>Reject</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Program Inspection Modal */}
      {selectedProgram && (
        <Modal visible transparent animationType="fade">
          <View className={styles.modalOverlay}>
            <View className={styles.modalCard}>
              <Text className={styles.modalTitle}>
                {selectedProgram.programName}
              </Text>
              <Text className={styles.modalSub}>
                {selectedProgram.hatcheryOrFarmName}
              </Text>

              <ScrollView className={styles.modalBody}>
                {/* 1. Status & Basic Details */}
                <View className="mb-3 rounded-xl border border-marush-border bg-marush-subtle/40 p-3.5">
                  <View className="flex-row items-center justify-between border-b border-marush-border/50 pb-2">
                    <Text className="text-xs font-black uppercase tracking-wider text-marush-primary">
                      Program Status
                    </Text>
                    <View className="rounded-md bg-marush-primary px-2.5 py-1">
                      <Text className="text-[10px] font-extrabold uppercase text-white">
                        {selectedProgram.status.replace("_", " ")}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-2.5 gap-1.5 text-xs">
                    <View className="flex-row justify-between">
                      <Text className="text-[11px] font-bold text-marush-muted">
                        Farm / Hatchery:
                      </Text>
                      <Text className="text-[11px] font-semibold text-marush-text">
                        {selectedProgram.hatcheryOrFarmName}
                      </Text>
                    </View>

                    {selectedProgram.farmAddress && (
                      <View className="flex-row justify-between">
                        <Text className="text-[11px] font-bold text-marush-muted">
                          Farm Address:
                        </Text>
                        <Text className="text-[11px] text-marush-text">
                          {selectedProgram.farmAddress}
                        </Text>
                      </View>
                    )}

                    {selectedProgram.farmManagerName && (
                      <View className="flex-row justify-between">
                        <Text className="text-[11px] font-bold text-marush-muted">
                          Farm / Hatchery Manager:
                        </Text>
                        <Text className="text-[11px] font-semibold text-marush-text">
                          {selectedProgram.farmManagerName}
                        </Text>
                      </View>
                    )}

                    <View className="flex-row justify-between">
                      <Text className="text-[11px] font-bold text-marush-muted">
                        Lead Controller:
                      </Text>
                      <Text className="text-[11px] font-bold text-marush-primary">
                        {selectedProgram.controllerName || "Dr. Tariq Mahmood"}
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-[11px] font-bold text-marush-muted">
                        Assigned Auditor:
                      </Text>
                      <Text className="text-[11px] font-bold text-marush-secondary-dark">
                        {selectedProgram.auditorName || "Pending Assignment"}
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-[11px] font-bold text-marush-muted">
                        Vaccinator Team:
                      </Text>
                      <Text className="max-w-[220px] text-right text-[11px] text-marush-text">
                        {selectedProgram.teamMembers &&
                        selectedProgram.teamMembers.length > 0
                          ? selectedProgram.teamMembers
                              .map((m) => m.fullName)
                              .join(", ")
                          : `${selectedProgram.teamMemberIds?.length || 0} members assigned`}
                      </Text>
                    </View>

                    <View className="flex-row justify-between">
                      <Text className="text-[11px] font-bold text-marush-muted">
                        Date & Time:
                      </Text>
                      <Text className="text-[11px] text-marush-text">
                        {selectedProgram.scheduledStartDate} at{" "}
                        {selectedProgram.scheduledStartTime}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 2. Bird Details & Vaccines */}
                <View className="mb-3 rounded-xl border border-marush-border bg-white p-3.5">
                  <Text className="mb-2 text-xs font-black uppercase tracking-wider text-marush-primary">
                    Flock & Vaccine Specifications
                  </Text>

                  <View className="gap-1.5">
                    <View className="flex-row justify-between border-b border-marush-border/50 pb-1">
                      <Text className="text-[11px] font-bold text-marush-muted">
                        Total Flock Size:
                      </Text>
                      <Text className="text-[11px] font-extrabold text-marush-text">
                        {selectedProgram.flockSize.toLocaleString()} birds
                      </Text>
                    </View>

                    {selectedProgram.birdDetails && (
                      <View className="flex-row justify-between border-b border-marush-border/50 pb-1">
                        <Text className="text-[11px] font-bold text-marush-muted">
                          Categorized Flock Breakdown:
                        </Text>
                        <Text className="text-[11px] text-marush-text">
                          B: {selectedProgram.birdDetails.b || 0} • L:{" "}
                          {selectedProgram.birdDetails.l || 0} • Br:{" "}
                          {selectedProgram.birdDetails.br || 0}
                        </Text>
                      </View>
                    )}

                    <View className="flex-row justify-between pt-0.5">
                      <Text className="text-[11px] font-bold text-marush-muted">
                        Vaccine(s) Used:
                      </Text>
                      <Text className="max-w-[200px] text-right text-[11px] font-semibold text-marush-text">
                        {selectedProgram.vaccinesUsed &&
                        selectedProgram.vaccinesUsed.length > 0
                          ? selectedProgram.vaccinesUsed.join(", ")
                          : selectedProgram.completionMetrics?.vaccineType ||
                            "Standard Ceva Program"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 3. Travel & Field Timings */}
                {(selectedProgram.travelDepartureTime ||
                  selectedProgram.travelArrivalTime ||
                  selectedProgram.returnDepartureTime ||
                  selectedProgram.returnArrivalTime) && (
                  <View className="mb-3 rounded-xl border border-marush-border bg-white p-3.5">
                    <Text className="mb-2 text-xs font-black uppercase tracking-wider text-marush-primary">
                      Travel & Return Schedule
                    </Text>

                    <View className="gap-1 text-xs">
                      <View className="flex-row justify-between">
                        <Text className="text-[11px] font-bold text-marush-muted">
                          Departure from Office:
                        </Text>
                        <Text className="text-[11px] text-marush-text">
                          {selectedProgram.travelDepartureTime || "N/A"}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-[11px] font-bold text-marush-muted">
                          Arrival at Farm:
                        </Text>
                        <Text className="text-[11px] text-marush-text">
                          {selectedProgram.travelArrivalTime || "N/A"}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-[11px] font-bold text-marush-muted">
                          Departure from Farm:
                        </Text>
                        <Text className="text-[11px] text-marush-text">
                          {selectedProgram.returnDepartureTime || "N/A"}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-[11px] font-bold text-marush-muted">
                          Return to Office:
                        </Text>
                        <Text className="text-[11px] text-marush-text">
                          {selectedProgram.returnArrivalTime || "N/A"}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* 4. Controller Remarks */}
                {selectedProgram.controllerRemarks && (
                  <View className="mb-3 rounded-xl border border-marush-border bg-marush-subtle/30 p-3.5">
                    <Text className="mb-1 text-xs font-black uppercase tracking-wider text-marush-primary">
                      Controller Observations & Remarks
                    </Text>
                    <Text className="text-xs italic text-marush-text">
                      "{selectedProgram.controllerRemarks}"
                    </Text>
                  </View>
                )}

                {/* 5. Auditor Findings & Remarks */}
                {(selectedProgram.auditorRemarks ||
                  selectedProgram.auditDetails) && (
                  <View className="mb-3 rounded-xl border border-marush-border bg-white p-3.5">
                    <View className="flex-row items-center justify-between border-b border-marush-border/50 pb-2">
                      <Text className="text-xs font-black uppercase tracking-wider text-marush-primary">
                        Auditor Quality Findings & Audit Form
                      </Text>
                      {selectedProgram.auditScore ? (
                        <View className="rounded-md bg-marush-subtle px-2 py-0.5">
                          <Text className="text-xs font-bold text-marush-primary">
                            Score: {selectedProgram.auditScore}/100
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View className="mt-2.5 gap-2">
                      {selectedProgram.auditDetails && (
                        <View className="gap-1.5 border-b border-marush-border/50 pb-2">
                          <View className="flex-row justify-between">
                            <Text className="text-[11px] font-bold text-marush-muted">
                              Bird Count Verification:
                            </Text>
                            <Text
                              className={`text-[11px] font-bold ${selectedProgram.auditDetails.birdCountVerified !== false ? "text-green-600" : "text-red-600"}`}
                            >
                              {selectedProgram.auditDetails
                                .birdCountVerified !== false
                                ? "✓ Verified Correct"
                                : "✕ Discrepancy"}
                            </Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-[11px] font-bold text-marush-muted">
                              Vaccine Verification:
                            </Text>
                            <Text
                              className={`text-[11px] font-bold ${selectedProgram.auditDetails.vaccineVerified !== false ? "text-green-600" : "text-red-600"}`}
                            >
                              {selectedProgram.auditDetails.vaccineVerified !==
                              false
                                ? "✓ Verified Matching"
                                : "✕ Discrepancy"}
                            </Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-[11px] font-bold text-marush-muted">
                              Timing Verification:
                            </Text>
                            <Text
                              className={`text-[11px] font-bold ${selectedProgram.auditDetails.timingVerified !== false ? "text-green-600" : "text-red-600"}`}
                            >
                              {selectedProgram.auditDetails.timingVerified !==
                              false
                                ? "✓ Timings Verified"
                                : "✕ Discrepancy"}
                            </Text>
                          </View>
                          <View className="flex-row justify-between">
                            <Text className="text-[11px] font-bold text-marush-muted">
                              Uniform & PPE Compliance:
                            </Text>
                            <Text
                              className={`text-[11px] font-bold ${selectedProgram.auditDetails.uniformCompliance !== false ? "text-green-600" : "text-red-600"}`}
                            >
                              {selectedProgram.auditDetails
                                .uniformCompliance !== false
                                ? "✓ Compliant"
                                : "✕ Non-Compliant"}
                            </Text>
                          </View>
                          {selectedProgram.auditDetails.overallAuditResult && (
                            <View className="flex-row justify-between">
                              <Text className="text-[11px] font-bold text-marush-muted">
                                Overall Audit Result:
                              </Text>
                              <Text className="text-[11px] font-extrabold uppercase text-marush-primary">
                                {selectedProgram.auditDetails.overallAuditResult.replace(
                                  "_",
                                  " ",
                                )}
                              </Text>
                            </View>
                          )}
                          {selectedProgram.auditDetails
                            .vaccinationQualityAssessment && (
                            <View className="pt-1">
                              <Text className="text-[11px] font-bold text-marush-muted">
                                Quality Assessment:
                              </Text>
                              <Text className="text-[11px] text-marush-text">
                                {
                                  selectedProgram.auditDetails
                                    .vaccinationQualityAssessment
                                }
                              </Text>
                            </View>
                          )}
                          {selectedProgram.auditDetails
                            .vaccinatorBehaviorAssessment && (
                            <View className="pt-1">
                              <Text className="text-[11px] font-bold text-marush-muted">
                                Vaccinator Behavior:
                              </Text>
                              <Text className="text-[11px] text-marush-text">
                                {
                                  selectedProgram.auditDetails
                                    .vaccinatorBehaviorAssessment
                                }
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {selectedProgram.auditorRemarks && (
                        <View className="pt-1">
                          <Text className="text-[11px] font-bold text-marush-muted">
                            Auditor Remarks & Recommendations:
                          </Text>
                          <Text className="mt-1 text-xs italic text-marush-primary-dark">
                            "{selectedProgram.auditorRemarks}"
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* 6. Technical / Metrics Details */}
                {selectedProgram.completionMetrics && (
                  <View className={styles.metricsBox}>
                    <Text className={styles.metricsBoxTitle}>
                      Cold-Chain & Injection Metrics
                    </Text>
                    <Text className={styles.metricLine}>
                      • Birds Vaccinated:{" "}
                      {selectedProgram.completionMetrics.birdsVaccinated.toLocaleString()}
                    </Text>
                    <Text className={styles.metricLine}>
                      • Dosage:{" "}
                      {selectedProgram.completionMetrics.dosagePerBird}
                    </Text>
                    <Text className={styles.metricLine}>
                      • Vaccine Batch:{" "}
                      {selectedProgram.completionMetrics.batchNumber}
                    </Text>
                    <Text className={styles.metricLine}>
                      • Cold Chain Temp:{" "}
                      {selectedProgram.completionMetrics.coldChainTempCelsius}°C
                    </Text>
                    <Text className={styles.metricLine}>
                      • Field Observations:{" "}
                      {selectedProgram.completionMetrics.farmFlockObservations}
                    </Text>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity
                className={styles.closeBtn}
                onPress={() => setSelectedProgram(null)}
              >
                <View className="flex-row items-center justify-center gap-1.5">
                  <X size={15} color={Colors.textSecondary} />
                  <Text className={styles.closeBtnText}>Close Details</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Add / Edit Employee Modal */}
      {programForAuditorAssignment && (
        <Modal visible transparent animationType="fade">
          <View className={styles.modalOverlay}>
            <View className={styles.modalCard}>
              <Text className={styles.modalTitle}>Assign Program Auditor</Text>
              <Text className={styles.modalSub}>
                {programForAuditorAssignment.programName}
              </Text>
              <ScrollView className="my-4 max-h-72">
                {availableAuditors.length === 0 ? (
                  <Text className={styles.emptyText}>
                    There are no approved program auditors to assign.
                  </Text>
                ) : (
                  availableAuditors.map((auditor) => (
                    <TouchableOpacity
                      key={auditor.id}
                      className={`mb-2 rounded-xl border p-3 ${selectedAuditorId === auditor.id ? "border-marush-primary bg-marush-primary-subtle" : "border-marush-border bg-white"}`}
                      onPress={() => setSelectedAuditorId(auditor.id)}
                    >
                      <Text className="font-bold text-marush-text">
                        {auditor.fullName}
                      </Text>
                      <Text className="mt-1 text-xs text-marush-muted">
                        {auditor.email}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <View className={styles.modalBtnRow}>
                <TouchableOpacity
                  className={styles.cancelModalBtn}
                  onPress={() => setProgramForAuditorAssignment(null)}
                >
                  <Text className={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`${styles.confirmModalBtn} ${!selectedAuditorId || savingAuditor ? "opacity-50" : ""}`}
                  disabled={!selectedAuditorId || savingAuditor}
                  onPress={saveAuditorAssignment}
                >
                  <Text className={styles.confirmModalBtnText}>
                    {savingAuditor ? "Saving..." : "Save Auditor"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Add / Edit Employee Modal */}
      {isEmpModalOpen && (
        <Modal visible transparent animationType="fade">
          <View className={styles.modalOverlay}>
            <View className={styles.modalCard}>
              <Text className={styles.modalTitle}>
                {editingEmp ? "Edit Employee Role" : "Add New Employee"}
              </Text>
              <TextInput
                className={styles.modalInput}
                placeholder="Full Name"
                placeholderTextColor={Colors.textMuted}
                value={empFullName}
                onChangeText={setEmpFullName}
                editable={!editingEmp}
              />
              <TextInput
                className={styles.modalInput}
                placeholder="Work Email"
                placeholderTextColor={Colors.textMuted}
                value={empEmail}
                onChangeText={setEmpEmail}
                editable={!editingEmp}
              />
              <TextInput
                className={styles.modalInput}
                placeholder="Phone / WhatsApp"
                placeholderTextColor={Colors.textMuted}
                value={empPhone}
                onChangeText={setEmpPhone}
              />
              <TextInput
                className={styles.modalInput}
                placeholder="Employee Code"
                placeholderTextColor={Colors.textMuted}
                value={empCode}
                onChangeText={setEmpCode}
                editable={!editingEmp}
              />
              <Text className={styles.auditorSelectLabel}>Select Role:</Text>
              <View className={styles.rolePickerRow}>
                {(
                  [
                    "employee",
                    "program_controller",
                    "program_auditor",
                    ...(currentUser.isSuperAdmin ? ["admin" as UserRole] : []),
                  ] as UserRole[]
                ).map((r) => (
                  <TouchableOpacity
                    key={r}
                    className={`${styles.rolePickBtn} ${empRole === r ? styles.rolePickBtnActive : ""}`}
                    onPress={() => setEmpRole(r)}
                  >
                    <Text
                      className={`${styles.rolePickBtnText} ${empRole === r ? styles.rolePickBtnTextActive : ""} text-black`}
                    >
                      {r.replace("_", " ")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className={styles.modalBtnRow}>
                <TouchableOpacity
                  className={styles.cancelModalBtn}
                  onPress={() => setIsEmpModalOpen(false)}
                >
                  <Text className={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={styles.confirmModalBtn}
                  onPress={handleSaveEmployee}
                >
                  <View className="flex-row items-center justify-center gap-1.5">
                    <Save size={15} color={Colors.white} />
                    <Text className={styles.confirmModalBtnText}>Save</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {ConfirmDialogElement}
    </View>
  );
};

const styles = {
  container: "flex-1 bg-[#F4F6F7]",
  navTabs: "border-b border-[#E4E8EA] bg-white",
  navInner:
    "mx-auto w-full max-w-[1440px] flex-row items-center px-5 py-1 md:px-10",
  tabsScroll: "flex-row flex-grow-0 items-center gap-5 py-0",
  tabItem: "flex-shrink-0 border-b-2 border-transparent px-1 py-3.5",
  activeTabItem: "border-[#2D766D]",
  tabItemText: "text-[13px] font-semibold text-[#6D7D83]",
  activeTabItemText: "font-bold text-[#2D766D]",
  refreshBtn:
    "ml-3 justify-center rounded-xl border border-[#DCE4E7] bg-white px-3.5 py-2 active:scale-[0.97]",
  refreshBtnText: "text-xs font-bold text-marush-primary",
  searchBar:
    "mb-2 rounded-xl border border-black/[0.08] bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800",
  content: "mx-auto w-full max-w-[1440px] p-5 md:p-10",
  tabSection: "gap-4",
  pageHeader:
    "flex-row flex-wrap items-start justify-between gap-4 border-b border-[#DCE4E7] pb-6",
  pageHeaderCopy: "min-w-0 flex-1",
  eyebrow:
    "mb-1 text-[10px] font-black uppercase tracking-[1.8px] text-marush-secondary-dark",
  sectionHeading:
    "text-2xl font-black tracking-[-0.6px] text-[#162D38] md:text-3xl",
  sectionDescription:
    "mt-1 max-w-[620px] text-xs md:text-sm leading-relaxed text-slate-500",
  statusPill:
    "flex-row items-center gap-1.5 rounded-lg border border-[#CFE7DE] bg-[#E9F6F0] px-3 py-1.5",
  statusPillText: "text-xs font-bold text-[#2D766D]",
  subHeading: "mb-2 text-sm font-bold text-slate-900",
  metricsGrid: "mt-2 flex-row flex-wrap gap-4",
  metricCard:
    "min-w-[210px] flex-1 rounded-xl border border-[#DCE4E7] bg-white p-5 shadow-[0_2px_8px_rgba(18,38,48,0.035)]",
  metricCardHeader: "flex-row items-center justify-between gap-2",
  metricTrend: "text-[10px] font-bold uppercase tracking-wider text-slate-400",
  metricLabel: "text-[10px] font-black uppercase tracking-wider text-slate-400",
  metricValue: "mt-2 text-3xl font-black tracking-tight text-slate-900",
  metricSupporting: "mt-0.5 text-xs text-slate-500",
  recentSection:
    "mt-5 rounded-xl border border-[#DCE4E7] bg-white p-5 md:p-6 shadow-[0_2px_8px_rgba(18,38,48,0.035)]",
  sectionCaption: "text-xs text-slate-500",
  countCaption:
    "rounded-full bg-slate-100 border border-black/[0.05] px-2.5 py-1 text-[11px] font-bold text-marush-primary",
  requestSummary:
    "flex-row items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4",
  requestSummaryIcon:
    "rounded-xl bg-white p-2.5 border border-amber-100 shadow-sm",
  requestSummaryTitle: "text-sm font-bold text-slate-900",
  requestSummaryText: "mt-0.5 text-xs text-slate-600",
  compactEmptyState:
    "items-center rounded-3xl border border-dashed border-black/[0.1] bg-white p-8",
  requestCardHeader: "flex-row flex-wrap items-start justify-between gap-3",
  requestDetails:
    "mt-3 flex-row flex-wrap gap-8 border-t border-black/[0.05] pt-3",
  requestDetailLabel:
    "text-[10px] font-bold uppercase tracking-wider text-slate-400",
  requestDetailValue: "mt-0.5 text-xs font-semibold capitalize text-slate-800",
  directorySummary:
    "flex-row items-center rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm",
  directorySummaryItem: "min-w-0 flex-1 items-center",
  directorySummaryValue: "text-xl font-black text-slate-900",
  directorySummaryLabel: "mt-0.5 text-[11px] font-medium text-slate-500",
  directorySummaryDivider: "h-8 w-px bg-black/[0.06]",
  directoryToolbar:
    "gap-3 rounded-2xl border border-black/[0.07] bg-white p-3 shadow-sm md:flex-row md:items-center",
  searchWrapper:
    "flex-row items-center gap-2 rounded-xl border border-black/[0.08] bg-slate-50/80 px-3.5",
  searchInput: "min-w-0 flex-1 py-2.5 text-sm text-slate-800",
  filterScroll: "gap-2",
  filterChip:
    "rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 shadow-sm transition-all",
  filterChipActive: "border-marush-primary bg-marush-primary shadow-sm",
  filterChipText: "text-xs font-semibold text-slate-600",
  filterChipTextActive: "text-white font-bold",
  directoryEmptyState:
    "items-center rounded-3xl border border-dashed border-black/[0.1] bg-white p-10",
  programCard:
    "mb-3 gap-2 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]",
  progHeaderRow: "flex-row flex-wrap items-start justify-between gap-2",
  progTitle: "min-w-0 flex-1 text-base font-bold tracking-tight text-slate-900",
  progLocation: "text-sm font-medium text-slate-600",
  progMeta: "mt-1 text-xs text-slate-400",
  activeTag: "rounded-full bg-teal-50 border border-teal-200 px-3 py-1",
  activeTagText:
    "text-[10px] font-black uppercase tracking-wider text-teal-800",
  completedTag:
    "rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1",
  completedTagText:
    "text-[10px] font-black uppercase tracking-wider text-emerald-800",
  scoreText: "mt-1 text-xs font-black text-emerald-800",
  remarksSnippet: "mt-2 rounded-2xl bg-slate-50 border border-black/[0.05] p-3",
  remarksText: "text-xs italic text-slate-600",
  progDetailBox:
    "mt-2 gap-1 rounded-2xl bg-slate-50 border border-black/[0.05] p-3",
  progDetailText: "text-xs text-slate-600",
  bold: "font-bold text-slate-900",
  emptyBox:
    "items-center rounded-3xl border border-dashed border-black/[0.1] bg-white p-10",
  emptyTitle: "text-sm font-bold text-slate-800",
  emptyText: "mt-1 max-w-[360px] text-center text-xs text-slate-500",
  sectionHeaderRow: "flex-row flex-wrap items-center justify-between gap-3",
  addButton:
    "rounded-2xl bg-marush-primary px-3.5 py-2 shadow-sm active:scale-[0.97]",
  addButtonText: "text-xs font-bold text-white",
  employeeCard:
    "mb-3 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]",
  empHeader: "flex-row flex-wrap items-start justify-between gap-3",
  employeeIdentity: "min-w-0 flex-1 flex-row items-center gap-3.5",
  employeeAvatar:
    "h-11 w-11 items-center justify-center rounded-2xl bg-marush-primary-subtle border border-marush-primary/15",
  employeeAvatarText: "text-sm font-black text-marush-primary",
  employeeDetails:
    "mt-3 flex-row flex-wrap gap-4 border-t border-black/[0.05] pt-3",
  empName: "text-sm font-bold text-slate-900",
  empEmail: "text-xs text-slate-500",
  empCode: "text-[10px] font-mono font-bold text-slate-400",
  empPhone: "mt-0.5 text-xs text-slate-500",
  empBadgeGroup: "items-end gap-1.5",
  roleBadge: "rounded-full px-2.5 py-0.5",
  roleBadgeText: "text-[9px] font-bold text-white uppercase tracking-wider",
  statusBadge:
    "rounded-full bg-slate-100 border border-black/[0.05] px-2.5 py-0.5",
  statusBadgeText:
    "text-[9px] font-bold text-slate-700 uppercase tracking-wider",
  empActionRow:
    "mt-3 flex-row justify-end gap-2 border-t border-black/[0.05] pt-3",
  editBtn:
    "rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 shadow-sm active:scale-[0.97]",
  editBtnText: "text-xs font-semibold text-slate-600",
  deleteBtn:
    "rounded-xl border border-red-200 bg-red-50/70 px-3 py-1.5 active:scale-[0.97]",
  deleteBtnText: "text-xs font-bold text-red-700",
  approvalCard:
    "mb-3 gap-2 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]",
  approvalTitle: "text-base font-bold text-slate-900",
  approveTeamBtn:
    "mt-3 items-center rounded-2xl bg-marush-primary py-2.5 shadow-sm active:scale-[0.97]",
  approveTeamBtnText: "text-xs font-bold text-white tracking-tight",
  approvalBtnRow: "mt-3 flex-row flex-wrap gap-2.5",
  approveUserBtn:
    "min-w-[140px] flex-1 items-center rounded-2xl bg-marush-primary py-2.5 shadow-sm active:scale-[0.97]",
  approveUserBtnText: "text-xs font-bold text-white tracking-tight",
  rejectUserBtn:
    "min-w-[96px] flex-1 items-center rounded-2xl border border-black/[0.08] bg-slate-100 px-3.5 py-2.5 active:scale-[0.97]",
  rejectUserBtnText: "text-xs font-bold text-slate-700",
  modalOverlay:
    "flex-1 items-center justify-center bg-black/40 backdrop-blur-sm p-4",
  modalCard:
    "max-h-[85%] w-full max-w-[520px] rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-black/[0.08]",
  modalTitle: "text-xl font-black tracking-tight text-slate-900",
  modalSub: "mb-4 text-xs text-slate-500",
  modalBody: "mb-4",
  detailRow:
    "flex-row flex-wrap justify-between gap-x-2 gap-y-1 border-b border-black/[0.05] py-2",
  detailLabel: "text-[11px] font-bold uppercase tracking-wider text-slate-400",
  detailValue: "text-xs font-semibold text-slate-800",
  metricsBox:
    "mt-3 gap-1 rounded-2xl bg-slate-50 border border-black/[0.05] p-3.5",
  metricsBoxTitle:
    "mb-1 text-xs font-bold text-marush-primary uppercase tracking-wide",
  metricLine: "text-xs text-slate-600",
  auditorBox:
    "mt-3 gap-1 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5",
  auditorBoxTitle: "text-xs font-bold text-emerald-800 uppercase tracking-wide",
  auditorRemarksText: "text-xs italic text-emerald-900",
  scoreBadge: "mt-1 text-xs font-black text-emerald-800",
  closeBtn:
    "items-center rounded-2xl bg-marush-primary py-3 shadow-sm active:scale-[0.98]",
  closeBtnText: "text-xs font-bold text-white tracking-tight",
  auditorSelectLabel:
    "mb-2 text-xs font-bold uppercase tracking-wider text-slate-500",
  auditorList: "mb-4 gap-2",
  auditorItem:
    "rounded-2xl border border-black/[0.08] bg-slate-50 p-3.5 active:scale-[0.98]",
  auditorItemActive: "border-marush-primary bg-marush-primary shadow-sm",
  auditorItemText: "text-sm font-semibold text-slate-800",
  auditorItemTextActive: "font-bold text-white",
  modalBtnRow: "flex-row flex-wrap justify-end gap-2.5",
  cancelModalBtn:
    "min-w-[100px] flex-1 items-center rounded-2xl border border-black/[0.08] px-4 py-2.5 active:scale-[0.97]",
  cancelModalBtnText: "text-xs font-bold text-slate-600",
  confirmModalBtn:
    "min-w-[120px] flex-1 items-center rounded-2xl bg-marush-primary px-4 py-2.5 shadow-sm active:scale-[0.97]",
  confirmModalBtnText: "text-xs font-bold text-white tracking-tight",
  modalInput:
    "mb-3 rounded-xl border border-black/[0.08] bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800",
  rolePickerRow: "mb-4 flex-row flex-wrap gap-2",
  rolePickBtn:
    "rounded-2xl border border-black/[0.08] bg-slate-50 px-3 py-2 active:scale-[0.97]",
  rolePickBtnActive:
    "border-marush-primary bg-marush-primary shadow-sm text-black",
  rolePickBtnText: "text-xs font-semibold capitalize text-slate-600",
  rolePickBtnTextActive: "font-bold text-white",
};
