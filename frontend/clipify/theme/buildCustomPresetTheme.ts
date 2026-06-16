import { alpha, createTheme, type PaletteOptions, type ThemeOptions } from "@mui/material/styles";
import type { ThemePresetId } from "./presetIds";

export type CustomPresetSurfaces = {
  /** Card / elevated panels (~30% secondary) */
  card: string;
  /** Drawer, subtle chrome */
  paperChrome: string;
  /** Top app bar (often translucent) */
  appBar: string;
};

export type CustomPresetDefinition = {
  id: ThemePresetId;
  palette: PaletteOptions;
  surfaces: CustomPresetSurfaces;
  /** Soft shadow tint (rgb base) */
  shadowTint: string;
};

const darkShadowsDeep = [
  "none",
  "0 1px 2px rgba(0,0,0,0.45)",
  "0 2px 4px rgba(0,0,0,0.45)",
  "0 4px 8px rgba(0,0,0,0.45)",
  "0 8px 16px rgba(0,0,0,0.45)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
  "0 12px 24px rgba(0,0,0,0.5)",
] as const;

const lightShadowsSoft = [
  "none",
  "0 1px 2px rgba(15,23,42,0.05)",
  "0 2px 4px rgba(15,23,42,0.05)",
  "0 4px 8px rgba(15,23,42,0.06)",
  "0 8px 16px rgba(15,23,42,0.07)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
  "0 12px 24px rgba(15,23,42,0.08)",
] as const;

const commonTypography = {
  fontFamily: '"Inter", "Geist", "system-ui", sans-serif',
  fontWeightMedium: 500,
  fontWeightBold: 700,
  h4: { fontWeight: 700, letterSpacing: "-0.03em" },
  h5: { fontWeight: 600, letterSpacing: "-0.02em" },
  h6: { fontWeight: 600, letterSpacing: "-0.01em" },
  body1: { letterSpacing: "0.01em" },
  body2: { letterSpacing: "0.01em" },
} as const;

