import {
  AlertTriangle,
  CheckCircle2,
  LogOut,
  Send,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Radii, Shadows, Spacing, Type } from "../constants/design";

export type ConfirmVariant = "danger" | "warning" | "primary";

export type ConfirmIconType =
  | "trash"
  | "alert"
  | "warning"
  | "shield"
  | "check"
  | "logout"
  | "send"
  | "user-check"
  | "user-x";

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
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  icon = "shield",
  onConfirm,
  onClose,
  onCancel,
}) => {
  const [submitting, setSubmitting] = useState(false);

  // Entrance animation
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

  // Define semantic colors based on variant
  const variantColor =
    variant === "danger"
      ? Colors.danger
      : variant === "warning"
        ? Colors.warning
        : Colors.accent;

  const variantBg =
    variant === "danger"
      ? Colors.dangerSubtle
      : variant === "warning"
        ? Colors.warningSubtle
        : Colors.accentSubtle;

  const variantBorder =
    variant === "danger"
      ? Colors.dangerBorder
      : variant === "warning"
        ? Colors.warningBorder
        : Colors.accentBorder;

  const renderIcon = () => {
    const iconColor =
      icon === "trash" || icon === "logout" || icon === "user-x"
        ? Colors.danger
        : icon === "warning" || icon === "alert"
          ? Colors.warning
          : icon === "shield" && variant === "danger"
            ? Colors.danger
            : Colors.accent;

    switch (icon) {
      case "trash":
        return <Trash2 size={24} color={iconColor} strokeWidth={2.4} />;
      case "logout":
        return <LogOut size={24} color={iconColor} strokeWidth={2.4} />;
      case "user-x":
        return <UserX size={24} color={iconColor} strokeWidth={2.4} />;
      case "warning":
      case "alert":
        return <AlertTriangle size={24} color={iconColor} strokeWidth={2.4} />;
      case "send":
        return <Send size={24} color={iconColor} strokeWidth={2.4} />;
      case "user-check":
        return <UserCheck size={24} color={iconColor} strokeWidth={2.4} />;
      case "check":
        return <CheckCircle2 size={24} color={iconColor} strokeWidth={2.4} />;
      case "shield":
      default:
        return <ShieldAlert size={24} color={iconColor} strokeWidth={2.4} />;
    }
  };

  const badgeLabel =
    variant === "danger"
      ? "Security action"
      : variant === "warning"
        ? "Verification required"
        : "Confirmation";

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="none"
      onRequestClose={handleCancel}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: Spacing.lg,
          backgroundColor: Colors.surfaceOverlay,
          ...(Platform.OS === "web"
            ? ({ backdropFilter: "blur(8px)" } as any)
            : {}),
        }}
      >
        <Animated.View
          style={{
            width: "100%",
            maxWidth: 420,
            borderRadius: Radii["2xl"],
            borderWidth: 1,
            borderColor: Colors.border,
            backgroundColor: Colors.surfaceElevated,
            padding: Spacing.xl,
            ...Shadows.popover,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          {/* Header with Icon & Title */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: Spacing.md,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                flexShrink: 0,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: Radii.lg,
                backgroundColor: variantBg,
                borderWidth: 1,
                borderColor: variantBorder,
              }}
            >
              {renderIcon()}
            </View>
            <View style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <Text
                style={{
                  ...Type.eyebrow,
                  fontSize: 9,
                  letterSpacing: 1.5,
                  color: variantColor,
                }}
              >
                {badgeLabel}
              </Text>
              <Text
                style={{
                  ...Type.h3,
                  fontWeight: "700",
                  color: Colors.textPrimary,
                  marginTop: Spacing.xs,
                }}
              >
                {title}
              </Text>
            </View>
          </View>

          {/* Message */}
          <Text
            style={{
              ...Type.body,
              color: Colors.textSecondary,
              marginTop: Spacing.xl,
              lineHeight: 21,
            }}
          >
            {message}
          </Text>

          {/* Helper Note */}
          <View
            style={{
              marginTop: Spacing.xl,
              paddingHorizontal: Spacing.md + 2,
              paddingVertical: Spacing.md,
              borderRadius: Radii.lg,
              borderWidth: 1,
              borderColor: Colors.border,
              backgroundColor: Colors.surfaceInput,
            }}
          >
            <Text
              style={{
                ...Type.caption,
                color: Colors.textSecondary,
                lineHeight: 17,
              }}
            >
              {variant === "danger"
                ? "You can sign in again at any time using your approved account."
                : "Review this action before continuing."}
            </Text>
          </View>

          {/* Buttons */}
          <View
            style={{
              marginTop: Spacing.xl,
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.md,
            }}
          >
            <TouchableOpacity
              onPress={handleCancel}
              disabled={submitting}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={cancelText}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: Spacing.md,
                borderRadius: Radii.md,
                borderWidth: 1,
                borderColor: Colors.border,
                backgroundColor: Colors.surfaceInput,
              }}
            >
              <Text
                style={{
                  ...Type.caption,
                  fontWeight: "700",
                  color: Colors.textPrimary,
                }}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              disabled={submitting}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={confirmText}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: Spacing.md,
                borderRadius: Radii.md,
                backgroundColor: variantColor,
                opacity: submitting ? 0.7 : 1,
                ...(submitting ? {} : Shadows.accentGlow),
              }}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text
                  style={{
                    ...Type.caption,
                    fontWeight: "700",
                    color: Colors.white,
                  }}
                >
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
      title: "",
      message: "",
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
