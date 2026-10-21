import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  Alert,
  AppState,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import "./global.css";

WebBrowser.maybeCompleteAuthSession();

import {
  dataProvider,
  getSupabaseClient,
  isSupabaseConfigured,
} from "./src/services";
import { UserProfile } from "./src/types";

import { ArrowLeft } from "lucide-react-native";
import { BottomTabBar, WorkspaceTab } from "./src/components/BottomTabBar";
import { MarushLogo } from "./src/components/MarushLogo";
import { Navbar } from "./src/components/Navbar";
import { WorkspaceSidebar } from "./src/components/WorkspaceSidebar";
import { Colors } from "./src/constants/colors";
import { Radii, Spacing, Type } from "./src/constants/design";
import { AdminDashboard } from "./src/screens/AdminDashboard";
import { AuthScreen } from "./src/screens/AuthScreen";
import { EmployeeDashboard } from "./src/screens/EmployeeDashboard";
import { LaunchScreen } from "./src/screens/LaunchScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { OperationsHome } from "./src/screens/OperationsHome";
import { PendingApprovalScreen } from "./src/screens/PendingApprovalScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { ProgramAuditorDashboard } from "./src/screens/ProgramAuditorDashboard";
import { ProgramControllerDashboard } from "./src/screens/ProgramControllerDashboard";
import { ProgramDetail } from "./src/screens/ProgramDetail";
import { checkForAppUpdate } from "./src/services/appUpdate";

