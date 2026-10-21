// admin/styles.ts
import { TextStyle, ViewStyle } from "react-native";
import { Colors, Radii, Shadows, Spacing, Type } from "../../constants/design";

export const S = {
  // ── Screen shell
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  } as ViewStyle,

  // ── Tab bar
  tabBarWrap: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  } as ViewStyle,

  tabBarInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs,
  } as ViewStyle,

  tabScroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xl,
    paddingVertical: 0,
  } as ViewStyle,

  tabItem: {
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  } as ViewStyle,

  tabItemActive: {
    borderBottomColor: Colors.accent,
  } as ViewStyle,

  tabItemText: {
    ...Type.caption,
    fontWeight: "600",
    color: Colors.textSecondary,
  } as TextStyle,

  tabItemTextActive: {
    fontWeight: "700",
    color: Colors.textPrimary,
  } as TextStyle,

  refreshBtn: {
    marginLeft: Spacing.md,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
  } as ViewStyle,

  refreshBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs + 2,
  } as ViewStyle,

  refreshBtnText: {
    ...Type.caption,
    fontWeight: "700",
    color: Colors.accent,
  } as TextStyle,

  // ── Content
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  } as ViewStyle,

  tabSection: {
    gap: Spacing.lg,
  } as ViewStyle,

  pageHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  } as ViewStyle,

  pageHeaderCopy: {
    flex: 1,
    minWidth: 0,
  } as ViewStyle,

  eyebrow: {
    ...Type.eyebrow,
    color: Colors.accent,
    marginBottom: Spacing.xs,
  } as TextStyle,

  sectionHeading: {
    ...Type.h1,
    color: Colors.textPrimary,
  } as TextStyle,

  sectionDescription: {
    ...Type.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    maxWidth: 620,
  } as TextStyle,

  subHeading: {
    ...Type.bodyStrong,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  } as TextStyle,

  sectionCaption: {
    ...Type.caption,
    color: Colors.textSecondary,
  } as TextStyle,

  countCaption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
    ...Type.caption,
    fontWeight: "700",
    color: Colors.accent,
  } as TextStyle,

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.md,
    backgroundColor: Colors.accentSubtle,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
  } as ViewStyle,

  statusPillText: {
    ...Type.caption,
    fontWeight: "700",
    color: Colors.accent,
  } as TextStyle,

  // ── Metrics grid
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  } as ViewStyle,

  recentSection: {
    marginTop: Spacing.md,
    padding: Spacing.xl,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
  } as ViewStyle,

  sectionHeaderRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  } as ViewStyle,

  // ── Empty / loading
  emptyBox: {
    alignItems: "center",
    padding: Spacing["3xl"],
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
  } as ViewStyle,

  emptyTitle: {
    ...Type.bodyStrong,
    color: Colors.textPrimary,
    textAlign: "center",
  } as TextStyle,

  emptyText: {
    ...Type.caption,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
    maxWidth: 360,
  } as TextStyle,

  compactEmptyState: {
    alignItems: "center",
    padding: Spacing["2xl"],
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
  } as ViewStyle,

  // ── Directory
  directorySummary: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
  } as ViewStyle,

  directorySummaryItem: {
    flex: 1,
    alignItems: "center",
  } as ViewStyle,

  directorySummaryValue: {
    ...Type.h2,
    color: Colors.textPrimary,
  } as TextStyle,

  directorySummaryLabel: {
    ...Type.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  } as TextStyle,

  directorySummaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  } as ViewStyle,

  directoryToolbar: {
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
  } as ViewStyle,

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md + 2,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  } as ViewStyle,

  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Type.body,
    color: Colors.textPrimary,
  } as TextStyle,

  searchBar: {
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surfaceInput,
    ...Type.body,
    color: Colors.textPrimary,
  } as TextStyle,

  filterScroll: {
    gap: Spacing.sm,
  } as ViewStyle,

  filterChip: {
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    borderWidth: 1,
    backgroundColor: Colors.surfaceInput,
    borderColor: Colors.borderSubtle,
  } as ViewStyle,

  filterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  } as ViewStyle,

  filterChipText: {
    ...Type.caption,
    fontWeight: "600",
    color: Colors.textSecondary,
  } as TextStyle,

  filterChipTextActive: {
    color: Colors.white,
    fontWeight: "700",
  } as TextStyle,

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.md,
    backgroundColor: Colors.accent,
  } as ViewStyle,

  addButtonText: {
    ...Type.caption,
    fontWeight: "700",
    color: Colors.white,
  } as TextStyle,

  // ── Approval requests
  requestSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    backgroundColor: Colors.warningSubtle,
  } as ViewStyle,

  requestSummaryIcon: {
    padding: Spacing.sm + 2,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  } as ViewStyle,

  requestSummaryTitle: {
    ...Type.bodyStrong,
    color: Colors.textPrimary,
  } as TextStyle,

  requestSummaryText: {
    ...Type.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  } as TextStyle,

  // ── Modals
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.surfaceOverlay,
  } as ViewStyle,

  modalCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "85%",
    padding: Spacing["2xl"],
    borderRadius: Radii["2xl"],
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    ...Shadows.popover,
  } as ViewStyle,

  modalTitle: {
    ...Type.h2,
    color: Colors.textPrimary,
  } as TextStyle,

  modalSub: {
    ...Type.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  } as TextStyle,

  modalBody: {
    marginBottom: Spacing.lg,
  } as ViewStyle,

  modalInput: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surfaceInput,
    ...Type.body,
    color: Colors.textPrimary,
  } as TextStyle,

  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  } as ViewStyle,

  cancelModalBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceInput,
  } as ViewStyle,

  cancelModalBtnText: {
    ...Type.caption,
    fontWeight: "700",
    color: Colors.textSecondary,
  } as TextStyle,

  confirmModalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radii.md,
    backgroundColor: Colors.accent,
  } as ViewStyle,

  confirmModalBtnText: {
    ...Type.caption,
    fontWeight: "700",
    color: Colors.white,
  } as TextStyle,

  closeBtn: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.xs + 2,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: Colors.accent,
  } as ViewStyle,

  closeBtnText: {
    ...Type.caption,
    fontWeight: "700",
    color: Colors.white,
  } as TextStyle,

  // ── Detail rows (inside inspection modal)
  detailSection: {
    marginBottom: Spacing.md,
    padding: Spacing.md + 2,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
  } as ViewStyle,

  detailSectionTitle: {
    ...Type.eyebrow,
    color: Colors.accent,
    marginBottom: Spacing.sm,
  } as TextStyle,

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  } as ViewStyle,

  detailLabel: {
    ...Type.caption,
    fontWeight: "600",
    color: Colors.textSecondary,
  } as TextStyle,

  detailValue: {
    ...Type.caption,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "right",
    flexShrink: 1,
    marginLeft: Spacing.sm,
  } as TextStyle,

  detailValueAccent: {
    color: Colors.accent,
    fontWeight: "700",
  } as TextStyle,

  // ── Program detail rows
  progDetailBox: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.surfaceInput,
    gap: Spacing.xs,
  } as ViewStyle,

  progDetailText: {
    ...Type.caption,
    color: Colors.textSecondary,
  } as TextStyle,

  bold: {
    fontWeight: "700",
    color: Colors.textPrimary,
  } as TextStyle,

  scoreText: {
    ...Type.caption,
    fontWeight: "700",
    color: Colors.success,
    marginTop: Spacing.xs,
  } as TextStyle,

  remarksSnippet: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceInput,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  } as ViewStyle,

  remarksText: {
    ...Type.caption,
    fontStyle: "italic",
    color: Colors.textSecondary,
  } as TextStyle,

  // ── Role picker (employee modal)
  auditorSelectLabel: {
    ...Type.eyebrow,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  } as TextStyle,

  rolePickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  } as ViewStyle,

  rolePickBtn: {
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceInput,
  } as ViewStyle,

  rolePickBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSubtle,
  } as ViewStyle,

  rolePickBtnText: {
    ...Type.caption,
    fontWeight: "600",
    color: Colors.textPrimary,
    textTransform: "capitalize",
  } as TextStyle,

  rolePickBtnTextActive: {
    color: Colors.accent,
    fontWeight: "700",
  } as TextStyle,

  // admin/styles.ts
  // ... existing styles ...

  // ── New Split-View Layout for Programs
  splitLayout: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: Spacing["2xl"],
  } as ViewStyle,

  splitSidebar: {
    width: "100%",
    maxWidth: 260,
    gap: Spacing.xs,
  } as ViewStyle,

  splitSidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: "transparent",
  } as ViewStyle,

  splitSidebarItemActive: {
    backgroundColor: Colors.accentSubtle,
    borderColor: Colors.accentBorder,
  } as ViewStyle,

  splitSidebarText: {
    ...Type.bodyStrong,
    color: Colors.textSecondary,
  } as TextStyle,

  splitSidebarTextActive: {
    color: Colors.accent,
    fontWeight: "700",
  } as TextStyle,

  splitSidebarCount: {
    ...Type.caption,
    fontWeight: "600",
    color: Colors.textTertiary,
    backgroundColor: Colors.surfaceInput,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.pill,
    overflow: "hidden",
  } as TextStyle,

  splitSidebarCountActive: {
    color: Colors.accent,
    backgroundColor: "transparent",
  } as TextStyle,

  splitMain: {
    flex: 1,
    minWidth: 320,
    gap: Spacing.lg,
  } as ViewStyle,
} as const;
