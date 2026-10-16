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
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Defs,
  Ellipse,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";
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

const DESIGNATIONS: { value: RequestedDesignation; label: string }[] = [
  { value: "employee", label: "Employee" },
  { value: "program_controller", label: "Program Controller" },
  { value: "program_auditor", label: "Program Auditor" },
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
      className="flex-1 bg-[#e9f7f5]"
      contentContainerClassName="flex-grow"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 bg-[#e9f7f5]">
        <View className="h-[280px] overflow-hidden bg-marush-primary">
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 460 280"
            preserveAspectRatio="xMidYMid slice"
          >
            <Defs>
              <SvgLinearGradient id="leafBackground" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={Colors.primaryLight} />
                <Stop offset="1" stopColor={Colors.primaryDark} />
              </SvgLinearGradient>
              <SvgLinearGradient id="leafHighlight" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={Colors.secondary} stopOpacity="0.75" />
                <Stop offset="1" stopColor={Colors.primary} stopOpacity="0.15" />
              </SvgLinearGradient>
            </Defs>
            <Path d="M0 0h460v280H0z" fill="url(#leafBackground)" />
            <Ellipse
              cx="66"
              cy="44"
              rx="118"
              ry="52"
              fill="url(#leafHighlight)"
              rotation="-28"
              origin="66, 44"
            />
            <Ellipse
              cx="386"
              cy="82"
              rx="106"
              ry="48"
              fill={Colors.secondaryDark}
              opacity="0.75"
              rotation="-25"
              origin="386, 82"
            />
            <Ellipse
              cx="260"
              cy="194"
              rx="148"
              ry="60"
              fill={Colors.primary}
              opacity="0.85"
              rotation="-20"
              origin="260, 194"
            />
            <Path
              d="M-32 126C58 34 131 27 194 19M-20 145C68 71 128 58 193 48M-2 167c73-65 130-86 196-91M331 19c-2 77 26 120 91 174M365 10c-5 81 22 126 73 166M403 24c-2 69 15 111 50 145"
              stroke={Colors.secondaryLight}
              strokeOpacity="0.33"
              strokeWidth="2"
              fill="none"
            />
            <Path
              d="M0 246C78 203 144 179 229 174C321 169 383 184 460 146V280H0Z"
              fill="#e9f7f5"
            />
          </Svg>
          <View className="absolute left-6 top-8">
            <MarushLogo size="sm" variant="mark" />
          </View>
        </View>

        <View className="mx-auto w-full max-w-[460px] px-6 pb-8 pt-10">
          <View className="items-center">
            <Text className="text-[28px] font-extrabold tracking-tight text-marush-primary">
              Welcome back
            </Text>
            <Text className="mt-1 text-sm font-medium text-marush-muted">
              Sign in to your Marush account
            </Text>
            <View className="mt-3 flex-row items-center gap-1.5">
              <ShieldCheck size={13} color={Colors.primary} />
              <Text className="text-[10px] font-bold uppercase tracking-[1.4px] text-marush-primary">
                Secure work access
              </Text>
            </View>
          </View>

          <View className="mt-7 gap-4">
            <View
              className="gap-2"
              style={
                designationOpen
                  ? { position: "relative", zIndex: 10, elevation: 8 }
                  : undefined
              }
            >
              <Text className="text-sm font-bold text-marush-text">
                Designation
              </Text>
              <TouchableOpacity
                className="h-14 flex-row items-center justify-between rounded-xl border border-[#bce5df] bg-[#e9f7f5] px-4"
                onPress={() => setDesignationOpen((open) => !open)}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={`Designation: ${DESIGNATIONS.find((option) => option.value === designation)?.label}`}
                accessibilityState={{ expanded: designationOpen }}
              >
                <Text className="text-base font-semibold text-marush-text">
                  {
                    DESIGNATIONS.find((option) => option.value === designation)
                      ?.label
                  }
                </Text>
                {designationOpen ? (
                  <ChevronUp size={18} color={Colors.primary} />
                ) : (
                  <ChevronDown size={18} color={Colors.primary} />
                )}
              </TouchableOpacity>

              {designationOpen && (
                <View
                  className="overflow-hidden rounded-xl border border-[#bce5df] bg-white shadow-md"
                  style={{
                    position: "absolute",
                    top: 62,
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    elevation: 8,
                  }}
                >
                  {DESIGNATIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`min-h-11 flex-row items-center justify-between border-b border-marush-border px-3.5 ${designation === option.value ? "bg-[#e9f7f5]" : ""}`}
                      onPress={() => {
                        setDesignation(option.value);
                        setDesignationOpen(false);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected: designation === option.value,
                      }}
                    >
                      <Text
                        className={`text-sm ${designation === option.value ? "font-bold text-marush-primary" : "text-marush-muted"}`}
                      >
                        {option.label}
                      </Text>
                      {designation === option.value && (
                        <Check size={16} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <Text className="text-sm leading-5 text-marush-muted">
              Designation is a request. New accounts need approval.
            </Text>

            <TouchableOpacity
              className={`min-h-14 items-center justify-center rounded-xl bg-marush-primary px-4 shadow-sm ${loading ? "opacity-70" : ""}`}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View className="flex-row items-center justify-center gap-2.5">
                  <Image
                    source={require("../../assets/google-g-logo.png")}
                    className="h-5 w-5"
                    style={{ width: 20, height: 20 }}
                    resizeMode="contain"
                    accessible={false}
                  />
                  <Text className="text-base font-bold text-white">
                    Continue with Google
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <Text className="mt-5 text-center text-xs leading-5 text-marush-muted">
            New accounts are reviewed by a Marush administrator after sign-in.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};
