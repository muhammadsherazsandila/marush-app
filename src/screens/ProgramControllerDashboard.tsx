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
import { UserProfile, Program, ProgramCompletionMetrics } from '../types';
import { dataProvider, mockStore } from '../services/supabase';

interface ProgramControllerDashboardProps {
  currentUser: UserProfile;
}

export const ProgramControllerDashboard: React.FC<ProgramControllerDashboardProps> = ({
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'my_programs' | 'initiate'>('my_programs');
  const [programs, setPrograms] = useState<Program[]>(mockStore.getPrograms());
  const [availableEmployees, setAvailableEmployees] = useState<UserProfile[]>(
    mockStore.getAvailableEmployees()
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State for Program Initiation
  const [programName, setProgramName] = useState('');
  const [hatcheryOrFarm, setHatcheryOrFarm] = useState('');
  const [flockSize, setFlockSize] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00 AM');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('04:00 PM');
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);

  // End Program / Send to Auditor Modal
  const [endingProgram, setEndingProgram] = useState<Program | null>(null);
  const [birdsVaccinated, setBirdsVaccinated] = useState('');
  const [dosagePerBird, setDosagePerBird] = useState('0.05 ml via automated Ceva Egginject');
  const [batchNumber, setBatchNumber] = useState('VND-2026-PK');
  const [vaccineType, setVaccineType] = useState('Vectormune ND + Cevac Transmune');
  const [coldChainTemp, setColdChainTemp] = useState('4.0');
  const [equipmentCheckPassed, setEquipmentCheckPassed] = useState(true);
  const [farmFlockNotes, setFarmFlockNotes] = useState('Flock condition optimal. Sterilization protocol followed.');

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [allProgs, available] = await Promise.all([
        dataProvider.getPrograms(),
        dataProvider.getAvailableEmployees(),
      ]);
      setPrograms(allProgs);
      setAvailableEmployees(available);
    } catch {
      setPrograms(mockStore.getPrograms());
      setAvailableEmployees(mockStore.getAvailableEmployees());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const myPrograms = programs.filter(p => p.controllerId === currentUser.id);

  const toggleSelectEmployee = (id: string) => {
    if (selectedEmpIds.includes(id)) {
      setSelectedEmpIds(selectedEmpIds.filter(eId => eId !== id));
    } else {
      setSelectedEmpIds([...selectedEmpIds, id]);
    }
  };

  const handleInitiateProgram = async () => {
    if (!programName.trim() || !hatcheryOrFarm.trim() || !flockSize.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Required Fields Missing',
        text2: 'Please provide program name, hatchery/farm, and flock size.',
      });
      return;
    }

    const parsedFlock = parseInt(flockSize.trim(), 10);
    if (isNaN(parsedFlock) || parsedFlock <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Flock Size',
        text2: 'Please enter a valid positive number for flock size.',
      });
      return;
    }

    if (selectedEmpIds.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Team Selected',
        text2: 'Select at least one available employee for the team.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const newProg = await dataProvider.createProgram({
        programName: programName.trim(),
        hatcheryOrFarmName: hatcheryOrFarm.trim(),
        flockSize: parsedFlock,
        scheduledStartDate: startDate,
        scheduledStartTime: startTime,
        scheduledEndDate: endDate,
        scheduledEndTime: endTime,
        controllerId: currentUser.id,
        teamMemberIds: selectedEmpIds,
      });

      Toast.show({
        type: 'success',
        text1: 'Team Submitted to Admin',
        text2: `${newProg.programName} sent for admin review and auditor assignment.`,
      });

      // Reset Form
      setProgramName('');
      setHatcheryOrFarm('');
      setFlockSize('');
      setSelectedEmpIds([]);
      setActiveTab('my_programs');
      refreshData();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: err?.message || 'Could not initiate program.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEndProgram = (prog: Program) => {
    setEndingProgram(prog);
    setBirdsVaccinated(prog.flockSize.toString());
    setDosagePerBird('0.05 ml via automated Ceva Egginject');
    setBatchNumber('VND-2026-PK');
    setVaccineType('Vectormune ND + Cevac Transmune');
    setColdChainTemp('4.0');
    setEquipmentCheckPassed(true);
    setFarmFlockNotes('Vaccination carried out per Ceva standard protocol. Cold-chain verified.');
  };

  const handleConfirmEndProgram = async () => {
    if (!endingProgram) return;

    setSubmitting(true);
    try {
      const metrics: ProgramCompletionMetrics = {
        birdsVaccinated: parseInt(birdsVaccinated.trim(), 10) || endingProgram.flockSize,
        dosagePerBird: dosagePerBird.trim(),
        batchNumber: batchNumber.trim(),
        vaccineType: vaccineType.trim(),
        coldChainTempCelsius: parseFloat(coldChainTemp.trim()) || 4.0,
        equipmentCheckPassed,
        farmFlockObservations: farmFlockNotes.trim(),
      };

      await dataProvider.submitProgramCompletion(endingProgram.id, metrics);

      Toast.show({
        type: 'success',
        text1: 'Program Ended & Submitted',
        text2: 'Details forwarded to Program Auditor for remarks.',
      });

      setEndingProgram(null);
      refreshData();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Submission Error',
        text2: err?.message || 'Could not complete program.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Switcher & Refresh */}
      <View style={styles.tabBar}>
        <View style={styles.tabGroup}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'my_programs' && styles.tabBtnActive]}
            onPress={() => setActiveTab('my_programs')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'my_programs' && styles.tabBtnTextActive]}>
              My Programs ({myPrograms.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'initiate' && styles.tabBtnActive]}
            onPress={() => {
              refreshData();
              setActiveTab('initiate');
            }}
          >
            <Text style={[styles.tabBtnText, activeTab === 'initiate' && styles.tabBtnTextActive]}>
              + Initiate Program
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={refreshData} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.refreshBtnText}>↻ Refresh</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'my_programs' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Field Operations Assigned to You</Text>
            {myPrograms.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>You have not initiated any programs yet.</Text>
                <TouchableOpacity
                  style={styles.initiatePromptBtn}
                  onPress={() => setActiveTab('initiate')}
                >
                  <Text style={styles.initiatePromptBtnText}>Initiate First Program</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myPrograms.map(prog => (
                <View key={prog.id} style={styles.progCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{prog.programName}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        prog.status === 'active' && { backgroundColor: '#DCFCE7' },
                        prog.status === 'pending_approval' && { backgroundColor: '#FEF3C7' },
                        prog.status === 'pending_audit' && { backgroundColor: '#EDE9FE' },
                        prog.status === 'completed' && { backgroundColor: '#E0F2FE' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          prog.status === 'active' && { color: '#15803D' },
                          prog.status === 'pending_approval' && { color: '#B45309' },
                          prog.status === 'pending_audit' && { color: '#6D28D9' },
                          prog.status === 'completed' && { color: '#0369A1' },
                        ]}
                      >
                        {prog.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardSub}>{prog.hatcheryOrFarmName}</Text>
                  <Text style={styles.cardMeta}>
                    Flock: {prog.flockSize.toLocaleString()} birds • Team: {prog.teamMemberIds.length} members
                  </Text>
                  <Text style={styles.cardMeta}>
                    Schedule: {prog.scheduledStartDate} ({prog.scheduledStartTime} - {prog.scheduledEndTime})
                  </Text>
                  {prog.auditorName ? (
                    <Text style={styles.cardMeta}>Assigned Auditor: {prog.auditorName}</Text>
                  ) : null}

                  {prog.status === 'active' && (
                    <TouchableOpacity
                      style={styles.endProgBtn}
                      onPress={() => handleOpenEndProgram(prog)}
                    >
                      <Text style={styles.endProgBtnText}>End Program & Send to Auditor</Text>
                    </TouchableOpacity>
                  )}

                  {prog.status === 'pending_approval' && (
                    <View style={styles.waitingBanner}>
                      <Text style={styles.waitingBannerText}>
                        Team submitted. Waiting for Admin to approve & assign Auditor.
                      </Text>
                    </View>
                  )}

                  {prog.status === 'pending_audit' && (
                    <View style={styles.waitingBanner}>
                      <Text style={styles.waitingBannerText}>
                        Program completed. Awaiting Auditor's review and remarks.
                      </Text>
                    </View>
                  )}

                  {prog.status === 'completed' && prog.auditorRemarks ? (
                    <View style={styles.auditFeedback}>
                      <Text style={styles.auditFeedbackTitle}>
                        Auditor Sign-off ({prog.auditorName}):
                      </Text>
                      <Text style={styles.auditFeedbackText}>"{prog.auditorRemarks}"</Text>
                      {prog.auditScore ? (
                        <Text style={styles.auditScorePill}>Audit Score: {prog.auditScore}/100</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Initiate Field Program & Draft Team</Text>
            <Text style={styles.formSub}>
              Select available personnel who are not engaged in any other active concurrent programs.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Program Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Hatchery Ceva ND In-Ovo Vaccination"
                placeholderTextColor={Colors.textMuted}
                value={programName}
                onChangeText={setProgramName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hatchery / Farm Location</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Big Bird Hatcheries - Unit 4, Raiwind"
                placeholderTextColor={Colors.textMuted}
                value={hatcheryOrFarm}
                onChangeText={setHatcheryOrFarm}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Flock Size (Birds)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 50000"
                placeholderTextColor={Colors.textMuted}
                value={flockSize}
                onChangeText={setFlockSize}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Start Date</Text>
                <TextInput
                  style={styles.input}
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Start Time</Text>
                <TextInput
                  style={styles.input}
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>End Date</Text>
                <TextInput
                  style={styles.input}
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>End Time</Text>
                <TextInput
                  style={styles.input}
                  value={endTime}
                  onChangeText={setEndTime}
                />
              </View>
            </View>

            {/* Dynamic Available Employees Selector */}
            <View style={styles.inputGroup}>
              <View style={styles.empSelectHeader}>
                <Text style={styles.label}>Select Available Team Members</Text>
                <Text style={styles.availCount}>
                  {availableEmployees.length} Available Staff
                </Text>
              </View>

              {availableEmployees.length === 0 ? (
                <View style={styles.noEmpBox}>
                  <Text style={styles.noEmpWarning}>
                    All employees are currently occupied in active programs!
                  </Text>
                </View>
              ) : (
                <View style={styles.empListGrid}>
                  {availableEmployees.map(emp => {
                    const isSelected = selectedEmpIds.includes(emp.id);
                    return (
                      <TouchableOpacity
                        key={emp.id}
                        style={[styles.empPill, isSelected && styles.empPillSelected]}
                        onPress={() => toggleSelectEmployee(emp.id)}
                      >
                        <Text
                          style={[
                            styles.empPillText,
                            isSelected && styles.empPillTextSelected,
                          ]}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {emp.fullName} ({emp.employeeCode || emp.role})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitProgBtn, submitting && styles.btnDisabled]}
              onPress={handleInitiateProgram}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitProgBtnText}>Submit Team to Admin for Approval</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* End Program / Send to Auditor Modal */}
      {endingProgram && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>End Program & Record Metrics</Text>
              <Text style={styles.modalSub}>{endingProgram.programName}</Text>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Total Birds Vaccinated</Text>
                  <TextInput
                    style={styles.input}
                    value={birdsVaccinated}
                    onChangeText={setBirdsVaccinated}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Dosage Per Bird</Text>
                  <TextInput
                    style={styles.input}
                    value={dosagePerBird}
                    onChangeText={setDosagePerBird}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Vaccine Batch Number</Text>
                  <TextInput
                    style={styles.input}
                    value={batchNumber}
                    onChangeText={setBatchNumber}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Vaccine Type</Text>
                  <TextInput
                    style={styles.input}
                    value={vaccineType}
                    onChangeText={setVaccineType}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Cold-Chain Log Temperature (°C)</Text>
                  <TextInput
                    style={styles.input}
                    value={coldChainTemp}
                    onChangeText={setColdChainTemp}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Equipment Check Status</Text>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      equipmentCheckPassed ? styles.toggleBtnPassed : styles.toggleBtnFailed,
                    ]}
                    onPress={() => setEquipmentCheckPassed(!equipmentCheckPassed)}
                  >
                    <Text style={styles.toggleBtnText}>
                      {equipmentCheckPassed ? '✓ Equipment Check PASSED' : '✕ Equipment Check FAILED'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Flock Monitoring Observations</Text>
                  <TextInput
                    style={[styles.input, { height: 60 }]}
                    multiline
                    value={farmFlockNotes}
                    onChangeText={setFarmFlockNotes}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setEndingProgram(null)}
                  disabled={submitting}
                >
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmModalBtn, submitting && styles.btnDisabled]}
                  onPress={handleConfirmEndProgram}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.confirmModalBtnText}>Send to Auditor</Text>
                  )}
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
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
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
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  content: {
    padding: 16,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  initiatePromptBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  initiatePromptBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  progCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cardMeta: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  endProgBtn: {
    backgroundColor: Colors.accent,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  endProgBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  waitingBanner: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  waitingBannerText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  auditFeedback: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  auditFeedbackTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  auditFeedbackText: {
    fontSize: 12,
    color: '#166534',
    fontStyle: 'italic',
    marginTop: 2,
  },
  auditScorePill: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 4,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
  },
  formSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#FAFAFA',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  empSelectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availCount: {
    fontSize: 11,
    color: Colors.secondaryDark,
    fontWeight: '700',
  },
  noEmpBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginVertical: 4,
  },
  noEmpWarning: {
    fontSize: 12,
    color: '#DC2626',
    fontStyle: 'italic',
  },
  empListGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  empPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F8FAFC',
  },
  empPillSelected: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  empPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  empPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitProgBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  submitProgBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  modalSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  modalScroll: {
    marginBottom: 16,
  },
  toggleBtn: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 2,
  },
  toggleBtnPassed: {
    backgroundColor: '#DCFCE7',
  },
  toggleBtnFailed: {
    backgroundColor: '#FEE2E2',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelModalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelModalBtnText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  confirmModalBtn: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
