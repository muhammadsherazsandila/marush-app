import { ArrowLeft, Bell, Check } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Colors, Radii, Spacing, Type } from "../constants/design";

interface NotificationsScreenProps {
  onBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onBack,
}) => (
  <ScrollView
    style={{ flex: 1, backgroundColor: Colors.surface }}
    contentContainerStyle={{ paddingBottom: Spacing["5xl"] }}
    showsVerticalScrollIndicator={false}
  >
    <View
      style={{
        width: "100%",
        maxWidth: 980,
        alignSelf: "center",
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing["2xl"],
        paddingBottom: Spacing["3xl"],
      }}
    >
      {/* Back Button */}
      <TouchableOpacity
        onPress={onBack}
        style={{
          marginBottom: Spacing["2xl"],
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.sm,
          alignSelf: "flex-start",
        }}
      >
        <View
          style={{
            padding: Spacing.sm,
            borderRadius: Radii.md,
            borderWidth: 1,
            borderColor: Colors.border,
            backgroundColor: Colors.surfaceInput,
          }}
        >
          <ArrowLeft size={17} color={Colors.accent} />
        </View>
        <Text
          style={{
            ...Type.caption,
            fontWeight: "700",
            color: Colors.textSecondary,
          }}
        >
          Back to workspace
        </Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={{ marginBottom: Spacing["2xl"] }}>
        <Text
          style={{
            ...Type.eyebrow,
            color: Colors.accent,
            marginBottom: Spacing.sm,
          }}
        >
          WORKSPACE / UPDATES
        </Text>
        <Text style={{ ...Type.h1, color: Colors.textPrimary }}>
          Notifications
        </Text>
        <Text
          style={{
            ...Type.caption,
            color: Colors.textSecondary,
            marginTop: Spacing.sm,
            lineHeight: 22,
          }}
        >
          Stay up to date with program activity, approvals, and account changes.
        </Text>
      </View>

      {/* Empty State Card */}
      <View
        style={{
          alignItems: "center",
          paddingHorizontal: Spacing["2xl"],
          paddingVertical: Spacing["5xl"],
          borderRadius: Radii["2xl"],
          borderWidth: 1,
          borderColor: Colors.border,
          backgroundColor: Colors.surfaceCard,
        }}
      >
        <View
          style={{
            marginBottom: Spacing.xl,
            width: 64,
            height: 64,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: Radii.lg,
            backgroundColor: Colors.accentSubtle,
            borderWidth: 1,
            borderColor: Colors.accentBorder,
          }}
        >
          <Bell size={28} color={Colors.accent} strokeWidth={1.8} />
        </View>

        <Text style={{ ...Type.h3, color: Colors.textPrimary }}>
          No notifications yet
        </Text>
        <Text
          style={{
            ...Type.caption,
            color: Colors.textSecondary,
            textAlign: "center",
            maxWidth: 360,
            marginTop: Spacing.sm,
            lineHeight: 22,
          }}
        >
          You’re all caught up. New updates about your programs and workspace
          will appear here.
        </Text>

        <View
          style={{
            marginTop: Spacing.xl,
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.sm,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            borderRadius: Radii.pill,
            backgroundColor: Colors.successSubtle,
            borderWidth: 1,
            borderColor: Colors.successBorder,
          }}
        >
          <Check size={13} color={Colors.success} strokeWidth={2.5} />
          <Text
            style={{
              ...Type.caption,
              fontWeight: "700",
              color: Colors.success,
            }}
          >
            Everything is up to date
          </Text>
        </View>
      </View>
    </View>
  </ScrollView>
);
