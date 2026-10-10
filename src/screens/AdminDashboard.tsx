import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Colors } from '../constants/colors';
import { UserProfile, Program, UserRole } from '../types';
import { dataProvider, mockStore } from '../services/supabase';

interface AdminDashboardProps {
  currentUser: UserProfile;
}

type TabType = 'overview' | 'programs' | 'active_programs' | 'employees' | 'approvals';

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [users, setUsers] = useState<UserProfile[]>(mockStore.getUsers());
  const [programs, setPrograms] = useState<Program[]>(mockStore.getPrograms());
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Employee CRUD Modal State
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<UserProfile | null>(null);
  const [empFullName, setEmpFullName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empRole, setEmpRole] = useState<UserRole>('employee');
  const [empPhone, setEmpPhone] = useState('');
  const [empCode, setEmpCode] = useState('');

  // Program Detail / Inspection Modal
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Auditor Assignment Modal for Team Approval
  const [approvingProgram, setApprovingProgram] = useState<Program | null>(null);
  const [selectedAuditorId, setSelectedAuditorId] = useState<string>('');

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [latestUsers, latestPrograms] = await Promise.all([
        dataProvider.getUsers(),
        dataProvider.getPrograms(),
      ]);
      setUsers(latestUsers);
      setPrograms(latestPrograms);
    } catch {
      // Fallback to local store
      setUsers(mockStore.getUsers());
      setPrograms(mockStore.getPrograms());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const completedPrograms = programs.filter(p => p.status === 'completed');
  const activeProgramsList = programs.filter(p => p.status === 'active');
  const pendingTeamPrograms = programs.filter(p => p.status === 'pending_approval');
  const pendingUsers = users.filter(u => u.status === 'pending');
  const auditors = users.filter(u => u.role === 'program_auditor' && u.status === 'approved');

  // Filtered lists for search
  const filteredUsers = users.filter(
    u =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.employeeCode && u.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCompletedPrograms = completedPrograms.filter(
    p =>
      p.programName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.hatcheryOrFarmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.controllerName && p.controllerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Employee CRUD Actions
  const handleOpenAddEmp = () => {
    setEditingEmp(null);
    setEmpFullName('');
    setEmpEmail('');
    setEmpRole('employee');
    setEmpPhone('');
    setEmpCode(`MRSH-EMP-${Math.floor(100 + Math.random() * 900)}`);
    setIsEmpModalOpen(true);
  };

  const handleOpenEditEmp = (emp: UserProfile) => {
    setEditingEmp(emp);
    setEmpFullName(emp.fullName);
    setEmpEmail(emp.email);
    setEmpRole(emp.role);
    setEmpPhone(emp.phone || '');
    setEmpCode(emp.employeeCode || '');
    setIsEmpModalOpen(true);
  };

  const handleSaveEmployee = async () => {
    if (!empFullName.trim() || !empEmail.trim()) {
      Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Name and email are required.' });
      return;
    }

    if (editingEmp) {
      await dataProvider.updateUserRole(editingEmp.id, empRole);
      Toast.show({ type: 'success', text1: 'Updated', text2: `${empFullName} role updated.` });
    } else {
      await dataProvider.addUser({
        fullName: empFullName.trim(),
        email: empEmail.trim(),
        role: empRole,
        status: 'approved',
        phone: empPhone.trim() || undefined,
        employeeCode: empCode.trim() || `MRSH-EMP-${Math.floor(100 + Math.random() * 900)}`,
      });
      Toast.show({ type: 'success', text1: 'Employee Added', text2: `${empFullName} registered.` });
    }

    setIsEmpModalOpen(false);
    refreshData();
  };

  const handleDeleteEmployee = async (id: string) => {
    await dataProvider.deleteUser(id);
    Toast.show({ type: 'info', text1: 'Deleted', text2: 'Employee removed from system.' });
    refreshData();
  };

  const handleApproveUser = async (id: string) => {
    await dataProvider.updateUserStatus(id, 'approved');
    Toast.show({ type: 'success', text1: 'User Approved', text2: 'Account verified.' });
    refreshData();
  };

  const handleRejectUser = async (id: string) => {
    await dataProvider.updateUserStatus(id, 'rejected');
    Toast.show({ type: 'error', text1: 'User Rejected', text2: 'Account access declined.' });
    refreshData();
  };

  // Program Approval & Auditor Assignment
  const handleOpenTeamApproval = (prog: Program) => {
    setApprovingProgram(prog);
    if (auditors.length > 0) {
      setSelectedAuditorId(auditors[0].id);
    }
  };

  const handleConfirmTeamApproval = async () => {
    if (!approvingProgram) return;
    if (!selectedAuditorId) {
      Toast.show({ type: 'error', text1: 'Auditor Required', text2: 'Please assign a Program Auditor.' });
      return;
    }

    await dataProvider.approveProgramAndStart(approvingProgram.id, selectedAuditorId);
    Toast.show({
      type: 'success',
      text1: 'Program Approved & Started',
      text2: `${approvingProgram.programName} is now ACTIVE!`,
    });
    setApprovingProgram(null);
    refreshData();
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation & Refresh */}
      <View style={styles.navTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'active_programs', label: `Active Programs (${activeProgramsList.length})` },
            { id: 'programs', label: `All Programs Done (${completedPrograms.length})` },
            { id: 'employees', label: `Employees (${users.length})` },
            { id: 'approvals', label: `Pending Approvals (${pendingUsers.length + pendingTeamPrograms.length})` },
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabItem, activeTab === tab.id && styles.activeTabItem]}
              onPress={() => {
                setActiveTab(tab.id as TabType);
                setSearchQuery('');
              }}
            >
              <Text style={[styles.tabItemText, activeTab === tab.id && styles.activeTabItemText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.refreshBtn} onPress={refreshData} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.refreshBtnText}>↻ Refresh</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionHeading}>Operations & Program Summary</Text>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { borderLeftColor: Colors.primary }]}>
                <Text style={styles.metricLabel}>Total Programs Done</Text>
                <Text style={[styles.metricValue, { color: Colors.primary }]}>
                  {completedPrograms.length}
                </Text>
              </View>

              <View style={[styles.metricCard, { borderLeftColor: Colors.secondary }]}>
                <Text style={styles.metricLabel}>Currently Active</Text>
                <Text style={[styles.metricValue, { color: Colors.secondary }]}>
                  {activeProgramsList.length}
                </Text>
              </View>

              <View style={[styles.metricCard, { borderLeftColor: Colors.accent }]}>
                <Text style={styles.metricLabel}>Pending Team Approvals</Text>
                <Text style={[styles.metricValue, { color: Colors.accent }]}>
                  {pendingTeamPrograms.length}
                </Text>
              </View>

              <View style={[styles.metricCard, { borderLeftColor: '#8B5CF6' }]}>
                <Text style={styles.metricLabel}>Pending Staff Signups</Text>
                <Text style={[styles.metricValue, { color: '#8B5CF6' }]}>
                  {pendingUsers.length}
                </Text>
              </View>
            </View>

            {/* Quick Action: Recently Active */}
            <View style={styles.recentSection}>
              <Text style={styles.subHeading}>Active Programs In The Field</Text>
              {activeProgramsList.length === 0 ? (
                <Text style={styles.emptyText}>No active programs running at the moment.</Text>
              ) : (
                activeProgramsList.map(prog => (
                  <View key={prog.id} style={styles.programCard}>
                    <View style={styles.progHeaderRow}>
                      <Text style={styles.progTitle}>{prog.programName}</Text>
                      <View style={styles.activeTag}>
                        <Text style={styles.activeTagText}>IN PROGRESS</Text>
                      </View>
                    </View>
                    <Text style={styles.progLocation}>{prog.hatcheryOrFarmName}</Text>
                    <Text style={styles.progMeta}>
                      Flock: {prog.flockSize.toLocaleString()} birds • Controller: {prog.controllerName}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ACTIVE PROGRAMS TAB */}
        {activeTab === 'active_programs' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionHeading}>Currently Active Programs</Text>
            {activeProgramsList.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No programs are currently running.</Text>
              </View>
            ) : (
              activeProgramsList.map(prog => (
                <View key={prog.id} style={styles.programCard}>
                  <View style={styles.progHeaderRow}>
                    <Text style={styles.progTitle}>{prog.programName}</Text>
                    <View style={styles.activeTag}>
                      <Text style={styles.activeTagText}>ACTIVE</Text>
                    </View>
                  </View>
                  <Text style={styles.progLocation}>{prog.hatcheryOrFarmName}</Text>
                  <View style={styles.progDetailBox}>
                    <Text style={styles.progDetailText}>
                      <Text style={styles.bold}>Controller:</Text> {prog.controllerName}
                    </Text>
                    <Text style={styles.progDetailText}>
                      <Text style={styles.bold}>Auditor:</Text> {prog.auditorName || 'Pending'}
                    </Text>
                    <Text style={styles.progDetailText}>
                      <Text style={styles.bold}>Scheduled:</Text> {prog.scheduledStartDate} ({prog.scheduledStartTime} - {prog.scheduledEndTime})
                    </Text>
                    <Text style={styles.progDetailText}>
                      <Text style={styles.bold}>Assigned Staff:</Text> {prog.teamMemberIds.length} members
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ALL PROGRAMS DONE TAB */}
        {activeTab === 'programs' && (
          <View style={styles.tabSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Completed Programs Archive</Text>
            </View>

            <TextInput
              style={styles.searchBar}
              placeholder="Search programs by name, location, or controller..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {filteredCompletedPrograms.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No matching completed programs found.</Text>
              </View>
            ) : (
              filteredCompletedPrograms.map(prog => (
                <TouchableOpacity
                  key={prog.id}
                  style={styles.programCard}
                  onPress={() => setSelectedProgram(prog)}
                >
                  <View style={styles.progHeaderRow}>
                    <Text style={styles.progTitle}>{prog.programName}</Text>
                    <View style={styles.completedTag}>
                      <Text style={styles.completedTagText}>DONE</Text>
                    </View>
                  </View>
                  <Text style={styles.progLocation}>{prog.hatcheryOrFarmName}</Text>
                  <Text style={styles.progMeta}>
                    Controller: {prog.controllerName} • Auditor: {prog.auditorName}
                  </Text>
                  {prog.auditScore ? (
                    <Text style={styles.scoreText}>Quality Score: {prog.auditScore}/100</Text>
                  ) : null}
                  {prog.auditorRemarks ? (
                    <View style={styles.remarksSnippet}>
                      <Text style={styles.remarksText} numberOfLines={2}>
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
        {activeTab === 'employees' && (
          <View style={styles.tabSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>Employee Directory</Text>
              <TouchableOpacity style={styles.addButton} onPress={handleOpenAddEmp}>
                <Text style={styles.addButtonText}>+ Add Employee</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchBar}
              placeholder="Search by name, email, or employee code..."
              placeholderTextColor={Colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {filteredUsers.map(emp => (
              <View key={emp.id} style={styles.employeeCard}>
                <View style={styles.empHeader}>
                  <View>
                    <Text style={styles.empName}>{emp.fullName}</Text>
                    <Text style={styles.empEmail}>{emp.email}</Text>
                    <Text style={styles.empCode}>{emp.employeeCode || 'N/A'}</Text>
                    {emp.phone ? <Text style={styles.empPhone}>{emp.phone}</Text> : null}
                  </View>
                  <View style={styles.empBadgeGroup}>
                    <View style={[styles.roleBadge, { backgroundColor: Colors.primaryLight }]}>
                      <Text style={styles.roleBadgeText}>{emp.role.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: emp.status === 'approved' ? '#D1FAE5' : '#FEF3C7' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: emp.status === 'approved' ? '#065F46' : '#92400E' },
                        ]}
                      >
                        {emp.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.empActionRow}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEditEmp(emp)}>
                    <Text style={styles.editBtnText}>Edit Role</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteEmployee(emp.id)}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* APPROVALS TAB */}
        {activeTab === 'approvals' && (
          <View style={styles.tabSection}>
            <Text style={styles.sectionHeading}>Pending Program Teams</Text>
            {pendingTeamPrograms.length === 0 ? (
              <Text style={styles.emptyText}>No program teams pending approval.</Text>
            ) : (
              pendingTeamPrograms.map(prog => (
                <View key={prog.id} style={styles.approvalCard}>
                  <Text style={styles.approvalTitle}>{prog.programName}</Text>
                  <Text style={styles.progLocation}>{prog.hatcheryOrFarmName}</Text>
                  <Text style={styles.progMeta}>
                    Controller: {prog.controllerName} • Team: {prog.teamMemberIds.length} members
                  </Text>
                  <TouchableOpacity
                    style={styles.approveTeamBtn}
                    onPress={() => handleOpenTeamApproval(prog)}
                  >
                    <Text style={styles.approveTeamBtnText}>Assign Auditor & Start Program</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Pending User Registrations</Text>
            {pendingUsers.length === 0 ? (
              <Text style={styles.emptyText}>No pending user accounts.</Text>
            ) : (
              pendingUsers.map(user => (
                <View key={user.id} style={styles.approvalCard}>
                  <Text style={styles.approvalTitle}>{user.fullName}</Text>
                  <Text style={styles.progLocation}>{user.email}</Text>
                  <Text style={styles.progMeta}>
                    Requested Role: {user.role.replace('_', ' ').toUpperCase()}
                  </Text>
                  <View style={styles.approvalBtnRow}>
                    <TouchableOpacity
                      style={styles.approveUserBtn}
                      onPress={() => handleApproveUser(user.id)}
                    >
                      <Text style={styles.approveUserBtnText}>Approve Account</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectUserBtn}
                      onPress={() => handleRejectUser(user.id)}
                    >
                      <Text style={styles.rejectUserBtnText}>Reject</Text>
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{selectedProgram.programName}</Text>
              <Text style={styles.modalSub}>{selectedProgram.hatcheryOrFarmName}</Text>

              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.detailValue, { color: Colors.success, fontWeight: '800' }]}>
                    COMPLETED
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Controller:</Text>
                  <Text style={styles.detailValue}>{selectedProgram.controllerName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Auditor:</Text>
                  <Text style={styles.detailValue}>{selectedProgram.auditorName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Flock Size:</Text>
                  <Text style={styles.detailValue}>{selectedProgram.flockSize.toLocaleString()} birds</Text>
                </View>

                {selectedProgram.completionMetrics && (
                  <View style={styles.metricsBox}>
                    <Text style={styles.metricsBoxTitle}>Vaccination & Monitoring Metrics</Text>
                    <Text style={styles.metricLine}>
                      • Birds Vaccinated: {selectedProgram.completionMetrics.birdsVaccinated.toLocaleString()}
                    </Text>
                    <Text style={styles.metricLine}>
                      • Dosage: {selectedProgram.completionMetrics.dosagePerBird}
                    </Text>
                    <Text style={styles.metricLine}>
                      • Vaccine Type: {selectedProgram.completionMetrics.vaccineType}
                    </Text>
                    <Text style={styles.metricLine}>
                      • Batch #: {selectedProgram.completionMetrics.batchNumber}
                    </Text>
                    <Text style={styles.metricLine}>
                      • Cold Chain Temp: {selectedProgram.completionMetrics.coldChainTempCelsius}°C
                    </Text>
                    <Text style={styles.metricLine}>
                      • Observations: {selectedProgram.completionMetrics.farmFlockObservations}
                    </Text>
                  </View>
                )}

                {selectedProgram.auditorRemarks && (
                  <View style={styles.auditorBox}>
                    <Text style={styles.auditorBoxTitle}>Auditor Sign-off & Remarks</Text>
                    <Text style={styles.auditorRemarksText}>{selectedProgram.auditorRemarks}</Text>
                    {selectedProgram.auditScore ? (
                      <Text style={styles.scoreBadge}>Score: {selectedProgram.auditScore}/100</Text>
                    ) : null}
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedProgram(null)}>
                <Text style={styles.closeBtnText}>Close Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Auditor Assignment Modal */}
      {approvingProgram && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Approve Team & Assign Auditor</Text>
              <Text style={styles.modalSub}>{approvingProgram.programName}</Text>
              <Text style={styles.auditorSelectLabel}>Select Program Auditor:</Text>
              <View style={styles.auditorList}>
                {auditors.map(aud => (
                  <TouchableOpacity
                    key={aud.id}
                    style={[
                      styles.auditorItem,
                      selectedAuditorId === aud.id && styles.auditorItemActive,
                    ]}
                    onPress={() => setSelectedAuditorId(aud.id)}
                  >
                    <Text
                      style={[
                        styles.auditorItemText,
                        selectedAuditorId === aud.id && styles.auditorItemTextActive,
                      ]}
                    >
                      {aud.fullName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setApprovingProgram(null)}
                >
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmModalBtn}
                  onPress={handleConfirmTeamApproval}
                >
                  <Text style={styles.confirmModalBtnText}>Start Program</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Add / Edit Employee Modal */}
      {isEmpModalOpen && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {editingEmp ? 'Edit Employee Role' : 'Add New Employee'}
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Full Name"
                placeholderTextColor={Colors.textMuted}
                value={empFullName}
                onChangeText={setEmpFullName}
                editable={!editingEmp}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Work Email"
                placeholderTextColor={Colors.textMuted}
                value={empEmail}
                onChangeText={setEmpEmail}
                editable={!editingEmp}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Phone / WhatsApp"
                placeholderTextColor={Colors.textMuted}
                value={empPhone}
                onChangeText={setEmpPhone}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Employee Code"
                placeholderTextColor={Colors.textMuted}
                value={empCode}
                onChangeText={setEmpCode}
                editable={!editingEmp}
              />
              <Text style={styles.auditorSelectLabel}>Select Role:</Text>
              <View style={styles.rolePickerRow}>
                {(['employee', 'program_controller', 'program_auditor', 'admin'] as UserRole[]).map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.rolePickBtn, empRole === r && styles.rolePickBtnActive]}
                    onPress={() => setEmpRole(r)}
                  >
                    <Text
                      style={[
                        styles.rolePickBtnText,
                        empRole === r && styles.rolePickBtnTextActive,
                      ]}
                    >
                      {r.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setIsEmpModalOpen(false)}
                >
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmModalBtn} onPress={handleSaveEmployee}>
                  <Text style={styles.confirmModalBtnText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  navTabs: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabsScroll: {
    paddingHorizontal: 12,
    gap: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tabItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  activeTabItem: {
    backgroundColor: Colors.primary,
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabItemText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 8,
  },
  content: {
    padding: 16,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  tabSection: {
    gap: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  recentSection: {
    marginTop: 8,
  },
  programCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    gap: 4,
  },
  progHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  progLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  progMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  activeTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTagText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '800',
  },
  completedTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  completedTagText: {
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '800',
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  remarksSnippet: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
  },
  remarksText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.textSecondary,
  },
  progDetailBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  progDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  employeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  empHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  empName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  empEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  empCode: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  empPhone: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  empBadgeGroup: {
    alignItems: 'flex-end',
    gap: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  empActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  deleteBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  approvalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
    gap: 4,
  },
  approvalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  approveTeamBtn: {
    backgroundColor: Colors.secondary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  approveTeamBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  approvalBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  approveUserBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveUserBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  rejectUserBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  rejectUserBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  modalBody: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  metricsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 4,
  },
  metricsBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  metricLine: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  auditorBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 4,
  },
  auditorBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  auditorRemarksText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#166534',
  },
  scoreBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 4,
  },
  closeBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  auditorSelectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  auditorList: {
    gap: 6,
    marginBottom: 16,
  },
  auditorItem: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F8FAFC',
  },
  auditorItemActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  auditorItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  auditorItemTextActive: {
    color: '#FFFFFF',
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelModalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelModalBtnText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  confirmModalBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 10,
  },
  rolePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  rolePickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F8FAFC',
  },
  rolePickBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rolePickBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  rolePickBtnTextActive: {
    color: '#FFFFFF',
  },
});
