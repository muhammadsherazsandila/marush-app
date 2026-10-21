import { ArrowLeft, Bell, ShieldCheck } from "lucide-react-native";
import React from "react";
import {
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Colors, Radii, Spacing, Type } from "../constants/design";

interface NavbarProps {
  title?: string;
  onBack?: () => void;
  onNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title = "Overview",
  onBack,
  onNotifications,
}) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 520;

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.surface,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1480,
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: isCompact ? Spacing.xl : Spacing["4xl"],
          paddingVertical: isCompact ? Spacing.md : Spacing.md + 2,
        }}
      >
        {/* Left side: Back button + Title */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.md,
            flex: 1,
            minWidth: 0,
          }}
        >
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={{
                padding: Spacing.sm,
                borderRadius: Radii.md,
                borderWidth: 1,
                borderColor: Colors.border,
                backgroundColor: Colors.surfaceInput,
              }}
            >
              <ArrowLeft size={17} color={Colors.accent} />
            </TouchableOpacity>
          )}

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                ...Type.eyebrow,
                fontSize: 9,
                letterSpacing: 1.8,
                color: Colors.textTertiary,
              }}
            >
              MARUSH WORKSPACE
            </Text>
            <Text
              style={{
                ...Type.bodyStrong,
                fontWeight: "700",
                color: Colors.textPrimary,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
        </View>

        {/* Right side: Status, Notifications, Shield */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.md,
          }}
        >
          {!isCompact && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.sm,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: Radii.pill,
                  backgroundColor: Colors.success,
                }}
              />
              <Text
                style={{
                  ...Type.caption,
                  fontWeight: "700",
                  color: Colors.textSecondary,
                }}
              >
                All systems operational
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={onNotifications}
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
            style={{
              padding: Spacing.sm,
              borderRadius: Radii.md,
              borderWidth: 1,
              borderColor: Colors.border,
              backgroundColor: Colors.surfaceInput,
            }}
          >
            <Bell size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          {!isCompact && <ShieldCheck size={16} color={Colors.accent} />}
        </View>
      </View>
    </View>
  );
};
