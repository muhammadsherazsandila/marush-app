import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { UserProfile } from '../types';
import { MarushLogo } from './MarushLogo';

interface NavbarProps {
  user: UserProfile;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', bg: Colors.accent, text: '#FFF' };
      case 'program_controller':
        return { label: 'Controller', bg: Colors.secondary, text: '#FFF' };
      case 'program_auditor':
        return { label: 'Auditor', bg: '#8B5CF6', text: '#FFF' };
      default:
        return { label: 'Employee', bg: Colors.primaryLight, text: '#FFF' };
    }
  };

  const badge = getRoleBadge(user.role);

  return (
    <View style={styles.container}>
      <View style={styles.brandGroup}>
        <MarushLogo size="sm" variant="mark" />
        <View style={styles.titleWrapper}>
          <Text style={styles.brandTitle}>MARUSH</Text>
          <Text style={styles.brandSub}>Ceva Sole Distributor</Text>
        </View>
      </View>

      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {user.fullName}
          </Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>
              {badge.label}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
          accessibilityLabel="Sign out"
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleWrapper: {
    marginLeft: 8,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    maxWidth: 140,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F8FAFC',
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
