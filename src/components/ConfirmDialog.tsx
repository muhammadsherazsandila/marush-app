import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import {
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  LogOut,
  Send,
  UserCheck,
  UserX,
} from 'lucide-react-native';
import { Colors } from '../constants/colors';

export type ConfirmVariant = 'danger' | 'warning' | 'primary';

export type ConfirmIconType =
  | 'trash'
  | 'alert'
  | 'warning'
  | 'shield'
  | 'check'
  | 'logout'
  | 'send'
  | 'user-check'
  | 'user-x';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: ConfirmIconType;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface ConfirmDialogProps extends ConfirmDialogOptions {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  icon = 'shield',
  onConfirm,
  onClose,
  onCancel,
}) => {
  const [submitting, setSubmitting] = useState(false);

  // Emil Kowalski animation craft: entrance from scale(0.95) with opacity 0 (duration 180ms ease-out)
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      scaleAnim.setValue(0.95);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, scaleAnim, opacityAnim]);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (submitting) return;
    if (onCancel) onCancel();
    onClose();
  };

  if (!isOpen) return null;

  const renderIcon = () => {
    switch (icon) {
      case 'trash':
        return <Trash2 size={24} color="#DC2626" strokeWidth={2.4} />;
      case 'logout':
        return <LogOut size={24} color="#DC2626" strokeWidth={2.4} />;
      case 'user-x':
        return <UserX size={24} color="#DC2626" strokeWidth={2.4} />;
      case 'warning':
      case 'alert':
        return <AlertTriangle size={24} color="#D97706" strokeWidth={2.4} />;
      case 'send':
        return <Send size={24} color={Colors.primary} strokeWidth={2.4} />;
      case 'user-check':
        return <UserCheck size={24} color={Colors.primary} strokeWidth={2.4} />;
      case 'check':
        return <CheckCircle2 size={24} color={Colors.primary} strokeWidth={2.4} />;
      case 'shield':
      default:
        return <ShieldAlert size={24} color={variant === 'danger' ? '#DC2626' : Colors.primary} strokeWidth={2.4} />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBox: 'bg-red-50 border-red-200/80',
          confirmBtn: 'bg-red-600 hover:bg-red-700 shadow-[0_2px_8px_rgba(220,38,38,0.22)]',
          badge: 'text-red-700 bg-red-50 border-red-200/80',
        };
      case 'warning':
        return {
          iconBox: 'bg-amber-50 border-amber-200/80',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 shadow-[0_2px_8px_rgba(217,119,6,0.22)]',
          badge: 'text-amber-700 bg-amber-50 border-amber-200/80',
        };
      case 'primary':
      default:
        return {
          iconBox: 'bg-marush-primary-subtle border-marush-primary/15',
          confirmBtn: 'bg-marush-primary hover:bg-marush-primary-light shadow-[0_2px_8px_rgba(0,79,66,0.2)]',
          badge: 'text-marush-primary bg-marush-primary-subtle border-marush-primary/15',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      onRequestClose={handleCancel}
    >
      <View
        className="flex-1 items-center justify-center p-4"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.48)',
          ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as any) : {}),
        }}
      >
        <Animated.View
          className="w-full max-w-[440px] rounded-3xl border border-black/[0.08] bg-white p-6 md:p-7 shadow-2xl"
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          {/* Top row: Icon well & variant badge */}
          <View className="flex-row items-center justify-between">
            <View
              className={`h-14 w-14 items-center justify-center rounded-2xl border ${variantStyles.iconBox}`}
            >
              {renderIcon()}
            </View>
            <View className={`rounded-full border px-3 py-1 ${variantStyles.badge}`}>
              <Text className="text-[10px] font-black uppercase tracking-wider">
                {variant === 'danger' ? 'CONFIRM ACTION' : variant === 'warning' ? 'VERIFICATION REQUIRED' : 'CONFIRMATION'}
              </Text>
            </View>
          </View>

          {/* Title & Description */}
          <Text className="mt-4 text-xl font-black tracking-tight text-slate-900">
            {title}
          </Text>
          <Text className="mt-1.5 text-sm leading-relaxed text-slate-500">
            {message}
          </Text>

          {/* Action Button Row */}
          <View className="mt-6 flex-row items-center justify-end gap-3">
            <TouchableOpacity
              className="min-w-[100px] flex-1 items-center rounded-2xl border border-black/[0.08] bg-slate-50 px-4 py-3 active:scale-[0.97]"
              onPress={handleCancel}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text className="text-xs font-bold text-slate-600">{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`min-w-[140px] flex-1 items-center rounded-2xl px-4 py-3 transition-all active:scale-[0.97] ${variantStyles.confirmBtn} ${
                submitting ? 'opacity-70' : ''
              }`}
              onPress={handleConfirm}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-xs font-bold text-white tracking-tight">
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

/**
 * Convenient Hook for declarative confirmation invocations across any component
 */
export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions;
  }>({
    isOpen: false,
    options: {
      title: '',
      message: '',
      onConfirm: () => {},
    },
  });

  const confirm = useCallback((options: ConfirmDialogOptions) => {
    setDialogState({
      isOpen: true,
      options,
    });
  }, []);

  const close = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const ConfirmDialogElement = (
    <ConfirmDialog
      isOpen={dialogState.isOpen}
      onClose={close}
      title={dialogState.options.title}
      message={dialogState.options.message}
      confirmText={dialogState.options.confirmText}
      cancelText={dialogState.options.cancelText}
      variant={dialogState.options.variant}
      icon={dialogState.options.icon}
      onConfirm={dialogState.options.onConfirm}
      onCancel={dialogState.options.onCancel}
    />
  );

  return {
    confirm,
    close,
    ConfirmDialogElement,
  };
}
