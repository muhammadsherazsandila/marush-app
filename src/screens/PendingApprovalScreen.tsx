import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { Colors } from '../constants/colors';
import { UserProfile } from '../types';
import { dataProvider } from '../services/supabase';
import { MarushLogo } from '../components/MarushLogo';

interface PendingApprovalScreenProps {
  user: UserProfile;
  onApproved: (updatedUser: UserProfile) => void;
  onBackToLogin: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  user,
  onApproved,
  onBackToLogin,
}) => {
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const refreshed = await dataProvider.getUserById(user.id);
      setChecking(false);

      if (!refreshed) {
        Toast.show({
          type: 'error',
          text1: 'Account Error',
          text2: 'Account record could not be found.',
        });
        return;
      }

      if (refreshed.status === 'approved') {
        Toast.show({
          type: 'success',
          text1: 'Account Approved!',
          text2: `Welcome to Marush, ${refreshed.fullName}`,
        });
        dataProvider.setCurrentUser(refreshed);
        onApproved(refreshed);
      } else if (refreshed.status === 'rejected') {
        Toast.show({
          type: 'error',
          text1: 'Registration Declined',
          text2: 'Administrator declined this registration request.',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Status: Pending',
          text2: 'Awaiting Administrator verification and approval.',
        });
      }
    } catch (err: any) {
      setChecking(false);
      Toast.show({
        type: 'error',
        text1: 'Verification Check Failed',
        text2: err?.message || 'Network error checking status',
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <MarushLogo size="sm" variant="mark" />

        <View style={styles.badge}>
          <Text style={styles.badgeText}>AWAITING ADMIN APPROVAL</Text>
        </View>

        <Text style={styles.title}>Registration Under Review</Text>
        <Text style={styles.description}>
          Thank you, <Text style={styles.bold}>{user.fullName}</Text>. Your request to join
          Marush as a <Text style={styles.bold}>{user.role.toUpperCase()}</Text> has been
          submitted to the Administrator.
        </Text>

        <View style={styles.infoBox}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Email:</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Requested Role:</Text>
            <Text style={styles.infoValue}>{user.role.replace('_', ' ').toUpperCase()}</Text>
          </View>
          {user.employeeCode ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Employee Code:</Text>
              <Text style={styles.infoValue}>{user.employeeCode}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Current Status:</Text>
            <Text style={styles.statusPending}>PENDING APPROVAL</Text>
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>WHAT HAPPENS NEXT?</Text>
          <Text style={styles.noteText}>
            The system administrator verifies employee credentials and assigns proper access permissions before activation.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.refreshButton, checking && styles.buttonDisabled]}
          onPress={checkStatus}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.refreshButtonText}>Check Approval Status</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={onBackToLogin}
          disabled={checking}
        >
          <Text style={styles.backButtonText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 16,
  },
  badgeText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  bold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusPending: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  noteBox: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  noteTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    width: '100%',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  backButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
