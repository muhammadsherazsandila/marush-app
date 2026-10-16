import React from 'react';
import { ArrowLeft, Bell, Check } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';

interface NotificationsScreenProps {
  onBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => (
  <ScrollView className="flex-1 bg-[#F4F6F7]" contentContainerClassName="pb-12">
    <View className="mx-auto w-full max-w-[980px] px-5 py-6 md:px-10 md:py-9">
      <TouchableOpacity onPress={onBack} className="mb-7 flex-row items-center gap-2 self-start">
        <View className="rounded-lg border border-[#D7E1E4] bg-white p-2">
          <ArrowLeft size={17} color={Colors.primary} />
        </View>
        <Text className="text-sm font-bold text-[#294D55]">Back to workspace</Text>
      </TouchableOpacity>

      <View className="mb-6">
        <Text className="mb-2 text-[11px] font-bold uppercase tracking-[2px] text-[#2D766D]">WORKSPACE / UPDATES</Text>
        <Text className="text-3xl font-black tracking-[-1px] text-[#152A35] md:text-4xl">Notifications</Text>
        <Text className="mt-2 text-sm leading-6 text-[#6D7D83]">
          Stay up to date with program activity, approvals, and account changes.
        </Text>
      </View>

      <View className="items-center rounded-2xl border border-[#DCE4E7] bg-white px-6 py-16">
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF5F1]">
          <Bell size={28} color={Colors.primary} strokeWidth={1.8} />
        </View>
        <Text className="text-lg font-black text-[#152A35]">No notifications yet</Text>
        <Text className="mt-2 max-w-[360px] text-center text-sm leading-6 text-[#8A989C]">
          You’re all caught up. New updates about your programs and workspace will appear here.
        </Text>
        <View className="mt-6 flex-row items-center gap-2 rounded-full bg-[#F1F7F4] px-3 py-2">
          <Check size={13} color="#397A61" strokeWidth={2.5} />
          <Text className="text-xs font-bold text-[#397A61]">Everything is up to date</Text>
        </View>
      </View>
    </View>
  </ScrollView>
);
