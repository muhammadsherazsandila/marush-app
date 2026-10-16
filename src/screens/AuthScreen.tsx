import {
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { ClipPath, Defs, Path, Image as SvgImage } from "react-native-svg";
import Toast from "react-native-toast-message";
import { MarushLogo } from "../components/MarushLogo";
import { Colors } from "../constants/colors";
import { dataProvider } from "../services";
import { UserProfile, UserRole } from "../types";

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  onRegisteredPending: (user: UserProfile) => void;
}

type RequestedDesignation = Exclude<UserRole, "admin">;

const DESIGNATIONS: {
  value: RequestedDesignation;
  label: string;
  desc: string;
}[] = [
  {
    value: "employee",
    label: "Field Specialist (Vaccinator)",
    desc: "Execute field programs & report logs",
  },
  {
    value: "program_controller",
    label: "Program Controller",
    desc: "Plan schedules, assign teams & submit",
  },
  {
    value: "program_auditor",
    label: "Program Auditor",
    desc: "Inspect vaccination quality & verify flocks",
  },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onRegisteredPending,
}) => {
  const [designation, setDesignation] =
    useState<RequestedDesignation>("employee");
  const [designationOpen, setDesignationOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { user, error } = await dataProvider.signInWithGoogle(designation);
      if (error) {
        const isLocalhostPreviewError = error.startsWith(
          "Mobile browser preview is on localhost.",
        );
        Toast.show({
          type: "error",
          text1: isLocalhostPreviewError
            ? "Open the app in Expo Go"
            : "Google sign-in failed",
          text2: isLocalhostPreviewError
            ? "Use the LAN QR code, or sign in from the deployed HTTPS app."
            : error,
        });
        setLoading(false);
        return;
      }

      const authenticatedUser = user || dataProvider.getCurrentUser();
      if (!authenticatedUser) {
        setLoading(false);
        return;
      }

      if (authenticatedUser.status === "rejected") {
        Toast.show({
          type: "error",
          text1: "Access denied",
          text2: "Contact your administrator for assistance.",
        });
        setLoading(false);
        return;
      }

      if (authenticatedUser.status === "pending") {
        Toast.show({
          type: "info",
          text1: "Account under review",
          text2: "Your account was sent to an administrator for approval.",
        });
        setLoading(false);
        onRegisteredPending(authenticatedUser);
        return;
      }

      Toast.show({
        type: "success",
        text1: "Welcome back",
        text2: `Signed in as ${authenticatedUser.fullName}`,
      });
      setLoading(false);
      onLoginSuccess(authenticatedUser);
    } catch (error: any) {
      setLoading(false);
      Toast.show({
        type: "error",
        text1: "Google sign-in failed",
        text2:
          error?.message || "Please try again or contact your administrator.",
      });
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="flex-grow"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 bg-slate-50">
        {/* Header Art Background */}
        <View className="h-[400px] overflow-hidden bg-slate-50">
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 460 270"
            preserveAspectRatio="xMidYMid slice"
            pointerEvents="none"
            className="absolute inset-0"
          >
            <Defs>
              <ClipPath id="headerPhotoClip">
                <Path d="M0 0H460V138C383 176 321 161 229 166C144 170 78 193 0 236Z" />
              </ClipPath>
            </Defs>
            <SvgImage
              href={require("../../assets/bg.jpg")}
              x="0"
              y="0"
              width="460"
              height="270"
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#headerPhotoClip)"
            />
          </Svg>
          <View className="absolute left-6 top-8">
            <MarushLogo size="sm" variant="mark" />
          </View>
        </View>

        {/* Elevated Card Form */}
        <View className="mx-auto -mt-10 w-full max-w-[480px] px-5 pb-10">
          <View className="rounded-3xl border border-black/[0.07] bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <View className="items-center">
              <Text className="text-[26px] font-black tracking-tight text-slate-900">
                Welcome to Marush
              </Text>
              <Text className="mt-1 text-center text-sm font-medium text-slate-500">
                Poultry health, vaccination & biosecurity intelligence
              </Text>
              <View className="mt-3.5 flex-row items-center gap-1.5 rounded-full border border-black/[0.06] bg-slate-50 px-3 py-1">
                <ShieldCheck
                  size={13}
                  color={Colors.primary}
                  strokeWidth={2.4}
                />
                <Text className="text-[10px] font-bold uppercase tracking-[1.4px] text-marush-primary">
                  Enterprise SSO Access
                </Text>
              </View>
            </View>

            <View className="mt-6 gap-4 z-10">
              {/* Designation Selector */}
              <View
                className="gap-2"
                style={
                  designationOpen
                    ? { position: "relative", zIndex: 10, elevation: 8 }
                    : undefined
                }
              >
                <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Requested Role
                </Text>
                <TouchableOpacity
                  className="h-14 flex-row items-center justify-between rounded-2xl border border-black/[0.08] bg-slate-50/80 px-4 transition-all"
                  onPress={() => setDesignationOpen((open) => !open)}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel={`Designation: ${DESIGNATIONS.find((option) => option.value === designation)?.label}`}
                  accessibilityState={{ expanded: designationOpen }}
                  activeOpacity={0.8}
                >
                  <View className="min-w-0 flex-1 justify-center">
                    <Text className="text-sm font-bold text-slate-900">
                      {
                        DESIGNATIONS.find(
                          (option) => option.value === designation,
                        )?.label
                      }
                    </Text>
                  </View>
                  {designationOpen ? (
                    <ChevronUp size={18} color={Colors.primary} />
                  ) : (
                    <ChevronDown size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>

                {designationOpen && (
                  <View
                    className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-xl"
                    style={{
                      position: "absolute",
                      top: 72,
                      left: 0,
                      right: 0,
                      zIndex: 20,
                      elevation: 10,
                    }}
                  >
                    {DESIGNATIONS.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        className={`min-h-[54px] flex-row items-center justify-between border-b border-black/[0.05] px-4 py-2.5 last:border-b-0 ${
                          designation === option.value
                            ? "bg-marush-primary-subtle/80"
                            : "bg-white hover:bg-slate-50"
                        }`}
                        onPress={() => {
                          setDesignation(option.value);
                          setDesignationOpen(false);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: designation === option.value,
                        }}
                      >
                        <View className="min-w-0 flex-1 pr-2">
                          <Text
                            className={`text-sm ${
                              designation === option.value
                                ? "font-bold text-marush-primary"
                                : "font-semibold text-slate-800"
                            }`}
                          >
                            {option.label}
                          </Text>
                        </View>
                        {designation === option.value && (
                          <View className="h-6 w-6 items-center justify-center rounded-full bg-marush-primary">
                            <Check size={14} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Continue with Google button */}
              <TouchableOpacity
                className={`min-h-[52px] items-center justify-center rounded-2xl bg-marush-primary px-4 shadow-[0_2px_8px_rgba(0,79,66,0.2)] transition-all ${
                  loading ? "opacity-70" : ""
                }`}
                onPress={handleGoogleSignIn}
                disabled={loading}
                activeOpacity={0.85}
                accessibilityRole="button"
                {...(Platform.OS === "web"
                  ? ({
                      style: {
                        transition:
                          "transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out",
                      },
                    } as any)
                  : {})}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View className="flex-row items-center justify-center gap-3">
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-white p-0.5">
                      <Image
                        source={require("../../assets/google-g-logo.png")}
                        className="h-4 w-4"
                        style={{ width: 16, height: 16 }}
                        resizeMode="contain"
                        accessible={false}
                      />
                    </View>
                    <Text className="text-[15px] font-bold text-white tracking-tight">
                      Continue with Google
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <Text className="mt-5 text-center text-xs leading-relaxed text-slate-400">
              Authorized personnel only. Sessions are monitored for operational
              integrity.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
