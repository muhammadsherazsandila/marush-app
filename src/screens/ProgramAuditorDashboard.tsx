import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Check, ClipboardCheck, RefreshCw, ShieldCheck } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { UserProfile, Program, AuditChecklistItem } from '../types';
import { dataProvider } from '../services';

interface ProgramAuditorDashboardProps {
  currentUser: UserProfile;
  activeArea: 'overview' | 'programs';
}

const DEFAULT_CHECKLIST: AuditChecklistItem[] = [
  { item: 'Cold-chain maintained at optimal 2Ã‚Â°C - 8Ã‚Â°C throughout', passed: true },
  { item: 'Vaccine batch number & Ceva pharmaceutical seal verified', passed: true },
  { item: 'Automated injection / spray equipment sterilized per SOP', passed: true },
  { item: 'Dosage calibration verified per bird / crate count', passed: true },
  { item: 'Flock vitality and post-vaccine condition confirmed', passed: true },
];

export const ProgramAuditorDashboard: React.FC<ProgramAuditorDashboardProps> = ({
  currentUser,
  activeArea,
}) => {
  const [programs, setPrograms] = useState<Program[]>([]);
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
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Unable to load audit data',
        text2: error?.message || 'Check your connection and try again.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (activeArea === 'overview') setActiveTab('pending');
  }, [activeArea]);

  const pendingAudits = programs.filter(p => p.status === 'pending_audit');
  const completedAudits = programs.filter(p => p.status === 'completed' && p.auditorRemarks);

  const handleOpenAuditModal = (prog: Program) => {
    setAuditingProgram(prog);
    setRemarks(
      `Cold-chain log verified at ${
        prog.completionMetrics?.coldChainTempCelsius || 4.0
      }Ã‚Â°C. Vaccine batch ${
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
    <View className={styles.container}>
      {activeArea === 'programs' && <View className={styles.tabBar}>
        <View className={styles.tabGroup}>
          <TouchableOpacity
            className={`${styles.tabBtn} ${activeTab === 'pending' ? styles.tabBtnActive : ''}`}
            onPress={() => setActiveTab('pending')}
          >
            <Text className={`${styles.tabBtnText} ${activeTab === 'pending' ? styles.tabBtnTextActive : ''}`}>
              Pending Review ({pendingAudits.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`${styles.tabBtn} ${activeTab === 'completed' ? styles.tabBtnActive : ''}`}
            onPress={() => setActiveTab('completed')}
          >
            <Text className={`${styles.tabBtnText} ${activeTab === 'completed' ? styles.tabBtnTextActive : ''}`}>
              Audited Programs ({completedAudits.length})
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className={styles.refreshBtn} onPress={refreshData} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <View className="flex-row items-center gap-1.5">
              <RefreshCw size={15} color={Colors.primary} />
              <Text className={styles.refreshBtnText}>Refresh</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>}

      <ScrollView contentContainerClassName={styles.content}>
        {activeTab === 'pending' ? (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>Programs Awaiting Quality Audit & Sign-off</Text>
            {pendingAudits.length === 0 ? (
              <View className={styles.emptyBox}>
                <Text className={styles.emptyText}>All programs audited! No pending inspections.</Text>
              </View>
            ) : (
              pendingAudits.map(prog => (
                <View key={prog.id} className={styles.card}>
                  <View className={styles.cardHeader}>
                    <Text className={styles.cardTitle}>{prog.programName}</Text>
                    <View className={styles.pendingBadge}>
                      <Text className={styles.pendingBadgeText}>NEEDS AUDIT</Text>
                    </View>
                  </View>
                  <Text className={styles.cardSub}>{prog.hatcheryOrFarmName}</Text>
                  <Text className={styles.cardMeta}>
                    Controller: {prog.controllerName} Ã¢â‚¬Â¢ Flock: {prog.flockSize.toLocaleString()} birds
                  </Text>

                  {prog.completionMetrics && (
                    <View className={styles.metricsPreview}>
                      <Text className={styles.metricsPreviewText}>
                        Vaccinated: {prog.completionMetrics.birdsVaccinated.toLocaleString()} Ã¢â‚¬Â¢ Batch: {prog.completionMetrics.batchNumber} Ã¢â‚¬Â¢ Cold-Chain: {prog.completionMetrics.coldChainTempCelsius}Ã‚Â°C
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    className={styles.reviewBtn}
                    onPress={() => handleOpenAuditModal(prog)}
                  >
                    <Text className={styles.reviewBtnText}>Inspect & Enter Remarks</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>Historical Audits & Remarks Log</Text>
            {completedAudits.length === 0 ? (
              <View className={styles.emptyBox}>
                <Text className={styles.emptyText}>No completed audits recorded yet.</Text>
              </View>
            ) : (
              completedAudits.map(prog => (
                <View key={prog.id} className={styles.card}>
                  <View className={styles.cardHeader}>
                    <Text className={styles.cardTitle}>{prog.programName}</Text>
                    <View className={styles.doneBadge}>
                      <Text className={styles.doneBadgeText}>AUDITED & DONE</Text>
                    </View>
                  </View>
                  <Text className={styles.cardSub}>{prog.hatcheryOrFarmName}</Text>
                  <Text className={styles.scoreText}>Quality Score: {prog.auditScore}/100</Text>
                  <View className={styles.remarksBox}>
                    <Text className={styles.remarksText}>"{prog.auditorRemarks}"</Text>
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
          <View className={styles.modalOverlay}>
            <View className={styles.modalCard}>
              <Text className={styles.modalTitle}>Program Quality Audit Review</Text>
              <Text className={styles.modalSub}>{auditingProgram.programName}</Text>

              <ScrollView className={styles.modalScroll}>
                <View className={styles.fieldBox}>
                  <Text className={styles.fieldLabel}>Submitted By Controller:</Text>
                  <Text className={styles.fieldVal}>{auditingProgram.controllerName}</Text>
                  <Text className={styles.fieldLabel}>Birds Vaccinated:</Text>
                  <Text className={styles.fieldVal}>
                    {auditingProgram.completionMetrics?.birdsVaccinated.toLocaleString() || 'N/A'}
                  </Text>
                  <Text className={styles.fieldLabel}>Vaccine Batch & Type:</Text>
                  <Text className={styles.fieldVal}>
                    {auditingProgram.completionMetrics?.vaccineType} (Batch #{auditingProgram.completionMetrics?.batchNumber})
                  </Text>
                  <Text className={styles.fieldLabel}>Cold-Chain Log Temperature:</Text>
                  <Text className={styles.fieldVal}>
                    {auditingProgram.completionMetrics?.coldChainTempCelsius}Ã‚Â°C (Target: 2Ã‚Â°C - 8Ã‚Â°C)
                  </Text>
                  <Text className={styles.fieldLabel}>Field Observations:</Text>
                  <Text className={styles.fieldVal}>
                    {auditingProgram.completionMetrics?.farmFlockObservations}
                  </Text>
                </View>

                {/* Audit Checklist */}
                <View className={styles.checklistSection}>
                  <Text className={styles.checklistTitle}>Verification Checklist:</Text>
                  {checklist.map((item, idx) => (
                    <TouchableOpacity
                      key={idx}
                      className={styles.checkItemRow}
                      onPress={() => toggleChecklistItem(idx)}
                    >
                      <View
                        className={`${styles.checkbox} ${item.passed ? styles.checkboxChecked : styles.checkboxUnchecked}`}
                      >
                        {item.passed ? <Check size={13} color={Colors.white} strokeWidth={3} /> : null}
                      </View>
                      <Text className={styles.checkItemText}>{item.item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View className={styles.inputGroup}>
                  <Text className={styles.label}>Auditor Remarks & Compliance Notes</Text>
                  <TextInput
                    className={`${styles.input} h-[70px]`}
                    multiline
                    value={remarks}
                    onChangeText={setRemarks}
                  />
                </View>

                <View className={styles.inputGroup}>
                  <Text className={styles.label}>Quality Compliance Score (0 - 100)</Text>
                  <TextInput
                    className={styles.input}
                    value={score}
                    onChangeText={setScore}
                    keyboardType="numeric"
                  />
                </View>
              </ScrollView>

              <View className={styles.modalBtnRow}>
                <TouchableOpacity
                  className={styles.cancelModalBtn}
                  onPress={() => setAuditingProgram(null)}
                  disabled={submitting}
                >
                  <Text className={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`${styles.signOffBtn} ${submitting ? styles.btnDisabled : ''}`}
                  onPress={handleSignOffAudit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View className="flex-row items-center justify-center gap-2">
                      <ClipboardCheck size={15} color={Colors.white} />
                      <Text className={styles.signOffBtnText}>Sign Off & Mark Program Done</Text>
                    </View>
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

const styles = {
  container: 'flex-1 bg-marush-background',
  tabBar: 'flex-row flex-wrap items-center justify-between border-b border-marush-border bg-white px-4 md:px-7',
  tabGroup: 'flex-row flex-wrap gap-[18px]',
  tabBtn: 'border-b-2 border-transparent px-1 py-[15px]',
  tabBtnActive: 'border-marush-primary',
  tabBtnText: 'text-[13px] font-semibold text-marush-muted',
  tabBtnTextActive: 'font-bold text-marush-primary',
  refreshBtn: 'rounded-lg border border-marush-border bg-white px-3 py-2',
  refreshBtnText: 'text-xs font-semibold text-marush-primary',
  content: 'mx-auto w-full max-w-[1200px] p-4 md:p-8',
  section: 'gap-3',
  sectionTitle: 'mb-1 text-xl font-bold text-marush-text',
  emptyBox: 'items-center p-8',
  emptyText: 'text-[13px] text-marush-muted-light',
  card: 'gap-1 rounded-[10px] border border-marush-border bg-white p-4',
  cardHeader: 'flex-row flex-wrap items-start justify-between gap-2',
  cardTitle: 'min-w-0 flex-1 text-[15px] font-bold text-marush-text',
  pendingBadge: 'rounded-md bg-marush-subtle px-2 py-1',
  pendingBadgeText: 'text-[10px] font-extrabold text-marush-primary',
  doneBadge: 'rounded-md bg-marush-subtle px-2 py-1',
  doneBadgeText: 'text-[10px] font-extrabold text-marush-primary',
  cardSub: 'text-[13px] text-marush-muted',
  cardMeta: 'text-xs text-marush-muted-light',
  metricsPreview: 'mt-1.5 rounded-md bg-marush-subtle p-2',
  metricsPreviewText: 'text-[11px] text-marush-muted',
  reviewBtn: 'mt-2 items-center rounded-lg bg-marush-primary py-2',
  reviewBtnText: 'text-[13px] font-bold text-white',
  scoreText: 'mt-1 text-xs font-bold text-marush-primary',
  remarksBox: 'mt-1.5 rounded-lg bg-marush-subtle p-2.5',
  remarksText: 'text-xs italic text-marush-primary-dark',
  modalOverlay: 'flex-1 items-center justify-center bg-black/50 p-4',
  modalCard: 'max-h-[90%] w-full max-w-[500px] rounded-2xl bg-white p-6',
  modalTitle: 'text-lg font-extrabold text-marush-primary',
  modalSub: 'mb-3 text-[13px] text-marush-muted',
  modalScroll: 'mb-4',
  fieldBox: 'mb-3.5 gap-0.5 rounded-lg bg-marush-subtle p-3',
  fieldLabel: 'text-[10px] font-bold uppercase text-marush-muted-light',
  fieldVal: 'mb-1.5 text-xs font-semibold text-marush-text',
  checklistSection: 'mb-3.5 gap-2 rounded-lg border border-marush-border bg-marush-subtle p-3',
  checklistTitle: 'mb-0.5 text-[11px] font-extrabold uppercase text-marush-primary',
  checkItemRow: 'flex-row items-center gap-2',
  checkbox: 'h-5 w-5 items-center justify-center rounded border-[1.5px]',
  checkboxChecked: 'border-marush-primary bg-marush-primary',
  checkboxUnchecked: 'border-marush-border bg-white',
  checkItemText: 'flex-1 text-xs text-marush-text',
  inputGroup: 'mb-2.5 gap-1',
  label: 'text-xs font-bold text-marush-text',
  input: 'rounded-lg border border-marush-border bg-marush-background px-3 py-2 text-[13px]',
  modalBtnRow: 'flex-row flex-wrap justify-end gap-2.5',
  cancelModalBtn: 'px-3.5 py-2',
  cancelModalBtnText: 'font-semibold text-marush-muted',
  signOffBtn: 'min-w-[180px] flex-1 rounded-lg bg-marush-primary px-4 py-2',
  btnDisabled: 'opacity-70',
  signOffBtnText: 'font-bold text-white',
};
