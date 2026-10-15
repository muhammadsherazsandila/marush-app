import React from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions, Platform } from 'react-native';
import { LayoutDashboard, BriefcaseBusiness, UserRound } from 'lucide-react-native';
import { Colors } from '../constants/colors';

export type WorkspaceTab = 'overview' | 'programs' | 'profile';

interface BottomTabBarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
}

const tabs = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'programs', label: 'Programs', Icon: BriefcaseBusiness },
  { id: 'profile', label: 'Profile', Icon: UserRound },
] as const;

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabChange }) => {
  const { width } = useWindowDimensions();

  return (
    <View className="border-t border-marush-border bg-white shadow-lg">
      <View
        className={`mx-auto w-full flex-row items-center justify-around px-3 py-2 ${
          width >= 900 ? 'max-w-[640px]' : ''
        }`}
        accessibilityRole="tablist"
      >
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => onTabChange(id)}
              className={`min-h-[50px] min-w-0 flex-1 flex-row items-center justify-center gap-2 rounded-xl px-3 py-2 transition-all ${
                active
                  ? 'bg-marush-primary-subtle border border-marush-primary/10 shadow-sm'
                  : 'bg-transparent'
              }`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              activeOpacity={0.7}
              {...(Platform.OS === 'web' ? ({ tabIndex: 0 } as any) : {})}
            >
              <View className="relative">
                <Icon
                  size={20}
                  color={active ? Colors.primary : Colors.textMuted}
                  strokeWidth={active ? 2.4 : 1.8}
                />
                {active && (
                  <View className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-marush-secondary" />
                )}
              </View>
              <Text
                className={`text-[12px] font-semibold tracking-tight ${
                  active ? 'font-bold text-marush-primary' : 'text-marush-muted'
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
