import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { Colors } from '../constants/colors';
import { UserProfile } from '../types';
import { mockStore } from '../services/supabase';
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
  const checkStatus = () => {
    const refreshed = mockStore.getUserById(user.id);
    if (!refreshed) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Account could not be found.',
      });
      return;
    }

    if (refreshed.status === 'approved') {
      Toast.show({
        type: 'success',
        text1: 'Account Approved!',
        text2: `Welcome to Marush, ${refreshed.fullName}`,
      });
      mockStore.setCurrentUser(refreshed);
      onApproved(refreshed);
    } else {
      Toast.show({
        type: 'info',
        text1: 'Still Pending',
        text2: 'Administrator has not yet approved this registration.',
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
          <Text style={styles.infoLabel}>Account Email:</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
          <Text style={styles.infoLabel}>Role Requested:</Text>
          <Text style={styles.infoValue}>{user.role.replace('_', ' ').toUpperCase()}</Text>
          <Text style={styles.infoLabel}>Current Status:</Text>
          <Text style={styles.statusPending}>PENDING VERIFICATION</Text>
        </View>

        <TouchableOpacity style={styles.refreshButton} onPress={checkStatus}>
          <Text style={styles.refreshButtonText}>Check Approval Status</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={onBackToLogin}>
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
    paddingVertical: 4,
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
    marginVertical: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
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
    marginBottom: 6,
  },
  statusPending: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  refreshButton: {
    backgroundColor: Colors.primary,
    width: '100%',
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
