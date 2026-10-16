import './global.css';
import React, { useState, useEffect } from 'react';
import { Alert, AppState, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

import { UserProfile } from './src/types';
import { dataProvider, getSupabaseClient, isSupabaseConfigured } from './src/services';

import { Navbar } from './src/components/Navbar';
import { LaunchScreen } from './src/screens/LaunchScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { PendingApprovalScreen } from './src/screens/PendingApprovalScreen';
import { AdminDashboard } from './src/screens/AdminDashboard';
import { ProgramControllerDashboard } from './src/screens/ProgramControllerDashboard';
import { ProgramAuditorDashboard } from './src/screens/ProgramAuditorDashboard';
import { EmployeeDashboard } from './src/screens/EmployeeDashboard';
import { MarushLogo } from './src/components/MarushLogo';
import { BottomTabBar, WorkspaceTab } from './src/components/BottomTabBar';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { checkForAppUpdate } from './src/services/appUpdate';

export default function App() {
  const [isLaunching, setIsLaunching] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(dataProvider.getCurrentUser());
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');

  useEffect(() => {
    // Restore the user profile synchronized with the current Supabase session.
    setCurrentUser(dataProvider.getCurrentUser());

    // If Supabase is configured, listen for auth session changes (including OAuth redirects)
    if (isSupabaseConfigured) {
      // 1. Direct Web OAuth redirect parser (hash fragments or query code)
      if (typeof window !== 'undefined' && window.location) {
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          const p: Record<string, string> = {};
          hash.substring(1).split('&').forEach(part => {
            const [k, v] = part.split('=');
            if (k && v) p[k] = decodeURIComponent(v);
          });

          if (p.access_token && p.refresh_token) {
            getSupabaseClient().auth.setSession({
              access_token: p.access_token,
              refresh_token: p.refresh_token,
            }).then(async ({ data: sData, error: sErr }) => {
              if (!sErr && sData?.user) {
                const u = await dataProvider.syncProfileForAuthUser(sData.user);
                if (u) {
                  setCurrentUser(u);
                  setIsLaunching(false);
                }
              }
              if (window.history?.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            });
          }
        }
      }

      // 2. Initial check for active session in client storage
      getSupabaseClient().auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const user = await dataProvider.syncProfileForAuthUser(session.user);
          if (user) {
            setCurrentUser(user);
            setIsLaunching(false);
          }
        }
      });

      // 3. Auth state changes listener (sign in, OAuth callback, sign out)
      const { data: authListener } = getSupabaseClient().auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const user = await dataProvider.syncProfileForAuthUser(session.user);
          if (user) {
            setCurrentUser(user);
            setIsLaunching(false);
          }
        } else if (_event === 'SIGNED_OUT') {
          setCurrentUser(null);
        }
      });

      // 4. Deep link listener for mobile OAuth return
      const handleDeepLink = async (event: { url: string }) => {
        const url = event.url;
        if (!url) return;

        const hashIndex = url.indexOf('#');
        const queryIndex = url.indexOf('?');
        if (hashIndex === -1 && queryIndex === -1) return;

        const params: Record<string, string> = {};

        if (hashIndex !== -1) {
          const hashStr = url.substring(hashIndex + 1);
          hashStr.split('&').forEach(part => {
            const [k, v] = part.split('=');
            if (k && v) params[k] = decodeURIComponent(v);
          });
        }

        if (queryIndex !== -1) {
          const queryPart =
            hashIndex !== -1 && hashIndex > queryIndex
              ? url.substring(queryIndex + 1, hashIndex)
              : url.substring(queryIndex + 1);
          queryPart.split('&').forEach(part => {
            const [k, v] = part.split('=');
            if (k && v) params[k] = decodeURIComponent(v);
          });
        }

        if (params.access_token && params.refresh_token) {
          const { data: sData } = await getSupabaseClient().auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sData?.user) {
            const user = await dataProvider.syncProfileForAuthUser(sData.user);
            if (user) {
              setCurrentUser(user);
              setIsLaunching(false);
            }
          }
        } else if (params.code) {
          const { data: sData } = await getSupabaseClient().auth.exchangeCodeForSession(params.code);
          if (sData?.user) {
            const user = await dataProvider.syncProfileForAuthUser(sData.user);
            if (user) {
              setCurrentUser(user);
              setIsLaunching(false);
            }
          }
        }
      };

      // AuthSession owns the active OAuth browser session and consumes its
      // return link. Keep initial-URL handling for launches restored from a
      // completed auth callback, without racing AuthSession's code exchange.
      Linking.getInitialURL().then(initialUrl => {
        if (initialUrl) handleDeepLink({ url: initialUrl });
      });

      return () => {
        authListener?.subscription.unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    checkForAppUpdate()
      .then((update) => {
        if (!update) return;

        Alert.alert(
          'Update available',
          `Marush ${update.version} is ready to download.\n\n${update.notes}`,
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Download',
              onPress: () => {
                Linking.openURL(update.downloadUrl).catch(() => {
                  Alert.alert(
                    'Unable to open download',
                    `Please download the update from ${update.releaseUrl}.`,
                  );
                });
              },
            },
          ],
        );
      })
      .catch((error) => {
        console.warn('[App Update] Could not check for updates:', error);
      });
  }, []);

  // Live-sync profile when admin changes the user's role/status via Supabase Realtime.
  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser) return;

    const channel = getSupabaseClient()
      .channel(`profile-sync-${currentUser.id}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUser.id}`,
        },
        async () => {
          const refreshed = await dataProvider.refreshCurrentUserProfile();
          if (refreshed) setCurrentUser(refreshed);
        },
      )
      .subscribe();

    return () => {
      getSupabaseClient().removeChannel(channel);
    };
  }, [currentUser?.id]);

  // Re-fetch profile when the app returns to foreground (fallback for missed realtime events).
  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser) return;

    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'active') {
        const refreshed = await dataProvider.refreshCurrentUserProfile();
        if (refreshed) setCurrentUser(refreshed);
      }
    });

    return () => subscription.remove();
  }, [currentUser?.id]);

  const handleLogout = async () => {
    await dataProvider.signOut();
    setCurrentUser(null);
    setActiveTab('overview');
    Toast.show({
      type: 'info',
      text1: 'Signed Out',
      text2: 'Session closed securely.',
    });
  };

  const renderDashboardByRole = (tab: Exclude<WorkspaceTab, 'profile'>) => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case 'admin':
        return <AdminDashboard currentUser={currentUser} activeArea={tab} />;
      case 'program_controller':
        return <ProgramControllerDashboard currentUser={currentUser} activeArea={tab} />;
      case 'program_auditor':
        return <ProgramAuditorDashboard currentUser={currentUser} activeArea={tab} />;
      case 'employee':
      default:
        return <EmployeeDashboard currentUser={currentUser} activeArea={tab} />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-marush-background" edges={['top', 'bottom']}>
        <StatusBar style="dark" />

        {!isSupabaseConfigured ? (
          <View className="flex-1 items-center justify-center bg-marush-background px-8">
            <MarushLogo size="lg" variant="full" showSubtitle />
            <Text className="mt-8 text-center text-[22px] font-bold text-marush-primary">Service unavailable</Text>
            <Text className="mt-2.5 max-w-[380px] text-center text-[15px] leading-[23px] text-marush-muted">
              This application has not been configured. Contact your IT administrator.
            </Text>
          </View>
        ) : isLaunching ? (
          <LaunchScreen onFinishLaunch={() => setIsLaunching(false)} />
        ) : !currentUser ? (
          <AuthScreen
            onLoginSuccess={user => { setActiveTab('overview'); setCurrentUser(user); }}
            onRegisteredPending={user => { setActiveTab('overview'); setCurrentUser(user); }}
          />
        ) : currentUser.status === 'pending' || currentUser.status === 'rejected' ? (
          <PendingApprovalScreen
            user={currentUser}
            onApproved={approvedUser => setCurrentUser(approvedUser)}
            onBackToLogin={handleLogout}
          />
        ) : (
          <View className="flex-1">
            <Navbar />
            <View className="flex-1">
              {activeTab === 'profile' ? (
                <ProfileScreen user={currentUser} onLogout={handleLogout} />
              ) : renderDashboardByRole(activeTab)}
            </View>
            <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
          </View>
        )}

        <Toast />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

