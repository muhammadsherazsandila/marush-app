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
  const upcomingCount = attendedPrograms.filter(p => p.status === 'pending_approval' || p.status === 'pending_audit').length;

  return (
    <View className="flex-1 bg-slate-50">
      {/* Sub-header navigation row matching AdminDashboard */}
      <View className="border-b border-black/[0.06] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <View className="mx-auto w-full max-w-[1280px] flex-row items-center justify-between px-5 md:px-8 py-3.5">
          <View className="flex-row items-center gap-2.5">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-marush-primary-subtle border border-marush-primary/15">
              <Syringe size={16} color={Colors.primary} strokeWidth={2.4} />
            </View>
            <View>
              <Text className="text-xs font-bold text-slate-900">{currentUser.fullName}</Text>
              <Text className="text-[10px] font-mono text-slate-400">ID: {currentUser.employeeCode || 'MRSH-VACC'}</Text>
            </View>
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

      <ScrollView contentContainerClassName="mx-auto w-full max-w-[1280px] p-4 md:p-8 gap-5">
        {/* OVERVIEW AREA */}
        {activeArea === 'overview' && (
          <View className="gap-5">
            {/* Page Header */}
            <View className="flex-row flex-wrap items-start justify-between gap-4">
              <View className="min-w-0 flex-1">
                <Text className="mb-1 text-[10px] font-black uppercase tracking-[1.8px] text-marush-secondary-dark">
                  FIELD OPERATIONS / WORKSPACE
                </Text>
                <Text className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                  Vaccination Specialist Summary
                </Text>
                <Text className="mt-1 max-w-[620px] text-xs md:text-sm leading-relaxed text-slate-500">
                  View your field assignments, live immunization schedules, and biosecurity audit sign-offs.
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5 rounded-full border border-black/[0.06] bg-white px-3.5 py-1.5 shadow-sm">
                <Activity size={14} color={Colors.primary} strokeWidth={2.5} />
                <Text className="text-xs font-bold text-marush-primary">Field Ready</Text>
              </View>
            </View>

            {/* Metrics Grid */}
            <View className="flex-row flex-wrap gap-3">
              <View className="min-w-[190px] flex-1 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border-l-4 border-l-marush-primary">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Assigned</Text>
                  <View className="rounded-xl bg-slate-100 p-2">
                    <ClipboardList size={16} color={Colors.primary} strokeWidth={2.4} />
                  </View>
                </View>
                <Text className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                  {attendedPrograms.length}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500">Total campaigns assigned</Text>
              </View>

              <View className="min-w-[190px] flex-1 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border-l-4 border-l-teal-600">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">In Progress</Text>
                  <View className="rounded-xl bg-teal-50 p-2">
                    <Activity size={16} color="#0D9488" strokeWidth={2.4} />
                  </View>
                </View>
                <Text className="mt-2 text-3xl font-black tracking-tight text-teal-700">
                  {activeCount}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500">Live in the field</Text>
              </View>

              <View className="min-w-[190px] flex-1 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border-l-4 border-l-emerald-600">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="text-[10px] font-black uppercase tracking-wider text-slate-400">Completed</Text>
                  <View className="rounded-xl bg-emerald-50 p-2">
                    <CircleCheck size={16} color="#059669" strokeWidth={2.4} />
                  </View>
                </View>
                <Text className="mt-2 text-3xl font-black tracking-tight text-emerald-700">
                  {completedCount}
                </Text>
                <Text className="mt-0.5 text-xs text-slate-500">Signed off & archived</Text>
              </View>
            </View>

            {/* Active Programs Section */}
            <View className="rounded-3xl border border-black/[0.07] bg-white p-5 md:p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <View className="flex-row flex-wrap items-center justify-between gap-3 mb-4">
                <View>
                  <Text className="text-sm font-bold text-slate-900">Your Current Field Missions</Text>
                  <Text className="text-xs text-slate-500">Active and upcoming vaccination schedules</Text>
                </View>
                {attendedPrograms.length > 0 && (
                  <Text className="rounded-full bg-slate-100 border border-black/[0.05] px-2.5 py-1 text-[11px] font-bold text-marush-primary">
                    {attendedPrograms.length} total
                  </Text>
                )}
              </View>

              {attendedPrograms.length === 0 ? (
                <View className="items-center rounded-3xl border border-dashed border-black/[0.1] bg-white p-10">
                  <View className="mb-2 rounded-full bg-marush-subtle p-3">
                    <ClipboardList size={22} color={Colors.primary} />
                  </View>
                  <Text className="text-sm font-bold text-slate-800">No programs assigned yet</Text>
                  <Text className="mt-1 max-w-[340px] text-center text-xs text-slate-500">
                    When a Program Controller assigns you to a vaccination team, it will appear here immediately.
                  </Text>
                </View>
              ) : (
                attendedPrograms.slice(0, 5).map(prog => (
                  <View
                    key={prog.id}
                    className="mb-3 gap-2.5 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                  >
                    <View className="flex-row flex-wrap items-start justify-between gap-2">
                      <Text className="min-w-0 flex-1 text-base font-bold tracking-tight text-slate-900">
                        {prog.programName}
                      </Text>
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

                    <View className="flex-row items-center gap-1.5">
                      <MapPin size={14} color={Colors.primary} strokeWidth={2.4} />
                      <Text className="text-sm font-semibold text-slate-700">{prog.hatcheryOrFarmName}</Text>
                      {prog.farmAddress && (
                        <Text className="text-xs text-slate-400" numberOfLines={1}>
                          • {prog.farmAddress}
                        </Text>
                      )}
                    </View>

                    <View className="mt-1 flex-row flex-wrap items-center gap-x-6 gap-y-1.5 rounded-2xl border border-black/[0.05] bg-slate-50/80 p-3">
                      <Text className="text-xs text-slate-600">
                        Flock: <Text className="font-bold text-slate-900">{prog.flockSize.toLocaleString()}</Text> birds
                      </Text>
                      <View className="flex-row items-center gap-1.5">
                        <CalendarDays size={13} color={Colors.textMuted} />
                        <Text className="text-xs text-slate-500">
                          {prog.scheduledStartDate} ({prog.scheduledStartTime} - {prog.scheduledEndTime})
                        </Text>
                      </View>
                      <Text className="text-xs text-slate-500">
                        Controller: <Text className="font-semibold text-slate-700">{prog.controllerName || 'Lead'}</Text>
                      </Text>
                    </View>

                    {prog.completionMetrics && (
                      <View className="mt-1 gap-1 rounded-2xl border border-black/[0.05] bg-slate-50 p-3">
                        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vaccination Records</Text>
                        <Text className="text-xs text-slate-600">
                          Vaccinated: <Text className="font-bold text-slate-800">{prog.completionMetrics.birdsVaccinated.toLocaleString()}</Text> birds • Cold-Chain: <Text className="font-bold text-slate-800">{prog.completionMetrics.coldChainTempCelsius}°C</Text> • Vaccine: {prog.completionMetrics.vaccineType}
                        </Text>
                      </View>
                    )}

                    {prog.auditorRemarks && (
                      <View className="mt-1 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3">
                        <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          Auditor Sign-off ({prog.auditorName || 'Auditor'})
                        </Text>
                        <Text className="mt-0.5 text-xs italic text-emerald-900">"{prog.auditorRemarks}"</Text>
                        {prog.auditScore ? (
                          <Text className="mt-1 text-xs font-black text-emerald-800">Quality Score: {prog.auditScore} / 100</Text>
                        ) : null}
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* PROGRAMS AREA */}
        {activeArea === 'programs' && (
          <View className="gap-4">
            <View className="flex-row flex-wrap items-start justify-between gap-4">
              <View className="min-w-0 flex-1">
                <Text className="mb-1 text-[10px] font-black uppercase tracking-[1.8px] text-marush-secondary-dark">
                  OPERATIONS DIRECTORY
                </Text>
                <Text className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
                  All Assigned Programs
                </Text>
                <Text className="mt-1 max-w-[620px] text-xs md:text-sm leading-relaxed text-slate-500">
                  Detailed timeline and operational logs for all programs where you are an active team member.
                </Text>
              </View>
            </View>

            {attendedPrograms.length === 0 ? (
              <View className="items-center rounded-3xl border border-dashed border-black/[0.1] bg-white p-10">
                <View className="mb-2 rounded-full bg-slate-100 p-3">
                  <ClipboardList size={22} color={Colors.textMuted} />
                </View>
                <Text className="text-sm font-bold text-slate-800">No programs assigned yet</Text>
                <Text className="mt-1 max-w-[340px] text-center text-xs text-slate-500">
                  New field assignments scheduled by your Program Controller will appear here automatically.
                </Text>
              </View>
            ) : (
              attendedPrograms.map(prog => (
                <View
                  key={prog.id}
                  className="mb-3 gap-2.5 rounded-3xl border border-black/[0.07] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                >
                  <View className="flex-row flex-wrap items-start justify-between gap-2">
                    <Text className="min-w-0 flex-1 text-base font-bold tracking-tight text-slate-900">
                      {prog.programName}
                    </Text>
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

                  <View className="flex-row items-center gap-1.5">
                    <MapPin size={14} color={Colors.primary} strokeWidth={2.4} />
                    <Text className="text-sm font-semibold text-slate-700">{prog.hatcheryOrFarmName}</Text>
                    {prog.farmAddress && (
                      <Text className="text-xs text-slate-400" numberOfLines={1}>
                        • {prog.farmAddress}
                      </Text>
                    )}
                  </View>

                  <View className="mt-1 flex-row flex-wrap items-center gap-x-6 gap-y-1.5 rounded-2xl border border-black/[0.05] bg-slate-50/80 p-3">
                    <Text className="text-xs text-slate-600">
                      Flock: <Text className="font-bold text-slate-900">{prog.flockSize.toLocaleString()}</Text> birds
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                      <CalendarDays size={13} color={Colors.textMuted} />
                      <Text className="text-xs text-slate-500">
                        {prog.scheduledStartDate} ({prog.scheduledStartTime} - {prog.scheduledEndTime})
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-500">
                      Controller: <Text className="font-semibold text-slate-700">{prog.controllerName || 'Lead'}</Text>
                    </Text>
                  </View>

                  {prog.completionMetrics && (
                    <View className="mt-1 gap-1 rounded-2xl border border-black/[0.05] bg-slate-50 p-3">
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vaccination Records</Text>
                      <Text className="text-xs text-slate-600">
                        Vaccinated: <Text className="font-bold text-slate-800">{prog.completionMetrics.birdsVaccinated.toLocaleString()}</Text> birds • Cold-Chain: <Text className="font-bold text-slate-800">{prog.completionMetrics.coldChainTempCelsius}°C</Text> • Vaccine: {prog.completionMetrics.vaccineType}
                      </Text>
                    </View>
                  )}

                  {prog.auditorRemarks && (
                    <View className="mt-1 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3">
                      <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Auditor Sign-off ({prog.auditorName || 'Auditor'})
                      </Text>
                      <Text className="mt-0.5 text-xs italic text-emerald-900">"{prog.auditorRemarks}"</Text>
                      {prog.auditScore ? (
                        <Text className="mt-1 text-xs font-black text-emerald-800">Quality Score: {prog.auditScore} / 100</Text>
                      ) : null}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
