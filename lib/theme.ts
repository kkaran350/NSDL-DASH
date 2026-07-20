export type ThemeMode = "light" | "dark";
export type AccentKey = "green" | "gold" | "blue" | "rust";

interface AccentPalette {
  accent: string;
  accentSoft: string;
}

const ACCENT_PALETTES: Record<ThemeMode, Record<AccentKey, AccentPalette>> = {
  light: {
    green: { accent: "#2F6F5E", accentSoft: "#DCE7E1" },
    gold: { accent: "#A9823C", accentSoft: "#EDE3D0" },
    blue: { accent: "#3A5A8A", accentSoft: "#DCE3EE" },
    rust: { accent: "#AD5A3A", accentSoft: "#EEDED5" },
  },
  dark: {
    green: { accent: "#5AB098", accentSoft: "#283C36" },
    gold: { accent: "#D6AA64", accentSoft: "#3A301E" },
    blue: { accent: "#78A0D6", accentSoft: "#202A3A" },
    rust: { accent: "#D6826A", accentSoft: "#3A261E" },
  },
};

const INK: Record<ThemeMode, string> = { light: "#1A2A26", dark: "#E6E8E2" };
const INK_SOFT: Record<ThemeMode, string> = { light: "#4B5A55", dark: "#96A098" };
const BORDER: Record<ThemeMode, string> = { light: "#D9D6C8", dark: "#37413C" };
const PAPER_RAISED: Record<ThemeMode, string> = { light: "#F8F9F5", dark: "#1C2421" };
const GOLD: Record<ThemeMode, string> = { light: "#A9823C", dark: "#D6AA64" };

export const ACCENT_OPTIONS: { key: AccentKey; label: string; swatch: string }[] = [
  { key: "green", label: "Ledger green", swatch: ACCENT_PALETTES.light.green.accent },
  { key: "gold", label: "Gold", swatch: ACCENT_PALETTES.light.gold.accent },
  { key: "blue", label: "Slate blue", swatch: ACCENT_PALETTES.light.blue.accent },
  { key: "rust", label: "Rust", swatch: ACCENT_PALETTES.light.rust.accent },
];

export interface ChartColors {
  accent: string;
  accentSoft: string;
  ink: string;
  inkSoft: string;
  border: string;
  paperRaised: string;
  gold: string;
}

export function getChartColors(theme: ThemeMode, accent: AccentKey): ChartColors {
  const palette = ACCENT_PALETTES[theme][accent];
  return {
    accent: palette.accent,
    accentSoft: palette.accentSoft,
    ink: INK[theme],
    inkSoft: INK_SOFT[theme],
    border: BORDER[theme],
    paperRaised: PAPER_RAISED[theme],
    gold: GOLD[theme],
  };
}

const THEME_KEY = "holdings-dashboard:theme";
const ACCENT_KEY = "holdings-dashboard:accent";

export function loadThemePrefs(): { theme: ThemeMode; accent: AccentKey } {
  if (typeof window === "undefined") return { theme: "light", accent: "green" };
  const theme = (window.localStorage.getItem(THEME_KEY) as ThemeMode) || "light";
  const accent = (window.localStorage.getItem(ACCENT_KEY) as AccentKey) || "green";
  return { theme, accent };
}

export function saveThemePrefs(theme: ThemeMode, accent: AccentKey) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, theme);
  window.localStorage.setItem(ACCENT_KEY, accent);
}

export function applyThemeToDocument(theme: ThemeMode, accent: AccentKey) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-accent", accent);
}