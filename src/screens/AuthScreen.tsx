import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { Colors } from '../constants/colors';
import { UserProfile, UserRole } from '../types';
import { dataProvider, mockStore } from '../services/supabase';
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
  const [employeeCode, setEmployeeCode] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('employee');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter both work email and password',
      });
      return;
    }

    setLoading(true);
    try {
      const { user, error } = await dataProvider.signInWithEmail(email, password);

      if (error || !user) {
        Toast.show({
          type: 'error',
          text1: 'Sign In Failed',
          text2: error || 'Invalid email or password',
        });
        setLoading(false);
        return;
      }

      if (user.status === 'pending') {
        Toast.show({
          type: 'info',
          text1: 'Account Pending Approval',
          text2: 'Your account is currently awaiting Admin approval.',
        });
        setLoading(false);
        onRegisteredPending(user);
        return;
      }

      if (user.status === 'rejected') {
        Toast.show({
          type: 'error',
          text1: 'Access Denied',
          text2: 'This account was declined by the administrator.',
        });
        setLoading(false);
        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: `Signed in as ${user.fullName}`,
      });
      setLoading(false);
      onLoginSuccess(user);
    } catch (err: any) {
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: err?.message || 'Failed to authenticate',
      });
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please provide full name, work email, and password.',
      });
      return;
    }

    setLoading(true);
    try {
      const { user, error } = await dataProvider.signUpWithEmail(email, password, {
        fullName: fullName.trim(),
        role: selectedRole,
        phone: phone.trim() || undefined,
        employeeCode: employeeCode.trim() || undefined,
      });

      if (error || !user) {
        Toast.show({
          type: 'error',
          text1: 'Registration Failed',
          text2: error || 'Could not complete registration',
        });
        setLoading(false);
        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Registration Submitted',
        text2: 'Account awaiting Administrator review.',
      });

      setLoading(false);
      onRegisteredPending(user);
    } catch (err: any) {
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Registration Error',
        text2: err?.message || 'Failed to register account',
      });
    }
  };

  const handleGoogleOAuth = async () => {
    setLoading(true);
    try {
      const { error } = await dataProvider.signInWithGoogle();
      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Google OAuth Error',
          text2: error,
        });
        setLoading(false);
        return;
      }

      const user = dataProvider.getCurrentUser();
      if (user) {
        Toast.show({
          type: 'success',
          text1: 'Google Workspace Verified',
          text2: `Signed in as ${user.fullName}`,
        });
        setLoading(false);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Google Sign-In Error',
        text2: err?.message || 'Failed to authenticate with Google',
      });
    }
  };

  const quickLoginAs = (userRole: UserRole) => {
    const user = mockStore.getUsers().find(u => u.role === userRole && u.status === 'approved');
    if (user) {
      dataProvider.setCurrentUser(user);
      Toast.show({
        type: 'success',
        text1: `Demo Login: ${user.fullName}`,
        text2: `Role: ${user.role.toUpperCase()}`,
      });
      onLoginSuccess(user);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <MarushLogo size="md" variant="full" showSubtitle={false} />

        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, isLoginTab && styles.activeTabButton]}
            onPress={() => setIsLoginTab(true)}
            disabled={loading}
          >
            <Text style={[styles.tabButtonText, isLoginTab && styles.activeTabText]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, !isLoginTab && styles.activeTabButton]}
            onPress={() => setIsLoginTab(false)}
            disabled={loading}
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
                editable={!loading}
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
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleOAuth}
              disabled={loading}
            >
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
                editable={!loading}
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
                editable={!loading}
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
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Employee Code (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. MRSH-EMP-105"
                placeholderTextColor={Colors.textMuted}
                value={employeeCode}
                onChangeText={setEmployeeCode}
                autoCapitalize="characters"
                editable={!loading}
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
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Requested Role (Default: Employee)</Text>
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
                    disabled={loading}
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

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Submit for Admin Approval</Text>
              )}
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
  buttonDisabled: {
    opacity: 0.7,
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
