// admin/ProgramInspectionModal.tsx
import { X } from "lucide-react-native";
import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Colors, Radii, Spacing, Type } from "../../constants/design";
import { Program } from "../../types";
import { S } from "./styles";

interface ProgramInspectionModalProps {
  program: Program | null;
  onClose: () => void;
}

const DetailRow: React.FC<{
  label: string;
  value: string | number | undefined | null;
  accent?: boolean;
}> = ({ label, value, accent }) => (
  <View style={S.detailRow}>
    <Text style={S.detailLabel}>{label}</Text>
    <Text
      style={[S.detailValue, accent && S.detailValueAccent]}
      numberOfLines={3}
    >
      {value ?? "—"}
    </Text>
  </View>
);

const BooleanRow: React.FC<{
  label: string;
  passed: boolean | undefined;
}> = ({ label, passed }) => {
  const ok = passed !== false;
  return (
    <View style={S.detailRow}>
      <Text style={S.detailLabel}>{label}</Text>
      <Text
        style={{
          ...Type.caption,
          fontWeight: "700",
          color: ok ? Colors.success : Colors.danger,
        }}
      >
        {ok ? "✓ Verified" : "✕ Discrepancy"}
      </Text>
    </View>
  );
};

export const ProgramInspectionModal: React.FC<ProgramInspectionModalProps> = ({
  program,
  onClose,
}) => {
  if (!program) return null;

  const teamNames =
    program.teamMembers && program.teamMembers.length > 0
      ? program.teamMembers.map((m) => m.fullName).join(", ")
      : `${program.teamMemberIds?.length || 0} members assigned`;

  return (
    <Modal visible transparent animationType="fade">
      <View style={S.modalOverlay}>
        <View style={S.modalCard}>
          <Text style={S.modalTitle}>{program.programName}</Text>
          <Text style={S.modalSub}>{program.hatcheryOrFarmName}</Text>

          <ScrollView style={S.modalBody}>
            {/* ── 1. Status & basic details */}
            <View style={S.detailSection}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: Spacing.sm,
                  marginBottom: Spacing.xs,
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.borderSubtle,
                }}
              >
                <Text style={S.detailSectionTitle}>Program Status</Text>
                <View
                  style={{
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 2,
                    borderRadius: Radii.sm,
                    backgroundColor: Colors.accentSubtle,
                    borderWidth: 1,
                    borderColor: Colors.accentBorder,
                  }}
                >
                  <Text
                    style={{
                      ...Type.eyebrow,
                      fontSize: 9,
                      color: Colors.accent,
                    }}
                  >
                    {program.status.replace(/_/g, " ")}
                  </Text>
                </View>
              </View>

              <DetailRow
                label="Farm / Hatchery"
                value={program.hatcheryOrFarmName}
              />
              {program.farmAddress ? (
                <DetailRow label="Farm Address" value={program.farmAddress} />
              ) : null}
              {program.farmManagerName ? (
                <DetailRow
                  label="Farm / Hatchery Manager"
                  value={program.farmManagerName}
                />
              ) : null}
              <DetailRow
                label="Lead Controller"
                value={program.controllerName || "Unassigned"}
                accent
              />
              <DetailRow
                label="Assigned Auditor"
                value={program.auditorName || "Pending assignment"}
              />
              <DetailRow label="Vaccinator Team" value={teamNames} />
              <DetailRow
                label="Date & Time"
                value={`${program.scheduledStartDate} at ${program.scheduledStartTime}`}
              />
            </View>

            {/* ── 2. Flock & vaccines */}
            <View style={S.detailSection}>
              <Text style={S.detailSectionTitle}>
                Flock & Vaccine Specifications
              </Text>
              <DetailRow
                label="Total Flock Size"
                value={`${program.flockSize.toLocaleString()} birds`}
              />
              {program.birdDetails ? (
                <DetailRow
                  label="Categorized Breakdown"
                  value={`B: ${program.birdDetails.b || 0} · L: ${program.birdDetails.l || 0} · Br: ${program.birdDetails.br || 0}`}
                />
              ) : null}
              <DetailRow
                label="Vaccine(s) Used"
                value={
                  program.vaccinesUsed && program.vaccinesUsed.length > 0
                    ? program.vaccinesUsed.join(", ")
                    : program.completionMetrics?.vaccineType ||
                      "Standard Ceva Program"
                }
              />
            </View>

            {/* ── 3. Travel schedule */}
            {(program.travelDepartureTime ||
              program.travelArrivalTime ||
              program.returnDepartureTime ||
              program.returnArrivalTime) && (
              <View style={S.detailSection}>
                <Text style={S.detailSectionTitle}>
                  Travel & Return Schedule
                </Text>
                <DetailRow
                  label="Departure from Office"
                  value={program.travelDepartureTime || "N/A"}
                />
                <DetailRow
                  label="Arrival at Farm"
                  value={program.travelArrivalTime || "N/A"}
                />
                <DetailRow
                  label="Departure from Farm"
                  value={program.returnDepartureTime || "N/A"}
                />
                <DetailRow
                  label="Return to Office"
                  value={program.returnArrivalTime || "N/A"}
                />
              </View>
            )}

            {/* ── 4. Controller remarks */}
            {program.controllerRemarks ? (
              <View style={S.detailSection}>
                <Text style={S.detailSectionTitle}>
                  Controller Observations
                </Text>
                <Text
                  style={{
                    ...Type.caption,
                    fontStyle: "italic",
                    color: Colors.textSecondary,
                  }}
                >
                  "{program.controllerRemarks}"
                </Text>
              </View>
            ) : null}

            {/* ── 5. Auditor findings */}
            {(program.auditorRemarks || program.auditDetails) && (
              <View style={S.detailSection}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: Spacing.sm,
                    marginBottom: Spacing.xs,
                    borderBottomWidth: 1,
                    borderBottomColor: Colors.borderSubtle,
                  }}
                >
                  <Text style={S.detailSectionTitle}>Auditor Findings</Text>
                  {program.auditScore != null ? (
                    <View
                      style={{
                        paddingHorizontal: Spacing.sm,
                        paddingVertical: 2,
                        borderRadius: Radii.sm,
                        backgroundColor: Colors.accentSubtle,
                      }}
                    >
                      <Text
                        style={{
                          ...Type.caption,
                          fontWeight: "700",
                          color: Colors.accent,
                        }}
                      >
                        Score: {program.auditScore}/100
                      </Text>
                    </View>
                  ) : null}
                </View>

                {program.auditDetails ? (
                  <>
                    <BooleanRow
                      label="Bird Count Verification"
                      passed={program.auditDetails.birdCountVerified}
                    />
                    <BooleanRow
                      label="Vaccine Verification"
                      passed={program.auditDetails.vaccineVerified}
                    />
                    <BooleanRow
                      label="Timing Verification"
                      passed={program.auditDetails.timingVerified}
                    />
                    <BooleanRow
                      label="Uniform & PPE Compliance"
                      passed={program.auditDetails.uniformCompliance}
                    />
                    {program.auditDetails.overallAuditResult ? (
                      <DetailRow
                        label="Overall Result"
                        value={program.auditDetails.overallAuditResult.replace(
                          /_/g,
                          " ",
                        )}
                        accent
                      />
                    ) : null}
                    {program.auditDetails.vaccinationQualityAssessment ? (
                      <View style={{ marginTop: Spacing.sm }}>
                        <Text style={S.detailLabel}>Quality Assessment</Text>
                        <Text
                          style={{
                            ...Type.caption,
                            color: Colors.textPrimary,
                            marginTop: Spacing.xs,
                          }}
                        >
                          {program.auditDetails.vaccinationQualityAssessment}
                        </Text>
                      </View>
                    ) : null}
                    {program.auditDetails.vaccinatorBehaviorAssessment ? (
                      <View style={{ marginTop: Spacing.sm }}>
                        <Text style={S.detailLabel}>Vaccinator Behavior</Text>
                        <Text
                          style={{
                            ...Type.caption,
                            color: Colors.textPrimary,
                            marginTop: Spacing.xs,
                          }}
                        >
                          {program.auditDetails.vaccinatorBehaviorAssessment}
                        </Text>
                      </View>
                    ) : null}
                  </>
                ) : null}

                {program.auditorRemarks ? (
                  <View style={{ marginTop: Spacing.md }}>
                    <Text style={S.detailLabel}>Remarks & Recommendations</Text>
                    <Text
                      style={{
                        ...Type.caption,
                        fontStyle: "italic",
                        color: Colors.accent,
                        marginTop: Spacing.xs,
                      }}
                    >
                      "{program.auditorRemarks}"
                    </Text>
                  </View>
                ) : null}
              </View>
            )}

            {/* ── 6. Metrics */}
            {program.completionMetrics ? (
              <View style={S.detailSection}>
                <Text style={S.detailSectionTitle}>
                  Cold-Chain & Injection Metrics
                </Text>
                <DetailRow
                  label="Birds Vaccinated"
                  value={program.completionMetrics.birdsVaccinated.toLocaleString()}
                />
                <DetailRow
                  label="Dosage per Bird"
                  value={program.completionMetrics.dosagePerBird}
                />
                <DetailRow
                  label="Vaccine Batch"
                  value={program.completionMetrics.batchNumber}
                />
                <DetailRow
                  label="Cold Chain Temp"
                  value={`${program.completionMetrics.coldChainTempCelsius}°C`}
                  accent
                />
                <DetailRow
                  label="Field Observations"
                  value={program.completionMetrics.farmFlockObservations}
                />
              </View>
            ) : null}
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={S.closeBtn}>
            <X size={15} color={Colors.white} />
            <Text style={S.closeBtnText}>Close Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
