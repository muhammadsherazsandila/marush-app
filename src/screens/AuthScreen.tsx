import {
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Rect,
  Stop,
  Image as SvgImage,
} from "react-native-svg";
import Toast from "react-native-toast-message";
import { MarushLogo } from "../components/MarushLogo";
import { Colors, Radii, Shadows, Spacing, Type } from "../constants/design";
import { dataProvider } from "../services";
import { UserProfile, UserRole } from "../types";

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  onRegisteredPending: (user: UserProfile) => void;
}

type RequestedDesignation = Exclude<UserRole, "admin" | "employee">;

const DESIGNATIONS: {
  value: RequestedDesignation;
  label: string;
  desc: string;
}[] = [
  {
    value: "program_controller",
    label: "Program Controller",
    desc: "Plan vaccination schedules & submit SOP reports",
  },
  {
    value: "program_auditor",
    label: "Program Auditor",
    desc: "Inspect quality & audit cold chain compliance",
  },
];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onRegisteredPending,
}) => {
  const [designation, setDesignation] =
    useState<RequestedDesignation>("program_controller");
  const [designationOpen, setDesignationOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = useCallback(async () => {
    if (loading) return;
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
            : "Authentication failed",
          text2: isLocalhostPreviewError
            ? "Use the LAN QR code, or sign in from the deployed HTTPS app."
            : error,
        });
        return;
      }

      const authenticatedUser = user ?? dataProvider.getCurrentUser();
      if (!authenticatedUser) return;

      if (authenticatedUser.status === "rejected") {
        Toast.show({
          type: "error",
          text1: "Access denied",
          text2: "Contact your Marush administrator.",
        });
        return;
      }

      if (authenticatedUser.status === "pending") {
        Toast.show({
          type: "info",
          text1: "Account under review",
          text2: "Your request was sent to a Marush administrator.",
        });
        onRegisteredPending(authenticatedUser);
        return;
      }

      Toast.show({
        type: "success",
        text1: "Authorized",
        text2: `Signed in as ${authenticatedUser.fullName}`,
      });
      onLoginSuccess(authenticatedUser);
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Authentication failed",
        text2: err?.message ?? "Please contact your Marush administrator.",
      });
    } finally {
      setLoading(false);
    }
  }, [loading, designation, onLoginSuccess, onRegisteredPending]);

  const selectedDesignation = DESIGNATIONS.find((o) => o.value === designation);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.surface }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ============================================================ */}
      {/* BACKGROUND — photo as texture, darkened + gradient overlay    */}
      {/* ============================================================ */}
      <View
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 400 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <Defs>
            <LinearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={Colors.surface} stopOpacity="0.55" />
              <Stop
                offset="0.45"
                stopColor={Colors.surface}
                stopOpacity="0.88"
              />
              <Stop offset="1" stopColor={Colors.surface} stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="glow" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor={Colors.accent} stopOpacity="0.12" />
              <Stop offset="1" stopColor={Colors.accent} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <SvgImage
            href={require("../../assets/bg.jpg")}
            x="0"
            y="0"
            width="400"
            height="800"
            preserveAspectRatio="xMidYMid slice"
          />
          <Rect x="0" y="0" width="400" height="800" fill="url(#overlay)" />
          <Rect x="0" y="0" width="400" height="400" fill="url(#glow)" />
        </Svg>
      </View>

      {/* ============================================================ */}
      {/* CONTENT                                                      */}
      {/* ============================================================ */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: Spacing["2xl"],
          paddingTop: Spacing["5xl"],
          paddingBottom: Spacing["3xl"],
        }}
      >
        {/* Brand mark */}
        <View style={{ alignItems: "center" }}>
          <MarushLogo size="md" variant="mark" theme="dark" />
        </View>

        {/* Display heading */}
        <Text
          style={{
            marginTop: Spacing["4xl"],
            textAlign: "center",
            color: Colors.textPrimary,
            ...Type.display,
          }}
        >
          Marush Technical Portal
        </Text>

        {/* Subhead pill */}
        <View
          style={{
            marginTop: Spacing.md,
            alignItems: "center",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.sm,
              borderRadius: Radii.pill,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.xs + 2,
              backgroundColor: Colors.accentSubtle,
              borderWidth: 1,
              borderColor: Colors.accentBorder,
            }}
          >
            <ShieldCheck size={12} color={Colors.accent} strokeWidth={2.4} />
            <Text
              style={{
                ...Type.eyebrow,
                letterSpacing: 1.5,
                color: Colors.accent,
              }}
            >
              Authorized Personnel Only
            </Text>
          </View>
        </View>

        {/* Tagline */}
        <Text
          style={{
            marginTop: Spacing.lg,
            textAlign: "center",
            color: Colors.textSecondary,
            ...Type.caption,
            lineHeight: 19,
          }}
        >
          CEVA's Exclusive Distributor in Pakistan{"\n"}
          Hatchery Vaccination · Technical Services
        </Text>

        {/* ======================================================== */}
        {/* FROSTED GLASS CARD                                        */}
        {/* ======================================================== */}
        <View
          style={{
            marginTop: Spacing["4xl"],
            padding: Spacing.xl,
            borderRadius: Radii.xl,
            backgroundColor: Colors.surfaceCard,
            borderWidth: 1,
            borderColor: Colors.border,
            ...(Platform.OS === "web"
              ? ({ backdropFilter: "blur(24px)" } as any)
              : {}),
          }}
        >
          <Text
            style={{
              ...Type.eyebrow,
              letterSpacing: 1.3,
              color: Colors.textTertiary,
            }}
          >
            Operational Role
          </Text>

          {/* Role selector trigger */}
          <TouchableOpacity
            style={{
              marginTop: Spacing.sm + 2,
              height: 52,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: Spacing.lg,
              borderRadius: Radii.md,
              backgroundColor: Colors.surfaceInput,
              borderWidth: 1,
              borderColor: Colors.borderSubtle,
            }}
            onPress={() => setDesignationOpen((v) => !v)}
            disabled={loading}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Role: ${selectedDesignation?.label}`}
            accessibilityState={{ expanded: designationOpen }}
          >
            <Text
              style={{
                flex: 1,
                ...Type.bodyStrong,
                color: Colors.textPrimary,
              }}
              numberOfLines={1}
            >
              {selectedDesignation?.label}
            </Text>
            {designationOpen ? (
              <ChevronUp size={17} color={Colors.accent} strokeWidth={2.2} />
            ) : (
              <ChevronDown
                size={17}
                color={Colors.textSecondary}
                strokeWidth={2.2}
              />
            )}
          </TouchableOpacity>

          {/* Dropdown panel */}
          {designationOpen && (
            <View
              style={{
                marginTop: Spacing.sm,
                overflow: "hidden",
                borderRadius: Radii.md,
                backgroundColor: Colors.surfaceElevated,
                borderWidth: 1,
                borderColor: Colors.border,
                ...Shadows.card,
              }}
            >
              {DESIGNATIONS.map((option, i) => {
                const selected = option.value === designation;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: Spacing.lg,
                      paddingVertical: Spacing.md + 2,
                      borderBottomWidth: i < DESIGNATIONS.length - 1 ? 1 : 0,
                      borderBottomColor: Colors.borderSubtle,
                      backgroundColor: selected
                        ? Colors.accentSubtle
                        : "transparent",
                    }}
                    onPress={() => {
                      setDesignation(option.value);
                      setDesignationOpen(false);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    <View style={{ flex: 1, paddingRight: Spacing.md }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: selected ? "700" : "600",
                          color: selected ? Colors.accent : Colors.textPrimary,
                        }}
                      >
                        {option.label}
                      </Text>
                      <Text
                        style={{
                          marginTop: 2,
                          fontSize: 11,
                          lineHeight: 15,
                          color: Colors.textTertiary,
                        }}
                      >
                        {option.desc}
                      </Text>
                    </View>
                    {selected && (
                      <View
                        style={{
                          height: 20,
                          width: 20,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: Radii.pill,
                          backgroundColor: Colors.accent,
                        }}
                      >
                        <Check size={12} color={Colors.white} strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Primary CTA */}
          <TouchableOpacity
            style={{
              marginTop: Spacing.xl,
              minHeight: 50,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: Radii.md,
              backgroundColor: loading ? "rgba(1,156,223,0.4)" : Colors.accent,
              ...(loading ? {} : Shadows.accentGlow),
            }}
            onPress={handleGoogleSignIn}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            accessibilityState={{ disabled: loading, busy: loading }}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: Spacing.sm + 2,
                }}
              >
                <View
                  style={{
                    height: 20,
                    width: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: Radii.pill,
                    backgroundColor: Colors.white,
                  }}
                >
                  <Image
                    source={require("../../assets/google-g-logo.png")}
                    style={{ width: 14, height: 14 }}
                    resizeMode="contain"
                    accessible={false}
                  />
                </View>
                <Text
                  style={{
                    ...Type.bodyStrong,
                    fontWeight: "700",
                    color: Colors.white,
                  }}
                >
                  Continue with Google
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View
          style={{
            marginTop: "auto",
            alignItems: "center",
            paddingTop: Spacing["3xl"],
          }}
        >
          <Text
            style={{
              textAlign: "center",
              fontSize: 10,
              lineHeight: 15,
              color: Colors.textTertiary,
            }}
          >
            Sessions are monitored in accordance with{"\n"}
            CEVA Animal Health SOPs & operational integrity standards.
          </Text>
          <View
            style={{
              marginTop: Spacing.md,
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.xs + 2,
            }}
          >
            <View
              style={{
                height: 4,
                width: 4,
                borderRadius: Radii.pill,
                backgroundColor: Colors.accent,
              }}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "500",
                color: Colors.textTertiary,
              }}
            >
              Marush Pvt. Ltd. · Lahore, Pakistan
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
