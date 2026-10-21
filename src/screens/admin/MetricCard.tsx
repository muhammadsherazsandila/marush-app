// admin/MetricCard.tsx
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Colors, Radii, Spacing, Type } from "../../constants/design";

interface MetricCardProps {
  icon: React.ReactNode;
  trendLabel: string;
  value: number;
  supportingText: string;
  accent?: string; // defaults to Colors.accent
  onPress?: () => void;
  accessibilityLabel?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  trendLabel,
  value,
  supportingText,
  accent = Colors.accent,
  onPress,
  accessibilityLabel,
}) => (
  <TouchableOpacity
    activeOpacity={0.8}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
    style={{
      flex: 1,
      minWidth: 210,
      padding: Spacing.xl,
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surfaceCard,
      borderLeftWidth: 3,
      borderLeftColor: accent,
    }}
  >
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: Spacing.sm,
      }}
    >
      <View
        style={{
          padding: Spacing.sm,
          borderRadius: Radii.sm,
          backgroundColor: `${accent}1A`,
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          ...Type.eyebrow,
          color: Colors.textTertiary,
        }}
      >
        {trendLabel}
      </Text>
    </View>
    <Text style={{ ...Type.number, color: accent }}>{value}</Text>
    <Text
      style={{
        ...Type.caption,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
      }}
    >
      {supportingText}
    </Text>
  </TouchableOpacity>
);
