import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Colors } from '../constants/colors';
import { UserProfile, UserRole } from '../types';
import { mockStore } from '../services/supabase';
import { MarushLogo } from '../components/MarushLogo';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  onRegisteredPending: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onRegisteredPending,
}) => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee');

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter both email and password',
      });
      return;
    }

    const users = mockStore.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      Toast.show({
        type: 'error',
        text1: 'Account Not Found',
        text2: 'No account registered with this email.',
      });
      return;
    }

    if (user.status === 'pending') {
      Toast.show({
        type: 'info',
        text1: 'Account Pending Approval',
        text2: 'Your account is awaiting Administrator verification.',
      });
      onRegisteredPending(user);
      return;
    }

    if (user.status === 'rejected') {
      Toast.show({
        type: 'error',
        text1: 'Access Denied',
        text2: 'This account was rejected by the administrator.',
      });
      return;
    }

    Toast.show({
      type: 'success',
      text1: 'Welcome back!',
      text2: `Logged in as ${user.fullName}`,
    });
    mockStore.setCurrentUser(user);
    onLoginSuccess(user);
  };

  const handleRegister = () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please provide full name, email, and password.',
      });
      return;
    }

    const existing = mockStore.getUsers().find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      Toast.show({
        type: 'error',
        text1: 'Account Exists',
        text2: 'An account with this email already exists.',
      });
      return;
    }

    const newUser = mockStore.addUser({
      email: email.trim(),
      fullName: fullName.trim(),
      role: selectedRole,
      status: 'pending', // Account sent to admin for approval
      phone: phone.trim() || undefined,
      employeeCode: `MRSH-${Math.floor(100 + Math.random() * 900)}`,
    });

    Toast.show({
      type: 'success',
      text1: 'Registration Submitted',
      text2: 'Sent to Administrator for review and approval.',
    });

    onRegisteredPending(newUser);
  };

  const handleGoogleOAuth = () => {
    Toast.show({
      type: 'info',
      text1: 'Google OAuth 2.0',
      text2: 'Connecting via Google Workspace OAuth...',
    });
    setTimeout(() => {
      const demoUser = mockStore.getUsers()[0];
      mockStore.setCurrentUser(demoUser);
      onLoginSuccess(demoUser);
    }, 800);
  };

  const quickLoginAs = (userRole: UserRole) => {
    const user = mockStore.getUsers().find(u => u.role === userRole && u.status === 'approved');
    if (user) {
      mockStore.setCurrentUser(user);
      Toast.show({
        type: 'success',
        text1: `Quick Login: ${user.fullName}`,
        text2: `Role: ${user.role.toUpperCase()}`,
      });
      onLoginSuccess(user);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.card}>
        <MarushLogo size="md" variant="full" showSubtitle={false} />

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, isLoginTab && styles.activeTabButton]}
            onPress={() => setIsLoginTab(true)}
          >
            <Text style={[styles.tabButtonText, isLoginTab && styles.activeTabText]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, !isLoginTab && styles.activeTabButton]}
            onPress={() => setIsLoginTab(false)}
          >
            <Text style={[styles.tabButtonText, !isLoginTab && styles.activeTabText]}>
              Register
            </Text>
          </TouchableOpacity>
        </View>

        {isLoginTab ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Work Email</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. employee@marush.com.pk"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleOAuth}>
              <Text style={styles.googleButtonText}>Continue with Google OAuth 2.0</Text>
            </TouchableOpacity>

            {/* Quick Demo Access Pills */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>DEMO QUICK-LOGIN:</Text>
              <View style={styles.demoPillsRow}>
                <TouchableOpacity
                  style={[styles.demoPill, { borderColor: Colors.accent }]}
                  onPress={() => quickLoginAs('admin')}
                >
                  <Text style={[styles.demoPillText, { color: Colors.accent }]}>Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.demoPill, { borderColor: Colors.secondary }]}
                  onPress={() => quickLoginAs('program_controller')}
                >
                  <Text style={[styles.demoPillText, { color: Colors.secondary }]}>Controller</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.demoPill, { borderColor: '#8B5CF6' }]}
                  onPress={() => quickLoginAs('program_auditor')}
                >
                  <Text style={[styles.demoPillText, { color: '#8B5CF6' }]}>Auditor</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.demoPill, { borderColor: Colors.primary }]}
                  onPress={() => quickLoginAs('employee')}
                >
                  <Text style={[styles.demoPillText, { color: Colors.primary }]}>Employee</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Dr. Muhammad Ali"
                placeholderTextColor={Colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Work Email</Text>
              <TextInput
                style={styles.input}
                placeholder="name@marush.com.pk"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone / WhatsApp</Text>
              <TextInput
                style={styles.input}
                placeholder="+92 300 1234567"
                placeholderTextColor={Colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Assign Role (Default: Employee)</Text>
              <View style={styles.roleGrid}>
                {[
                  { id: 'employee', label: 'Employee (Default)' },
                  { id: 'program_controller', label: 'Program Controller' },
                  { id: 'program_auditor', label: 'Program Auditor' },
                  { id: 'admin', label: 'Admin' },
                ].map(r => (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.roleChip,
                      selectedRole === r.id && styles.roleChipActive,
                    ]}
                    onPress={() => setSelectedRole(r.id as UserRole)}
                  >
                    <Text
                      style={[
                        styles.roleChipText,
                        selectedRole === r.id && styles.roleChipTextActive,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
              <Text style={styles.primaryButtonText}>Submit for Admin Approval</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
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
    padding: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.cardSubtle,
    borderRadius: 10,
    padding: 4,
    marginVertical: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: '#FAFAFA',
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#F8FAFC',
  },
  roleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  googleButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  googleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  demoSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  demoPillsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  demoPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
