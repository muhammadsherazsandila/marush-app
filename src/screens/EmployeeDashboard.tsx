import React, { useState, useEffect, useCallback } from 'react';
import Toast from 'react-native-toast-message';
import {
  Activity,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Syringe,
  Thermometer,
} from 'lucide-react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors } from '../constants/colors';
import { UserProfile, Program } from '../types';
import { dataProvider } from '../services';

interface EmployeeDashboardProps {
  currentUser: UserProfile;
  activeArea: 'overview' | 'programs';
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ currentUser, activeArea }) => {
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const progs = await dataProvider.getPrograms();
      setAllPrograms(progs);
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

  // Find all programs where this employee was controller OR team member
  const attendedPrograms = allPrograms.filter(
    p => p.controllerId === currentUser.id || p.teamMemberIds.includes(currentUser.id)
  );

  const completedCount = attendedPrograms.filter(p => p.status === 'completed').length;
  const activeCount = attendedPrograms.filter(p => p.status === 'active').length;

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="flex-grow p-4 md:p-8">
        <View className="mx-auto w-full max-w-[1180px] gap-4">
          {/* Employee Hero Card */}
          {activeArea === 'overview' && (
            <View className="overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <View className="flex-row flex-wrap items-center justify-between gap-4 bg-marush-primary px-6 py-6 md:px-8">
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[10px] font-black uppercase tracking-[1.8px] text-emerald-200">
                      Field Specialist Workspace
                    </Text>
                    <View className="rounded-full bg-white/15 px-2 py-0.5">
                      <Text className="text-[9px] font-bold text-white tracking-wider">ACTIVE</Text>
                    </View>
                  </View>
                  <Text className="mt-1 text-2xl md:text-3xl font-black text-white tracking-tight">
                    {currentUser.fullName}
                  </Text>
                  <Text className="mt-1 text-xs font-semibold text-emerald-100">
                    Badge: {currentUser.employeeCode || 'MRSH-VACC'} • Assigned to Field Operations
                  </Text>
                </View>

                <TouchableOpacity
                  className="flex-row items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 border border-white/20 transition-all active:scale-[0.97]"
                  onPress={refreshData}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <RefreshCw size={14} color="#FFFFFF" strokeWidth={2.4} />
                      <Text className="text-xs font-bold text-white">Sync Records</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap items-center justify-between gap-4 border-t border-black/[0.06] bg-slate-50/70 px-6 py-3 md:px-8">
                <Text className="text-xs font-medium text-slate-500">
                  Total Assigned Programs: <Text className="font-bold text-slate-800">{attendedPrograms.length}</Text>
                </Text>
                <View className="flex-row items-center gap-2">
                  <ShieldCheck size={14} color={Colors.primary} strokeWidth={2.4} />
                  <Text className="text-xs font-semibold text-marush-primary">Biosecurity & Cold-Chain Verified</Text>
                </View>
              </View>
            </View>
          )}

          {/* Metric Stats Section */}
          {activeArea === 'overview' && (
            <>
              <View className="mt-2 flex-row items-center justify-between">
                <View>
                  <Text className="text-[10px] font-black uppercase tracking-[1.6px] text-marush-secondary-dark">
                    Operational Metrics
                  </Text>
                  <Text className="mt-0.5 text-xl font-black tracking-tight text-slate-900">
                    Performance Summary
                  </Text>
                </View>
              </View>

              <View className="flex-row flex-wrap gap-3">
                <View className="min-w-[140px] flex-1 rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Programs</Text>
                    <View className="rounded-xl bg-slate-100 p-2">
                      <ClipboardList size={16} color={Colors.primary} strokeWidth={2.4} />
                    </View>
                  </View>
                  <Text className="mt-2 text-3xl font-black tracking-tight text-marush-primary">
                    {attendedPrograms.length}
                  </Text>
                  <Text className="mt-1 text-[11px] font-medium text-slate-500">All assigned campaigns</Text>
                </View>

                <View className="min-w-[140px] flex-1 rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">Currently Active</Text>
                    <View className="rounded-xl bg-teal-50 p-2">
                      <Activity size={16} color={Colors.secondary} strokeWidth={2.4} />
                    </View>
                  </View>
                  <Text className="mt-2 text-3xl font-black tracking-tight text-marush-secondary">
                    {activeCount}
                  </Text>
                  <Text className="mt-1 text-[11px] font-medium text-slate-500">Ongoing in the field</Text>
                </View>

                <View className="min-w-[140px] flex-1 rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">Completed</Text>
                    <View className="rounded-xl bg-emerald-50 p-2">
                      <CircleCheck size={16} color="#059669" strokeWidth={2.4} />
                    </View>
                  </View>
                  <Text className="mt-2 text-3xl font-black tracking-tight text-emerald-700">
                    {completedCount}
                  </Text>
                  <Text className="mt-1 text-[11px] font-medium text-slate-500">Audited & verified</Text>
                </View>
              </View>
            </>
          )}

          {/* Assigned Programs List */}
          {activeArea === 'programs' && (
            <>
              <View className="mt-1 mb-2">
                <Text className="text-[10px] font-black uppercase tracking-[1.6px] text-marush-secondary-dark">
                  Field Assignments
                </Text>
                <Text className="mt-0.5 text-2xl font-black tracking-tight text-slate-900">
                  Assigned Programs
                </Text>
                <Text className="mt-1 text-xs text-slate-500">
                  Track scheduled visits, vaccination progress, and audit outcomes.
                </Text>
              </View>

              {attendedPrograms.length === 0 ? (
                <View className="items-center rounded-3xl border border-dashed border-black/[0.1] bg-white p-10">
                  <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <ClipboardList size={22} color={Colors.textMuted} />
                  </View>
                  <Text className="mt-3 text-sm font-bold text-slate-800">No Programs Assigned Yet</Text>
                  <Text className="mt-1 text-center text-xs text-slate-500 max-w-[340px]">
                    When a Program Controller adds you to a vaccination team, it will appear here instantly.
                  </Text>
                </View>
              ) : (
                attendedPrograms.map((prog) => {
                  const isController = prog.controllerId === currentUser.id;
                  const isCompleted = prog.status === 'completed';
                  return (
                    <View
                      key={prog.id}
                      className="gap-3 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                    >
                      <View className="flex-row items-center justify-between gap-3">
                        <Text className="flex-1 text-base font-bold text-slate-900 tracking-tight">
                          {prog.programName}
                        </Text>
                        <View
                          className={`rounded-full px-3 py-1 ${
                            isCompleted ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-100 border border-black/[0.05]'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-black uppercase tracking-wider ${
                              isCompleted ? 'text-emerald-700' : 'text-slate-700'
                            }`}
                          >
                            {prog.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-1.5">
                        <MapPin size={15} color={Colors.primary} strokeWidth={2.4} />
                        <Text className="text-sm font-semibold text-slate-700">
                          {prog.hatcheryOrFarmName}
                        </Text>
                        {prog.farmAddress && (
                          <Text className="text-xs text-slate-400" numberOfLines={1}>
                            • {prog.farmAddress}
                          </Text>
                        )}
                      </View>

                      <View className="flex-row flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-black/[0.05] bg-slate-50/70 p-3">
                        <Text className="text-xs text-slate-600">
                          Flock: <Text className="font-bold text-slate-900">{prog.flockSize.toLocaleString()}</Text> birds
                          {prog.birdDetails && (
                            <Text className="text-slate-400">
                              {' '}(B: {prog.birdDetails.b || 0}, L: {prog.birdDetails.l || 0}, Br: {prog.birdDetails.br || 0})
                            </Text>
                          )}
                        </Text>
                        <View className="flex-row items-center gap-1.5">
                          <CalendarDays size={13} color={Colors.textMuted} />
                          <Text className="text-xs text-slate-500">
                            {prog.scheduledStartDate} ({prog.scheduledStartTime} - {prog.scheduledEndTime})
                          </Text>
                        </View>
                      </View>

                      {prog.completionMetrics && (
                        <View className="gap-1 rounded-2xl border border-black/[0.06] bg-slate-50 p-3.5">
                          <Text className="text-[11px] font-bold text-marush-primary uppercase tracking-wide">
                            Vaccination & Cold-Chain Records
                          </Text>
                          <Text className="text-xs text-slate-600">
                            • Vaccinated: <Text className="font-bold text-slate-900">{prog.completionMetrics.birdsVaccinated.toLocaleString()}</Text> birds
                          </Text>
                          <Text className="text-xs text-slate-600">
                            • Vaccine: {prog.completionMetrics.vaccineType} (Batch: {prog.completionMetrics.batchNumber})
                          </Text>
                          <Text className="text-xs text-slate-600">
                            • Cold-Chain: {prog.completionMetrics.coldChainTempCelsius}°C
                          </Text>
                        </View>
                      )}

                      {prog.auditorRemarks && (
                        <View className="gap-1 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3.5">
                          <Text className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                            Auditor Inspection ({prog.auditorName || 'Auditor'}):
                          </Text>
                          <Text className="text-xs italic text-emerald-900">"{prog.auditorRemarks}"</Text>
                          {prog.auditScore ? (
                            <Text className="mt-1 text-xs font-black text-emerald-800">
                              Quality Score: {prog.auditScore} / 100
                            </Text>
                          ) : null}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