export function buildCustomPresetTheme(def: CustomPresetDefinition) {
  const mode = def.palette.mode!;
  const isDark = mode === "dark";
  const { surfaces, shadowTint } = def;
  const primary = def.palette.primary as { main: string };
  const pm = primary.main;

  return createTheme({
    palette: def.palette,
    shape: { borderRadius: 12 },
    typography: { ...commonTypography },
    shadows: [...(isDark ? darkShadowsDeep : lightShadowsSoft)] as unknown as ThemeOptions["shadows"],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { colorScheme: isDark ? "dark" : "light" },
          "html, body": {
            transitionProperty: "background-color, color",
            transitionDuration: "0.3s",
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 12,
            transition: "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
          },
          contained: {
            boxShadow: isDark ? `0 1px 2px ${alpha(shadowTint, 0.35)}` : `0 1px 2px ${alpha(shadowTint, 0.08)}`,
            "&:hover": {
              boxShadow: `0 0 0 1px ${alpha(pm, 0.35)}, 0 4px 14px ${alpha(pm, isDark ? 0.2 : 0.12)}`,
            },
          },
          outlined: {
            borderWidth: 1,
            "&:hover": { borderWidth: 1 },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: surfaces.card,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 16,
            boxShadow: isDark
              ? `0 2px 12px ${alpha(shadowTint, 0.4)}`
              : `0 2px 16px ${alpha(shadowTint, 0.06)}`,
            transition: "border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease",
            overflow: "hidden",
            "&:hover": {
              borderColor: isDark ? alpha("#fff", 0.12) : alpha(shadowTint, 0.14),
              boxShadow: isDark
                ? `0 12px 40px ${alpha(shadowTint, 0.55)}`
                : `0 12px 32px ${alpha(shadowTint, 0.09)}`,
            },
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: surfaces.paperChrome,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 16,
            boxShadow: isDark
              ? `0 2px 10px ${alpha(shadowTint, 0.35)}`
              : `0 2px 14px ${alpha(shadowTint, 0.05)}`,
            transition: "background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
          }),
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundColor: surfaces.appBar,
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${theme.palette.divider}`,
            boxShadow: "none",
            color: theme.palette.text.primary,
            transition: "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease",
          }),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 500,
            borderRadius: 8,
            transition: "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease",
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: "color 0.2s ease, background-color 0.2s ease",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            transition: "background-color 0.3s ease, border-color 0.3s ease",
            backgroundColor: surfaces.paperChrome,
            borderRight: `1px solid ${theme.palette.divider}`,
          }),
        },
      },
    },
  });
}

/** Red-accent presets (5 dark + 5 light) */
export const CUSTOM_PRESET_DEFINITIONS: Record<
  Exclude<ThemePresetId, "dark-default" | "light-default">,
  CustomPresetDefinition
> = {
  "dark-red-neon": {
    id: "dark-red-neon",
    shadowTint: "#020204",
    surfaces: {
      card: "#12121a",
      paperChrome: "#0c0c12",
      appBar: "rgba(5, 5, 8, 0.94)",
    },
    palette: {
      mode: "dark",
      primary: { main: "#ff355e", light: "#ff6b88", dark: "#e11d48", contrastText: "#ffffff" },
      secondary: { main: "#71717a", light: "#a1a1aa", dark: "#52525b", contrastText: "#fafafa" },
      background: { default: "#050508", paper: "#0a0a10" },
      text: { primary: "#f8f8f9", secondary: "#a8a8b0", disabled: "#6b6b75" },
      divider: "rgba(255, 53, 94, 0.14)",
      action: { hover: alpha("#ff355e", 0.08), selected: alpha("#ff355e", 0.14) },
    },
  },
  "dark-red-crimson": {
    id: "dark-red-crimson",
    shadowTint: "#0a0808",
    surfaces: {
      card: "#181414",
      paperChrome: "#121010",
      appBar: "rgba(12, 10, 10, 0.93)",
    },
    palette: {
      mode: "dark",
      primary: { main: "#ef4444", light: "#f87171", dark: "#dc2626", contrastText: "#ffffff" },
      secondary: { main: "#78716c", light: "#a8a29e", dark: "#57534e", contrastText: "#fafaf9" },
      background: { default: "#0c0a0a", paper: "#141110" },
      text: { primary: "#faf7f7", secondary: "#b8a8a8", disabled: "#7a6e6e" },
      divider: "rgba(239, 68, 68, 0.12)",
      action: { hover: alpha("#ef4444", 0.08), selected: alpha("#ef4444", 0.14) },
    },
  },
  "dark-red-ruby": {
    id: "dark-red-ruby",
    shadowTint: "#0c080a",
    surfaces: {
      card: "#1a1416",
      paperChrome: "#141012",
      appBar: "rgba(15, 10, 12, 0.93)",
    },
    palette: {
      mode: "dark",
      primary: { main: "#f43f5e", light: "#fb7185", dark: "#e11d48", contrastText: "#ffffff" },
      secondary: { main: "#7a6a70", light: "#9c8c92", dark: "#5c4e54", contrastText: "#fdf2f4" },
      background: { default: "#0f0a0c", paper: "#161012" },
      text: { primary: "#fdf2f4", secondary: "#c4a8b0", disabled: "#8a7880" },
      divider: "rgba(244, 63, 94, 0.12)",
      action: { hover: alpha("#f43f5e", 0.08), selected: alpha("#f43f5e", 0.14) },
    },
  },
  "dark-red-merlot": {
    id: "dark-red-merlot",
    shadowTint: "#0a0606",
    surfaces: {
      card: "#1c1414",
      paperChrome: "#161010",
      appBar: "rgba(16, 8, 8, 0.93)",
    },
    palette: {
      mode: "dark",
      primary: { main: "#c24141", light: "#dc6464", dark: "#991b1b", contrastText: "#ffffff" },
      secondary: { main: "#736060", light: "#948080", dark: "#554848", contrastText: "#f5eded" },
      background: { default: "#100808", paper: "#181010" },
      text: { primary: "#f5eded", secondary: "#b5a0a0", disabled: "#786868" },
      divider: "rgba(194, 65, 65, 0.12)",
      action: { hover: alpha("#c24141", 0.08), selected: alpha("#c24141", 0.14) },
    },
  },
  "dark-red-maroon": {
    id: "dark-red-maroon",
    shadowTint: "#050303",
    surfaces: {
      card: "#161010",
      paperChrome: "#120c0c",
      appBar: "rgba(10, 6, 6, 0.94)",
    },
    palette: {
      mode: "dark",
      primary: { main: "#b91c1c", light: "#dc2626", dark: "#7f1d1d", contrastText: "#ffffff" },
      secondary: { main: "#6a5858", light: "#8a7878", dark: "#4a4040", contrastText: "#f5f0f0" },
      background: { default: "#0a0606", paper: "#120c0c" },
      text: { primary: "#f5f0f0", secondary: "#a89898", disabled: "#706060" },
      divider: "rgba(185, 28, 28, 0.1)",
      action: { hover: alpha("#b91c1c", 0.08), selected: alpha("#b91c1c", 0.14) },
    },
  },
  "light-red-snow": {
    id: "light-red-snow",
    shadowTint: "#171717",
    surfaces: {
      card: "#ffffff",
      paperChrome: "#fafafa",
      appBar: "rgba(255, 255, 255, 0.92)",
    },
    palette: {
      mode: "light",
      primary: { main: "#dc2626", light: "#ef4444", dark: "#b91c1c", contrastText: "#ffffff" },
      secondary: { main: "#525252", light: "#737373", dark: "#404040", contrastText: "#ffffff" },
      background: { default: "#fafafa", paper: "#ffffff" },
      text: { primary: "#171717", secondary: "#737373", disabled: "#a3a3a3" },
      divider: "rgba(23, 23, 23, 0.08)",
      action: { hover: alpha("#dc2626", 0.06), selected: alpha("#dc2626", 0.1) },
    },
  },
  "light-red-blush": {
    id: "light-red-blush",
    shadowTint: "#1f1416",
    surfaces: {
      card: "#ffffff",
      paperChrome: "#fffafa",
      appBar: "rgba(255, 255, 255, 0.9)",
    },
    palette: {
      mode: "light",
      primary: { main: "#e11d48", light: "#f43f5e", dark: "#be123c", contrastText: "#ffffff" },
      secondary: { main: "#78716c", light: "#a8a29e", dark: "#57534e", contrastText: "#ffffff" },
      background: { default: "#fff5f5", paper: "#ffffff" },
      text: { primary: "#1f1416", secondary: "#7d6568", disabled: "#a8a29e" },
      divider: "rgba(225, 29, 72, 0.12)",
      action: { hover: alpha("#e11d48", 0.06), selected: alpha("#e11d48", 0.1) },
    },
  },
  "light-red-coral": {
    id: "light-red-coral",
    shadowTint: "#1c1917",
    surfaces: {
      card: "#ffffff",
      paperChrome: "#fffaf5",
      appBar: "rgba(255, 255, 255, 0.9)",
    },
    palette: {
      mode: "light",
      primary: { main: "#f97316", light: "#fb923c", dark: "#ea580c", contrastText: "#ffffff" },
      secondary: { main: "#78716c", light: "#a8a29e", dark: "#57534e", contrastText: "#ffffff" },
      background: { default: "#fff7ed", paper: "#ffffff" },
      text: { primary: "#1c1917", secondary: "#78716c", disabled: "#a8a29e" },
      divider: "rgba(249, 115, 22, 0.14)",
      action: { hover: alpha("#f97316", 0.06), selected: alpha("#f97316", 0.1) },
    },
  },
  "light-red-peach": {
    id: "light-red-peach",
    shadowTint: "#1c1917",
    surfaces: {
      card: "#ffffff",
      paperChrome: "#fffefb",
      appBar: "rgba(255, 255, 255, 0.9)",
    },
    palette: {
      mode: "light",
      primary: { main: "#ea580c", light: "#f97316", dark: "#c2410c", contrastText: "#ffffff" },
      secondary: { main: "#78716c", light: "#a8a29e", dark: "#57534e", contrastText: "#ffffff" },
      background: { default: "#fffbeb", paper: "#ffffff" },
      text: { primary: "#1c1917", secondary: "#78716c", disabled: "#a8a29e" },
      divider: "rgba(234, 88, 12, 0.14)",
      action: { hover: alpha("#ea580c", 0.06), selected: alpha("#ea580c", 0.1) },
    },
  },
  "light-red-dawn": {
    id: "light-red-dawn",
    shadowTint: "#1a1014",
    surfaces: {
      card: "#ffffff",
      paperChrome: "#fef7f8",
      appBar: "rgba(255, 255, 255, 0.9)",
    },
    palette: {
      mode: "light",
      primary: { main: "#be123c", light: "#e11d48", dark: "#9f1239", contrastText: "#ffffff" },
      secondary: { main: "#78716c", light: "#a8a29e", dark: "#57534e", contrastText: "#ffffff" },
      background: { default: "#fdf4f6", paper: "#ffffff" },
      text: { primary: "#1a1014", secondary: "#7a6570", disabled: "#a8a29e" },
      divider: "rgba(190, 18, 60, 0.12)",
      action: { hover: alpha("#be123c", 0.06), selected: alpha("#be123c", 0.1) },
    },
  },
};