export default function App() {
  const { width } = useWindowDimensions();
  const [isLaunching, setIsLaunching] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(
    dataProvider.getCurrentUser(),
  );
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [selectedProgram, setSelectedProgram] = useState<
    import("./src/types").Program | null
  >(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    setCurrentUser(dataProvider.getCurrentUser());

    if (isSupabaseConfigured) {
      if (typeof window !== "undefined" && window.location) {
        const hash = window.location.hash;
        if (hash && hash.includes("access_token")) {
          const p: Record<string, string> = {};
          hash
            .substring(1)
            .split("&")
            .forEach((part) => {
              const [k, v] = part.split("=");
              if (k && v) p[k] = decodeURIComponent(v);
            });

          if (p.access_token && p.refresh_token) {
            getSupabaseClient()
              .auth.setSession({
                access_token: p.access_token,
                refresh_token: p.refresh_token,
              })
              .then(async ({ data: sData, error: sErr }) => {
                if (!sErr && sData?.user) {
                  const u = await dataProvider.syncProfileForAuthUser(
                    sData.user,
                  );
                  if (u) {
                    setCurrentUser(u);
                    setIsLaunching(false);
                  }
                }
                if (window.history?.replaceState) {
                  window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname,
                  );
                }
              });
          }
        }
      }

      getSupabaseClient()
        .auth.getSession()
        .then(async ({ data: { session } }) => {
          if (session?.user) {
            const user = await dataProvider.syncProfileForAuthUser(
              session.user,
            );
            if (user) {
              setCurrentUser(user);
              setIsLaunching(false);
            }
          }
        });

      const { data: authListener } = getSupabaseClient().auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user) {
            const user = await dataProvider.syncProfileForAuthUser(
              session.user,
            );
            if (user) {
              setCurrentUser(user);
              setIsLaunching(false);
            }
          } else if (_event === "SIGNED_OUT") {
            setCurrentUser(null);
          }
        },
      );

      const handleDeepLink = async (event: { url: string }) => {
        const url = event.url;
        if (!url) return;

        const hashIndex = url.indexOf("#");
        const queryIndex = url.indexOf("?");
        if (hashIndex === -1 && queryIndex === -1) return;

        const params: Record<string, string> = {};

        if (hashIndex !== -1) {
          const hashStr = url.substring(hashIndex + 1);
          hashStr.split("&").forEach((part) => {
            const [k, v] = part.split("=");
            if (k && v) params[k] = decodeURIComponent(v);
          });
        }

        if (queryIndex !== -1) {
          const queryPart =
            hashIndex !== -1 && hashIndex > queryIndex
              ? url.substring(queryIndex + 1, hashIndex)
              : url.substring(queryIndex + 1);
          queryPart.split("&").forEach((part) => {
            const [k, v] = part.split("=");
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
          const { data: sData } =
            await getSupabaseClient().auth.exchangeCodeForSession(params.code);
          if (sData?.user) {
            const user = await dataProvider.syncProfileForAuthUser(sData.user);
            if (user) {
              setCurrentUser(user);
              setIsLaunching(false);
            }
          }
        }
      };

      Linking.getInitialURL().then((initialUrl) => {
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
          "Update available",
          `Marush ${update.version} is ready to download.\n\n${update.notes}`,
          [
            { text: "Later", style: "cancel" },
            {
              text: "Download",
              onPress: () => {
                Linking.openURL(update.downloadUrl).catch(() => {
                  Alert.alert(
                    "Unable to open download",
                    `Please download the update from ${update.releaseUrl}.`,
                  );
                });
              },
            },
          ],
        );
      })
      .catch((error) => {
        console.warn("[App Update] Could not check for updates:", error);
      });
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser) return;

    const channel = getSupabaseClient()
      .channel(`profile-sync-${currentUser.id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
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

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser) return;

    const subscription = AppState.addEventListener(
      "change",
      async (nextState) => {
        if (nextState === "active") {
          const refreshed = await dataProvider.refreshCurrentUserProfile();
          if (refreshed) setCurrentUser(refreshed);
        }
      },
    );

    return () => subscription.remove();
  }, [currentUser?.id]);

  const handleLogout = async () => {
    await dataProvider.signOut();
    setCurrentUser(null);
    setActiveTab("overview");
    Toast.show({
      type: "info",
      text1: "Logged out",
      text2: "Your session was closed securely.",
    });
  };

  const handleCurrentAccountDeleted = () => {
    setCurrentUser(null);
    setActiveTab("overview");
    setSelectedProgram(null);
    setShowNotifications(false);
  };

  const handleTabChange = (tab: WorkspaceTab) => {
    setShowNotifications(false);
    setSelectedProgram(null);
    setActiveTab(tab);
  };

  const renderDashboardByRole = (
    tab: Exclude<WorkspaceTab, "profile" | "employees">,
  ) => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case "admin":
        return (
          <AdminDashboard
            currentUser={currentUser}
            activeArea={tab}
            onSelfDeleted={handleCurrentAccountDeleted}
            onOpenProgram={(program) => setSelectedProgram(program)}
          />
        );
      case "program_controller":
        return (
          <ProgramControllerDashboard
            currentUser={currentUser}
            activeArea={tab}
          />
        );
      case "program_auditor":
        return (
          <ProgramAuditorDashboard currentUser={currentUser} activeArea={tab} />
        );
      case "employee":
      default:
        return <EmployeeDashboard currentUser={currentUser} activeArea={tab} />;
    }
  };

  return (
    <SafeAreaProvider>
      {/* FORCED DARK BACKGROUND ON THE ROOT WRAPPER */}
      <SafeAreaView
        style={{ flex: 1, backgroundColor: Colors.surface }}
        edges={["top", "bottom"]}
      >
        <StatusBar style="light" />

        {!isSupabaseConfigured ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: Colors.surface,
              paddingHorizontal: 32,
            }}
          >
            <MarushLogo size="lg" variant="full" showSubtitle theme="dark" />
            <Text
              style={{
                marginTop: 32,
                textAlign: "center",
                fontSize: 22,
                fontWeight: "700",
                color: Colors.accent,
              }}
            >
              Service unavailable
            </Text>
            <Text
              style={{
                marginTop: 10,
                maxWidth: 380,
                textAlign: "center",
                fontSize: 15,
                lineHeight: 23,
                color: Colors.textSecondary,
              }}
            >
              This application has not been configured. Contact your IT
              administrator.
            </Text>
          </View>
        ) : isLaunching ? (
          <LaunchScreen onFinishLaunch={() => setIsLaunching(false)} />
        ) : !currentUser ? (
          <AuthScreen
            onLoginSuccess={(user) => {
              setActiveTab("overview");
              setCurrentUser(user);
            }}
            onRegisteredPending={(user) => {
              setActiveTab("overview");
              setCurrentUser(user);
            }}
          />
        ) : currentUser.status === "pending" ||
          currentUser.status === "rejected" ? (
          <PendingApprovalScreen
            user={currentUser}
            onApproved={(approvedUser) => setCurrentUser(approvedUser)}
            onBackToLogin={handleLogout}
          />
        ) : (
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              backgroundColor: Colors.surface,
            }}
          >
            {width >= 768 && (
              <WorkspaceSidebar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                onLogout={handleLogout}
                userRole={currentUser.role}
              />
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Navbar
                title={
                  showNotifications
                    ? "Notifications"
                    : selectedProgram
                      ? "Program detail"
                      : activeTab === "profile"
                        ? "Account & security"
                        : activeTab === "programs"
                          ? "Programs"
                          : "Overview"
                }
                onBack={
                  showNotifications
                    ? () => setShowNotifications(false)
                    : selectedProgram
                      ? () => setSelectedProgram(null)
                      : undefined
                }
                onNotifications={() => setShowNotifications(true)}
              />

              {/* Back to overview pill */}
              {activeTab !== "overview" &&
                activeTab !== "employees" &&
                width < 768 && (
                  <View
                    style={{
                      paddingHorizontal: Spacing.lg,
                      paddingTop: Spacing.md,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => setActiveTab("overview")}
                      accessibilityRole="button"
                      accessibilityLabel="Back to overview"
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: Spacing.sm,
                        alignSelf: "flex-start",
                        paddingHorizontal: Spacing.md + 2,
                        paddingVertical: Spacing.sm,
                        borderRadius: Radii.pill,
                        borderWidth: 1,
                        borderColor: Colors.border,
                        backgroundColor: Colors.surfaceCard,
                      }}
                    >
                      <ArrowLeft size={16} color={Colors.accent} />
                      <Text
                        style={{
                          ...Type.caption,
                          fontWeight: "700",
                          color: Colors.accent,
                        }}
                      >
                        Overview
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              <View style={{ flex: 1 }}>
                {showNotifications ? (
                  <NotificationsScreen
                    onBack={() => setShowNotifications(false)}
                  />
                ) : selectedProgram ? (
                  <ProgramDetail
                    program={selectedProgram}
                    onBack={() => setSelectedProgram(null)}
                  />
                ) : activeTab === "profile" ? (
                  <ProfileScreen user={currentUser} onLogout={handleLogout} />
                ) : activeTab === "employees" &&
                  currentUser.role === "admin" ? (
                  <AdminDashboard
                    currentUser={currentUser}
                    activeArea="employees"
                    onSelfDeleted={handleCurrentAccountDeleted}
                  />
                ) : activeTab === "overview" ? (
                  currentUser.role === "program_auditor" ? (
                    <ProgramAuditorDashboard
                      currentUser={currentUser}
                      activeArea="overview"
                      onSelectProgram={(program) => {
                        setActiveTab("overview");
                        setSelectedProgram(program);
                      }}
                    />
                  ) : (
                    <OperationsHome
                      currentUser={currentUser}
                      onOpenPrograms={() => setActiveTab("programs")}
                      onOpenProfile={() => setActiveTab("profile")}
                      onOpenProgram={(program) => {
                        setActiveTab("overview");
                        setSelectedProgram(program);
                      }}
                    />
                  )
                ) : (
                  renderDashboardByRole(
                    activeTab === "programs" ? "programs" : "overview",
                  )
                )}
              </View>
              {width < 768 && (
                <BottomTabBar
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                  isAdmin={currentUser.role === "admin"}
                  userRole={currentUser.role}
                />
              )}
            </View>
          </View>
        )}

        <Toast />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
