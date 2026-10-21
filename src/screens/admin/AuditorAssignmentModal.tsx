// admin/AuditorAssignmentModal.tsx
import React from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Radii, Spacing, Type } from "../../constants/design";
import { Program, UserProfile } from "../../types";
import { S } from "./styles";

interface AuditorAssignmentModalProps {
  program: Program | null;
  availableAuditors: UserProfile[];
  selectedAuditorId: string;
  saving: boolean;
  busyAuditors?: Map<string, string>;
  onSelect: (id: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export const AuditorAssignmentModal: React.FC<AuditorAssignmentModalProps> = ({
  program,
  availableAuditors,
  selectedAuditorId,
  saving,
  busyAuditors,
  onSelect,
  onCancel,
  onSave,
}) => {
  if (!program) return null;

  const isSelectedBusy =
    !!selectedAuditorId &&
    !!busyAuditors?.has(selectedAuditorId) &&
    program.auditorId !== selectedAuditorId;

  const canSave = !!selectedAuditorId && !saving && !isSelectedBusy;

  return (
    <Modal visible transparent animationType="fade">
      <View style={S.modalOverlay}>
        <View style={S.modalCard}>
          <Text style={S.modalTitle}>Assign Program Auditor</Text>
          <Text style={S.modalSub}>{program.programName}</Text>

          <ScrollView style={{ maxHeight: 320, marginVertical: Spacing.md }}>
            {availableAuditors.length === 0 ? (
              <Text style={S.emptyText}>
                There are no approved program auditors to assign.
              </Text>
            ) : (
              availableAuditors.map((auditor) => {
                const selected = selectedAuditorId === auditor.id;
                const assignedProgramName = busyAuditors?.get(auditor.id);
                const isBusy =
                  !!assignedProgramName && program.auditorId !== auditor.id;

                return (
                  <TouchableOpacity
                    key={auditor.id}
                    onPress={() => !isBusy && onSelect(auditor.id)}
                    disabled={isBusy}
                    style={{
                      marginBottom: Spacing.sm,
                      padding: Spacing.md + 2,
                      borderRadius: Radii.md,
                      borderWidth: 1,
                      borderStyle: isBusy ? "dashed" : "solid",
                      borderColor: selected
                        ? Colors.accent
                        : isBusy
                          ? Colors.border
                          : Colors.border,
                      backgroundColor: selected
                        ? Colors.accentSubtle
                        : Colors.surfaceInput,
                      opacity: isBusy ? 0.55 : 1,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          ...Type.bodyStrong,
                          color: isBusy
                            ? Colors.textSecondary
                            : Colors.textPrimary,
                        }}
                      >
                        {auditor.fullName}
                      </Text>
                      {isBusy && (
                        <View
                          style={{
                            paddingHorizontal: Spacing.xs + 2,
                            paddingVertical: 2,
                            borderRadius: Radii.sm,
                            backgroundColor: "rgba(245, 158, 11, 0.15)",
                          }}
                        >
                          <Text
                            style={{
                              ...Type.caption,
                              fontSize: 10,
                              fontWeight: "700",
                              color: Colors.warning,
                            }}
                          >
                            BUSY
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={{
                        ...Type.caption,
                        color: Colors.textTertiary,
                        marginTop: Spacing.xs,
                      }}
                    >
                      {auditor.email}
                    </Text>
                    {isBusy && (
                      <Text
                        style={{
                          ...Type.caption,
                          fontSize: 11,
                          color: Colors.warning,
                          marginTop: 4,
                        }}
                      >
                        Currently assigned to &quot;{assignedProgramName}&quot;
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <View style={S.modalBtnRow}>
            <TouchableOpacity onPress={onCancel} style={S.cancelModalBtn}>
              <Text style={S.cancelModalBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSave}
              disabled={!canSave}
              style={{
                ...S.confirmModalBtn,
                opacity: canSave ? 1 : 0.5,
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={S.confirmModalBtnText}>Save Auditor</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
