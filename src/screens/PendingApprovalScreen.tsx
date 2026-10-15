import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import { ArrowLeft, Clock3, RefreshCw, ShieldX, UserCheck } from 'lucide-react-native';
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
    <View className="flex-1 items-center justify-center bg-marush-background p-4 md:p-6">
      <View className="w-full max-w-[500px] items-center rounded-3xl border border-marush-border bg-white p-8 md:p-10 shadow-xl">
        <MarushLogo size="sm" variant="mark" framed={false} />

        <View
          className={`mt-6 h-16 w-16 items-center justify-center rounded-2xl shadow-inner ${
            isRejected ? 'bg-red-50 text-red-600' : 'bg-marush-primary-subtle text-marush-primary'
          }`}
        >
          {isRejected ? (
            <ShieldX size={32} color="#DC2626" />
          ) : (
            <Clock3 size={32} color={Colors.primary} strokeWidth={2.2} />
          )}
        </View>

        <View className="mt-4 rounded-full bg-marush-subtle px-3.5 py-1">
          <Text
            className={`text-[10px] font-black tracking-wider uppercase ${
              isRejected ? 'text-red-700' : 'text-marush-primary'
            }`}
          >
            {isRejected ? 'ACCESS NOT APPROVED' : 'UNDER VERIFICATION'}
          </Text>
        </View>

        <Text className="mt-3 text-center text-2xl font-extrabold text-marush-text">
          {isRejected ? 'Access Not Granted' : 'Approval In Progress'}
        </Text>
        <Text className="mt-2 text-center text-sm leading-relaxed text-marush-muted">
          {isRejected
            ? 'Your registration was reviewed and not approved. Contact your operations manager for further clearance.'
            : 'Your corporate Google profile is registered. An administrator will review and assign your field permissions shortly.'}
        </Text>

        <View className="mt-6 mb-4 w-full divide-y divide-marush-border/80 rounded-2xl border border-marush-border bg-marush-subtle/50 px-4 py-1">
          <View className="flex-row items-center justify-between py-2.5">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-marush-muted-light">
              Full Name
            </Text>
            <Text className="text-right text-xs font-bold text-marush-text">
              {user.fullName}
            </Text>
          </View>
          <View className="flex-row items-center justify-between py-2.5">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-marush-muted-light">
              Corporate Email
            </Text>
            <Text className="text-right text-xs font-semibold text-marush-text">
              {user.email}
            </Text>
          </View>
          <View className="flex-row items-center justify-between py-2.5">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-marush-muted-light">
              Designation
            </Text>
            <Text className="text-right text-xs font-bold text-marush-primary">
              {(user.requestedRole || user.role).replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
          {user.employeeCode && (
            <View className="flex-row items-center justify-between py-2.5">
              <Text className="text-[11px] font-bold uppercase tracking-wider text-marush-muted-light">
                Employee ID
              </Text>
              <Text className="text-right text-xs font-mono font-bold text-marush-text">
                {user.employeeCode}
              </Text>
            </View>
          )}
        </View>

        {!isRejected && (
          <TouchableOpacity
            className={`min-h-12 w-full flex-row items-center justify-center gap-2 rounded-xl bg-marush-primary shadow-sm hover:bg-marush-primary-light active:bg-marush-primary-dark transition-all ${
              checking ? 'opacity-75' : ''
            }`}
            onPress={checkStatus}
            disabled={checking}
            activeOpacity={0.8}
          >
            {checking ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <RefreshCw size={16} color="#FFFFFF" />
                <Text className="text-sm font-bold text-white">Check Verification Status</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="mt-4 flex-row items-center justify-center gap-2 py-2"
          onPress={onBackToLogin}
          disabled={checking}
        >
          <ArrowLeft size={15} color={Colors.textSecondary} />
          <Text className="text-xs font-bold text-marush-muted hover:text-marush-primary">
            Back to Sign In
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
