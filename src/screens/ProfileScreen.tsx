import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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
  admin: 'Administrator',
  program_controller: 'Program Controller',
  program_auditor: 'Program Auditor',
  employee: 'Field Specialist',
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
    <ScrollView className="flex-1 bg-marush-background">
      <View className="flex-grow px-5 py-8 md:py-10">
        <View className="mx-auto w-full max-w-[760px]">
          <View className="mb-6">
            <Text className="text-[10px] font-bold tracking-[1.6px] text-marush-secondary-dark">
              ACCOUNT / PROFILE
            </Text>
            <Text className="mt-1 text-3xl font-extrabold tracking-tight text-marush-text">Your profile</Text>
            <Text className="mt-1.5 max-w-[600px] text-sm leading-5 text-marush-muted">
              Manage your verified identity and review the access assigned to your Marush account.
            </Text>
          </View>

          <View className="overflow-hidden rounded-2xl border border-marush-border bg-white shadow-sm">
            <View className={`bg-marush-primary ${isCompact ? 'px-5 py-5' : 'px-6 py-6'}`}>
              <View className={`items-center gap-4 ${isCompact ? 'flex-row' : 'flex-row flex-wrap'}`}>
                <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white/15">
                  <Text className="text-xl font-black text-white">{initials || 'U'}</Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text className={`${isCompact ? 'text-lg' : 'text-xl'} font-bold text-white`} numberOfLines={2}>
                    {user.fullName}
                  </Text>
                  <Text className="mt-1 text-sm font-medium text-emerald-100">
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
            <View className="flex-row flex-wrap gap-x-8 gap-y-3 border-t border-marush-border px-6 py-4">
              <View className="flex-row items-center gap-2">
                <ShieldCheck size={15} color={Colors.primary} strokeWidth={2.3} />
                <Text className="text-xs font-semibold text-marush-muted">Verified account</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Building2 size={15} color={Colors.primary} strokeWidth={2.3} />
                <Text className="text-xs font-semibold text-marush-muted">Marush Operations</Text>
              </View>
            </View>
          </View>

          <View className="mt-6">
            <Text className="mb-2.5 text-xs font-bold uppercase tracking-wider text-marush-muted">
              Account details
            </Text>
            <View className="overflow-hidden rounded-2xl border border-marush-border bg-white shadow-sm">
              <ProfileDetail icon={<Mail size={18} color={Colors.primary} strokeWidth={2.2} />} label="Corporate email" value={user.email} />
              <ProfileDetail icon={<ShieldCheck size={18} color={Colors.primary} strokeWidth={2.2} />} label="Permission scope" value={roleLabels[user.role] || 'Field Specialist'} />
              {user.employeeCode && (
                <ProfileDetail icon={<IdCard size={18} color={Colors.primary} strokeWidth={2.2} />} label="Staff ID badge" value={user.employeeCode} mono />
              )}
              {user.phone && (
                <ProfileDetail icon={<Phone size={18} color={Colors.primary} strokeWidth={2.2} />} label="Phone / WhatsApp" value={user.phone} />
              )}
              <ProfileDetail icon={<Building2 size={18} color={Colors.primary} strokeWidth={2.2} />} label="Organization unit" value="Marush (Pvt.) Ltd. • Ceva Veterinary Health" />
            </View>
          </View>

          <TouchableOpacity
            className="mt-8 flex-row items-center justify-between rounded-2xl border border-red-200 bg-red-50/70 px-5 py-4 shadow-sm active:opacity-80"
            onPress={onLogout}
            accessibilityRole="button"
          >
            <View className="flex-row items-center gap-3">
              <View className="rounded-lg bg-white p-2">
                <LogOut size={17} color="#DC2626" strokeWidth={2.2} />
              </View>
              <View>
                <Text className="text-sm font-bold text-red-700">Sign out of session</Text>
                <Text className="mt-0.5 text-[11px] text-red-600/80">You will need to sign in again to continue.</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#DC2626" />
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
  <View className="flex-row items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
    <CheckCircle2 size={14} color="#A7F3D0" strokeWidth={2.5} />
    <Text className="text-[10px] font-bold uppercase tracking-wide text-emerald-100">{status}</Text>
  </View>
);

const ProfileDetail: React.FC<ProfileDetailProps> = ({ icon, label, value, mono = false }) => (
  <View className="flex-row items-center gap-3.5 border-b border-marush-border/80 px-5 py-4 last:border-b-0">
    <View className="h-10 w-10 items-center justify-center rounded-xl bg-marush-primary-subtle">{icon}</View>
    <View className="min-w-0 flex-1">
      <Text className="text-[10px] font-bold uppercase tracking-wider text-marush-muted-light">{label}</Text>
      <Text className={`mt-0.5 text-sm font-semibold text-marush-text ${mono ? 'font-mono' : ''}`}>{value}</Text>
    </View>
  </View>
);
