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
import { Check, CircleX, ClipboardCheck, Plus, RefreshCw, Send } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { UserProfile, Program, ProgramCompletionMetrics, ProgramStatus } from '../types';
import { dataProvider } from '../services';

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

  const handleInitiateProgram = async () => {
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
    <View className={styles.container}>
      {/* Tab Switcher & Refresh */}
      {activeArea === 'programs' && <View className={styles.tabBar}>
        <View className={styles.tabGroup}>
          <TouchableOpacity
            className={`${styles.tabBtn} ${activeTab === 'my_programs' ? styles.tabBtnActive : ''}`}
            onPress={() => setActiveTab('my_programs')}
          >
            <Text className={`${styles.tabBtnText} ${activeTab === 'my_programs' ? styles.tabBtnTextActive : ''}`}>
              My Programs ({myPrograms.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`${styles.tabBtn} ${activeTab === 'initiate' ? styles.tabBtnActive : ''}`}
            onPress={() => {
              refreshData();
              setActiveTab('initiate');
            }}
          >
            <View className="flex-row items-center gap-1">
              <Plus size={14} color={activeTab === 'initiate' ? Colors.primary : Colors.textSecondary} />
              <Text className={`${styles.tabBtnText} ${activeTab === 'initiate' ? styles.tabBtnTextActive : ''}`}>Initiate Program</Text>
            </View>
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

      {activeArea === 'programs' && activeTab === 'my_programs' && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={styles.filterRow}>
        {([
          ['all', 'All'],
          ['active', 'Active'],
          ['pending_approval', 'Awaiting approval'],
          ['pending_audit', 'Pending audit'],
          ['completed', 'Completed'],
        ] as const).map(([filter, label]) => (
          <TouchableOpacity key={filter} className={`${styles.filterChip} ${programFilter === filter ? styles.filterChipActive : ''}`} onPress={() => setProgramFilter(filter)}>
            <Text className={`${styles.filterChipText} ${programFilter === filter ? styles.filterChipTextActive : ''}`}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>}

      <ScrollView contentContainerClassName={styles.content}>
        {activeTab === 'my_programs' ? (
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>{activeArea === 'overview' ? 'Your operations at a glance' : 'Your programs'}</Text>
            {visiblePrograms.length === 0 ? (
              <View className={styles.emptyBox}>
                <Text className={styles.emptyText}>{myPrograms.length === 0 ? 'You have not initiated any programs yet.' : 'No programs match this status filter.'}</Text>
                <TouchableOpacity
                  className={styles.initiatePromptBtn}
                  onPress={() => setActiveTab('initiate')}
                >
                  <Text className={styles.initiatePromptBtnText}>Initiate First Program</Text>
                </TouchableOpacity>
              </View>
            ) : (
              visiblePrograms.map(prog => (
                <View key={prog.id} className={styles.progCard}>
                  <View className={styles.cardHeader}>
                    <Text className={styles.cardTitle}>{prog.programName}</Text>
                    <View
                      className={`${styles.statusBadge} bg-marush-subtle`}
                    >
                      <Text
                        className={`${styles.statusBadgeText} ${prog.status === 'pending_approval' ? 'text-marush-muted' : 'text-marush-primary'}`}
                      >
                        {prog.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text className={styles.cardSub}>{prog.hatcheryOrFarmName}</Text>
                  <Text className={styles.cardMeta}>
                    Flock: {prog.flockSize.toLocaleString()} birds Ã¢â‚¬Â¢ Team: {prog.teamMemberIds.length} members
                  </Text>
                  <Text className={styles.cardMeta}>
                    Schedule: {prog.scheduledStartDate} ({prog.scheduledStartTime} - {prog.scheduledEndTime})
                  </Text>
                  {prog.auditorName ? (
                    <Text className={styles.cardMeta}>Assigned Auditor: {prog.auditorName}</Text>
                  ) : null}

                  {prog.status === 'active' && (
                    <TouchableOpacity
                      className={styles.endProgBtn}
                      onPress={() => handleOpenEndProgram(prog)}
                    >
                      <Text className={styles.endProgBtnText}>End Program & Send to Auditor</Text>
                    </TouchableOpacity>
                  )}

                  {prog.status === 'pending_approval' && (
                    <View className={styles.waitingBanner}>
                      <Text className={styles.waitingBannerText}>
                        Team submitted. Waiting for Admin to approve & assign Auditor.
                      </Text>
                    </View>
                  )}

                  {prog.status === 'pending_audit' && (
                    <View className={styles.waitingBanner}>
                      <Text className={styles.waitingBannerText}>
                        Program completed. Awaiting Auditor's review and remarks.
                      </Text>
                    </View>
                  )}

                  {prog.status === 'completed' && prog.auditorRemarks ? (
                    <View className={styles.auditFeedback}>
                      <Text className={styles.auditFeedbackTitle}>
                        Auditor Sign-off ({prog.auditorName}):
                      </Text>
                      <Text className={styles.auditFeedbackText}>"{prog.auditorRemarks}"</Text>
                      {prog.auditScore ? (
                        <Text className={styles.auditScorePill}>Audit Score: {prog.auditScore}/100</Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ) : (
          <View className={styles.formCard}>
            <Text className={styles.formTitle}>Initiate Program & Field Schedule</Text>
            <Text className={styles.formSub}>
              Fill in farm, bird, vaccine, and travel details. The creator, submission timestamp, and status are automatically recorded.
            </Text>

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
            <View className="mb-2 rounded-xl border border-marush-border bg-marush-subtle/40 p-3.5">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="text-xs font-black uppercase tracking-wider text-marush-primary">
                  2. Team Details
                </Text>
                <Text className={styles.availCount}>
                  {availableEmployees.length} Available Staff
                </Text>
              </View>

              <View className="mb-2 rounded-lg bg-white p-2.5 border border-marush-border">
                <Text className="text-[11px] font-bold text-marush-muted">Program Controller Name</Text>
                <Text className="text-xs font-extrabold text-marush-primary">
                  {currentUser.fullName} ({currentUser.employeeCode || 'Lead Controller'})
                </Text>
              </View>

              <View className={styles.inputGroup}>
                <Text className={styles.label}>Vaccinator Name(s) * (Tap to assign)</Text>
                {availableEmployees.length === 0 ? (
                  <View className={styles.noEmpBox}>
                    <Text className={styles.noEmpWarning}>
                      All field vaccinators are currently engaged in active programs.
                    </Text>
                  </View>
                ) : (
                  <View className={styles.empListGrid}>
                    {availableEmployees.map(emp => {
                      const isSelected = selectedEmpIds.includes(emp.id);
                      return (
                        <TouchableOpacity
                          key={emp.id}
                          className={`${styles.empPill} ${isSelected ? styles.empPillSelected : ''}`}
                          onPress={() => toggleSelectEmployee(emp.id)}
                        >
                          <View className="flex-row items-center gap-1.5">
                            {isSelected ? <Check size={14} color={Colors.primary} /> : <Plus size={14} color={Colors.textSecondary} />}
                            <Text className={`${styles.empPillText} ${isSelected ? styles.empPillTextSelected : ''}`}>
                              {emp.fullName} ({emp.employeeCode || 'Vaccinator'})
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
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
    </View>
  );
};

const styles = {
  container: 'flex-1 bg-marush-background',
  tabBar: 'flex-row flex-wrap items-center justify-between border-b border-marush-border bg-white px-4 md:px-7',
  filterRow: 'gap-2 px-5 py-3',
  filterChip: 'min-h-[34px] justify-center rounded-full border border-marush-border bg-white px-3',
  filterChipActive: 'border-marush-secondary bg-marush-primary-subtle',
  filterChipText: 'text-xs font-semibold text-marush-muted',
  filterChipTextActive: 'font-bold text-marush-primary',
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
  emptyBox: 'items-center gap-3 p-8',
  emptyText: 'text-[13px] text-marush-muted-light',
  initiatePromptBtn: 'rounded-lg bg-marush-primary px-4 py-2',
  initiatePromptBtnText: 'text-[13px] font-bold text-white',
  progCard: 'mb-2.5 gap-1 rounded-[10px] border border-marush-border bg-white p-4',
  cardHeader: 'flex-row flex-wrap items-start justify-between gap-2',
  cardTitle: 'min-w-0 flex-1 text-[15px] font-bold text-marush-text',
  statusBadge: 'rounded-md px-2 py-1',
  statusBadgeText: 'text-[10px] font-extrabold',
  cardSub: 'text-[13px] text-marush-muted',
  cardMeta: 'text-xs text-marush-muted-light',
  endProgBtn: 'mt-2.5 items-center rounded-lg bg-marush-secondary-dark py-2',
  endProgBtnText: 'text-[13px] font-bold text-white',
  waitingBanner: 'mt-2 rounded-md bg-marush-subtle p-2',
  waitingBannerText: 'text-[11px] italic text-marush-muted',
  auditFeedback: 'mt-2 rounded-lg border border-marush-border bg-marush-subtle p-2.5',
  auditFeedbackTitle: 'text-[11px] font-bold text-marush-primary',
  auditFeedbackText: 'mt-0.5 text-xs italic text-marush-primary-dark',
  auditScorePill: 'mt-1 text-[11px] font-bold text-marush-primary',
  formCard: 'gap-3.5 rounded-[14px] border border-marush-border bg-white p-5',
  formTitle: 'text-[17px] font-extrabold text-marush-primary',
  formSub: 'mb-1.5 text-xs text-marush-muted',
  inputGroup: 'gap-1',
  label: 'text-xs font-bold text-marush-text',
  input: 'rounded-lg border border-marush-border bg-marush-background px-3 py-2 text-[13px]',
  row: 'flex-row flex-wrap gap-3',
  empSelectHeader: 'flex-row flex-wrap items-center justify-between gap-2',
  availCount: 'text-[11px] font-bold text-marush-secondary-dark',
  noEmpBox: 'my-1 rounded-lg border border-marush-subtle bg-marush-subtle p-2.5',
  noEmpWarning: 'text-xs italic text-marush-primary-dark',
  empListGrid: 'mt-1.5 flex-row flex-wrap gap-2',
  empPill: 'rounded-lg border border-marush-border bg-marush-subtle px-3 py-2',
  empPillSelected: 'border-marush-secondary bg-marush-secondary',
  empPillText: 'text-xs font-semibold text-marush-text',
  empPillTextSelected: 'font-bold text-white',
  submitProgBtn: 'mt-2 items-center rounded-[10px] bg-marush-primary py-3',
  btnDisabled: 'opacity-70',
  submitProgBtnText: 'text-sm font-bold text-white',
  modalOverlay: 'flex-1 items-center justify-center bg-black/50 p-4',
  modalCard: 'max-h-[90%] w-full max-w-[500px] rounded-2xl bg-white p-6',
  modalTitle: 'text-lg font-extrabold text-marush-primary',
  modalSub: 'mb-3 text-[13px] text-marush-muted',
  modalScroll: 'mb-4',
  toggleBtn: 'mt-0.5 items-center rounded-lg py-2',
  toggleBtnPassed: 'bg-marush-subtle',
  toggleBtnFailed: 'bg-marush-subtle',
  toggleBtnText: 'text-xs font-bold text-marush-text',
  modalBtnRow: 'flex-row flex-wrap justify-end gap-2.5',
  cancelModalBtn: 'min-w-[96px] flex-1 items-center px-3.5 py-2',
  cancelModalBtnText: 'font-semibold text-marush-muted',
  confirmModalBtn: 'min-w-[160px] flex-1 items-center rounded-lg bg-marush-secondary-dark px-4 py-2',
  confirmModalBtnText: 'font-bold text-white',
};
