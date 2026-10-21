import {
  AlertTriangle,
  Check,
  CircleX,
  ClipboardCheck,
  Clock3,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useConfirmDialog } from "../components/ConfirmDialog";
import { Colors, Radii, Shadows, Spacing, Type } from "../constants/design";
import { dataProvider } from "../services";
import {
  Program,
  ProgramCompletionMetrics,
  ProgramDraft,
  ProgramStatus,
  UserProfile,
} from "../types";

interface ProgramControllerDashboardProps {
  currentUser: UserProfile;
  activeArea: "overview" | "programs";
}

export const ProgramControllerDashboard: React.FC<
  ProgramControllerDashboardProps
> = ({ currentUser, activeArea }) => {
  const [activeTab, setActiveTab] = useState<"my_programs" | "initiate">(
    "my_programs",
  );
  const [programFilter, setProgramFilter] = useState<ProgramStatus | "all">(
    "all",
  );
  const [programs, setPrograms] = useState<Program[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<UserProfile[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State for Program Initiation
  const [programName, setProgramName] = useState("");
  const [hatcheryOrFarm, setHatcheryOrFarm] = useState("");
  const [farmAddress, setFarmAddress] = useState("");
  const [farmManagerName, setFarmManagerName] = useState("");

  // Bird counts categorized as B, L, Br
  const [birdBreeder, setBirdBreeder] = useState("");
  const [birdLayer, setBirdLayer] = useState("");
  const [birdBroiler, setBirdBroiler] = useState("");
  const [flockSize, setFlockSize] = useState("");

  // Vaccines
  const [vaccinesUsed, setVaccinesUsed] = useState(
    "Vectormune ND + Cevac Transmune",
  );

  // Dates & Times
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [startTime, setStartTime] = useState("08:00 AM");
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endTime, setEndTime] = useState("04:00 PM");

  // Travel schedule
  const [travelDepartureTime, setTravelDepartureTime] = useState("06:30 AM");
  const [travelArrivalTime, setTravelArrivalTime] = useState("07:45 AM");

  // Vaccination schedule
  const [vaccinationStartedAtTime, setVaccinationStartedAtTime] =
    useState("08:15 AM");
  const [vaccinationCompletedAtTime, setVaccinationCompletedAtTime] =
    useState("03:45 PM");

  // Return schedule
  const [returnDepartureTime, setReturnDepartureTime] = useState("04:15 PM");
  const [returnArrivalTime, setReturnArrivalTime] = useState("05:30 PM");

  // Controller Remarks
  const [controllerRemarks, setControllerRemarks] = useState("");

  // Team Details
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [empSearchQuery, setEmpSearchQuery] = useState<string>("");
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  const filteredAvailableEmployees = availableEmployees.filter(
    (emp) =>
      emp.fullName.toLowerCase().includes(empSearchQuery.toLowerCase()) ||
      (emp.employeeCode &&
        emp.employeeCode
          .toLowerCase()
          .includes(empSearchQuery.toLowerCase())) ||
      (emp.email &&
        emp.email.toLowerCase().includes(empSearchQuery.toLowerCase())),
  );

  // End Program / Submit to Admin Modal
  const [endingProgram, setEndingProgram] = useState<Program | null>(null);
  const [birdsVaccinated, setBirdsVaccinated] = useState("");
  const [dosagePerBird, setDosagePerBird] = useState(
    "0.05 ml via automated Ceva Egginject",
  );
  const [batchNumber, setBatchNumber] = useState("VND-2026-PK");
  const [vaccineType, setVaccineType] = useState(
    "Vectormune ND + Cevac Transmune",
  );
  const [coldChainTemp, setColdChainTemp] = useState("4.0");
  const [equipmentCheckPassed, setEquipmentCheckPassed] = useState(true);
  const [farmFlockNotes, setFarmFlockNotes] = useState(
    "Flock condition optimal. Sterilization protocol followed.",
  );

  const { confirm, ConfirmDialogElement } = useConfirmDialog();

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const [allProgs, available] = await Promise.all([
        dataProvider.getPrograms(),
        dataProvider.getAvailableEmployees(),
      ]);
      setPrograms(allProgs);
      setAvailableEmployees(available);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Unable to load program data",
        text2: error?.message || "Check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    let cancelled = false;
    dataProvider
      .getProgramDraft(currentUser.id)
      .then((draft) => {
        if (cancelled || !draft) {
          if (!cancelled) setDraftHydrated(true);
          return;
        }
        setProgramName(draft.programName);
        setHatcheryOrFarm(draft.hatcheryOrFarm);
        setFarmAddress(draft.farmAddress);
        setFarmManagerName(draft.farmManagerName);
        setBirdBreeder(draft.birdBreeder);
        setBirdLayer(draft.birdLayer);
        setBirdBroiler(draft.birdBroiler);
        setFlockSize(draft.flockSize);
        setVaccinesUsed(draft.vaccinesUsed);
        setStartDate(draft.startDate);
        setStartTime(draft.startTime);
        setEndDate(draft.endDate);
        setEndTime(draft.endTime);
        setTravelDepartureTime(draft.travelDepartureTime);
        setTravelArrivalTime(draft.travelArrivalTime);
        setVaccinationStartedAtTime(draft.vaccinationStartedAtTime);
        setVaccinationCompletedAtTime(draft.vaccinationCompletedAtTime);
        setReturnDepartureTime(draft.returnDepartureTime);
        setReturnArrivalTime(draft.returnArrivalTime);
        setControllerRemarks(draft.controllerRemarks);
        setSelectedEmpIds(draft.selectedEmpIds);
        setDraftSavedAt(draft.savedAt);
        setDraftHydrated(true);
      })
      .catch((error: any) => {
        if (!cancelled) {
          setDraftHydrated(true);
          Toast.show({
            type: "error",
            text1: "Draft could not be restored",
            text2: error?.message || "You can continue with a new schedule.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser.id]);

  const getDraft = (): ProgramDraft => ({
    programName,
    hatcheryOrFarm,
    farmAddress,
    farmManagerName,
    birdBreeder,
    birdLayer,
    birdBroiler,
    flockSize,
    vaccinesUsed,
    startDate,
    startTime,
    endDate,
    endTime,
    travelDepartureTime,
    travelArrivalTime,
    vaccinationStartedAtTime,
    vaccinationCompletedAtTime,
    returnDepartureTime,
    returnArrivalTime,
    controllerRemarks,
    selectedEmpIds,
    savedAt: new Date().toISOString(),
  });

  const handleSaveDraft = async (showToast = true) => {
    setSavingDraft(true);
    try {
      const draft = getDraft();
      await dataProvider.saveProgramDraft(currentUser.id, draft);
      setDraftSavedAt(draft.savedAt);
      if (showToast) {
        Toast.show({
          type: "success",
          text1: "Draft saved",
          text2: "You can safely return and finish this schedule later.",
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Draft could not be saved",
        text2: error?.message || "Please try again.",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  useEffect(() => {
    if (!draftHydrated || activeTab !== "initiate") return;
    const timer = setTimeout(() => {
      handleSaveDraft(false);
    }, 900);
    return () => clearTimeout(timer);
  }, [
    draftHydrated,
    activeTab,
    programName,
    hatcheryOrFarm,
    farmAddress,
    farmManagerName,
    birdBreeder,
    birdLayer,
    birdBroiler,
    flockSize,
    vaccinesUsed,
    startDate,
    startTime,
    endDate,
    endTime,
    travelDepartureTime,
    travelArrivalTime,
    vaccinationStartedAtTime,
    vaccinationCompletedAtTime,
    returnDepartureTime,
    returnArrivalTime,
    controllerRemarks,
    selectedEmpIds,
  ]);

  useEffect(() => {
    if (activeArea === "overview") setActiveTab("my_programs");
  }, [activeArea]);

  const myPrograms = programs.filter((p) => p.controllerId === currentUser.id);
  const activeIncompleteProgram = myPrograms.find(
    (p) => p.status !== "completed" && p.status !== "cancelled",
  );
  const visiblePrograms = myPrograms.filter(
    (p) => programFilter === "all" || p.status === programFilter,
  );

  const toggleSelectEmployee = (id: string) => {
    if (selectedEmpIds.includes(id)) {
      setSelectedEmpIds(selectedEmpIds.filter((eId) => eId !== id));
    } else {
      setSelectedEmpIds([...selectedEmpIds, id]);
    }
  };

  const handleInitiateProgram = () => {
    if (activeIncompleteProgram) {
      Toast.show({
        type: "error",
        text1: "Active Program Incomplete",
        text2: `You already have an active program ("${activeIncompleteProgram.programName}"). Complete it before initiating a new one.`,
      });
      return;
    }
    if (!programName.trim() || !hatcheryOrFarm.trim()) {
      Toast.show({
        type: "error",
        text1: "Required Fields Missing",
        text2: "Please provide program title and hatchery/farm name.",
      });
      return;
    }

    const bCount = parseInt(birdBreeder.trim(), 10) || 0;
    const lCount = parseInt(birdLayer.trim(), 10) || 0;
    const brCount = parseInt(birdBroiler.trim(), 10) || 0;
    const categoryTotal = bCount + lCount + brCount;
    const manualFlock = parseInt(flockSize.trim(), 10) || 0;
    const finalFlockSize = categoryTotal > 0 ? categoryTotal : manualFlock;

    if (finalFlockSize <= 0) {
      Toast.show({
        type: "error",
        text1: "Bird Count Required",
        text2: "Please enter bird numbers (B, L, or Br) or total flock size.",
      });
      return;
    }

    if (selectedEmpIds.length === 0) {
      Toast.show({
        type: "error",
        text1: "No Team Selected",
        text2: "Select at least one vaccinator / team member.",
      });
      return;
    }

    const vaccinesArray = vaccinesUsed
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    confirm({
      title: "Submit Program Schedule",
      message: `Submit "${programName.trim()}" for ${finalFlockSize.toLocaleString()} birds at "${hatcheryOrFarm.trim()}" with ${selectedEmpIds.length} team members to Admin for review?`,
      confirmText: "Submit to Admin",
      cancelText: "Cancel",
      variant: "primary",
      icon: "send",
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const newProg = await dataProvider.createProgram({
            programName: programName.trim(),
            hatcheryOrFarmName: hatcheryOrFarm.trim(),
            farmAddress: farmAddress.trim() || undefined,
            farmManagerName: farmManagerName.trim() || undefined,
            flockSize: finalFlockSize,
            birdDetails: {
              b: bCount || undefined,
              l: lCount || undefined,
              br: brCount || undefined,
              total: finalFlockSize,
            },
            vaccinesUsed:
              vaccinesArray.length > 0
                ? vaccinesArray
                : ["Vectormune ND + Cevac Transmune"],
            scheduledStartDate: startDate,
            scheduledStartTime: startTime,
            scheduledEndDate: endDate,
            scheduledEndTime: endTime,
            travelDepartureTime: travelDepartureTime.trim() || undefined,
            travelArrivalTime: travelArrivalTime.trim() || undefined,
            returnDepartureTime: returnDepartureTime.trim() || undefined,
            returnArrivalTime: returnArrivalTime.trim() || undefined,
            vaccinationStartedAt: vaccinationStartedAtTime
              ? `${startDate}T${vaccinationStartedAtTime}`
              : undefined,
            vaccinationCompletedAt: vaccinationCompletedAtTime
              ? `${endDate}T${vaccinationCompletedAtTime}`
              : undefined,
            controllerRemarks: controllerRemarks.trim() || undefined,
            controllerId: currentUser.id,
            teamMemberIds: selectedEmpIds,
          });

          Toast.show({
            type: "success",
            text1: "Program Submitted to Admin",
            text2: `${newProg.programName} sent for admin approval.`,
          });

          // Reset Form
          await dataProvider.clearProgramDraft(currentUser.id);
          setProgramName("");
          setHatcheryOrFarm("");
          setFarmAddress("");
          setFarmManagerName("");
          setBirdBreeder("");
          setBirdLayer("");
          setBirdBroiler("");
          setFlockSize("");
          setControllerRemarks("");
          setSelectedEmpIds([]);
          setDraftSavedAt(null);
          setActiveTab("my_programs");
          refreshData();
        } catch (err: any) {
          Toast.show({
            type: "error",
            text1: "Submission Failed",
            text2: err?.message || "Could not initiate program.",
          });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const handleOpenEndProgram = (prog: Program) => {
    setEndingProgram(prog);
    setBirdsVaccinated(prog.flockSize.toString());
    setDosagePerBird("0.05 ml via automated Ceva Egginject");
    setBatchNumber("VND-2026-PK");
    setVaccineType("Vectormune ND + Cevac Transmune");
    setColdChainTemp("4.0");
    setEquipmentCheckPassed(true);
    setFarmFlockNotes(
      "Vaccination carried out per Ceva standard protocol. Cold-chain verified.",
    );
  };

  const handleConfirmEndProgram = () => {
    if (!endingProgram) return;

    confirm({
      title: "Complete Program & Submit to Admin",
      message: `Finalize vaccination records for "${endingProgram.programName}" (${birdsVaccinated || endingProgram.flockSize} birds) and submit them to Admin for review?`,
      confirmText: "Submit to Admin",
      cancelText: "Back",
      variant: "primary",
      icon: "send",
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const metrics: ProgramCompletionMetrics = {
            birdsVaccinated:
              parseInt(birdsVaccinated.trim(), 10) || endingProgram.flockSize,
            dosagePerBird: dosagePerBird.trim(),
            batchNumber: batchNumber.trim(),
            vaccineType: vaccineType.trim(),
            coldChainTempCelsius: parseFloat(coldChainTemp.trim()) || 4.0,
            equipmentCheckPassed,
            farmFlockObservations: farmFlockNotes.trim(),
          };

          await dataProvider.submitProgramCompletion(endingProgram.id, metrics);

          Toast.show({
            type: "success",
            text1: "Program Submitted to Admin",
            text2: "The completed program is now awaiting admin review.",
          });

          setEndingProgram(null);
          refreshData();
        } catch (err: any) {
          Toast.show({
            type: "error",
            text1: "Submission Error",
            text2: err?.message || "Could not finalize program.",
          });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* Top Navigation Bar */}
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          backgroundColor: Colors.surfaceElevated,
        }}
      >
        <View
          style={{
            maxWidth: 1280,
            width: "100%",
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: Spacing.xl,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.xl,
              flexGrow: 1,
            }}
          >
            <TouchableOpacity
              style={{
                paddingVertical: Spacing.lg,
                borderBottomWidth: 2,
                borderBottomColor:
                  activeTab === "my_programs" ? Colors.accent : "transparent",
              }}
              onPress={() => setActiveTab("my_programs")}
            >
              <Text
                style={{
                  ...Type.bodyStrong,
                  color:
                    activeTab === "my_programs"
                      ? Colors.accent
                      : Colors.textSecondary,
                }}
              >
                My Programs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                paddingVertical: Spacing.lg,
                borderBottomWidth: 2,
                borderBottomColor:
                  activeTab === "initiate" ? Colors.accent : "transparent",
              }}
              onPress={() => {
                refreshData();
                setActiveTab("initiate");
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.xs,
                }}
              >
                <Plus
                  size={14}
                  color={
                    activeTab === "initiate"
                      ? Colors.accent
                      : Colors.textSecondary
                  }
                  strokeWidth={2.5}
                />
                <Text
                  style={{
                    ...Type.bodyStrong,
                    color:
                      activeTab === "initiate"
                        ? Colors.accent
                        : Colors.textSecondary,
                  }}
                >
                  Initiate Program
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity
            onPress={refreshData}
            disabled={loading}
            style={{
              marginLeft: Spacing.md,
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.xs,
              borderRadius: Radii.md,
              borderWidth: 1,
              borderColor: Colors.border,
              backgroundColor: Colors.surfaceInput,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.sm,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.accent} />
            ) : (
              <>
                <RefreshCw size={14} color={Colors.accent} strokeWidth={2.4} />
                <Text
                  style={{
                    ...Type.caption,
                    fontWeight: "700",
                    color: Colors.accent,
                  }}
                >
                  Refresh
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Row (Only for My Programs) */}
      {activeTab === "my_programs" && (
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: Colors.borderSubtle,
            backgroundColor: Colors.surface,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.sm,
              paddingHorizontal: Spacing.xl,
              paddingVertical: Spacing.md,
            }}
          >
            {[
              ["all", "All Statuses"],
              ["active", "Active In Field"],
              ["pending_approval", "Awaiting Approval"],
              ["pending_admin_review", "Awaiting Admin Review"],
              ["completed", "Completed"],
            ].map(([filter, label]) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setProgramFilter(filter as any)}
                style={{
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.xs + 2,
                  borderRadius: Radii.pill,
                  borderWidth: 1,
                  borderColor:
                    programFilter === filter ? Colors.accent : Colors.border,
                  backgroundColor:
                    programFilter === filter
                      ? Colors.accentSubtle
                      : Colors.surfaceCard,
                }}
              >
                <Text
                  style={{
                    ...Type.caption,
                    fontWeight: programFilter === filter ? "700" : "600",
                    color:
                      programFilter === filter
                        ? Colors.accent
                        : Colors.textSecondary,
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{
          maxWidth: 1280,
          width: "100%",
          alignSelf: "center",
          padding: Spacing.xl,
          gap: Spacing.xl,
          paddingBottom: Spacing["5xl"],
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: Spacing.lg,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={{
                ...Type.eyebrow,
                color: Colors.accent,
                marginBottom: Spacing.xs,
              }}
            >
              PROGRAM MANAGEMENT / CONTROLLER WORKSPACE
            </Text>
            <Text style={{ ...Type.h1, color: Colors.textPrimary }}>
              {activeTab === "my_programs"
                ? "Operations & Schedules"
                : "Create New Vaccination Program"}
            </Text>
            <Text
              style={{
                ...Type.caption,
                color: Colors.textSecondary,
                marginTop: Spacing.sm,
                maxWidth: 620,
              }}
            >
              {activeTab === "my_programs"
                ? "Coordinate vaccination teams, monitor live field progress, and submit completed batches for quality inspection."
                : "Configure farm details, assign certified vaccinators, schedule travel, and submit to Admin for deployment."}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.xs,
              paddingHorizontal: Spacing.md,
              paddingVertical: Spacing.xs,
              borderRadius: Radii.pill,
              borderWidth: 1,
              borderColor: Colors.border,
              backgroundColor: Colors.surfaceInput,
            }}
          >
            <ClipboardCheck size={14} color={Colors.accent} strokeWidth={2.5} />
            <Text
              style={{
                ...Type.caption,
                fontWeight: "700",
                color: Colors.accent,
              }}
            >
              Lead Controller
            </Text>
          </View>
        </View>

        {activeTab === "my_programs" ? (
          <View style={{ gap: Spacing.md }}>
            {/* Quick Metrics Bar */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: Spacing.md,
              }}
            >
              <View
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: Spacing.xl,
                  borderRadius: Radii.lg,
                  backgroundColor: Colors.surfaceCard,
                  borderLeftWidth: 4,
                  borderLeftColor: Colors.accent,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <Text
                  style={{
                    ...Type.eyebrow,
                    fontSize: 10,
                    color: Colors.textTertiary,
                  }}
                >
                  Total Created
                </Text>
                <Text
                  style={{
                    ...Type.number,
                    color: Colors.textPrimary,
                    marginTop: Spacing.sm,
                  }}
                >
                  {myPrograms.length}
                </Text>
                <Text
                  style={{
                    ...Type.caption,
                    color: Colors.textSecondary,
                    marginTop: Spacing.xs,
                  }}
                >
                  All managed programs
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: Spacing.xl,
                  borderRadius: Radii.lg,
                  backgroundColor: Colors.surfaceCard,
                  borderLeftWidth: 4,
                  borderLeftColor: Colors.info,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <Text
                  style={{
                    ...Type.eyebrow,
                    fontSize: 10,
                    color: Colors.textTertiary,
                  }}
                >
                  Active In Field
                </Text>
                <Text
                  style={{
                    ...Type.number,
                    color: Colors.info,
                    marginTop: Spacing.sm,
                  }}
                >
                  {myPrograms.filter((p) => p.status === "active").length}
                </Text>
                <Text
                  style={{
                    ...Type.caption,
                    color: Colors.textSecondary,
                    marginTop: Spacing.xs,
                  }}
                >
                  Currently executing
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: Spacing.xl,
                  borderRadius: Radii.lg,
                  backgroundColor: Colors.surfaceCard,
                  borderLeftWidth: 4,
                  borderLeftColor: Colors.warning,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <Text
                  style={{
                    ...Type.eyebrow,
                    fontSize: 10,
                    color: Colors.textTertiary,
                  }}
                >
                  Pending Review
                </Text>
                <Text
                  style={{
                    ...Type.number,
                    color: Colors.warning,
                    marginTop: Spacing.sm,
                  }}
                >
                  {
                    myPrograms.filter(
                      (p) =>
                        p.status === "pending_approval" ||
                        p.status === "pending_admin_review" ||
                        p.status === "pending_audit",
                    ).length
                  }
                </Text>
                <Text
                  style={{
                    ...Type.caption,
                    color: Colors.textSecondary,
                    marginTop: Spacing.xs,
                  }}
                >
                  Awaiting Admin review
                </Text>
              </View>
            </View>

            {visiblePrograms.length === 0 ? (
              <View
                style={{
                  alignItems: "center",
                  padding: Spacing["4xl"],
                  borderRadius: Radii.lg,
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: Colors.border,
                  backgroundColor: Colors.surfaceCard,
                }}
              >
                <Text style={{ ...Type.bodyStrong, color: Colors.textPrimary }}>
                  {myPrograms.length === 0
                    ? "No programs initiated yet"
                    : "No programs match this filter"}
                </Text>
                <Text
                  style={{
                    ...Type.caption,
                    color: Colors.textSecondary,
                    marginTop: Spacing.xs,
                    textAlign: "center",
                    maxWidth: 340,
                  }}
                >
                  {myPrograms.length === 0
                    ? "Start by creating your first vaccination program schedule."
                    : "Clear the filter above to view all of your programs."}
                </Text>
                {myPrograms.length === 0 && (
                  <TouchableOpacity
                    onPress={() => setActiveTab("initiate")}
                    style={{
                      marginTop: Spacing.lg,
                      paddingHorizontal: Spacing.lg,
                      paddingVertical: Spacing.sm,
                      borderRadius: Radii.md,
                      backgroundColor: Colors.accent,
                    }}
                  >
                    <Text
                      style={{
                        ...Type.caption,
                        fontWeight: "700",
                        color: Colors.white,
                      }}
                    >
                      Create First Program
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              visiblePrograms.map((prog) => {
                const statusColor =
                  prog.status === "completed"
                    ? Colors.success
                    : prog.status === "active"
                      ? Colors.info
                      : Colors.warning;
                return (
                  <View
                    key={prog.id}
                    style={{
                      padding: Spacing.xl,
                      borderRadius: Radii.lg,
                      borderWidth: 1,
                      borderColor: Colors.border,
                      backgroundColor: Colors.surfaceCard,
                      gap: Spacing.md,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        gap: Spacing.sm,
                      }}
                    >
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            ...Type.bodyStrong,
                            fontWeight: "700",
                            color: Colors.textPrimary,
                          }}
                        >
                          {prog.programName}
                        </Text>
                        <Text
                          style={{
                            ...Type.caption,
                            color: Colors.textSecondary,
                            marginTop: 2,
                          }}
                        >
                          {prog.hatcheryOrFarmName}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: Spacing.md,
                          paddingVertical: Spacing.xs,
                          borderRadius: Radii.pill,
                          borderWidth: 1,
                          borderColor: `${statusColor}55`,
                          backgroundColor: `${statusColor}1A`,
                        }}
                      >
                        <Text
                          style={{
                            ...Type.eyebrow,
                            fontSize: 10,
                            color: statusColor,
                          }}
                        >
                          {prog.status.replace("_", " ").toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: Spacing.lg,
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                      }}
                    >
                      <Text
                        style={{ ...Type.caption, color: Colors.textSecondary }}
                      >
                        Flock:{" "}
                        <Text
                          style={{
                            fontWeight: "700",
                            color: Colors.textPrimary,
                          }}
                        >
                          {prog.flockSize.toLocaleString()}
                        </Text>{" "}
                        birds
                      </Text>
                      <Text
                        style={{ ...Type.caption, color: Colors.textSecondary }}
                      >
                        Team:{" "}
                        <Text
                          style={{
                            fontWeight: "700",
                            color: Colors.textPrimary,
                          }}
                        >
                          {prog.teamMemberIds.length}
                        </Text>{" "}
                        vaccinators
                      </Text>
                      <Text
                        style={{ ...Type.caption, color: Colors.textSecondary }}
                      >
                        Schedule: {prog.scheduledStartDate} (
                        {prog.scheduledStartTime})
                      </Text>
                    </View>

                    {prog.status === "active" && (
                      <TouchableOpacity
                        onPress={() => handleOpenEndProgram(prog)}
                        style={{
                          marginTop: Spacing.sm,
                          paddingVertical: Spacing.md,
                          borderRadius: Radii.md,
                          backgroundColor: Colors.accent,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: Spacing.sm,
                          ...Shadows.accentGlow,
                        }}
                      >
                        <Send size={15} color={Colors.white} />
                        <Text
                          style={{
                            ...Type.caption,
                            fontWeight: "700",
                            color: Colors.white,
                          }}
                        >
                          End Program & Submit to Admin
                        </Text>
                      </TouchableOpacity>
                    )}

                    {prog.status === "pending_approval" && (
                      <View
                        style={{
                          padding: Spacing.md,
                          borderRadius: Radii.md,
                          backgroundColor: Colors.warningSubtle,
                          borderWidth: 1,
                          borderColor: Colors.warningBorder,
                        }}
                      >
                        <Text
                          style={{
                            ...Type.caption,
                            fontWeight: "600",
                            color: Colors.warning,
                          }}
                        >
                          Submitted to Admin. Awaiting approval.
                        </Text>
                      </View>
                    )}

                    {(prog.status === "pending_admin_review" ||
                      prog.status === "pending_audit") && (
                      <View
                        style={{
                          padding: Spacing.md,
                          borderRadius: Radii.md,
                          backgroundColor: Colors.infoSubtle,
                          borderWidth: 1,
                          borderColor: Colors.infoBorder,
                        }}
                      >
                        <Text
                          style={{
                            ...Type.caption,
                            fontWeight: "600",
                            color: Colors.info,
                          }}
                        >
                          Vaccination completed. Awaiting Admin review.
                        </Text>
                      </View>
                    )}

                    {prog.status === "completed" && prog.auditorRemarks && (
                      <View
                        style={{
                          marginTop: Spacing.xs,
                          padding: Spacing.md,
                          borderRadius: Radii.md,
                          backgroundColor: Colors.successSubtle,
                          borderWidth: 1,
                          borderColor: Colors.successBorder,
                        }}
                      >
                        <Text
                          style={{
                            ...Type.eyebrow,
                            fontSize: 9,
                            color: Colors.success,
                          }}
                        >
                          Auditor Sign-off ({prog.auditorName})
                        </Text>
                        <Text
                          style={{
                            ...Type.caption,
                            fontStyle: "italic",
                            color: Colors.textPrimary,
                            marginTop: Spacing.xs,
                          }}
                        >
                          "{prog.auditorRemarks}"
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        ) : (
          // ── INITIATE PROGRAM TAB ─────────────────────────────────
          <View style={{ gap: Spacing.xl }}>
            {/* Draft Status Banner */}
            <View
              style={{
                padding: Spacing.xl,
                borderRadius: Radii.lg,
                backgroundColor: Colors.surfaceElevated,
                borderWidth: 1,
                borderColor: Colors.accentBorder,
                ...Shadows.card,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: Spacing.md,
                }}
              >
                <View style={{ flex: 1, minWidth: 280 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.sm,
                    }}
                  >
                    <View
                      style={{
                        padding: Spacing.sm,
                        borderRadius: Radii.sm,
                        backgroundColor: Colors.accentSubtle,
                      }}
                    >
                      <ClipboardCheck size={18} color={Colors.accent} />
                    </View>
                    <Text style={{ ...Type.eyebrow, color: Colors.accent }}>
                      New field schedule
                    </Text>
                  </View>
                  <Text
                    style={{
                      ...Type.h2,
                      color: Colors.textPrimary,
                      marginTop: Spacing.md,
                    }}
                  >
                    Build a vaccination program
                  </Text>
                  <Text
                    style={{
                      ...Type.caption,
                      color: Colors.textSecondary,
                      marginTop: Spacing.xs,
                      maxWidth: 620,
                    }}
                  >
                    Add what is known now. Timing and operational details can be
                    completed later without losing your work.
                  </Text>
                </View>
                <View
                  style={{
                    padding: Spacing.md,
                    borderRadius: Radii.md,
                    backgroundColor: Colors.surfaceInput,
                    borderWidth: 1,
                    borderColor: Colors.border,
                    alignSelf: "flex-start",
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.sm,
                    }}
                  >
                    <Clock3 size={14} color={Colors.accent} />
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.accent,
                      }}
                    >
                      {draftSavedAt
                        ? `Saved ${new Date(draftSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        : "Not saved yet"}
                    </Text>
                  </View>
                  <Text
                    style={{
                      ...Type.caption,
                      color: Colors.textTertiary,
                      marginTop: 2,
                    }}
                  >
                    Private draft on this device
                  </Text>
                </View>
              </View>
            </View>

            {activeIncompleteProgram && (
              <View
                style={{
                  padding: Spacing.xl,
                  borderRadius: Radii.lg,
                  borderWidth: 1,
                  borderColor: Colors.warning,
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  gap: Spacing.sm,
                  marginBottom: Spacing.lg,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: Spacing.sm,
                  }}
                >
                  <AlertTriangle size={18} color={Colors.warning} />
                  <Text
                    style={{
                      ...Type.bodyStrong,
                      color: Colors.warning,
                      fontWeight: "700",
                    }}
                  >
                    Ongoing Program in Progress
                  </Text>
                </View>
                <Text style={{ ...Type.body, color: Colors.textSecondary }}>
                  You currently have an active program:{" "}
                  <Text style={{ color: Colors.textPrimary, fontWeight: "700" }}>
                    {activeIncompleteProgram.programName}
                  </Text>{" "}
                  ({activeIncompleteProgram.status.replace(/_/g, " ").toUpperCase()}). A controller cannot initiate a new program until the current program is completed.
                </Text>
              </View>
            )}

            {/* Form Sections */}
            <View style={{ gap: Spacing.xl }}>
              {/* 1. Farm Details */}
              <View
                style={{
                  padding: Spacing.xl,
                  borderRadius: Radii.lg,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  backgroundColor: Colors.surfaceCard,
                }}
              >
                <Text
                  style={{
                    ...Type.h3,
                    color: Colors.accent,
                    marginBottom: Spacing.lg,
                  }}
                >
                  1. Farm Details
                </Text>
                <View style={{ gap: Spacing.md }}>
                  <View>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Program Title *
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      placeholder="e.g. Broiler ND & IBD Complete Immunization"
                      placeholderTextColor={Colors.textTertiary}
                      value={programName}
                      onChangeText={setProgramName}
                    />
                  </View>
                  <View>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Farm / Hatchery Name *
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      placeholder="e.g. Jadeed Poultry Farm Sector 4"
                      placeholderTextColor={Colors.textTertiary}
                      value={hatcheryOrFarm}
                      onChangeText={setHatcheryOrFarm}
                    />
                  </View>
                  <View>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Farm / Hatchery Address
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      placeholder="e.g. 12-Km Depalpur Road, Okara"
                      placeholderTextColor={Colors.textTertiary}
                      value={farmAddress}
                      onChangeText={setFarmAddress}
                    />
                  </View>
                  <View>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Owner / Farm Manager Name
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      placeholder="e.g. Ch. Muhammad Akram"
                      placeholderTextColor={Colors.textTertiary}
                      value={farmManagerName}
                      onChangeText={setFarmManagerName}
                    />
                  </View>
                </View>
              </View>

              {/* 2. Team Allocation */}
              <View
                style={{
                  padding: Spacing.xl,
                  borderRadius: Radii.lg,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  backgroundColor: Colors.surfaceCard,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: Spacing.lg,
                  }}
                >
                  <Text style={{ ...Type.h3, color: Colors.accent }}>
                    2. Team Allocation
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.sm,
                    }}
                  >
                    <Text
                      style={{
                        ...Type.caption,
                        fontWeight: "700",
                        color: Colors.textSecondary,
                      }}
                    >
                      {selectedEmpIds.length} Selected
                    </Text>
                    <Text style={{ ...Type.caption, color: Colors.border }}>
                      •
                    </Text>
                    <Text
                      style={{
                        ...Type.caption,
                        fontWeight: "700",
                        color: Colors.accent,
                      }}
                    >
                      {availableEmployees.length} Available
                    </Text>
                  </View>
                </View>

                <View
                  style={{
                    padding: Spacing.md,
                    borderRadius: Radii.md,
                    backgroundColor: Colors.surfaceInput,
                    borderWidth: 1,
                    borderColor: Colors.borderSubtle,
                    marginBottom: Spacing.lg,
                  }}
                >
                  <Text
                    style={{
                      ...Type.eyebrow,
                      fontSize: 9,
                      color: Colors.textTertiary,
                    }}
                  >
                    Assigned Controller (Creator)
                  </Text>
                  <Text
                    style={{
                      ...Type.bodyStrong,
                      color: Colors.textPrimary,
                      marginTop: Spacing.xs,
                    }}
                  >
                    {currentUser.fullName}{" "}
                    <Text
                      style={{ fontWeight: "400", color: Colors.textSecondary }}
                    >
                      ({currentUser.employeeCode || "Lead Controller"})
                    </Text>
                  </Text>
                </View>

                <View style={{ gap: Spacing.sm }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                      }}
                    >
                      Select Vaccinators * ({selectedEmpIds.length} assigned)
                    </Text>
                    {selectedEmpIds.length > 0 && (
                      <TouchableOpacity onPress={() => setSelectedEmpIds([])}>
                        <Text
                          style={{
                            ...Type.caption,
                            fontWeight: "600",
                            color: Colors.danger,
                          }}
                        >
                          Clear selection
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.sm,
                      paddingHorizontal: Spacing.md,
                      borderRadius: Radii.md,
                      borderWidth: 1,
                      borderColor: Colors.borderSubtle,
                      backgroundColor: Colors.surfaceInput,
                    }}
                  >
                    <Search size={15} color={Colors.textTertiary} />
                    <TextInput
                      style={{
                        flex: 1,
                        paddingVertical: Spacing.md,
                        ...Type.body,
                        color: Colors.textPrimary,
                      }}
                      placeholder="Search by name, staff ID code, or email..."
                      placeholderTextColor={Colors.textTertiary}
                      value={empSearchQuery}
                      onChangeText={setEmpSearchQuery}
                    />
                    {empSearchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setEmpSearchQuery("")}>
                        <CircleX size={15} color={Colors.textTertiary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {availableEmployees.length === 0 ? (
                    <View
                      style={{
                        marginTop: Spacing.xs,
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.warningSubtle,
                        borderWidth: 1,
                        borderColor: Colors.warningBorder,
                      }}
                    >
                      <Text
                        style={{
                          ...Type.caption,
                          fontStyle: "italic",
                          color: Colors.warning,
                        }}
                      >
                        All field vaccinators are currently engaged in active
                        programs.
                      </Text>
                    </View>
                  ) : filteredAvailableEmployees.length === 0 ? (
                    <View
                      style={{
                        marginTop: Spacing.xs,
                        alignItems: "center",
                        padding: Spacing.lg,
                        borderRadius: Radii.md,
                        borderWidth: 1,
                        borderStyle: "dashed",
                        borderColor: Colors.border,
                      }}
                    >
                      <Text
                        style={{
                          ...Type.caption,
                          fontWeight: "600",
                          color: Colors.textSecondary,
                        }}
                      >
                        No vaccinators found matching "{empSearchQuery}"
                      </Text>
                      <Text
                        style={{
                          ...Type.caption,
                          color: Colors.textTertiary,
                          marginTop: Spacing.xs,
                        }}
                      >
                        Try searching with a different name or staff code.
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={{
                        maxHeight: 260,
                        borderRadius: Radii.md,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        backgroundColor: Colors.surface,
                        overflow: "hidden",
                      }}
                    >
                      <ScrollView
                        nestedScrollEnabled
                        contentContainerStyle={{
                          padding: Spacing.sm,
                          gap: Spacing.sm,
                        }}
                      >
                        {filteredAvailableEmployees.map((emp) => {
                          const isSelected = selectedEmpIds.includes(emp.id);
                          return (
                            <TouchableOpacity
                              key={emp.id}
                              onPress={() => toggleSelectEmployee(emp.id)}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingHorizontal: Spacing.md,
                                paddingVertical: Spacing.sm,
                                borderRadius: Radii.md,
                                borderWidth: 1,
                                borderColor: isSelected
                                  ? Colors.accentBorder
                                  : "transparent",
                                backgroundColor: isSelected
                                  ? Colors.accentSubtle
                                  : Colors.surfaceInput,
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: Spacing.md,
                                  flex: 1,
                                  minWidth: 0,
                                }}
                              >
                                <View
                                  style={{
                                    width: 32,
                                    height: 32,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: Radii.sm,
                                    borderWidth: 1,
                                    borderColor: isSelected
                                      ? Colors.accent
                                      : Colors.border,
                                    backgroundColor: isSelected
                                      ? Colors.accent
                                      : Colors.surfaceCard,
                                  }}
                                >
                                  {isSelected ? (
                                    <Check
                                      size={14}
                                      color={Colors.white}
                                      strokeWidth={2.6}
                                    />
                                  ) : (
                                    <Text
                                      style={{
                                        ...Type.eyebrow,
                                        fontSize: 10,
                                        color: Colors.textSecondary,
                                      }}
                                    >
                                      {emp.fullName
                                        .trim()
                                        .slice(0, 1)
                                        .toUpperCase()}
                                    </Text>
                                  )}
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <Text
                                    style={{
                                      ...Type.bodyStrong,
                                      fontWeight: "700",
                                      color: isSelected
                                        ? Colors.accent
                                        : Colors.textPrimary,
                                    }}
                                  >
                                    {emp.fullName}
                                  </Text>
                                  <Text
                                    style={{
                                      ...Type.caption,
                                      fontFamily: "monospace",
                                      color: Colors.textTertiary,
                                      marginTop: 2,
                                    }}
                                  >
                                    ID: {emp.employeeCode || "Not assigned"}
                                    {emp.email ? ` • ${emp.email}` : ""}
                                  </Text>
                                </View>
                              </View>
                              <View
                                style={{
                                  paddingHorizontal: Spacing.sm,
                                  paddingVertical: 2,
                                  borderRadius: Radii.pill,
                                  borderWidth: 1,
                                  borderColor: isSelected
                                    ? Colors.accent
                                    : Colors.border,
                                  backgroundColor: isSelected
                                    ? Colors.accent
                                    : Colors.surfaceCard,
                                }}
                              >
                                <Text
                                  style={{
                                    ...Type.eyebrow,
                                    fontSize: 9,
                                    color: isSelected
                                      ? Colors.white
                                      : Colors.textSecondary,
                                  }}
                                >
                                  {isSelected ? "ASSIGNED" : "TAP TO ADD"}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* 3. Program Details */}
              <View
                style={{
                  padding: Spacing.xl,
                  borderRadius: Radii.lg,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  backgroundColor: Colors.surfaceCard,
                }}
              >
                <Text
                  style={{
                    ...Type.h3,
                    color: Colors.accent,
                    marginBottom: Spacing.lg,
                  }}
                >
                  3. Program Details
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: Spacing.md,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 140 }}>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Date of Vaccination *
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      value={startDate}
                      onChangeText={setStartDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textTertiary}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 140 }}>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Time of Vaccination *
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      value={startTime}
                      onChangeText={setStartTime}
                      placeholder="08:00 AM"
                      placeholderTextColor={Colors.textTertiary}
                    />
                  </View>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: Spacing.md,
                    marginTop: Spacing.md,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 140 }}>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Estimated End Date
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      value={endDate}
                      onChangeText={setEndDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textTertiary}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 140 }}>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Estimated End Time
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      value={endTime}
                      onChangeText={setEndTime}
                      placeholder="04:00 PM"
                      placeholderTextColor={Colors.textTertiary}
                    />
                  </View>
                </View>
              </View>

              {/* 4. Bird Details */}
              <View
                style={{
                  padding: Spacing.xl,
                  borderRadius: Radii.lg,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  backgroundColor: Colors.surfaceCard,
                }}
              >
                <Text
                  style={{
                    ...Type.h3,
                    color: Colors.accent,
                    marginBottom: Spacing.lg,
                  }}
                >
                  4. Bird Details
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: Spacing.md,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 100 }}>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Breeder (B)
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      placeholder="e.g. 5000"
                      placeholderTextColor={Colors.textTertiary}
                      value={birdBreeder}
                      onChangeText={setBirdBreeder}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 100 }}>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Layer (L)
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      placeholder="e.g. 15000"
                      placeholderTextColor={Colors.textTertiary}
                      value={birdLayer}
                      onChangeText={setBirdLayer}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 100 }}>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Broiler (Br)
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      placeholder="e.g. 30000"
                      placeholderTextColor={Colors.textTertiary}
                      value={birdBroiler}
                      onChangeText={setBirdBroiler}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                <View style={{ marginTop: Spacing.md }}>
                  <Text
                    style={{
                      ...Type.eyebrow,
                      fontSize: 10,
                      color: Colors.textSecondary,
                      marginBottom: Spacing.xs,
                    }}
                  >
                    Total Flock Size *
                  </Text>
                  <TextInput
                    style={{
                      padding: Spacing.md,
                      borderRadius: Radii.md,
                      backgroundColor: Colors.surfaceInput,
                      borderWidth: 1,
                      borderColor: Colors.borderSubtle,
                      color: Colors.textPrimary,
                    }}
                    placeholder={
                      parseInt(birdBreeder || "0") +
                        parseInt(birdLayer || "0") +
                        parseInt(birdBroiler || "0") >
                      0
                        ? `Auto: ${(parseInt(birdBreeder || "0") + parseInt(birdLayer || "0") + parseInt(birdBroiler || "0")).toLocaleString()} birds`
                        : "e.g. 50000"
                    }
                    placeholderTextColor={Colors.textTertiary}
                    value={flockSize}
                    onChangeText={setFlockSize}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* 5. Vaccine Details */}
              <View
                style={{
                  padding: Spacing.xl,
                  borderRadius: Radii.lg,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  backgroundColor: Colors.surfaceCard,
                }}
              >
                <Text
                  style={{
                    ...Type.h3,
                    color: Colors.accent,
                    marginBottom: Spacing.lg,
                  }}
                >
                  5. Vaccine Details
                </Text>
                <View>
                  <Text
                    style={{
                      ...Type.eyebrow,
                      fontSize: 10,
                      color: Colors.textSecondary,
                      marginBottom: Spacing.xs,
                    }}
                  >
                    Vaccine(s) Used * (comma-separated)
                  </Text>
                  <TextInput
                    style={{
                      padding: Spacing.md,
                      borderRadius: Radii.md,
                      backgroundColor: Colors.surfaceInput,
                      borderWidth: 1,
                      borderColor: Colors.borderSubtle,
                      color: Colors.textPrimary,
                    }}
                    placeholder="e.g. Vectormune ND, Cevac Transmune"
                    placeholderTextColor={Colors.textTertiary}
                    value={vaccinesUsed}
                    onChangeText={setVaccinesUsed}
                  />
                </View>
              </View>

              {/* 6-8. Schedules */}
              <View
                style={{
                  padding: Spacing.xl,
                  borderRadius: Radii.lg,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  backgroundColor: Colors.surfaceCard,
                }}
              >
                <Text
                  style={{
                    ...Type.h3,
                    color: Colors.accent,
                    marginBottom: Spacing.lg,
                  }}
                >
                  6. Travel & Vaccination Schedules
                </Text>

                <Text
                  style={{
                    ...Type.bodyStrong,
                    color: Colors.textPrimary,
                    marginBottom: Spacing.sm,
                  }}
                >
                  Travel Schedule
                </Text>
                <View style={{ flexDirection: "row", gap: Spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Departure from Office
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      value={travelDepartureTime}
                      onChangeText={setTravelDepartureTime}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Arrival at Farm
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      value={travelArrivalTime}
                      onChangeText={setTravelArrivalTime}
                    />
                  </View>
                </View>

                <Text
                  style={{
                    ...Type.bodyStrong,
                    color: Colors.textPrimary,
                    marginTop: Spacing.lg,
                    marginBottom: Spacing.sm,
                  }}
                >
                  Vaccination Schedule
                </Text>
                <View style={{ flexDirection: "row", gap: Spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Started At
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      value={vaccinationStartedAtTime}
                      onChangeText={setVaccinationStartedAtTime}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Completed At
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      value={vaccinationCompletedAtTime}
                      onChangeText={setVaccinationCompletedAtTime}
                    />
                  </View>
                </View>

                <Text
                  style={{
                    ...Type.bodyStrong,
                    color: Colors.textPrimary,
                    marginTop: Spacing.lg,
                    marginBottom: Spacing.sm,
                  }}
                >
                  Return Schedule
                </Text>
                <View style={{ flexDirection: "row", gap: Spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Departure from Farm
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      value={returnDepartureTime}
                      onChangeText={setReturnDepartureTime}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Arrival at Office
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      value={returnArrivalTime}
                      onChangeText={setReturnArrivalTime}
                    />
                  </View>
                </View>
              </View>

              {/* 9. Remarks */}
              <View
                style={{
                  padding: Spacing.xl,
                  borderRadius: Radii.lg,
                  borderWidth: 1,
                  borderColor: Colors.border,
                  backgroundColor: Colors.surfaceCard,
                }}
              >
                <Text
                  style={{
                    ...Type.h3,
                    color: Colors.accent,
                    marginBottom: Spacing.lg,
                  }}
                >
                  9. Submission & Remarks
                </Text>
                <View>
                  <Text
                    style={{
                      ...Type.eyebrow,
                      fontSize: 10,
                      color: Colors.textSecondary,
                      marginBottom: Spacing.xs,
                    }}
                  >
                    Controller Remarks
                  </Text>
                  <TextInput
                    style={{
                      padding: Spacing.md,
                      borderRadius: Radii.md,
                      backgroundColor: Colors.surfaceInput,
                      borderWidth: 1,
                      borderColor: Colors.borderSubtle,
                      color: Colors.textPrimary,
                      minHeight: 80,
                    }}
                    multiline
                    placeholder="Record observations, site conditions, vehicle details or notes..."
                    placeholderTextColor={Colors.textTertiary}
                    value={controllerRemarks}
                    onChangeText={setControllerRemarks}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: Spacing.md,
                  marginTop: Spacing.md,
                }}
              >
                <TouchableOpacity
                  onPress={() => handleSaveDraft()}
                  disabled={submitting || savingDraft}
                  style={{
                    flex: 1,
                    minWidth: 150,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: Spacing.sm,
                    paddingVertical: Spacing.md,
                    borderRadius: Radii.md,
                    backgroundColor: Colors.surfaceCard,
                    borderWidth: 1,
                    borderColor: Colors.accentBorder,
                  }}
                >
                  {savingDraft ? (
                    <ActivityIndicator color={Colors.accent} size="small" />
                  ) : (
                    <Save size={16} color={Colors.accent} />
                  )}
                  <Text
                    style={{
                      ...Type.bodyStrong,
                      fontWeight: "700",
                      color: Colors.accent,
                    }}
                  >
                    Save as draft
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleInitiateProgram}
                  disabled={submitting || !!activeIncompleteProgram}
                  style={{
                    flex: 1.5,
                    minWidth: 190,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: Spacing.sm,
                    paddingVertical: Spacing.md,
                    borderRadius: Radii.md,
                    backgroundColor: activeIncompleteProgram
                      ? Colors.surfaceElevated
                      : Colors.accent,
                    borderWidth: activeIncompleteProgram ? 1 : 0,
                    borderColor: activeIncompleteProgram
                      ? Colors.border
                      : "transparent",
                    opacity: activeIncompleteProgram ? 0.6 : 1,
                    ...(activeIncompleteProgram ? {} : Shadows.accentGlow),
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <ClipboardCheck
                      size={16}
                      color={
                        activeIncompleteProgram
                          ? Colors.textTertiary
                          : Colors.white
                      }
                    />
                  )}
                  <Text
                    style={{
                      ...Type.bodyStrong,
                      fontWeight: "700",
                      color: activeIncompleteProgram
                        ? Colors.textTertiary
                        : Colors.white,
                    }}
                  >
                    {activeIncompleteProgram
                      ? "Current program must be completed"
                      : "Submit Program"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* End Program Modal */}
      {endingProgram && (
        <Modal visible transparent animationType="fade">
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: Spacing.lg,
              backgroundColor: Colors.surfaceOverlay,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 520,
                maxHeight: "90%",
                padding: Spacing["2xl"],
                borderRadius: Radii["2xl"],
                borderWidth: 1,
                borderColor: Colors.border,
                backgroundColor: Colors.surfaceElevated,
                ...Shadows.popover,
              }}
            >
              <Text style={{ ...Type.h2, color: Colors.textPrimary }}>
                End Program & Record Metrics
              </Text>
              <Text
                style={{
                  ...Type.caption,
                  color: Colors.textSecondary,
                  marginTop: Spacing.xs,
                  marginBottom: Spacing.lg,
                }}
              >
                {endingProgram.programName}
              </Text>

              <ScrollView style={{ marginBottom: Spacing.lg }}>
                <View style={{ gap: Spacing.md }}>
                  <View>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Total Birds Vaccinated
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      value={birdsVaccinated}
                      onChangeText={setBirdsVaccinated}
                      keyboardType="numeric"
                    />
                  </View>
                  <View>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Dosage Per Bird
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      value={dosagePerBird}
                      onChangeText={setDosagePerBird}
                    />
                  </View>
                  <View>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Vaccine Batch Number
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      value={batchNumber}
                      onChangeText={setBatchNumber}
                    />
                  </View>
                  <View>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Cold-Chain Log Temperature (°C)
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                      }}
                      value={coldChainTemp}
                      onChangeText={setColdChainTemp}
                      keyboardType="numeric"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={() =>
                      setEquipmentCheckPassed(!equipmentCheckPassed)
                    }
                    style={{
                      padding: Spacing.md,
                      borderRadius: Radii.md,
                      alignItems: "center",
                      backgroundColor: equipmentCheckPassed
                        ? Colors.successSubtle
                        : Colors.dangerSubtle,
                      borderWidth: 1,
                      borderColor: equipmentCheckPassed
                        ? Colors.successBorder
                        : Colors.dangerBorder,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: Spacing.sm,
                      }}
                    >
                      {equipmentCheckPassed ? (
                        <Check size={15} color={Colors.success} />
                      ) : (
                        <CircleX size={15} color={Colors.danger} />
                      )}
                      <Text
                        style={{
                          ...Type.bodyStrong,
                          fontWeight: "700",
                          color: equipmentCheckPassed
                            ? Colors.success
                            : Colors.danger,
                        }}
                      >
                        Equipment Check{" "}
                        {equipmentCheckPassed ? "PASSED" : "FAILED"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View>
                    <Text
                      style={{
                        ...Type.eyebrow,
                        fontSize: 10,
                        color: Colors.textSecondary,
                        marginBottom: Spacing.xs,
                      }}
                    >
                      Flock Monitoring Observations
                    </Text>
                    <TextInput
                      style={{
                        padding: Spacing.md,
                        borderRadius: Radii.md,
                        backgroundColor: Colors.surfaceInput,
                        borderWidth: 1,
                        borderColor: Colors.borderSubtle,
                        color: Colors.textPrimary,
                        minHeight: 60,
                      }}
                      multiline
                      value={farmFlockNotes}
                      onChangeText={setFarmFlockNotes}
                    />
                  </View>
                </View>
              </ScrollView>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: Spacing.md,
                  marginTop: Spacing.md,
                }}
              >
                <TouchableOpacity
                  onPress={() => setEndingProgram(null)}
                  disabled={submitting}
                  style={{
                    paddingHorizontal: Spacing.xl,
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
                      color: Colors.textSecondary,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmEndProgram}
                  disabled={submitting}
                  style={{
                    paddingHorizontal: Spacing.xl,
                    paddingVertical: Spacing.md,
                    borderRadius: Radii.md,
                    backgroundColor: Colors.accent,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: Spacing.sm,
                    ...Shadows.accentGlow,
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <>
                      <Send size={15} color={Colors.white} />
                      <Text
                        style={{
                          ...Type.caption,
                          fontWeight: "700",
                          color: Colors.white,
                        }}
                      >
                        Submit to Admin
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {ConfirmDialogElement}
    </View>
  );
};
