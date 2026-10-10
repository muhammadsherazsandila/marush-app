import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { Colors } from './src/constants/colors';
import { UserProfile } from './src/types';
import { mockStore } from './src/services/supabase';

import { Navbar } from './src/components/Navbar';
import { LaunchScreen } from './src/screens/LaunchScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { PendingApprovalScreen } from './src/screens/PendingApprovalScreen';
import { AdminDashboard } from './src/screens/AdminDashboard';
import { ProgramControllerDashboard } from './src/screens/ProgramControllerDashboard';
import { ProgramAuditorDashboard } from './src/screens/ProgramAuditorDashboard';
import { EmployeeDashboard } from './src/screens/EmployeeDashboard';

export default function App() {
  const [isLaunching, setIsLaunching] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(mockStore.getCurrentUser());

  const handleLogout = () => {
    mockStore.setCurrentUser(null);
    setCurrentUser(null);
    Toast.show({
      type: 'info',
      text1: 'Signed Out',
      text2: 'Session closed.',
    });
  };

  const renderDashboardByRole = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case 'admin':
        return <AdminDashboard currentUser={currentUser} />;
      case 'program_controller':
        return <ProgramControllerDashboard currentUser={currentUser} />;
      case 'program_auditor':
        return <ProgramAuditorDashboard currentUser={currentUser} />;
      case 'employee':
      default:
        return <EmployeeDashboard currentUser={currentUser} />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="dark" backgroundColor={Colors.background} />

        {isLaunching ? (
          <LaunchScreen onFinishLaunch={() => setIsLaunching(false)} />
        ) : !currentUser ? (
          <AuthScreen
            onLoginSuccess={user => setCurrentUser(user)}
            onRegisteredPending={user => setCurrentUser(user)}
          />
        ) : currentUser.status === 'pending' ? (
          <PendingApprovalScreen
            user={currentUser}
            onApproved={approvedUser => setCurrentUser(approvedUser)}
            onBackToLogin={handleLogout}
          />
        ) : (
          <View style={styles.mainLayout}>
            <Navbar user={currentUser} onLogout={handleLogout} />
            <View style={styles.contentArea}>{renderDashboardByRole()}</View>
          </View>
        )}

        <Toast />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mainLayout: {
    flex: 1,
  },
  contentArea: {
    flex: 1,
  },
});
