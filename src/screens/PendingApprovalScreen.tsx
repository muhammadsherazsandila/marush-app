import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { ArrowLeft, Clock3, RefreshCw, ShieldX } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { UserProfile } from '../types';
import { dataProvider } from '../services';
import { MarushLogo } from '../components/MarushLogo';

interface PendingApprovalScreenProps {
  user: UserProfile;
  onApproved: (updatedUser: UserProfile) => void;
  onBackToLogin: () => void;
}

export const PendingApprovalScreen: React.FC<PendingApprovalScreenProps> = ({
  user,
  onApproved,
  onBackToLogin,
}) => {
  const [checking, setChecking] = useState(false);
  const isRejected = user.status === 'rejected';

  const checkStatus = async () => {
    setChecking(true);
    try {
      const refreshed = await dataProvider.getUserById(user.id);
      setChecking(false);

      if (!refreshed) {
        Toast.show({
          type: 'error',
          text1: 'Account Error',
          text2: 'Account record could not be found.',
        });
        return;
      }

      if (refreshed.status === 'approved') {
        Toast.show({
          type: 'success',
          text1: 'Account Approved!',
          text2: `Welcome to Marush, ${refreshed.fullName}`,
        });
        dataProvider.setCurrentUser(refreshed);
        onApproved(refreshed);
      } else if (refreshed.status === 'rejected') {
        dataProvider.setCurrentUser(refreshed);
        onApproved(refreshed);
        Toast.show({
          type: 'error',
          text1: 'Registration Declined',
          text2: 'Administrator declined this registration request.',
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Status: Pending',
          text2: 'Awaiting Administrator verification and approval.',
        });
      }
    } catch (err: any) {
      setChecking(false);
      Toast.show({
        type: 'error',
        text1: 'Verification Check Failed',
        text2: err?.message || 'Network error checking status',
      });
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-slate-50 p-4 md:p-6">
      <View className="w-full max-w-[480px] items-center rounded-3xl border border-black/[0.07] bg-white p-7 md:p-9 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
        <MarushLogo size="sm" variant="mark" framed={false} />

        <View
          className={`mt-6 h-16 w-16 items-center justify-center rounded-2xl border ${
            isRejected ? 'bg-red-50 border-red-200' : 'bg-marush-primary-subtle border-marush-primary/15'
          }`}
        >
          {isRejected ? (
            <ShieldX size={30} color="#DC2626" strokeWidth={2.2} />
          ) : (
            <Clock3 size={30} color={Colors.primary} strokeWidth={2.2} />
          )}
        </View>

        <View className="mt-4 rounded-full border border-black/[0.06] bg-slate-50 px-3.5 py-1">
          <Text
            className={`text-[10px] font-black tracking-wider uppercase ${
              isRejected ? 'text-red-700' : 'text-marush-primary'
            }`}
          >
            {isRejected ? 'ACCESS DECLINED' : 'PENDING ADMINISTRATIVE REVIEW'}
          </Text>
        </View>

        <Text className="mt-3 text-center text-2xl font-black tracking-tight text-slate-900">
          {isRejected ? 'Access Not Granted' : 'Verification In Progress'}
        </Text>
        <Text className="mt-1.5 text-center text-xs md:text-sm leading-relaxed text-slate-500">
          {isRejected
            ? 'Your registration was reviewed and not approved. Contact your operations manager for clearance.'
            : 'Your corporate Google profile has been created. An administrator will verify and assign your permissions shortly.'}
        </Text>

        <View className="mt-5 mb-4 w-full divide-y divide-black/[0.05] rounded-2xl border border-black/[0.06] bg-slate-50/70 px-4 py-1">
          <View className="flex-row items-center justify-between py-2.5">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Full Name
            </Text>
            <Text className="text-right text-xs font-bold text-slate-800">
              {user.fullName}
            </Text>
          </View>
          <View className="flex-row items-center justify-between py-2.5">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Corporate Email
            </Text>
            <Text className="text-right text-xs font-medium text-slate-700">
              {user.email}
            </Text>
          </View>
          <View className="flex-row items-center justify-between py-2.5">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Requested Role
            </Text>
            <Text className="text-right text-xs font-bold text-marush-primary">
              {(user.requestedRole || user.role).replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {!isRejected && (
          <TouchableOpacity
            className={`min-h-[48px] w-full flex-row items-center justify-center gap-2 rounded-2xl bg-marush-primary px-4 shadow-[0_2px_8px_rgba(0,79,66,0.18)] transition-all ${
              checking ? 'opacity-75' : ''
            }`}
            onPress={checkStatus}
            disabled={checking}
            activeOpacity={0.85}
            {...(Platform.OS === 'web'
              ? ({
                  style: {
                    transition: 'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 140ms ease-out',
                  },
                } as any)
              : {})}
          >
            {checking ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <RefreshCw size={15} color="#FFFFFF" strokeWidth={2.4} />
                <Text className="text-sm font-bold text-white tracking-tight">Check Verification Status</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="mt-4 flex-row items-center justify-center gap-2 py-2"
          onPress={onBackToLogin}
          disabled={checking}
          activeOpacity={0.7}
        >
          <ArrowLeft size={14} color={Colors.textSecondary} />
          <Text className="text-xs font-bold text-slate-500 hover:text-slate-800">
            Back to Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
