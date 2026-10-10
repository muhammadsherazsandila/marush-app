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
import { UserProfile, Program, AuditChecklistItem } from '../types';
import { dataProvider, mockStore } from '../services/supabase';

interface ProgramAuditorDashboardProps {
  currentUser: UserProfile;
}

const DEFAULT_CHECKLIST: AuditChecklistItem[] = [
  { item: 'Cold-chain maintained at optimal 2°C - 8°C throughout', passed: true },
  { item: 'Vaccine batch number & Ceva pharmaceutical seal verified', passed: true },
  { item: 'Automated injection / spray equipment sterilized per SOP', passed: true },
  { item: 'Dosage calibration verified per bird / crate count', passed: true },
  { item: 'Flock vitality and post-vaccine condition confirmed', passed: true },
];

export const ProgramAuditorDashboard: React.FC<ProgramAuditorDashboardProps> = ({
  currentUser,
}) => {
  const [programs, setPrograms] = useState<Program[]>(mockStore.getPrograms());
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Review Modal State
  const [auditingProgram, setAuditingProgram] = useState<Program | null>(null);
  const [remarks, setRemarks] = useState('');
  const [score, setScore] = useState('96');
  const [checklist, setChecklist] = useState<AuditChecklistItem[]>(DEFAULT_CHECKLIST);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const allProgs = await dataProvider.getPrograms();
      setPrograms(allProgs);
    } catch {
      setPrograms(mockStore.getPrograms());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const pendingAudits = programs.filter(p => p.status === 'pending_audit');
  const completedAudits = programs.filter(p => p.status === 'completed' && p.auditorRemarks);

  const handleOpenAuditModal = (prog: Program) => {
    setAuditingProgram(prog);
    setRemarks(
      `Cold-chain log verified at ${
        prog.completionMetrics?.coldChainTempCelsius || 4.0
      }°C. Vaccine batch ${
        prog.completionMetrics?.batchNumber || 'N/A'
      } meets Ceva standards. Flock viability approved.`
    );
    setScore('96');
    setChecklist(DEFAULT_CHECKLIST);
  };

  const toggleChecklistItem = (index: number) => {
    const updated = [...checklist];
    updated[index].passed = !updated[index].passed;
    setChecklist(updated);
  };

  const handleSignOffAudit = async () => {
    if (!auditingProgram) return;

    if (!remarks.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Remarks Required',
        text2: 'Please provide audit observations and remarks before sign-off.',
      });
      return;
    }

    const auditScoreNum = parseInt(score.trim(), 10);
    if (isNaN(auditScoreNum) || auditScoreNum < 0 || auditScoreNum > 100) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Score',
        text2: 'Score must be a number between 0 and 100.',
      });
      return;
    }

    setSubmitting(true);
    try {
      await dataProvider.submitAuditRemarks(
        auditingProgram.id,
        currentUser.id,
        remarks.trim(),
        auditScoreNum,
        checklist
      );

      Toast.show({
        type: 'success',
        text1: 'Audit Signed Off & Program Completed',
        text2: `${auditingProgram.programName} marked as DONE and synchronized with Admin records.`,
      });

      setAuditingProgram(null);
      refreshData();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Audit Submission Failed',
        text2: err?.message || 'Could not complete audit.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <View style={styles.tabGroup}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'pending' && styles.tabBtnActive]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'pending' && styles.tabBtnTextActive]}>
              Pending Review ({pendingAudits.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'completed' && styles.tabBtnTextActive]}>
              Audited Programs ({completedAudits.length})
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.refreshBtn} onPress={refreshData} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <Text style={styles.refreshBtnText}>↻ Refresh</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'pending' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Programs Awaiting Quality Audit & Sign-off</Text>
            {pendingAudits.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>All programs audited! No pending inspections.</Text>
              </View>
            ) : (
              pendingAudits.map(prog => (
                <View key={prog.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{prog.programName}</Text>
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingBadgeText}>NEEDS AUDIT</Text>
                    </View>
                  </View>
                  <Text style={styles.cardSub}>{prog.hatcheryOrFarmName}</Text>
                  <Text style={styles.cardMeta}>
                    Controller: {prog.controllerName} • Flock: {prog.flockSize.toLocaleString()} birds
                  </Text>

                  {prog.completionMetrics && (
                    <View style={styles.metricsPreview}>
                      <Text style={styles.metricsPreviewText}>
                        Vaccinated: {prog.completionMetrics.birdsVaccinated.toLocaleString()} • Batch: {prog.completionMetrics.batchNumber} • Cold-Chain: {prog.completionMetrics.coldChainTempCelsius}°C
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => handleOpenAuditModal(prog)}
                  >
                    <Text style={styles.reviewBtnText}>Inspect & Enter Remarks</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historical Audits & Remarks Log</Text>
            {completedAudits.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No completed audits recorded yet.</Text>
              </View>
            ) : (
              completedAudits.map(prog => (
                <View key={prog.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{prog.programName}</Text>
                    <View style={styles.doneBadge}>
                      <Text style={styles.doneBadgeText}>AUDITED & DONE</Text>
                    </View>
                  </View>
                  <Text style={styles.cardSub}>{prog.hatcheryOrFarmName}</Text>
                  <Text style={styles.scoreText}>Quality Score: {prog.auditScore}/100</Text>
                  <View style={styles.remarksBox}>
                    <Text style={styles.remarksText}>"{prog.auditorRemarks}"</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Review & Sign-Off Modal */}
      {auditingProgram && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Program Quality Audit Review</Text>
              <Text style={styles.modalSub}>{auditingProgram.programName}</Text>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.fieldBox}>
                  <Text style={styles.fieldLabel}>Submitted By Controller:</Text>
                  <Text style={styles.fieldVal}>{auditingProgram.controllerName}</Text>
                  <Text style={styles.fieldLabel}>Birds Vaccinated:</Text>
                  <Text style={styles.fieldVal}>
                    {auditingProgram.completionMetrics?.birdsVaccinated.toLocaleString() || 'N/A'}
                  </Text>
                  <Text style={styles.fieldLabel}>Vaccine Batch & Type:</Text>
                  <Text style={styles.fieldVal}>
                    {auditingProgram.completionMetrics?.vaccineType} (Batch #{auditingProgram.completionMetrics?.batchNumber})
                  </Text>
                  <Text style={styles.fieldLabel}>Cold-Chain Log Temperature:</Text>
                  <Text style={styles.fieldVal}>
                    {auditingProgram.completionMetrics?.coldChainTempCelsius}°C (Target: 2°C - 8°C)
                  </Text>
                  <Text style={styles.fieldLabel}>Field Observations:</Text>
                  <Text style={styles.fieldVal}>
                    {auditingProgram.completionMetrics?.farmFlockObservations}
                  </Text>
                </View>

                {/* Audit Checklist */}
                <View style={styles.checklistSection}>
                  <Text style={styles.checklistTitle}>Verification Checklist:</Text>
                  {checklist.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.checkItemRow}
                      onPress={() => toggleChecklistItem(idx)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          item.passed ? styles.checkboxChecked : styles.checkboxUnchecked,
                        ]}
                      >
                        <Text style={styles.checkboxText}>{item.passed ? '✓' : ''}</Text>
                      </View>
                      <Text style={styles.checkItemText}>{item.item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Auditor Remarks & Compliance Notes</Text>
                  <TextInput
                    style={[styles.input, { height: 70 }]}
                    multiline
                    value={remarks}
                    onChangeText={setRemarks}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Quality Compliance Score (0 - 100)</Text>
                  <TextInput
                    style={styles.input}
                    value={score}
                    onChangeText={setScore}
                    keyboardType="numeric"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelModalBtn}
                  onPress={() => setAuditingProgram(null)}
                  disabled={submitting}
                >
                  <Text style={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.signOffBtn, submitting && styles.btnDisabled]}
                  onPress={handleSignOffAudit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.signOffBtnText}>Sign Off & Mark Program Done</Text>
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
    backgroundColor: '#8B5CF6',
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
    color: '#8B5CF6',
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
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
  pendingBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    color: '#6D28D9',
    fontSize: 10,
    fontWeight: '800',
  },
  doneBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  doneBadgeText: {
    color: '#15803D',
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
  metricsPreview: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
  },
  metricsPreviewText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  reviewBtn: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  reviewBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 4,
  },
  remarksBox: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  remarksText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#166534',
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
  fieldBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    gap: 2,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  fieldVal: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  checklistSection: {
    backgroundColor: '#FAF5FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    gap: 8,
  },
  checklistTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  checkboxUnchecked: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8B4FE',
  },
  checkboxText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  checkItemText: {
    fontSize: 12,
    color: Colors.textPrimary,
    flex: 1,
  },
  inputGroup: {
    gap: 4,
    marginBottom: 10,
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
  signOffBtn: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  signOffBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
