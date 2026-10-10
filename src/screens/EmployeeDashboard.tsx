import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/colors';
import { UserProfile, Program } from '../types';
import { dataProvider, mockStore } from '../services/supabase';

interface EmployeeDashboardProps {
  currentUser: UserProfile;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ currentUser }) => {
  const [allPrograms, setAllPrograms] = useState<Program[]>(mockStore.getPrograms());
  const [loading, setLoading] = useState(false);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const progs = await dataProvider.getPrograms();
      setAllPrograms(progs);
    } catch {
      setAllPrograms(mockStore.getPrograms());
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        {/* Profile Summary Card with Refresh */}
        <View style={styles.profileCard}>
          <View>
            <Text style={styles.welcomeText}>Field Personnel Portal</Text>
            <Text style={styles.employeeName}>{currentUser.fullName}</Text>
            <Text style={styles.employeeCode}>{currentUser.employeeCode || 'MRSH-EMP'}</Text>
          </View>
          <View style={styles.rightHeaderGroup}>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>{currentUser.role.replace('_', ' ').toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={refreshData} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Text style={styles.refreshBtnText}>↻ Refresh</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview Tab Stats */}
        <Text style={styles.sectionHeading}>Overview & Attendance Stats</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderLeftColor: Colors.primary }]}>
            <Text style={styles.statLabel}>Total Attended Programs</Text>
            <Text style={[styles.statValue, { color: Colors.primary }]}>
              {attendedPrograms.length}
            </Text>
          </View>

          <View style={[styles.statBox, { borderLeftColor: Colors.secondary }]}>
            <Text style={styles.statLabel}>Currently Active</Text>
            <Text style={[styles.statValue, { color: Colors.secondary }]}>
              {activeCount}
            </Text>
          </View>

          <View style={[styles.statBox, { borderLeftColor: Colors.success }]}>
            <Text style={styles.statLabel}>Successfully Completed</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>
              {completedCount}
            </Text>
          </View>
        </View>

        {/* Attended Programs List with Role in that Program */}
        <Text style={[styles.sectionHeading, { marginTop: 24 }]}>
          My Attended Field Programs
        </Text>

        {attendedPrograms.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              You have not been assigned to any programs yet. When a Program Controller selects
              you for a team, it will appear here in real time.
            </Text>
          </View>
        ) : (
          attendedPrograms.map(prog => {
            const isController = prog.controllerId === currentUser.id;
            return (
              <View key={prog.id} style={styles.programCard}>
                <View style={styles.progHeaderRow}>
                  <Text style={styles.progTitle}>{prog.programName}</Text>
                  <View
                    style={[
                      styles.roleInProgBadge,
                      isController ? styles.controllerBadge : styles.memberBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleInProgText,
                        isController ? styles.controllerText : styles.memberText,
                      ]}
                    >
                      {isController ? 'PROGRAM CONTROLLER' : 'TEAM MEMBER'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.progLocation}>{prog.hatcheryOrFarmName}</Text>

                <View style={styles.detailsRow}>
                  <Text style={styles.metaItem}>
                    Flock: {prog.flockSize.toLocaleString()} birds
                  </Text>
                  <Text style={styles.metaItem}>
                    Status: <Text style={styles.statusBold}>{prog.status.toUpperCase()}</Text>
                  </Text>
                </View>

                <Text style={styles.dateMeta}>
                  Scheduled: {prog.scheduledStartDate} ({prog.scheduledStartTime} - {prog.scheduledEndTime})
                </Text>

                {prog.completionMetrics && (
                  <View style={styles.metricsBox}>
                    <Text style={styles.metricsTitle}>Vaccination & Cold-Chain Records:</Text>
                    <Text style={styles.metricsText}>
                      • Birds Vaccinated: {prog.completionMetrics.birdsVaccinated.toLocaleString()}
                    </Text>
                    <Text style={styles.metricsText}>
                      • Vaccine: {prog.completionMetrics.vaccineType} (Batch: {prog.completionMetrics.batchNumber})
                    </Text>
                    <Text style={styles.metricsText}>
                      • Cold Chain Log: {prog.completionMetrics.coldChainTempCelsius}°C
                    </Text>
                  </View>
                )}

                {prog.auditorRemarks ? (
                  <View style={styles.remarksBox}>
                    <Text style={styles.remarksTitle}>
                      Auditor Remarks ({prog.auditorName}):
                    </Text>
                    <Text style={styles.remarksText}>"{prog.auditorRemarks}"</Text>
                    {prog.auditScore ? (
                      <Text style={styles.scorePill}>Score: {prog.auditScore}/100</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  content: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    gap: 12,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  employeeName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 2,
  },
  employeeCode: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  rightHeaderGroup: {
    alignItems: 'flex-end',
    gap: 8,
  },
  roleTag: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  roleTagText: {
    color: '#0369A1',
    fontWeight: '800',
    fontSize: 10,
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  statBox: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  programCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
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
  roleInProgBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleInProgText: {
    fontSize: 9,
    fontWeight: '800',
  },
  controllerBadge: {
    backgroundColor: '#FEF3C7',
  },
  controllerText: {
    color: '#B45309',
    fontSize: 9,
    fontWeight: '800',
  },
  memberBadge: {
    backgroundColor: '#DCFCE7',
  },
  memberText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: '800',
  },
  progLocation: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  metaItem: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
  dateMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  metricsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    gap: 2,
  },
  metricsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  metricsText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  remarksBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 2,
  },
  remarksTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  remarksText: {
    fontSize: 12,
    color: '#166534',
    fontStyle: 'italic',
  },
  scorePill: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
});
