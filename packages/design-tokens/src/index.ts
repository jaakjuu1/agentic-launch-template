export const radii = {
  lg: 24,
  md: 18,
  pill: 999,
  sm: 12,
} as const;

export const spacing = {
  lg: 32,
  md: 20,
  sm: 12,
  xl: 48,
  xs: 8,
} as const;

export const typography = {
  display: "Space Grotesk",
  body: "Instrument Sans",
  mono: "IBM Plex Mono",
} as const;

export const colors = {
  accent: "#ff6b35",
  accentSoft: "#ffd4c7",
  background: "#f5efe6",
  card: "#fffaf4",
  ink: "#16202a",
  muted: "#5f6772",
  success: "#1b7f5b",
  surface: "#fffdf9",
  warning: "#b85c00",
} as const;

export const gradients = {
  hero: "linear-gradient(135deg, #fffaf4 0%, #ffd4c7 48%, #b6d4ff 100%)",
  card: "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,245,238,0.98) 100%)",
} as const;
