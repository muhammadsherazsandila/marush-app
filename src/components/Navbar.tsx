import React from 'react';
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { ArrowLeft, Bell, ShieldCheck } from 'lucide-react-native';
import { Colors } from '../constants/colors';

interface NavbarProps {
  title?: string;
  onBack?: () => void;
  onNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ title = 'Overview', onBack, onNotifications }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 520;

  return (
    <View className="border-b border-[#E4E8EA] bg-white">
      <View className={`mx-auto w-full max-w-[1480px] flex-row items-center justify-between ${isCompact ? 'px-5 py-3' : 'px-10 py-3.5'}`}>
        <View className="flex-row items-center gap-3">
          {onBack && <TouchableOpacity onPress={onBack} className="rounded-lg border border-[#D7E1E4] p-2"><ArrowLeft size={17} color={Colors.primary} /></TouchableOpacity>}
          <View><Text className="text-[10px] font-bold uppercase tracking-[1.8px] text-[#8A989C]">MARUSH WORKSPACE</Text><Text className="mt-0.5 text-sm font-black text-[#152A35]">{title}</Text></View>
        </View>
        <View className="flex-row items-center gap-3">
          {!isCompact && <View className="flex-row items-center gap-2"><View className="h-2 w-2 rounded-full bg-emerald-500" /><Text className="text-[11px] font-bold text-[#527278]">All systems operational</Text></View>}
          <TouchableOpacity
            onPress={onNotifications}
            className="rounded-lg border border-[#D7E1E4] p-2"
            accessibilityRole="button"
            accessibilityLabel="Open notifications"
          >
            <Bell size={16} color="#527278" />
          </TouchableOpacity>
          {!isCompact && <ShieldCheck size={16} color={Colors.primary} />}
        </View>
      </View>
    </View>
  );
};
