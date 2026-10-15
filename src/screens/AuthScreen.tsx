import {
  ArrowRight,
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
  useWindowDimensions,
} from "react-native";
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
  description: string;
}[] = [
  {
    value: "employee",
    label: "Field Specialist",
    description: "Vaccination execution & monitoring",
  },
  {
    value: "program_controller",
    label: "Program Controller",
    description: "Operations setup & oversight",
  },
  {
    value: "program_auditor",
    label: "Program Auditor",
    description: "Quality compliance & sign-off",
  },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onRegisteredPending,
}) => {
  const { width } = useWindowDimensions();
  const [designation, setDesignation] =
    useState<RequestedDesignation>("employee");
  const [designationOpen, setDesignationOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isWide = width >= 960;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { user } = await dataProvider.signInWithGoogle(designation);

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

  const selectedDesignationObj = DESIGNATIONS.find(
    (option) => option.value === designation,
  );

  return (
    <ScrollView
      className="flex-1 bg-marush-background"
      contentContainerClassName="flex-grow items-center justify-center p-4 md:p-8"
      keyboardShouldPersistTaps="handled"
    >
      <View
        className={`w-full max-w-[1040px] flex-grow justify-center self-center overflow-hidden rounded-3xl border border-marush-border bg-white shadow-xl ${
          isWide
            ? "flex-row items-stretch min-h-[580px]"
            : "items-center p-6 md:p-10"
        }`}
      >
        {/* Left Hero Panel (Desktop) */}
        {isWide && (
          <View className="relative w-[45%] flex-col justify-between overflow-hidden bg-marush-primary p-10">
            {/* Ambient background glows */}
            <View className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-marush-primary-light/40 blur-2xl" />
            <View className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-marush-secondary/20 blur-3xl" />

            {/* Top Brand section */}
            <View className="z-10">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20 shadow-sm backdrop-blur-md">
                <MarushLogo size="sm" variant="mark" framed={false} />
              </View>
              <Text className="mt-6 text-[32px] font-black tracking-[2px] text-white">
                MARUSH
              </Text>
              <View className="mt-2 flex-row items-center gap-2">
                <View className="h-1.5 w-1.5 rounded-full bg-marush-secondary" />
                <Text className="text-xs font-semibold uppercase tracking-wider text-marush-secondary-light">
                  Exclusive Ceva Animal Health Partner
                </Text>
              </View>
            </View>

            {/* Center value prop */}
            <View className="z-10 my-8">
              <Text className="text-[20px] font-bold leading-tight text-white">
                Precision Poultry Monitoring & Vaccination
              </Text>
              <Text className="mt-3 text-[13px] leading-relaxed text-marush-primary-subtle/80">
                Pakistan’s premier field enterprise management system for
                automated hatchery cold-chain verification and flock vitality.
              </Text>
            </View>

            {/* Bottom Security indicator */}
            <View className="z-10 flex-row items-center gap-2 rounded-xl bg-white/10 px-4 py-3 border border-white/10">
              <ShieldCheck size={18} color={Colors.secondaryLight} />
              <View>
                <Text className="text-[11px] font-bold text-white">
                  Authorized Access Only
                </Text>
                <Text className="text-[10px] text-marush-primary-subtle/70">
                  Encrypted Enterprise SSO
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Right Form Container */}
        <View
          className={`flex-1 justify-center gap-10 ${
            isWide ? "px-12 py-6" : "w-full max-w-[420px]"
          }`}
        >
          {!isWide && (
            <View className="mb-6 items-center">
              <MarushLogo
                size="lg"
                variant="full"
                framed={false}
                showSubtitle={false}
              />
            </View>
          )}

          <View className="mb-6">
            <Text className="text-2xl md:text-3xl font-extrabold tracking-tight text-marush-text">
              Welcome back
            </Text>
            <Text className="mt-1.5 text-sm text-marush-muted">
              Select your role and authenticate with your corporate Google
              workspace account.
            </Text>
          </View>

          <View className="gap-8">
            {/* Designation Selector */}
            <View
              className="gap-2"
              style={
                designationOpen
                  ? { position: "relative", zIndex: 30, elevation: 12 }
                  : undefined
              }
            >
              <Text className="text-xs font-bold uppercase tracking-wider text-marush-muted">
                Assigned Designation
              </Text>

              <TouchableOpacity
                className="h-14 flex-row items-center justify-between rounded-xl border border-marush-border bg-marush-background px-4 hover:border-marush-primary transition-colors shadow-sm"
                onPress={() => setDesignationOpen((open) => !open)}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={`Designation: ${selectedDesignationObj?.label}`}
                accessibilityState={{ expanded: designationOpen }}
                activeOpacity={0.8}
              >
                <View>
                  <Text className="text-sm font-bold text-marush-text">
                    {selectedDesignationObj?.label}
                  </Text>
                  <Text className="text-[11px] text-marush-muted">
                    {selectedDesignationObj?.description}
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
                  className="overflow-hidden rounded-xl border border-marush-border bg-white shadow-xl"
                  style={{
                    position: "absolute",
                    top: 76,
                    left: 0,
                    right: 0,
                    zIndex: 40,
                    elevation: 16,
                  }}
                >
                  {DESIGNATIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      className={`flex-row items-center justify-between border-b border-marush-border/60 p-3.5 ${
                        designation === option.value
                          ? "bg-marush-primary-subtle/80"
                          : "hover:bg-marush-subtle"
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
                      <View>
                        <Text
                          className={`text-sm ${
                            designation === option.value
                              ? "font-extrabold text-marush-primary"
                              : "font-semibold text-marush-text"
                          }`}
                        >
                          {option.label}
                        </Text>
                        <Text className="text-[11px] text-marush-muted">
                          {option.description}
                        </Text>
                      </View>
                      {designation === option.value && (
                        <View className="h-6 w-6 items-center justify-center rounded-full bg-marush-primary">
                          <Check size={13} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Google Sign In Action */}
            <TouchableOpacity
              className={`h-14 flex-row items-center justify-center gap-3 rounded-xl border border-marush-border bg-white px-5 shadow-sm active:bg-marush-subtle hover:border-marush-primary transition-all ${
                loading ? "opacity-75" : ""
              }`}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              {loading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator color={Colors.primary} size="small" />
                  <Text className="text-sm font-semibold text-marush-primary">
                    Connecting to Google…
                  </Text>
                </View>
              ) : (
                <>
                  <Image
                    source={require("../../assets/google-g-logo.png")}
                    style={{ width: 22, height: 22 }}
                    resizeMode="contain"
                    accessible={false}
                  />
                  <Text className="text-[15px] font-bold text-marush-text">
                    Continue with Google
                  </Text>
                  <ArrowRight size={16} color={Colors.textMuted} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
