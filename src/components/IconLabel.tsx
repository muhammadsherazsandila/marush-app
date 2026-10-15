import React from 'react';
import { Text, View } from 'react-native';
import { Colors } from '../constants/colors';

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
  className?: string;
}

export const IconLabel: React.FC<IconLabelProps> = ({
  icon: Icon,
  label,
  color = Colors.primary,
  size = 16,
  className,
}) => (
  <View className="flex-row items-center justify-center gap-2">
    <Icon size={size} color={color} strokeWidth={2} />
    <Text className={className}>{label}</Text>
  </View>
);

