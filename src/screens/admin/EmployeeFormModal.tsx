// admin/EmployeeFormModal.tsx
import { Save } from "lucide-react-native";
import React from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Colors, Spacing, Type } from "../../constants/design";
import { UserProfile, UserRole } from "../../types";
import { S } from "./styles";

interface EmployeeFormModalProps {
  visible: boolean;
  editing: UserProfile | null;
  isSuperUser: boolean;
  fullName: string;
  email: string;
  phone: string;
  code: string;
  role: UserRole;
  onChangeFullName: (v: string) => void;
  onChangeEmail: (v: string) => void;
  onChangePhone: (v: string) => void;
  onChangeCode: (v: string) => void;
  onChangeRole: (v: UserRole) => void;
  onCancel: () => void;
  onSave: () => void;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  visible,
  editing,
  fullName,
  email,
  phone,
  code,
  role,
  onChangeFullName,
  onChangeEmail,
  onChangePhone,
  onChangeCode,
  onCancel,
  onSave,
}) => {
  const isEditing = !!editing;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={S.modalOverlay}>
        <View style={S.modalCard}>
          <Text style={S.modalTitle}>
            {isEditing ? "Edit Employee Name" : "Add New Employee"}
          </Text>

          {isEditing && (
            <View style={{ marginBottom: Spacing.md }}>
              <Text
                style={{
                  ...Type.caption,
                  fontWeight: "700",
                  color: Colors.textPrimary,
                }}
              >
                ID: {code || "Not assigned"}
              </Text>
              <Text
                style={{
                  ...Type.caption,
                  color: Colors.textTertiary,
                  marginTop: 2,
                }}
              >
                Role: Field Specialist (Employee)
              </Text>
            </View>
          )}

          <TextInput
            style={S.modalInput}
            placeholder="Full Name"
            placeholderTextColor={Colors.textTertiary}
            value={fullName}
            onChangeText={onChangeFullName}
            autoFocus={isEditing}
          />

          {!isEditing && (
            <>
              <TextInput
                style={S.modalInput}
                placeholder={
                  role === "employee"
                    ? "Work Email (Optional — no login required)"
                    : "Work Email (Required for login)"
                }
                placeholderTextColor={Colors.textTertiary}
                value={email}
                onChangeText={onChangeEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={S.modalInput}
                placeholder="Phone / WhatsApp"
                placeholderTextColor={Colors.textTertiary}
                value={phone}
                onChangeText={onChangePhone}
              />
              <TextInput
                style={S.modalInput}
                placeholder="Employee Code"
                placeholderTextColor={Colors.textTertiary}
                value={code}
                onChangeText={onChangeCode}
              />
            </>
          )}

          <View style={S.modalBtnRow}>
            <TouchableOpacity onPress={onCancel} style={S.cancelModalBtn}>
              <Text style={S.cancelModalBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} style={S.confirmModalBtn}>
              <Save size={15} color={Colors.white} />
              <Text style={S.confirmModalBtnText}>
                {isEditing ? "Update Name" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
