import { ArrowLeft, Clock3, RefreshCw, ShieldX } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { MarushLogo } from "../components/MarushLogo";
import { Colors, Radii, Shadows, Spacing, Type } from "../constants/design";
import { dataProvider } from "../services";
import { UserProfile } from "../types";

interface PendingApprovalScreenProps {
  user: UserProfile;
  onApproved: (updatedUser: UserProfile) => void;
  onBackToLogin: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  user,
  onApproved,
  onBackToLogin,
}) => {
  const [checking, setChecking] = useState(false);
  const isRejected = user.status === "rejected";

  const checkStatus = async () => {
    setChecking(true);
    try {
      const refreshed = await dataProvider.getUserById(user.id);
      setChecking(false);

      if (!refreshed) {
        Toast.show({
          type: "error",
          text1: "Account Error",
          text2: "Account record could not be found.",
        });
        return;
      }

      if (refreshed.status === "approved") {
        Toast.show({
          type: "success",
          text1: "Account Approved!",
          text2: `Welcome to Marush, ${refreshed.fullName}`,
        });
        dataProvider.setCurrentUser(refreshed);
        onApproved(refreshed);
      } else if (refreshed.status === "rejected") {
        dataProvider.setCurrentUser(refreshed);
        onApproved(refreshed);
        Toast.show({
          type: "error",
          text1: "Registration Declined",
          text2: "Administrator declined this registration request.",
        });
      } else {
        Toast.show({
          type: "info",
          text1: "Status: Pending",
          text2: "Awaiting Administrator verification and approval.",
        });
      }
    } catch (err: any) {
      setChecking(false);
      Toast.show({
        type: "error",
        text1: "Verification Check Failed",
        text2: err?.message || "Network error checking status",
      });
    }
  };

  const activeColor = isRejected ? Colors.danger : Colors.accent;
  const activeBg = isRejected ? Colors.dangerSubtle : Colors.accentSubtle;
  const activeBorder = isRejected ? Colors.dangerBorder : Colors.accentBorder;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.surface,
        padding: Spacing.xl,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 480,
          alignItems: "center",
          padding: Spacing["3xl"],
          borderRadius: Radii["2xl"],
          borderWidth: 1,
          borderColor: Colors.border,
          backgroundColor: Colors.surfaceCard,
          ...(Platform.OS === "web"
            ? ({ backdropFilter: "blur(24px)" } as any)
            : {}),
          ...Shadows.cardElevated,
        }}
      >
        <MarushLogo size="sm" variant="mark" framed={false} theme="dark" />

        {/* Status Icon */}
        <View
          style={{
            marginTop: Spacing.xl,
            width: 64,
            height: 64,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: Radii.lg,
            borderWidth: 1,
            borderColor: activeBorder,
            backgroundColor: activeBg,
          }}
        >
          {isRejected ? (
            <ShieldX size={30} color={Colors.danger} strokeWidth={2.2} />
          ) : (
            <Clock3 size={30} color={Colors.accent} strokeWidth={2.2} />
          )}
        </View>

        {/* Status Badge */}
        <View
          style={{
            marginTop: Spacing.lg,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.xs + 2,
            borderRadius: Radii.pill,
            borderWidth: 1,
            borderColor: activeBorder,
            backgroundColor: activeBg,
          }}
        >
          <Text
            style={{
              ...Type.eyebrow,
              fontSize: 9,
              color: activeColor,
            }}
          >
            {isRejected ? "ACCESS DECLINED" : "PENDING ADMINISTRATIVE REVIEW"}
          </Text>
        </View>

        {/* Titles */}
        <Text
          style={{
            ...Type.h2,
            color: Colors.textPrimary,
            textAlign: "center",
            marginTop: Spacing.md,
          }}
        >
          {isRejected ? "Access Not Granted" : "Verification In Progress"}
        </Text>
        <Text
          style={{
            ...Type.caption,
            color: Colors.textSecondary,
            textAlign: "center",
            marginTop: Spacing.sm,
            lineHeight: 20,
          }}
        >
          {isRejected
            ? "Your registration was reviewed and not approved. Contact your operations manager for clearance."
            : "Your corporate Google profile has been created. An administrator will verify and assign your permissions shortly."}
        </Text>

        {/* Details List */}
        <View
          style={{
            marginTop: Spacing.xl,
            marginBottom: Spacing.lg,
            width: "100%",
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.xs,
            borderRadius: Radii.lg,
            borderWidth: 1,
            borderColor: Colors.border,
            backgroundColor: Colors.surfaceInput,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: Spacing.sm + 2,
              borderBottomWidth: 1,
              borderBottomColor: Colors.borderSubtle,
            }}
          >
            <Text
              style={{
                ...Type.eyebrow,
                fontSize: 9,
                color: Colors.textTertiary,
              }}
            >
              Full Name
            </Text>
            <Text
              style={{
                ...Type.caption,
                fontWeight: "700",
                color: Colors.textPrimary,
                textAlign: "right",
                flex: 1,
                marginLeft: Spacing.md,
              }}
              numberOfLines={1}
            >
              {user.fullName}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: Spacing.sm + 2,
              borderBottomWidth: 1,
              borderBottomColor: Colors.borderSubtle,
            }}
          >
            <Text
              style={{
                ...Type.eyebrow,
                fontSize: 9,
                color: Colors.textTertiary,
              }}
            >
              Corporate Email
            </Text>
            <Text
              style={{
                ...Type.caption,
                fontWeight: "500",
                color: Colors.textSecondary,
                textAlign: "right",
                flex: 1,
                marginLeft: Spacing.md,
              }}
              numberOfLines={1}
            >
              {user.email}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: Spacing.sm + 2,
            }}
          >
            <Text
              style={{
                ...Type.eyebrow,
                fontSize: 9,
                color: Colors.textTertiary,
              }}
            >
              Requested Role
            </Text>
            <Text
              style={{
                ...Type.caption,
                fontWeight: "700",
                color: Colors.accent,
                textAlign: "right",
                flex: 1,
                marginLeft: Spacing.md,
              }}
              numberOfLines={1}
            >
              {(user.requestedRole || user.role)
                .replace(/_/g, " ")
                .toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        {!isRejected && (
          <TouchableOpacity
            onPress={checkStatus}
            disabled={checking}
            activeOpacity={0.85}
            style={{
              width: "100%",
              minHeight: 48,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: Spacing.sm,
              borderRadius: Radii.md,
              backgroundColor: Colors.accent,
              opacity: checking ? 0.75 : 1,
              ...(checking ? {} : Shadows.accentGlow),
              ...(Platform.OS === "web"
                ? ({
                    transition:
                      "transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out",
                  } as any)
                : {}),
            }}
          >
            {checking ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <RefreshCw size={15} color={Colors.white} strokeWidth={2.4} />
                <Text
                  style={{
                    ...Type.bodyStrong,
                    fontWeight: "700",
                    color: Colors.white,
                  }}
                >
                  Check Verification Status
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Back to Login */}
        <TouchableOpacity
          onPress={onBackToLogin}
          disabled={checking}
          activeOpacity={0.7}
          style={{
            marginTop: Spacing.lg,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: Spacing.sm,
            paddingVertical: Spacing.sm,
          }}
        >
          <ArrowLeft size={14} color={Colors.textSecondary} />
          <Text
            style={{
              ...Type.caption,
              fontWeight: "700",
              color: Colors.textSecondary,
            }}
          >
            Back to Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
