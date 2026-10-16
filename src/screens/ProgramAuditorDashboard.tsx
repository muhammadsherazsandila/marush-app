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

  // Comprehensive Audit Fields (from specification B)
  const [birdCountVerified, setBirdCountVerified] = useState(true);
  const [vaccineVerified, setVaccineVerified] = useState(true);
  const [timingVerified, setTimingVerified] = useState(true);
  const [vaccinationQualityAssessment, setVaccinationQualityAssessment] = useState('Optimal vaccination technique, correct dosage and droplet/injection penetration.');
  const [uniformCompliance, setUniformCompliance] = useState(true);
  const [vaccinatorBehaviorAssessment, setVaccinatorBehaviorAssessment] = useState('Professional conduct, standard bio-security protocol followed diligently.');
  const [overallAuditResult, setOverallAuditResult] = useState<'approved' | 'conditional_approval' | 'rejected'>('approved');

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
      }°C. Vaccine batch ${
        prog.completionMetrics?.batchNumber || 'N/A'
      } meets Ceva standards. Flock viability approved.`
    );
    setScore('96');
    setChecklist(DEFAULT_CHECKLIST);
    setBirdCountVerified(true);
    setVaccineVerified(true);
    setTimingVerified(true);
    setVaccinationQualityAssessment('Optimal vaccination technique, correct dosage and droplet/injection penetration.');
    setUniformCompliance(true);
    setVaccinatorBehaviorAssessment('Professional conduct, standard bio-security protocol followed diligently.');
    setOverallAuditResult('approved');
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
        text2: 'Please provide audit observations, findings, and remarks before sign-off.',
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
        checklist,
        {
          birdCountVerified,
          vaccineVerified,
          timingVerified,
          vaccinationQualityAssessment: vaccinationQualityAssessment.trim(),
          uniformCompliance,
          vaccinatorBehaviorAssessment: vaccinatorBehaviorAssessment.trim(),
          overallAuditResult,
        }
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
                {/* READ-ONLY CONTROLLER SUBMITTED INFORMATION */}
                <View className="mb-3 rounded-xl border border-marush-border bg-marush-subtle/50 p-3.5">
                  <Text className="mb-2 text-xs font-black uppercase tracking-wider text-marush-primary">
                    Controller-Submitted Record (Read-Only)
                  </Text>
                  
                  <View className="gap-1.5 text-xs">
                    <View className="flex-row justify-between border-b border-marush-border/50 pb-1">
                      <Text className="text-[11px] font-bold text-marush-muted">Farm / Hatchery Name:</Text>
                      <Text className="text-[11px] font-semibold text-marush-text">{auditingProgram.hatcheryOrFarmName}</Text>
                    </View>

                    {auditingProgram.farmAddress && (
                      <View className="flex-row justify-between border-b border-marush-border/50 pb-1">
                        <Text className="text-[11px] font-bold text-marush-muted">Farm Address:</Text>
                        <Text className="text-[11px] text-marush-text">{auditingProgram.farmAddress}</Text>
                      </View>
                    )}

                    {auditingProgram.farmManagerName && (
                      <View className="flex-row justify-between border-b border-marush-border/50 pb-1">
                        <Text className="text-[11px] font-bold text-marush-muted">Farm / Hatchery Manager:</Text>
                        <Text className="text-[11px] font-semibold text-marush-text">{auditingProgram.farmManagerName}</Text>
                      </View>
                    )}

                    <View className="flex-row justify-between border-b border-marush-border/50 pb-1">
                      <Text className="text-[11px] font-bold text-marush-muted">Program Controller:</Text>
                      <Text className="text-[11px] font-bold text-marush-primary">{auditingProgram.controllerName || 'Field Controller'}</Text>
                    </View>

                    <View className="flex-row justify-between border-b border-marush-border/50 pb-1">
                      <Text className="text-[11px] font-bold text-marush-muted">Vaccinator Team:</Text>
                      <Text className="text-[11px] text-marush-text">
                        {auditingProgram.teamMembers && auditingProgram.teamMembers.length > 0
                          ? auditingProgram.teamMembers.map(m => m.fullName).join(', ')
                          : `${auditingProgram.teamMemberIds?.length || 0} members assigned`}
                      </Text>
                    </View>

                    <View className="flex-row justify-between border-b border-marush-border/50 pb-1">
                      <Text className="text-[11px] font-bold text-marush-muted">Date & Time of Vaccination:</Text>
                      <Text className="text-[11px] text-marush-text">
                        {auditingProgram.scheduledStartDate} at {auditingProgram.scheduledStartTime}
                      </Text>
                    </View>

                    {/* Bird Breakdown */}
                    <View className="border-b border-marush-border/50 pb-1">
                      <View className="flex-row justify-between">
                        <Text className="text-[11px] font-bold text-marush-muted">Total Flock Size:</Text>
                        <Text className="text-[11px] font-bold text-marush-text">{auditingProgram.flockSize.toLocaleString()} birds</Text>
                      </View>
                      {auditingProgram.birdDetails && (
                        <Text className="mt-0.5 text-[10px] text-marush-muted-light">
                          Breakdown: B: {auditingProgram.birdDetails.b || 0} • L: {auditingProgram.birdDetails.l || 0} • Br: {auditingProgram.birdDetails.br || 0}
                        </Text>
                      )}
                    </View>

                    {/* Vaccine(s) Used */}
                    <View className="flex-row justify-between border-b border-marush-border/50 pb-1">
                      <Text className="text-[11px] font-bold text-marush-muted">Vaccine(s) Used:</Text>
                      <Text className="max-w-[200px] text-right text-[11px] font-semibold text-marush-text">
                        {auditingProgram.vaccinesUsed && auditingProgram.vaccinesUsed.length > 0
                          ? auditingProgram.vaccinesUsed.join(', ')
                          : (auditingProgram.completionMetrics?.vaccineType || 'Standard Ceva Program')}
                      </Text>
                    </View>

                    {/* Travel Timings */}
                    {(auditingProgram.travelDepartureTime || auditingProgram.travelArrivalTime) && (
                      <View className="flex-row justify-between border-b border-marush-border/50 pb-1">
                        <Text className="text-[11px] font-bold text-marush-muted">Travel (Office → Farm):</Text>
                        <Text className="text-[11px] text-marush-text">
                          Dept: {auditingProgram.travelDepartureTime || 'N/A'} • Arrv: {auditingProgram.travelArrivalTime || 'N/A'}
                        </Text>
                      </View>
                    )}

                    {/* Return Timings */}
                    {(auditingProgram.returnDepartureTime || auditingProgram.returnArrivalTime) && (
                      <View className="flex-row justify-between border-b border-marush-border/50 pb-1">
                        <Text className="text-[11px] font-bold text-marush-muted">Return (Farm → Office):</Text>
                        <Text className="text-[11px] text-marush-text">
                          Dept: {auditingProgram.returnDepartureTime || 'N/A'} • Arrv: {auditingProgram.returnArrivalTime || 'N/A'}
                        </Text>
                      </View>
                    )}

                    {/* Controller Remarks */}
                    {auditingProgram.controllerRemarks && (
                      <View className="pt-1">
                        <Text className="text-[11px] font-bold text-marush-muted">Controller Remarks:</Text>
                        <Text className="mt-0.5 text-xs italic text-marush-text">"{auditingProgram.controllerRemarks}"</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* AUDITOR'S AUDIT FORM (Section B) */}
                <View className="mb-3 rounded-xl border border-marush-border bg-white p-3.5">
                  <Text className="mb-2.5 text-xs font-black uppercase tracking-wider text-marush-primary">
                    Auditor Quality & Compliance Verification
                  </Text>

                  {/* 1. Bird Count Verification */}
                  <View className="mb-3 rounded-lg border border-marush-border bg-marush-subtle/30 p-2.5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-marush-text">1. Bird Count Verification</Text>
                      <TouchableOpacity
                        className={`rounded-md px-2.5 py-1 ${birdCountVerified ? 'bg-marush-primary' : 'bg-red-500'}`}
                        onPress={() => setBirdCountVerified(!birdCountVerified)}
                      >
                        <Text className="text-[11px] font-extrabold text-white">
                          {birdCountVerified ? '✓ Correct' : '✕ Discrepancy'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text className="mt-1 text-[11px] text-marush-muted">
                      Confirm whether recorded bird count ({auditingProgram.flockSize.toLocaleString()} birds) is accurate.
                    </Text>
                  </View>

                  {/* 2. Vaccine Verification */}
                  <View className="mb-3 rounded-lg border border-marush-border bg-marush-subtle/30 p-2.5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-marush-text">2. Vaccine Verification</Text>
                      <TouchableOpacity
                        className={`rounded-md px-2.5 py-1 ${vaccineVerified ? 'bg-marush-primary' : 'bg-red-500'}`}
                        onPress={() => setVaccineVerified(!vaccineVerified)}
                      >
                        <Text className="text-[11px] font-extrabold text-white">
                          {vaccineVerified ? '✓ Matches Records' : '✕ Mismatch'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text className="mt-1 text-[11px] text-marush-muted">
                      Confirm whether the recorded vaccines match pharmaceutical and batch stock records.
                    </Text>
                  </View>

                  {/* 3. Timing Verification */}
                  <View className="mb-3 rounded-lg border border-marush-border bg-marush-subtle/30 p-2.5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-marush-text">3. Timing Verification</Text>
                      <TouchableOpacity
                        className={`rounded-md px-2.5 py-1 ${timingVerified ? 'bg-marush-primary' : 'bg-red-500'}`}
                        onPress={() => setTimingVerified(!timingVerified)}
                      >
                        <Text className="text-[11px] font-extrabold text-white">
                          {timingVerified ? '✓ Timings Verified' : '✕ Delay / Issue'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text className="mt-1 text-[11px] text-marush-muted">
                      Check recorded travel, vaccination start, completion, and return timings.
                    </Text>
                  </View>

                  {/* 4. Vaccination Quality Assessment */}
                  <View className={`${styles.inputGroup} mb-3`}>
                    <Text className={styles.label}>4. Vaccination Quality Assessment</Text>
                    <TextInput
                      className={`${styles.input} h-[60px]`}
                      multiline
                      value={vaccinationQualityAssessment}
                      onChangeText={setVaccinationQualityAssessment}
                      placeholder="Record assessment of dosage calibration, droplet/injection penetration..."
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>

                  {/* 5. Uniform Compliance */}
                  <View className="mb-3 rounded-lg border border-marush-border bg-marush-subtle/30 p-2.5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-bold text-marush-text">5. Uniform & PPE Compliance</Text>
                      <TouchableOpacity
                        className={`rounded-md px-2.5 py-1 ${uniformCompliance ? 'bg-marush-primary' : 'bg-red-500'}`}
                        onPress={() => setUniformCompliance(!uniformCompliance)}
                      >
                        <Text className="text-[11px] font-extrabold text-white">
                          {uniformCompliance ? '✓ Compliant' : '✕ Non-Compliant'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <Text className="mt-1 text-[11px] text-marush-muted">
                      Record whether mandatory PPE, sterile footwear, and uniforms were worn per SOP.
                    </Text>
                  </View>

                  {/* 6. Vaccinator Behavior */}
                  <View className={`${styles.inputGroup} mb-3`}>
                    <Text className={styles.label}>6. Vaccinator Behavior & Conduct</Text>
                    <TextInput
                      className={`${styles.input} h-[60px]`}
                      multiline
                      value={vaccinatorBehaviorAssessment}
                      onChangeText={setVaccinatorBehaviorAssessment}
                      placeholder="Assess team discipline, bird handling, and farm staff interaction..."
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>

                  {/* 7. Overall Audit Result */}
                  <View className="mb-3">
                    <Text className={styles.label}>7. Overall Audit Result</Text>
                    <View className="mt-1.5 flex-row gap-2">
                      {(['approved', 'conditional_approval', 'rejected'] as const).map(res => (
                        <TouchableOpacity
                          key={res}
                          className={`flex-1 rounded-lg border py-2 items-center ${
                            overallAuditResult === res
                              ? 'border-marush-primary bg-marush-primary'
                              : 'border-marush-border bg-white'
                          }`}
                          onPress={() => setOverallAuditResult(res)}
                        >
                          <Text
                            className={`text-[11px] font-extrabold uppercase ${
                              overallAuditResult === res ? 'text-white' : 'text-marush-muted'
                            }`}
                          >
                            {res.replace('_', ' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* 8. Auditor Remarks */}
                  <View className={styles.inputGroup}>
                    <Text className={styles.label}>8. Auditor Remarks & Recommendations *</Text>
                    <TextInput
                      className={`${styles.input} h-[70px]`}
                      multiline
                      value={remarks}
                      onChangeText={setRemarks}
                      placeholder="Record findings, discrepancies, temperature logs or corrective recommendations..."
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>

                  {/* Audit Score */}
                  <View className={`${styles.inputGroup} mt-2`}>
                    <Text className={styles.label}>Quality Score (0 - 100)</Text>
                    <TextInput
                      className={styles.input}
                      value={score}
                      onChangeText={setScore}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Auditor Auto Metadata */}
                  <View className="mt-3 rounded-lg border border-dashed border-marush-border bg-marush-subtle/30 p-2.5">
                    <Text className="text-[10px] font-bold text-marush-primary">Auditor Identity (Auto-Recorded):</Text>
                    <Text className="text-[10px] text-marush-muted">
                      {currentUser.fullName} ({currentUser.email}) • Timestamp auto-stamped on submission.
                    </Text>
                  </View>
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
  container: 'flex-1 bg-slate-50',
  tabBar: 'flex-row flex-wrap items-center justify-between border-b border-black/[0.06] bg-white px-5 md:px-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
  tabGroup: 'flex-row flex-wrap gap-5',
  tabBtn: 'border-b-2 border-transparent px-1 py-4',
  tabBtnActive: 'border-marush-primary',
  tabBtnText: 'text-[13px] font-semibold text-slate-500',
  tabBtnTextActive: 'font-bold text-marush-primary',
  refreshBtn: 'rounded-2xl border border-black/[0.08] bg-white px-3.5 py-2 shadow-sm active:scale-[0.97]',
  refreshBtnText: 'text-xs font-bold text-marush-primary',
  content: 'mx-auto w-full max-w-[1180px] p-4 md:p-8',
  section: 'gap-3',
  sectionTitle: 'mb-1 text-xl font-black tracking-tight text-slate-900',
  emptyBox: 'items-center gap-3 rounded-3xl border border-dashed border-black/[0.1] bg-white p-10',
  emptyText: 'text-sm text-slate-500',
  card: 'gap-2 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]',
  cardHeader: 'flex-row flex-wrap items-start justify-between gap-2',
  cardTitle: 'min-w-0 flex-1 text-base font-bold tracking-tight text-slate-900',
  pendingBadge: 'rounded-full bg-amber-50 border border-amber-200/80 px-3 py-1',
  pendingBadgeText: 'text-[10px] font-black uppercase tracking-wider text-amber-800',
  doneBadge: 'rounded-full bg-emerald-50 border border-emerald-200/80 px-3 py-1',
  doneBadgeText: 'text-[10px] font-black uppercase tracking-wider text-emerald-800',
  cardSub: 'text-sm font-semibold text-slate-600',
  cardMeta: 'text-xs text-slate-400',
  metricsPreview: 'mt-2 rounded-2xl bg-slate-50 border border-black/[0.05] p-3',
  metricsPreviewText: 'text-xs text-slate-600',
  reviewBtn: 'mt-3 items-center rounded-2xl bg-marush-primary py-2.5 shadow-sm active:scale-[0.97]',
  reviewBtnText: 'text-xs font-bold text-white tracking-tight',
  scoreText: 'mt-1 text-xs font-black text-marush-primary',
  remarksBox: 'mt-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3',
  remarksText: 'text-xs italic text-emerald-900',
  modalOverlay: 'flex-1 items-center justify-center bg-black/40 backdrop-blur-sm p-4',
  modalCard: 'max-h-[90%] w-full max-w-[560px] rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-black/[0.08]',
  modalTitle: 'text-xl font-black tracking-tight text-slate-900',
  modalSub: 'mb-4 text-xs text-slate-500',
  modalScroll: 'mb-4',
  fieldBox: 'mb-3.5 gap-1 rounded-2xl bg-slate-50/80 border border-black/[0.05] p-4',
  fieldLabel: 'text-[10px] font-bold uppercase tracking-wider text-slate-400',
  fieldVal: 'mb-1 text-xs font-semibold text-slate-800',
  checklistSection: 'mb-4 gap-2.5 rounded-2xl border border-black/[0.06] bg-slate-50/70 p-4',
  checklistTitle: 'mb-1 text-xs font-black uppercase tracking-wider text-marush-primary',
  checkItemRow: 'flex-row items-center gap-2.5 py-1',
  checkbox: 'h-5 w-5 items-center justify-center rounded-lg border-[1.5px]',
  checkboxChecked: 'border-marush-primary bg-marush-primary',
  checkboxUnchecked: 'border-black/[0.15] bg-white',
  checkItemText: 'flex-1 text-xs font-semibold text-slate-700',
  inputGroup: 'mb-3 gap-1.5',
  label: 'text-xs font-bold uppercase tracking-wider text-slate-500',
  input: 'rounded-xl border border-black/[0.08] bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800',
  modalBtnRow: 'flex-row flex-wrap justify-end gap-3',
  cancelModalBtn: 'min-w-[100px] flex-1 items-center rounded-2xl border border-black/[0.08] px-4 py-2.5 active:scale-[0.97]',
  cancelModalBtnText: 'text-xs font-bold text-slate-600',
  signOffBtn: 'min-w-[180px] flex-1 items-center rounded-2xl bg-marush-primary px-4 py-2.5 shadow-sm active:scale-[0.97]',
  btnDisabled: 'opacity-70',
  signOffBtnText: 'text-xs font-bold text-white tracking-tight',
};
