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
    <View
      className="border-t border-black/[0.06] bg-white shadow-[0_-2px_12px_rgba(0,0,0,0.03)]"
      style={Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)', userSelect: 'none' } as any) : {}}
    >
      <View
        className={`mx-auto w-full flex-row items-center justify-around px-3 py-2 ${
          width >= 900 ? 'max-w-[580px]' : ''
        }`}
        accessibilityRole="tablist"
      >
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <TouchableOpacity
              key={id}
              onPress={() => onTabChange(id)}
              className={`min-h-[48px] min-w-0 flex-1 flex-row items-center justify-center gap-2 rounded-2xl px-3.5 py-2 transition-all ${
                active
                  ? 'bg-marush-primary-subtle border border-marush-primary/15 shadow-sm'
                  : 'bg-transparent border border-transparent'
              }`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              activeOpacity={0.75}
              {...(Platform.OS === 'web'
                ? ({
                    tabIndex: 0,
                    style: {
                      transition: 'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out',
                    },
                  } as any)
                : {})}
            >
              <View className="relative items-center justify-center">
                <Icon
                  size={19}
                  color={active ? Colors.primary : Colors.textMuted}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </View>
              <Text
                className={`text-[12px] tracking-tight ${
                  active ? 'font-bold text-marush-primary' : 'font-medium text-slate-500'
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
