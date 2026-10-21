// constants/design.ts
// ============================================
// Marush App — Design Tokens (Dark Premium)
// ============================================
// Single source of truth for color, spacing,
// radii, typography, shadows, and motion.
// Every screen imports from here.
// ============================================

// ---- Palette ---------------------------------------------------

export const Colors = {
  // ── Accent (CEVA Cerulean) — the only chromatic accent
  accent: "#019CDF",
  accentLight: "#3BB4E8",
  accentDark: "#0177AA",
  accentSubtle: "rgba(1,156,223,0.12)",
  accentBorder: "rgba(1,156,223,0.28)",
  accentGlow: "rgba(1,156,223,0.35)",

  // ── Dark surfaces (default app theme)
  background: "#0A0F1A",
  surface: "#0A0F1A",
  surfaceElevated: "#121722",
  surfaceCard: "rgba(255,255,255,0.045)",
  surfaceCardHover: "rgba(255,255,255,0.07)",
  surfaceInput: "rgba(255,255,255,0.04)",
  surfaceOverlay: "rgba(0,0,0,0.72)",

  // ── Borders (on dark)
  border: "rgba(255,255,255,0.08)",
  borderSubtle: "rgba(255,255,255,0.05)",
  borderStrong: "rgba(255,255,255,0.14)",
  borderAccent: "rgba(1,156,223,0.4)",

  // ── Text (on dark)
  textPrimary: "#F7F8F8",
  textSecondary: "#8A8F98",
  textTertiary: "#5C6169",
  textInverse: "#0A0F1A",

  // ── Semantic (used sparingly — one status = one color)
  success: "#3FB950",
  successSubtle: "rgba(63,185,80,0.12)",
  successBorder: "rgba(63,185,80,0.3)",
  warning: "#D29922",
  warningSubtle: "rgba(210,153,34,0.12)",
  warningBorder: "rgba(210,153,34,0.3)",
  danger: "#F85149",
  dangerSubtle: "rgba(248,81,73,0.12)",
  dangerBorder: "rgba(248,81,73,0.3)",
  info: "#58A6FF",
  infoSubtle: "rgba(88,166,255,0.12)",
  infoBorder: "rgba(88,166,255,0.3)",

  // ── Legacy compatibility (so existing imports don't break)
  // These map to the new palette. Forest green stays for the logo only,
  // but code that referenced Colors.primary/secondary still compiles.
  primary: "#019CDF",
  primaryLight: "#3BB4E8",
  primaryDark: "#0177AA",
  secondary: "#8A8F98",
  secondaryLight: "#A1A6AE",
  secondaryDark: "#5C6169",
  white: "#FFFFFF",
  card: "#121722",
  cardSubtle: "#161B26",
  textMuted: "#5C6169",

  // ── Brand (logo / marketing only — not for UI surfaces)
  brandForest: "#0B6259",
  brandTeal: "#1D8B7E",
} as const;

export type ColorKey = keyof typeof Colors;

// ---- Radii -----------------------------------------------------

export const Radii = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  "2xl": 24,
  pill: 999,
} as const;

// ---- Spacing ---------------------------------------------------

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 56,
} as const;

// ---- Typography ------------------------------------------------
// Each entry = RN-compatible style. Spread into `style={}`.

export const Type = {
  display: {
    fontSize: 34,
    fontWeight: "700" as const,
    letterSpacing: -1.2,
    lineHeight: 40,
  },
  h1: {
    fontSize: 26,
    fontWeight: "700" as const,
    letterSpacing: -0.6,
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: "700" as const,
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  h3: {
    fontSize: 16,
    fontWeight: "600" as const,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    letterSpacing: 0,
    lineHeight: 20,
  },
  bodyStrong: {
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 0,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    letterSpacing: 0,
    lineHeight: 17,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 1.4,
    lineHeight: 14,
    textTransform: "uppercase" as const,
  },
  mono: {
    fontSize: 12,
    fontWeight: "600" as const,
    letterSpacing: 0.4,
    lineHeight: 16,
    fontFamily: "monospace",
  },
  number: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.8,
    lineHeight: 32,
  },
} as const;

// ---- Shadows ---------------------------------------------------

export const Shadows = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  cardElevated: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 6,
  },
  popover: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.42,
    shadowRadius: 32,
    elevation: 12,
  },
  accentGlow: {
    shadowColor: "#019CDF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

// ---- Motion ----------------------------------------------------

export const Motion = {
  fast: 140,
  base: 220,
  slow: 380,
  spring: { friction: 7, tension: 55 },
} as const;

// ---- Convenience: card style bundle ----------------------------
// Use: <View style={CardStyle}> ... </View>

export const CardStyle = {
  backgroundColor: Colors.surfaceCard,
  borderRadius: Radii.lg,
  borderWidth: 1,
  borderColor: Colors.border,
} as const;

export const CardStyleElevated = {
  ...CardStyle,
  backgroundColor: Colors.surfaceElevated,
  ...Shadows.card,
} as const;
