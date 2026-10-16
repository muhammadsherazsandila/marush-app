import React from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  IdCard,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { UserProfile } from '../types';

interface ProfileScreenProps {
  user: UserProfile;
  onLogout: () => void;
}

const roleLabels: Record<string, string> = {
  admin: 'Executive Administrator',
  program_controller: 'Program Controller',
  program_auditor: 'Senior Quality Auditor',
  employee: 'Field Vaccination Specialist',
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 640;
  const initials = user.fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="flex-grow px-5 py-7 md:py-10">
        <View className="mx-auto w-full max-w-[720px]">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-[10px] font-black tracking-[1.8px] uppercase text-marush-secondary-dark">
              Account Security & Identity
            </Text>
            <Text className="mt-1 text-2xl md:text-3xl font-black tracking-tight text-slate-900">
              Verified Profile
            </Text>
            <Text className="mt-1 max-w-[580px] text-xs md:text-sm leading-relaxed text-slate-500">
              Your identity credentials and field clearance assigned by Marush Operations.
            </Text>
          </View>

          {/* Profile Identity Card */}
          <View className="overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
            <View className={`bg-marush-primary ${isCompact ? 'p-5' : 'p-6'}`}>
              <View className="flex-row items-center gap-4">
                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/15 border border-white/20 shadow-inner">
                  <Text className="text-xl font-black text-white tracking-wider">{initials || 'U'}</Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-lg md:text-xl font-bold text-white tracking-tight" numberOfLines={1}>
                    {user.fullName}
                  </Text>
                  <Text className="mt-0.5 text-xs font-semibold text-emerald-200">
                    {roleLabels[user.role] || 'Field Specialist'}
                  </Text>
                </View>
                {!isCompact && <ProfileStatus status={user.status} />}
              </View>
              {isCompact && (
                <View className="mt-4 self-start">
                  <ProfileStatus status={user.status} />
                </View>
              )}
            </View>

            <View className="flex-row flex-wrap gap-x-6 gap-y-2 border-t border-black/[0.06] bg-slate-50/60 px-6 py-3.5">
              <View className="flex-row items-center gap-2">
                <ShieldCheck size={14} color={Colors.primary} strokeWidth={2.4} />
                <Text className="text-xs font-semibold text-slate-600">SSO Verified Account</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Building2 size={14} color={Colors.primary} strokeWidth={2.4} />
                <Text className="text-xs font-semibold text-slate-600">Ceva Animal Health Operations</Text>
              </View>
            </View>
          </View>

          {/* Account Details Group */}
          <View className="mt-6">
            <Text className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Operational Details
            </Text>
            <View className="overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] divide-y divide-black/[0.05]">
              <ProfileDetail icon={<Mail size={17} color={Colors.primary} strokeWidth={2.2} />} label="Corporate Email" value={user.email} />
              <ProfileDetail icon={<ShieldCheck size={17} color={Colors.primary} strokeWidth={2.2} />} label="Assigned Role" value={roleLabels[user.role] || 'Field Specialist'} />
              {user.employeeCode && (
                <ProfileDetail icon={<IdCard size={17} color={Colors.primary} strokeWidth={2.2} />} label="Staff Code" value={user.employeeCode} mono />
              )}
              {user.phone && (
                <ProfileDetail icon={<Phone size={17} color={Colors.primary} strokeWidth={2.2} />} label="Direct Contact" value={user.phone} />
              )}
              <ProfileDetail icon={<Building2 size={17} color={Colors.primary} strokeWidth={2.2} />} label="Organization Entity" value="Marush (Pvt.) Ltd. • Ceva Veterinary Health" />
            </View>
          </View>

          {/* Tactile Logout Button */}
          <TouchableOpacity
            className="mt-8 flex-row items-center justify-between rounded-2xl border border-red-200/80 bg-red-50/60 px-5 py-4 shadow-sm transition-all"
            onPress={onLogout}
            accessibilityRole="button"
            activeOpacity={0.8}
            {...(Platform.OS === 'web'
              ? ({
                  style: {
                    transition: 'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out',
                  },
                } as any)
              : {})}
          >
            <View className="flex-row items-center gap-3.5">
              <View className="rounded-xl bg-white p-2 border border-red-100 shadow-sm">
                <LogOut size={16} color="#DC2626" strokeWidth={2.4} />
              </View>
                <Text className="text-sm font-bold text-red-700">Sign Out of Session</Text>
                <Text className="text-[11px] text-red-600/80">End active session securely on this device</Text>
            </View>
            <ChevronRight size={17} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

interface ProfileDetailProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}

const ProfileStatus: React.FC<{ status: UserProfile['status'] }> = ({ status }) => (
  <View className="flex-row items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 border border-white/25 shadow-sm">
    <CheckCircle2 size={13} color="#A7F3D0" strokeWidth={2.6} />
    <Text className="text-[10px] font-black uppercase tracking-wider text-emerald-100">{status}</Text>
  </View>
);

const ProfileDetail: React.FC<ProfileDetailProps> = ({ icon, label, value, mono = false }) => (
  <View className="flex-row items-center gap-3.5 px-5 py-3.5">
    <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100 border border-black/[0.04]">{icon}</View>
    <View className="min-w-0 flex-1">
      <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</Text>
      <Text className={`mt-0.5 text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value}</Text>
    </View>
  </View>
);
