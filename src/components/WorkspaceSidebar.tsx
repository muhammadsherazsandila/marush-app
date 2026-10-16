import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { BarChart3, BriefcaseBusiness, LayoutDashboard, LogOut, UserRound } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { MarushLogo } from './MarushLogo';
import { WorkspaceTab } from './BottomTabBar';

interface WorkspaceSidebarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onLogout: () => void;
}

const tabs = [
  { id: 'overview', label: 'Overview', caption: 'Operations at a glance', Icon: LayoutDashboard },
  { id: 'programs', label: 'Programs', caption: 'Manage field work', Icon: BriefcaseBusiness },
  { id: 'profile', label: 'Profile', caption: 'Account & security', Icon: UserRound },
] as const;

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({ activeTab, onTabChange, onLogout }) => (
  <View className="hidden w-[264px] flex-col border-r border-[#243A47] bg-[#152A35] px-4 py-5 md:flex">
    <View className="mb-10 flex-row items-center gap-3 px-2">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#D9F2E6]">
        <MarushLogo size="sm" variant="mark" framed={false} />
      </View>
      <View>
        <Text className="text-[13px] font-black tracking-[1.6px] text-white">MARUSH</Text>
        <Text className="text-[10px] font-medium text-[#9CB2B7]">Operations workspace</Text>
      </View>
    </View>

    <Text className="mb-3 px-3 text-[10px] font-black uppercase tracking-[1.5px] text-[#718B92]">Workspace</Text>
    <View className="gap-1">
      {tabs.map(({ id, label, caption, Icon }) => {
        const active = activeTab === id;
        return (
          <TouchableOpacity
            key={id}
            onPress={() => onTabChange(id)}
            className={`flex-row items-center gap-3 rounded-xl px-3 py-3 ${active ? 'bg-[#2D766D] shadow-[0_8px_20px_rgba(0,0,0,0.18)]' : 'bg-transparent'}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Icon size={18} color={active ? Colors.white : '#9CB2B7'} strokeWidth={active ? 2.4 : 1.9} />
            <View className="min-w-0 flex-1">
              <Text className={`text-[13px] font-bold ${active ? 'text-white' : 'text-[#D7E2E0]'}`}>{label}</Text>
              <Text className={`mt-0.5 text-[10px] ${active ? 'text-[#C5E8DE]' : 'text-[#7F989D]'}`}>{caption}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>

    <View className="mt-auto gap-3">
      <View className="rounded-xl border border-[#2A4652] bg-[#1C3541] p-3">
        <View className="mb-2 flex-row items-center gap-2">
          <BarChart3 size={15} color={Colors.primary} />
          <Text className="text-[11px] font-bold text-white">System status</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="h-2 w-2 rounded-full bg-emerald-500" />
          <Text className="text-[11px] text-[#A3B8BA]">All services operational</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onLogout} className="flex-row items-center gap-3 rounded-xl px-3 py-3">
        <LogOut size={17} color="#B84C4C" />
        <Text className="text-[13px] font-bold text-[#F3A5A5]">Sign out</Text>
      </TouchableOpacity>
    </View>
  </View>
);
