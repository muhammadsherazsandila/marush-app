import React, { useState, useEffect, useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { Activity, Bird, CircleCheck, ClipboardList, RefreshCw, Syringe, Thermometer } from 'lucide-react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { UserProfile, Program } from '../types';
import { dataProvider } from '../services';
import { IconLabel } from '../components/IconLabel';

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
    <ScrollView className="flex-1 bg-marush-background">
      <View className="flex-grow p-4 md:p-8">
      <View className="mx-auto w-full max-w-[1200px] gap-3">
        {activeArea === 'overview' && <View className="flex-row flex-wrap items-center justify-between gap-3.5 rounded-lg border border-marush-border bg-white p-[22px]">
          <View>
            <Text className="text-[11px] font-bold uppercase text-marush-muted-light">Overview</Text>
            <Text className="mt-0.5 text-[22px] font-extrabold text-marush-primary">{currentUser.fullName}</Text>
            <Text className="mt-0.5 text-xs font-semibold text-marush-muted">{currentUser.employeeCode || 'MRSH-EMP'}</Text>
          </View>
          <View className="items-end gap-2">
            <View className="rounded-lg bg-marush-subtle px-2.5 py-1.5">
              <Text className="text-[10px] font-extrabold text-marush-primary">{currentUser.role.replace('_', ' ').toUpperCase()}</Text>
            </View>
            <TouchableOpacity className="rounded-md border border-marush-border bg-white px-2.5 py-1.5" onPress={refreshData} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <IconLabel icon={RefreshCw} label="Refresh" className="text-[11px] font-semibold text-marush-primary" />
              )}
            </TouchableOpacity>
          </View>
        </View>}

        {/* Overview Tab Stats */}
        {activeArea === 'overview' && <>
        <IconLabel icon={ClipboardList} label="Program summary" size={18} className="text-xl font-bold text-marush-text" />
        <View className="flex-row flex-wrap gap-2.5">
          <View className="min-w-[130px] flex-1 rounded-[10px] border border-l-4 border-marush-border border-l-marush-primary bg-white p-3.5">
            <IconLabel icon={ClipboardList} label="Total programs" color={Colors.textSecondary} size={14} className="text-[10px] font-bold uppercase text-marush-muted-light" />
            <Text className="mt-1 text-2xl font-extrabold text-marush-primary">
              {attendedPrograms.length}
            </Text>
          </View>

          <View className="min-w-[130px] flex-1 rounded-[10px] border border-l-4 border-marush-border border-l-marush-secondary bg-white p-3.5">
            <IconLabel icon={Activity} label="Active" color={Colors.textSecondary} size={14} className="text-[10px] font-bold uppercase text-marush-muted-light" />
            <Text className="mt-1 text-2xl font-extrabold text-marush-secondary">
              {activeCount}
            </Text>
          </View>

          <View className="min-w-[130px] flex-1 rounded-[10px] border border-l-4 border-marush-border border-l-marush-primary-light bg-white p-3.5">
            <IconLabel icon={CircleCheck} label="Completed" color={Colors.textSecondary} size={14} className="text-[10px] font-bold uppercase text-marush-muted-light" />
            <Text className="mt-1 text-2xl font-extrabold text-marush-primary-light">
              {completedCount}
            </Text>
          </View>
        </View>
        </>}

        {/* Attended Programs List with Role in that Program */}
        {activeArea === 'programs' && <>
        <IconLabel icon={ClipboardList} label="My programs" size={18} className="mt-2 text-xl font-bold text-marush-text" />

        {attendedPrograms.length === 0 ? (
          <View className="items-center rounded-[10px] border border-marush-border bg-white p-6">
            <Text className="text-center text-[13px] leading-[18px] text-marush-muted-light">
              No programs assigned.
            </Text>
          </View>
        ) : (
          attendedPrograms.map(prog => {
            const isController = prog.controllerId === currentUser.id;
            return (
              <View key={prog.id} className="mb-2 gap-1 rounded-xl border border-marush-border bg-white p-4">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 text-[15px] font-bold text-marush-text">{prog.programName}</Text>
                  <View
                    className={`rounded-md px-2 py-1 ${isController ? 'bg-marush-subtle' : 'bg-marush-primary-subtle'}`}
                  >
                    <Text
                      className={`text-[9px] font-extrabold ${isController ? 'text-marush-muted' : 'text-marush-primary'}`}
                    >
                      {isController ? 'PROGRAM CONTROLLER' : 'TEAM MEMBER'}
                    </Text>
                  </View>
                </View>

                <Text className="text-[13px] font-medium text-marush-muted">{prog.hatcheryOrFarmName}</Text>

                <View className="mt-1 flex-row flex-wrap gap-x-4 gap-y-1">
                  <Text className="text-xs text-marush-muted">
                    Flock: {prog.flockSize.toLocaleString()} birds
                  </Text>
                  <Text className="text-xs text-marush-muted">
                    Status: <Text className="font-bold text-marush-primary">{prog.status.toUpperCase()}</Text>
                  </Text>
                </View>

                <Text className="mt-0.5 text-[11px] text-marush-muted-light">
                  Scheduled: {prog.scheduledStartDate} ({prog.scheduledStartTime} - {prog.scheduledEndTime})
                </Text>

                {prog.completionMetrics && (
                  <View className="mt-2 gap-0.5 rounded-lg bg-marush-subtle p-2.5">
                    <Text className="text-[11px] font-bold text-marush-primary">Vaccination & Cold-Chain Records:</Text>
                    <Text className="text-[11px] text-marush-muted">
                      Birds Vaccinated: {prog.completionMetrics.birdsVaccinated.toLocaleString()}
                    </Text>
                    <Text className="text-[11px] text-marush-muted">
                      Vaccine: {prog.completionMetrics.vaccineType} (Batch: {prog.completionMetrics.batchNumber})
                    </Text>
                    <Text className="text-[11px] text-marush-muted">
                      Cold Chain Log: {prog.completionMetrics.coldChainTempCelsius}°C
                    </Text>
                  </View>
                )}

                {prog.auditorRemarks ? (
                  <View className="mt-2 gap-0.5 rounded-lg border border-marush-border bg-marush-subtle p-2.5">
                    <Text className="text-[11px] font-bold text-marush-primary">
                      Auditor Remarks ({prog.auditorName}):
                    </Text>
                    <Text className="text-xs italic text-marush-primary-dark">"{prog.auditorRemarks}"</Text>
                    {prog.auditScore ? (
                      <Text className="mt-0.5 text-[11px] font-extrabold text-marush-primary">Score: {prog.auditScore}/100</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
        </>}
      </View>
      </View>
    </ScrollView>
  );
};

