import React from "react";
import { Text, View } from "react-native";
import { Colors, Spacing } from "../constants/design";

type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

interface IconLabelProps {
  icon: IconComponent;
  label: string;
  color?: string;
  size?: number;
  className?: string; // Kept for backward compatibility, but ignored
}

export const IconLabel: React.FC<IconLabelProps> = ({
  icon: Icon,
  label,
  color = Colors.accent, // Changed default from primary (forest) to accent (cerulean)
  size = 16,
  className,
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
    }}
  >
    <Icon size={size} color={color} strokeWidth={2} />
    <Text
      style={{
        // If you have standard text colors you want to enforce here, you can,
        // but usually this takes a className from the parent. Since we are
        // moving away from Tailwind classes, I've set a default text color.
        color: Colors.textSecondary,
        fontWeight: "500",
        fontSize: 13,
      }}
    >
      {label}
    </Text>
  </View>
);
