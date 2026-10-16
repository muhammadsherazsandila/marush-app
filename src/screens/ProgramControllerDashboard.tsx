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
import { Check, CircleX, ClipboardCheck, Plus, RefreshCw, Search, Send, Users } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { UserProfile, Program, ProgramCompletionMetrics, ProgramStatus } from '../types';
import { dataProvider } from '../services';
import { useConfirmDialog } from '../components/ConfirmDialog';

interface ProgramControllerDashboardProps {
  currentUser: UserProfile;
  activeArea: 'overview' | 'programs';
}

export const ProgramControllerDashboard: React.FC<ProgramControllerDashboardProps> = ({
  currentUser,
  activeArea,
}) => {
  const [activeTab, setActiveTab] = useState<'my_programs' | 'initiate'>('my_programs');
  const [programFilter, setProgramFilter] = useState<ProgramStatus | 'all'>('all');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State for Program Initiation
  const [programName, setProgramName] = useState('');
  const [hatcheryOrFarm, setHatcheryOrFarm] = useState('');
  const [farmAddress, setFarmAddress] = useState('');
  const [farmManagerName, setFarmManagerName] = useState('');
  
  // Bird counts categorized as B, L, Br
  const [birdBreeder, setBirdBreeder] = useState('');
  const [birdLayer, setBirdLayer] = useState('');
  const [birdBroiler, setBirdBroiler] = useState('');
  const [flockSize, setFlockSize] = useState('');

  // Vaccines
  const [vaccinesUsed, setVaccinesUsed] = useState('Vectormune ND + Cevac Transmune');

  // Dates & Times
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00 AM');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('04:00 PM');

  // Travel schedule
  const [travelDepartureTime, setTravelDepartureTime] = useState('06:30 AM');
  const [travelArrivalTime, setTravelArrivalTime] = useState('07:45 AM');

  // Vaccination schedule
  const [vaccinationStartedAtTime, setVaccinationStartedAtTime] = useState('08:15 AM');
  const [vaccinationCompletedAtTime, setVaccinationCompletedAtTime] = useState('03:45 PM');

  // Return schedule
  const [returnDepartureTime, setReturnDepartureTime] = useState('04:15 PM');
  const [returnArrivalTime, setReturnArrivalTime] = useState('05:30 PM');

  // Controller Remarks
  const [controllerRemarks, setControllerRemarks] = useState('');

  // Team Details
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [empSearchQuery, setEmpSearchQuery] = useState<string>('');

  const filteredAvailableEmployees = availableEmployees.filter(emp =>
    emp.fullName.toLowerCase().includes(empSearchQuery.toLowerCase()) ||
    (emp.employeeCode && emp.employeeCode.toLowerCase().includes(empSearchQuery.toLowerCase())) ||
    emp.email.toLowerCase().includes(empSearchQuery.toLowerCase())
  );

  // End Program / Send to Auditor Modal
  const [endingProgram, setEndingProgram] = useState<Program | null>(null);
  const [birdsVaccinated, setBirdsVaccinated] = useState('');
  const [dosagePerBird, setDosagePerBird] = useState('0.05 ml via automated Ceva Egginject');
  const [batchNumber, setBatchNumber] = useState('VND-2026-PK');
  const [vaccineType, setVaccineType] = useState('Vectormune ND + Cevac Transmune');
  const [coldChainTemp, setColdChainTemp] = useState('4.0');
  const [equipmentCheckPassed, setEquipmentCheckPassed] = useState(true);
  const [farmFlockNotes, setFarmFlockNotes] = useState('Flock condition optimal. Sterilization protocol followed.');

  const { confirm, ConfirmDialogElement } = useConfirmDialog();

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [allProgs, available] = await Promise.all([
        dataProvider.getPrograms(),
        dataProvider.getAvailableEmployees(),
      ]);
      setPrograms(allProgs);
      setAvailableEmployees(available);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Unable to load program data',
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
    if (activeArea === 'overview') setActiveTab('my_programs');
  }, [activeArea]);

  const myPrograms = programs.filter(p => p.controllerId === currentUser.id);
  const visiblePrograms = myPrograms.filter(p => programFilter === 'all' || p.status === programFilter);

  const toggleSelectEmployee = (id: string) => {
    if (selectedEmpIds.includes(id)) {
      setSelectedEmpIds(selectedEmpIds.filter(eId => eId !== id));
    } else {
      setSelectedEmpIds([...selectedEmpIds, id]);
    }
  };

  const handleInitiateProgram = () => {
    if (!programName.trim() || !hatcheryOrFarm.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Required Fields Missing',
        text2: 'Please provide program title and hatchery/farm name.',
      });
      return;
    }

    const bCount = parseInt(birdBreeder.trim(), 10) || 0;
    const lCount = parseInt(birdLayer.trim(), 10) || 0;
    const brCount = parseInt(birdBroiler.trim(), 10) || 0;
    const categoryTotal = bCount + lCount + brCount;
    const manualFlock = parseInt(flockSize.trim(), 10) || 0;
    const finalFlockSize = categoryTotal > 0 ? categoryTotal : manualFlock;

    if (finalFlockSize <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Bird Count Required',
        text2: 'Please enter bird numbers (B, L, or Br) or total flock size.',
      });
      return;
    }

    if (selectedEmpIds.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Team Selected',
        text2: 'Select at least one vaccinator / team member.',
      });
      return;
    }

    const vaccinesArray = vaccinesUsed
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

    confirm({
      title: 'Submit Program Schedule',
      message: `Submit "${programName.trim()}" for ${finalFlockSize.toLocaleString()} birds at "${hatcheryOrFarm.trim()}" with ${selectedEmpIds.length} team members to Admin for review?`,
      confirmText: 'Submit to Admin',
      cancelText: 'Cancel',
      variant: 'primary',
      icon: 'send',
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const newProg = await dataProvider.createProgram({
            programName: programName.trim(),
            hatcheryOrFarmName: hatcheryOrFarm.trim(),
            farmAddress: farmAddress.trim() || undefined,
            farmManagerName: farmManagerName.trim() || undefined,
            flockSize: finalFlockSize,
            birdDetails: {
              b: bCount || undefined,
              l: lCount || undefined,
              br: brCount || undefined,
              total: finalFlockSize,
            },
            vaccinesUsed: vaccinesArray.length > 0 ? vaccinesArray : ['Vectormune ND + Cevac Transmune'],
            scheduledStartDate: startDate,
            scheduledStartTime: startTime,
            scheduledEndDate: endDate,
            scheduledEndTime: endTime,
            travelDepartureTime: travelDepartureTime.trim() || undefined,
            travelArrivalTime: travelArrivalTime.trim() || undefined,
            returnDepartureTime: returnDepartureTime.trim() || undefined,
            returnArrivalTime: returnArrivalTime.trim() || undefined,
            vaccinationStartedAt: vaccinationStartedAtTime ? `${startDate}T${vaccinationStartedAtTime}` : undefined,
            vaccinationCompletedAt: vaccinationCompletedAtTime ? `${endDate}T${vaccinationCompletedAtTime}` : undefined,
            controllerRemarks: controllerRemarks.trim() || undefined,
            controllerId: currentUser.id,
            teamMemberIds: selectedEmpIds,
          });

          Toast.show({
            type: 'success',
            text1: 'Program Submitted to Admin',
            text2: `${newProg.programName} sent for admin review and auditor assignment.`,
          });

          // Reset Form
          setProgramName('');
          setHatcheryOrFarm('');
          setFarmAddress('');
          setFarmManagerName('');
          setBirdBreeder('');
          setBirdLayer('');
          setBirdBroiler('');
          setFlockSize('');
          setControllerRemarks('');
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
      },
    });
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

  const handleConfirmEndProgram = () => {
    if (!endingProgram) return;

    confirm({
      title: 'Complete Program & Notify Auditor',
      message: `Finalize vaccination records for "${endingProgram.programName}" (${birdsVaccinated || endingProgram.flockSize} birds) and forward to Program Auditor for audit sign-off?`,
      confirmText: 'Send to Auditor',
      cancelText: 'Back',
      variant: 'primary',
      icon: 'send',
      onConfirm: async () => {
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
            text2: err?.message || 'Could not finalize program.',
          });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Sub-header navigation row matching AdminDashboard */}
      <View className="border-b border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <View className="mx-auto w-full max-w-[1280px] flex-row items-center justify-between px-5 md:px-8 py-0">
          <View className="flex-row items-center gap-5">
            <TouchableOpacity
              className={`border-b-2 px-1 py-4 ${activeTab === 'my_programs' ? 'border-marush-primary' : 'border-transparent'}`}
              onPress={() => setActiveTab('my_programs')}
            >
              <Text className={`text-[13px] ${activeTab === 'my_programs' ? 'font-bold text-marush-primary' : 'font-semibold text-slate-500'}`}>
                My Programs ({myPrograms.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`border-b-2 px-1 py-4 ${activeTab === 'initiate' ? 'border-marush-primary' : 'border-transparent'}`}
              onPress={() => {
                refreshData();
                setActiveTab('initiate');
              }}
            >
              <View className="flex-row items-center gap-1.5">
                <Plus size={14} color={activeTab === 'initiate' ? Colors.primary : Colors.textMuted} strokeWidth={2.5} />
                <Text className={`text-[13px] ${activeTab === 'initiate' ? 'font-bold text-marush-primary' : 'font-semibold text-slate-500'}`}>
                  Initiate Program
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="flex-row items-center gap-1.5 rounded-2xl border border-black/[0.08] bg-white px-3.5 py-2 shadow-sm transition-all active:scale-[0.97]"
            onPress={refreshData}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <RefreshCw size={14} color={Colors.primary} strokeWidth={2.4} />
                <Text className="text-xs font-bold text-marush-primary">Refresh</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Program Status Filter Row */}
      {activeTab === 'my_programs' && (
        <View className="border-b border-black/[0.04] bg-white/70">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="mx-auto w-full max-w-[1280px] flex-row items-center gap-2 px-5 md:px-8 py-2.5"
          >
            {([
              ['all', 'All Statuses'],
              ['active', 'Active In Field'],
              ['pending_approval', 'Awaiting Approval'],
              ['pending_audit', 'Awaiting Audit'],
              ['completed', 'Completed'],
            ] as const).map(([filter, label]) => (
              <TouchableOpacity
                key={filter}
                className={`rounded-full px-3.5 py-1.5 border transition-all active:scale-[0.97] ${
                  programFilter === filter
                    ? 'border-marush-primary bg-marush-primary shadow-sm'
                    : 'border-black/[0.08] bg-white shadow-sm'
                }`}
                onPress={() => setProgramFilter(filter)}
              >
                <Text
                  className={`text-xs font-semibold ${
                    programFilter === filter ? 'font-bold text-white' : 'text-slate-600'
                  }`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerClassName="mx-auto w-full max-w-[1280px] p-4 md:p-8 gap-5">
        {/* Header Block */}
        <View className="flex-row flex-wrap items-start justify-between gap-4">
          <View className="min-w-0 flex-1">
            <Text className="mb-1 text-[10px] font-black uppercase tracking-[1.8px] text-marush-secondary-dark">
              PROGRAM MANAGEMENT / CONTROLLER WORKSPACE
            </Text>
            <Text className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
              {activeTab === 'my_programs' ? 'Operations & Schedules' : 'Create New Vaccination Program'}
            </Text>
            <Text className="mt-1 max-w-[620px] text-xs md:text-sm leading-relaxed text-slate-500">
              {activeTab === 'my_programs'
                ? 'Coordinate vaccination teams, monitor live field progress, and submit completed batches for quality inspection.'
                : 'Configure farm details, assign certified vaccinators, schedule travel, and submit to Admin for deployment.'}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-3.5 py-1.5 shadow-sm">
            <ClipboardCheck size={14} color={Colors.primary} strokeWidth={2.5} />
            <Text className="text-xs font-bold text-marush-primary">Lead Controller</Text>
          </View>
        </View>

        {activeTab === 'my_programs' ? (
          <View className="gap-3">
            {/* Quick Metrics Bar */}
            <View className="flex-row flex-wrap gap-3">
              <View className="min-w-[180px] flex-1 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border-l-4 border-l-marush-primary">
                <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Created</Text>
                <Text className="mt-2 text-3xl font-black tracking-tight text-slate-900">{myPrograms.length}</Text>
                <Text className="mt-0.5 text-xs text-slate-500">All managed programs</Text>
              </View>

              <View className="min-w-[180px] flex-1 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border-l-4 border-l-teal-600">
                <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active In Field</Text>
                <Text className="mt-2 text-3xl font-black tracking-tight text-teal-700">
                  {myPrograms.filter(p => p.status === 'active').length}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500">Currently executing</Text>
              </View>

              <View className="min-w-[180px] flex-1 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border-l-4 border-l-amber-500">
                <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pending Review</Text>
                <Text className="mt-2 text-3xl font-black tracking-tight text-amber-700">
                  {myPrograms.filter(p => p.status === 'pending_approval' || p.status === 'pending_audit').length}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500">Awaiting Admin or Auditor</Text>
              </View>
            </View>

            {visiblePrograms.length === 0 ? (
              <View className="items-center rounded-3xl border border-dashed border-black/[0.1] bg-white p-10">
                <Text className="text-sm font-bold text-slate-800">
                  {myPrograms.length === 0 ? 'No programs initiated yet' : 'No programs match this filter'}
                </Text>
                <Text className="mt-1 max-w-[340px] text-center text-xs text-slate-500">
                  {myPrograms.length === 0
                    ? 'Start by creating your first vaccination program schedule.'
                    : 'Clear the filter above to view all of your programs.'}
                </Text>
                {myPrograms.length === 0 && (
                  <TouchableOpacity
                    className="mt-4 rounded-2xl bg-marush-primary px-4 py-2.5 shadow-sm active:scale-[0.97]"
                    onPress={() => setActiveTab('initiate')}
                  >
                    <Text className="text-xs font-bold text-white">Create First Program</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              visiblePrograms.map(prog => (
                <View
                  key={prog.id}
                  className="gap-3 rounded-3xl border border-black/[0.07] bg-white p-5 md:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                >
                  <View className="flex-row flex-wrap items-start justify-between gap-2">
                    <View className="min-w-0 flex-1">
                      <Text className="text-base font-bold tracking-tight text-slate-900">{prog.programName}</Text>
                      <Text className="text-sm font-semibold text-slate-600">{prog.hatcheryOrFarmName}</Text>
                    </View>
                    <View
                      className={`rounded-full px-3 py-1 ${
                        prog.status === 'completed'
                          ? 'bg-emerald-50 border border-emerald-200'
                          : prog.status === 'active'
                          ? 'bg-teal-50 border border-teal-200'
                          : 'bg-amber-50 border border-amber-200'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-black uppercase tracking-wider ${
                          prog.status === 'completed'
                            ? 'text-emerald-800'
                            : prog.status === 'active'
                            ? 'text-teal-800'
                            : 'text-amber-800'
                        }`}
                      >
                        {prog.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap items-center gap-x-6 gap-y-1.5 rounded-2xl border border-black/[0.05] bg-slate-50/80 p-3.5">
                    <Text className="text-xs text-slate-600">
                      Flock: <Text className="font-bold text-slate-900">{prog.flockSize.toLocaleString()}</Text> birds
                    </Text>
                    <Text className="text-xs text-slate-600">
                      Team: <Text className="font-bold text-slate-900">{prog.teamMemberIds.length}</Text> vaccinators
                    </Text>
                    <Text className="text-xs text-slate-500">
                      Schedule: {prog.scheduledStartDate} ({prog.scheduledStartTime} - {prog.scheduledEndTime})
                    </Text>
                    {prog.auditorName && (
                      <Text className="text-xs text-slate-500">
                        Auditor: <Text className="font-semibold text-slate-700">{prog.auditorName}</Text>
                      </Text>
                    )}
                  </View>

                  {prog.status === 'active' && (
                    <TouchableOpacity
                      className="mt-1 items-center rounded-2xl bg-marush-primary py-3 shadow-[0_2px_8px_rgba(0,79,66,0.18)] transition-all active:scale-[0.98]"
                      onPress={() => handleOpenEndProgram(prog)}
                    >
                      <View className="flex-row items-center justify-center gap-2">
                        <Send size={15} color={Colors.white} />
                        <Text className="text-xs font-bold text-white tracking-tight">End Program & Submit to Auditor</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {prog.status === 'pending_approval' && (
                    <View className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
                      <Text className="text-xs font-semibold text-amber-800">
                        Submitted to Admin. Awaiting approval and Auditor assignment.
                      </Text>
                    </View>
                  )}

                  {prog.status === 'pending_audit' && (
                    <View className="rounded-2xl border border-teal-200 bg-teal-50/70 p-3">
                      <Text className="text-xs font-semibold text-teal-800">
                        Vaccination completed. Awaiting Auditor inspection and remarks.
                      </Text>
                    </View>
                  )}

                  {prog.status === 'completed' && prog.auditorRemarks && (
                    <View className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5">
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Auditor Sign-off ({prog.auditorName})
                      </Text>
                      <Text className="mt-0.5 text-xs italic text-emerald-900">"{prog.auditorRemarks}"</Text>
                      {prog.auditScore ? (
                        <Text className="mt-1 text-xs font-black text-emerald-800">
                          Quality Score: {prog.auditScore} / 100
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        ) : (
          <View className="gap-5 rounded-3xl border border-black/[0.07] bg-white p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]">

            {/* SECTION 1: Farm Details */}
            <View className="mb-2 mt-1 rounded-xl border border-marush-border bg-marush-subtle/40 p-3.5">
              <Text className="mb-2 text-xs font-black uppercase tracking-wider text-marush-primary">
                1. Farm Details
              </Text>
              
              <View className={styles.inputGroup}>
                <Text className={styles.label}>Program Title *</Text>
                <TextInput
                  className={styles.input}
                  placeholder="e.g. Broiler ND & IBD Complete Immunization"
                  placeholderTextColor={Colors.textMuted}
                  value={programName}
                  onChangeText={setProgramName}
                />
              </View>

              <View className={`${styles.inputGroup} mt-2`}>
                <Text className={styles.label}>Farm / Hatchery Name *</Text>
                <TextInput
                  className={styles.input}
                  placeholder="e.g. Jadeed Poultry Farm Sector 4"
                  placeholderTextColor={Colors.textMuted}
                  value={hatcheryOrFarm}
                  onChangeText={setHatcheryOrFarm}
                />
              </View>

              <View className={`${styles.inputGroup} mt-2`}>
                <Text className={styles.label}>Farm / Hatchery Address</Text>
                <TextInput
                  className={styles.input}
                  placeholder="e.g. 12-Km Depalpur Road, Okara"
                  placeholderTextColor={Colors.textMuted}
                  value={farmAddress}
                  onChangeText={setFarmAddress}
                />
              </View>

              <View className={`${styles.inputGroup} mt-2`}>
                <Text className={styles.label}>Owner / Farm / Hatchery Manager Name</Text>
                <TextInput
                  className={styles.input}
                  placeholder="e.g. Ch. Muhammad Akram"
                  placeholderTextColor={Colors.textMuted}
                  value={farmManagerName}
                  onChangeText={setFarmManagerName}
                />
              </View>
            </View>

            {/* SECTION 2: Team Details */}
            <View className="mb-2 rounded-2xl border border-black/[0.07] bg-slate-50/70 p-4">
              <View className="mb-2.5 flex-row items-center justify-between">
                <Text className="text-xs font-black uppercase tracking-wider text-marush-primary">
                  2. Team Allocation
                </Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-xs font-bold text-slate-500">
                    {selectedEmpIds.length} Selected
                  </Text>
                  <Text className="text-slate-300">•</Text>
                  <Text className="text-xs font-bold text-marush-secondary-dark">
                    {availableEmployees.length} Available
                  </Text>
                </View>
              </View>

              <View className="mb-3 rounded-2xl bg-white p-3 border border-black/[0.06] shadow-sm">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Controller (Creator)</Text>
                <Text className="mt-0.5 text-xs font-bold text-slate-900">
                  {currentUser.fullName} <Text className="font-mono text-slate-400">({currentUser.employeeCode || 'Lead Controller'})</Text>
                </Text>
              </View>

              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Select Vaccinators * ({selectedEmpIds.length} assigned)
                  </Text>
                  {selectedEmpIds.length > 0 && (
                    <TouchableOpacity onPress={() => setSelectedEmpIds([])}>
                      <Text className="text-xs font-semibold text-red-600">Clear selection</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Search Bar for Vaccinators */}
                <View className="flex-row items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 shadow-sm">
                  <Search size={15} color={Colors.textMuted} />
                  <TextInput
                    className="min-w-0 flex-1 py-2 text-xs text-slate-800"
                    placeholder="Search by name, staff ID code, or email..."
                    placeholderTextColor={Colors.textMuted}
                    value={empSearchQuery}
                    onChangeText={setEmpSearchQuery}
                  />
                  {empSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setEmpSearchQuery('')}>
                      <CircleX size={15} color={Colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Vertically Scrollable List with Max Height */}
                {availableEmployees.length === 0 ? (
                  <View className="my-1 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5">
                    <Text className="text-xs italic text-amber-800">
                      All field vaccinators are currently engaged in active programs.
                    </Text>
                  </View>
                ) : filteredAvailableEmployees.length === 0 ? (
                  <View className="my-1 items-center rounded-2xl border border-dashed border-black/[0.1] bg-white p-6">
                    <Text className="text-xs font-semibold text-slate-600">No vaccinators found matching "{empSearchQuery}"</Text>
                    <Text className="mt-0.5 text-[11px] text-slate-400">Try searching with a different name or staff code.</Text>
                  </View>
                ) : (
                  <View className="max-h-[260px] rounded-2xl border border-black/[0.08] bg-white shadow-inner overflow-hidden">
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator={true}
                      contentContainerClassName="p-2 gap-1.5"
                    >
                      {filteredAvailableEmployees.map(emp => {
                        const isSelected = selectedEmpIds.includes(emp.id);
                        return (
                          <TouchableOpacity
                            key={emp.id}
                            className={`flex-row items-center justify-between rounded-xl px-3.5 py-2.5 transition-all active:scale-[0.99] border ${
                              isSelected
                                ? 'border-marush-primary/30 bg-marush-primary-subtle'
                                : 'border-transparent bg-slate-50/80 hover:bg-slate-100'
                            }`}
                            onPress={() => toggleSelectEmployee(emp.id)}
                          >
                            <View className="min-w-0 flex-1 flex-row items-center gap-3">
                              <View
                                className={`h-8 w-8 items-center justify-center rounded-lg border ${
                                  isSelected
                                    ? 'border-marush-primary bg-marush-primary'
                                    : 'border-black/[0.1] bg-white'
                                }`}
                              >
                                {isSelected ? (
                                  <Check size={14} color={Colors.white} strokeWidth={2.6} />
                                ) : (
                                  <Text className="text-xs font-bold text-slate-500">
                                    {emp.fullName.trim().slice(0, 1).toUpperCase()}
                                  </Text>
                                )}
                              </View>
                              <View className="min-w-0 flex-1">
                                <Text className={`text-xs font-bold ${isSelected ? 'text-marush-primary' : 'text-slate-900'}`}>
                                  {emp.fullName}
                                </Text>
                                <Text className="text-[11px] font-mono text-slate-400">
                                  ID: {emp.employeeCode || 'Not assigned'} • {emp.email}
                                </Text>
                              </View>
                            </View>

                            <View
                              className={`rounded-full px-2.5 py-0.5 border ${
                                isSelected
                                  ? 'bg-marush-primary border-marush-primary'
                                  : 'bg-white border-black/[0.08]'
                              }`}
                            >
                              <Text
                                className={`text-[10px] font-bold ${
                                  isSelected ? 'text-white' : 'text-slate-600'
                                }`}
                              >
                                {isSelected ? 'ASSIGNED' : 'TAP TO ADD'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* SECTION 3: Program Details */}
            <View className="mb-2 rounded-xl border border-marush-border bg-marush-subtle/40 p-3.5">
              <Text className="mb-2 text-xs font-black uppercase tracking-wider text-marush-primary">
                3. Program Details
              </Text>
              
              <View className={styles.row}>
                <View className={`${styles.inputGroup} flex-1`}>
                  <Text className={styles.label}>Date of Vaccination *</Text>
                  <TextInput
                    className={styles.input}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View className={`${styles.inputGroup} flex-1`}>
                  <Text className={styles.label}>Time of Vaccination *</Text>
                  <TextInput
                    className={styles.input}
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="08:00 AM"
                  />
                </View>
              </View>

              <View className={`${styles.row} mt-2`}>
                <View className={`${styles.inputGroup} flex-1`}>
                  <Text className={styles.label}>Estimated End Date</Text>
                  <TextInput
                    className={styles.input}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View className={`${styles.inputGroup} flex-1`}>
                  <Text className={styles.label}>Estimated End Time</Text>
                  <TextInput
                    className={styles.input}
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="04:00 PM"
                  />
                </View>
              </View>
            </View>

            {/* SECTION 4: Bird Details */}
            <View className="mb-2 rounded-xl border border-marush-border bg-marush-subtle/40 p-3.5">
              <Text className="mb-2 text-xs font-black uppercase tracking-wider text-marush-primary">
                4. Bird Details (Number of Birds Categorized)
              </Text>
              
              <View className={styles.row}>
                <View className={`${styles.inputGroup} flex-1`}>
                  <Text className={styles.label}>Breeder (B)</Text>
                  <TextInput
                    className={styles.input}
                    placeholder="e.g. 5000"
                    placeholderTextColor={Colors.textMuted}
                    value={birdBreeder}
                    onChangeText={setBirdBreeder}
                    keyboardType="numeric"
                  />
                </View>
                <View className={`${styles.inputGroup} flex-1`}>
                  <Text className={styles.label}>Layer (L)</Text>
                  <TextInput
                    className={styles.input}
                    placeholder="e.g. 15000"
                    placeholderTextColor={Colors.textMuted}
                    value={birdLayer}
                    onChangeText={setBirdLayer}
                    keyboardType="numeric"
                  />
                </View>
                <View className={`${styles.inputGroup} flex-1`}>
                  <Text className={styles.label}>Broiler (Br)</Text>
                  <TextInput
                    className={styles.input}
                    placeholder="e.g. 30000"
                    placeholderTextColor={Colors.textMuted}
                    value={birdBroiler}
                    onChangeText={setBirdBroiler}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View className={`${styles.inputGroup} mt-2`}>
                <Text className={styles.label}>Total Flock Size (Birds) *</Text>
                <TextInput
                  className={styles.input}
                  placeholder={
                    (parseInt(birdBreeder || '0', 10) + parseInt(birdLayer || '0', 10) + parseInt(birdBroiler || '0', 10)) > 0
                      ? `Auto: ${(parseInt(birdBreeder || '0', 10) + parseInt(birdLayer || '0', 10) + parseInt(birdBroiler || '0', 10)).toLocaleString()} birds`
                      : "e.g. 50000"
                  }
                  placeholderTextColor={Colors.textMuted}
                  value={flockSize}
                  onChangeText={setFlockSize}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* SECTION 5: Vaccine Details */}
            <View className="mb-2 rounded-xl border border-marush-border bg-marush-subtle/40 p-3.5">
              <Text className="mb-2 text-xs font-black uppercase tracking-wider text-marush-primary">
                5. Vaccine Details
              </Text>
              
              <View className={styles.inputGroup}>
                <Text className={styles.label}>Vaccine(s) Used * (comma-separated if multiple)</Text>
                <TextInput
                  className={styles.input}
                  placeholder="e.g. Vectormune ND, Cevac Transmune, Cevac IBird"
                  placeholderTextColor={Colors.textMuted}
                  value={vaccinesUsed}
                  onChangeText={setVaccinesUsed}
                />
              </View>
            </View>

            {/* SECTION 6: Travel Schedule */}
            <View className="mb-2 rounded-xl border border-marush-border bg-marush-subtle/40 p-3.5">
              <Text className="mb-2 text-xs font-black uppercase tracking-wider text-marush-primary">
                6. Travel Schedule
              </Text>
              
              <View className={styles.row}>
                <View className={`${styles.inputGroup} flex-1`}>
                  <Text className={styles.label}>Departure Time from Office</Text>
                  <TextInput
                    className={styles.input}
                    value={travelDepartureTime}
                    onChangeText={setTravelDepartureTime}
                    placeholder="06:30 AM"
                  />
                </View>
                <View className={`${styles.inputGroup} flex-1`}>
                  <Text className={styles.label}>Arrival Time at Farm / Hatchery</Text>
                  <TextInput
                    className={styles.input}
                    value={travelArrivalTime}
                    onChangeText={setTravelArrivalTime}
                    placeholder="07:45 AM"
                  />
                </View>
              </View>
            </View>

            {/* SECTION 7: Vaccination Schedule */}
            <View className="mb-2 rounded-xl border border-marush-border bg-marush-subtle/40 p-3.5">
              <Text className="mb-2 text-xs font-black uppercase tracking-wider text-marush-primary">
                7. Vaccination Schedule
              </Text>
              
              <View className={styles.row}>
                <View className={`${styles.inputGroup} flex-1`}>
                  <Text className={styles.label}>Vaccination Started At</Text>
                  <TextInput
                    className={styles.input}
                    value={vaccinationStartedAtTime}
                    onChangeText={setVaccinationStartedAtTime}
                    placeholder="08:15 AM"
                  />
                </View>
                <View className={`${styles.inputGroup} flex-1`}>
                  <Text className={styles.label}>Vaccination Completed At</Text>
                  <TextInput
                    className={styles.input}
                    value={vaccinationCompletedAtTime}
                    onChangeText={setVaccinationCompletedAtTime}
                    placeholder="03:45 PM"
                  />
                </View>
              </View>
            </View>

            {/* SECTION 8: Return Schedule */}
            <View className="mb-2 rounded-xl border border-marush-border bg-marush-subtle/40 p-3.5">
              <Text className="mb-2 text-xs font-black uppercase tracking-wider text-marush-primary">
                8. Return Schedule
              </Text>
              
              <View className={styles.row}>
                <View className={`${styles.inputGroup} flex-1`}>
                  <Text className={styles.label}>Departure Time from Farm / Hatchery</Text>
                  <TextInput
                    className={styles.input}
                    value={returnDepartureTime}
                    onChangeText={setReturnDepartureTime}
                    placeholder="04:15 PM"
                  />
                </View>
                <View className={`${styles.inputGroup} flex-1`}>
                  <Text className={styles.label}>Returning Time at Office</Text>
                  <TextInput
                    className={styles.input}
                    value={returnArrivalTime}
                    onChangeText={setReturnArrivalTime}
                    placeholder="05:30 PM"
                  />
                </View>
              </View>
            </View>

            {/* SECTION 9: Submission & Remarks */}
            <View className="mb-2 rounded-xl border border-marush-border bg-marush-subtle/40 p-3.5">
              <Text className="mb-2 text-xs font-black uppercase tracking-wider text-marush-primary">
                9. Submission & Remarks
              </Text>
              
              <View className={styles.inputGroup}>
                <Text className={styles.label}>Controller Remarks</Text>
                <TextInput
                  className={`${styles.input} h-[70px]`}
                  multiline
                  placeholder="Record observations, site conditions, vehicle details or notes..."
                  placeholderTextColor={Colors.textMuted}
                  value={controllerRemarks}
                  onChangeText={setControllerRemarks}
                />
              </View>

              <View className="mt-3 rounded-lg border border-dashed border-marush-border bg-white p-3">
                <Text className="text-[11px] font-bold text-marush-primary">System-Recorded Metadata</Text>
                <Text className="mt-1 text-[11px] text-marush-muted">
                  • Creator: {currentUser.fullName} ({currentUser.email}){'\n'}
                  • Status: pending_approval (sent to Admin){'\n'}
                  • Submission Timestamp: Automatic server timestamp on save
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className={`${styles.submitProgBtn} ${submitting ? styles.btnDisabled : ''}`}
              onPress={handleInitiateProgram}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View className="flex-row items-center justify-center gap-2">
                  <ClipboardCheck size={16} color={Colors.white} />
                  <Text className={styles.submitProgBtnText}>Submit Program & Team to Admin</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* End Program / Send to Auditor Modal */}
      {endingProgram && (
        <Modal visible transparent animationType="fade">
          <View className={styles.modalOverlay}>
            <View className={styles.modalCard}>
              <Text className={styles.modalTitle}>End Program & Record Metrics</Text>
              <Text className={styles.modalSub}>{endingProgram.programName}</Text>

              <ScrollView className={styles.modalScroll}>
                <View className={styles.inputGroup}>
                  <Text className={styles.label}>Total Birds Vaccinated</Text>
                  <TextInput
                    className={styles.input}
                    value={birdsVaccinated}
                    onChangeText={setBirdsVaccinated}
                    keyboardType="numeric"
                  />
                </View>

                <View className={styles.inputGroup}>
                  <Text className={styles.label}>Dosage Per Bird</Text>
                  <TextInput
                    className={styles.input}
                    value={dosagePerBird}
                    onChangeText={setDosagePerBird}
                  />
                </View>

                <View className={styles.inputGroup}>
                  <Text className={styles.label}>Vaccine Batch Number</Text>
                  <TextInput
                    className={styles.input}
                    value={batchNumber}
                    onChangeText={setBatchNumber}
                  />
                </View>

                <View className={styles.inputGroup}>
                  <Text className={styles.label}>Vaccine Type</Text>
                  <TextInput
                    className={styles.input}
                    value={vaccineType}
                    onChangeText={setVaccineType}
                  />
                </View>

                <View className={styles.inputGroup}>
                  <Text className={styles.label}>Cold-Chain Log Temperature (Ã‚Â°C)</Text>
                  <TextInput
                    className={styles.input}
                    value={coldChainTemp}
                    onChangeText={setColdChainTemp}
                    keyboardType="numeric"
                  />
                </View>

                <View className={styles.inputGroup}>
                  <Text className={styles.label}>Equipment Check Status</Text>
                  <TouchableOpacity
                    className={`${styles.toggleBtn} ${equipmentCheckPassed ? styles.toggleBtnPassed : styles.toggleBtnFailed}`}
                    onPress={() => setEquipmentCheckPassed(!equipmentCheckPassed)}
                  >
                    <View className="flex-row items-center gap-2">
                      {equipmentCheckPassed
                        ? <Check size={15} color={Colors.white} strokeWidth={2.5} />
                        : <CircleX size={15} color={Colors.white} strokeWidth={2.5} />}
                      <Text className={styles.toggleBtnText}>
                        Equipment Check {equipmentCheckPassed ? 'PASSED' : 'FAILED'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View className={styles.inputGroup}>
                  <Text className={styles.label}>Flock Monitoring Observations</Text>
                  <TextInput
                    className={`${styles.input} h-[60px]`}
                    multiline
                    value={farmFlockNotes}
                    onChangeText={setFarmFlockNotes}
                  />
                </View>
              </ScrollView>

              <View className={styles.modalBtnRow}>
                <TouchableOpacity
                  className={styles.cancelModalBtn}
                  onPress={() => setEndingProgram(null)}
                  disabled={submitting}
                >
                  <Text className={styles.cancelModalBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`${styles.confirmModalBtn} ${submitting ? styles.btnDisabled : ''}`}
                  onPress={handleConfirmEndProgram}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <View className="flex-row items-center justify-center gap-2">
                      <Send size={15} color={Colors.white} />
                      <Text className={styles.confirmModalBtnText}>Send to Auditor</Text>
                    </View>
                  )}
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
  container: 'flex-1 bg-slate-50',
  tabBar: 'flex-row flex-wrap items-center justify-between border-b border-black/[0.06] bg-white px-5 md:px-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
  filterRow: 'gap-2 px-5 py-3',
  filterChip: 'min-h-[34px] justify-center rounded-full border border-black/[0.08] bg-white px-3.5 shadow-sm transition-all',
  filterChipActive: 'border-marush-primary bg-marush-primary-subtle',
  filterChipText: 'text-xs font-semibold text-slate-500',
  filterChipTextActive: 'font-bold text-marush-primary',
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
  initiatePromptBtn: 'rounded-2xl bg-marush-primary px-4 py-2.5 shadow-sm active:scale-[0.97]',
  initiatePromptBtnText: 'text-xs font-bold text-white',
  progCard: 'mb-3 gap-2 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]',
  cardHeader: 'flex-row flex-wrap items-start justify-between gap-2',
  cardTitle: 'min-w-0 flex-1 text-base font-bold tracking-tight text-slate-900',
  statusBadge: 'rounded-full px-3 py-1',
  statusBadgeText: 'text-[10px] font-black uppercase tracking-wider',
  cardSub: 'text-sm font-semibold text-slate-600',
  cardMeta: 'text-xs text-slate-400',
  endProgBtn: 'mt-3 items-center rounded-2xl bg-marush-primary py-2.5 shadow-sm active:scale-[0.97]',
  endProgBtnText: 'text-xs font-bold text-white',
  waitingBanner: 'mt-2 rounded-2xl bg-slate-50 border border-black/[0.05] p-2.5',
  waitingBannerText: 'text-xs italic text-slate-500',
  auditFeedback: 'mt-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5',
  auditFeedbackTitle: 'text-xs font-bold text-emerald-800 uppercase tracking-wide',
  auditFeedbackText: 'mt-0.5 text-xs italic text-emerald-900',
  auditScorePill: 'mt-1 text-xs font-black text-emerald-800',
  formCard: 'gap-4 rounded-3xl border border-black/[0.07] bg-white p-6 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]',
  formTitle: 'text-xl font-black tracking-tight text-slate-900',
  formSub: 'mb-2 text-xs text-slate-500',
  inputGroup: 'gap-1.5',
  label: 'text-xs font-bold uppercase tracking-wider text-slate-500',
  input: 'rounded-xl border border-black/[0.08] bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800',
  row: 'flex-row flex-wrap gap-3',
  empSelectHeader: 'flex-row flex-wrap items-center justify-between gap-2',
  availCount: 'text-xs font-bold text-marush-secondary-dark',
  noEmpBox: 'my-1 rounded-2xl border border-amber-200 bg-amber-50/80 p-3',
  noEmpWarning: 'text-xs italic text-amber-800',
  empListGrid: 'mt-2 flex-row flex-wrap gap-2',
  empPill: 'rounded-2xl border border-black/[0.08] bg-slate-50 px-3.5 py-2.5 shadow-sm active:scale-[0.97]',
  empPillSelected: 'border-marush-primary bg-marush-primary shadow-sm',
  empPillText: 'text-xs font-semibold text-slate-700',
  empPillTextSelected: 'font-bold text-white',
  submitProgBtn: 'mt-3 items-center rounded-2xl bg-marush-primary py-3.5 shadow-[0_2px_10px_rgba(0,79,66,0.2)] active:scale-[0.98]',
  btnDisabled: 'opacity-70',
  submitProgBtnText: 'text-sm font-bold text-white tracking-tight',
  modalOverlay: 'flex-1 items-center justify-center bg-black/40 backdrop-blur-sm p-4',
  modalCard: 'max-h-[90%] w-full max-w-[520px] rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-black/[0.08]',
  modalTitle: 'text-xl font-black tracking-tight text-slate-900',
  modalSub: 'mb-4 text-xs text-slate-500',
  modalScroll: 'mb-4',
  toggleBtn: 'mt-1 items-center rounded-2xl py-2.5 active:scale-[0.97]',
  toggleBtnPassed: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
  toggleBtnFailed: 'bg-red-50 border border-red-200 text-red-800',
  toggleBtnText: 'text-xs font-black tracking-wide',
  modalBtnRow: 'flex-row flex-wrap justify-end gap-3',
  cancelModalBtn: 'min-w-[100px] flex-1 items-center rounded-2xl border border-black/[0.08] px-4 py-2.5 active:scale-[0.97]',
  cancelModalBtnText: 'text-xs font-bold text-slate-600',
  confirmModalBtn: 'min-w-[160px] flex-1 items-center rounded-2xl bg-marush-primary px-4 py-2.5 shadow-sm active:scale-[0.97]',
  confirmModalBtnText: 'text-xs font-bold text-white tracking-tight',
};
