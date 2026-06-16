import type { ThemePresetId } from "./presetIds";

export const THEME_PRESET_STORAGE_KEY = "clipify-theme-preset";

/** @deprecated legacy binary light/dark — migrated once to a preset id */
export const LEGACY_THEME_STORAGE_KEY = "clipify-theme";

export type PresetMeta = {
  label: string;
  group: "dark" | "light";
  /** Accent / CTA (≈10%) */
  accent: string;
  /** Primary background (≈60%) */
  background: string;
};

export const PRESET_META: Record<ThemePresetId, PresetMeta> = {
  "dark-default": {
    label: "Dark Default",
    group: "dark",
    accent: "#E50914",
    background: "#0a0a0a",
  },
  "dark-red-neon": {
    label: "Red Neon",
    group: "dark",
    accent: "#ff355e",
    background: "#050508",
  },
  "dark-red-crimson": {
    label: "Red Crimson",
    group: "dark",
    accent: "#ef4444",
    background: "#0c0a0a",
  },
  "dark-red-ruby": {
    label: "Red Ruby",
    group: "dark",
    accent: "#f43f5e",
    background: "#0f0a0c",
  },
  "dark-red-merlot": {
    label: "Red Merlot",
    group: "dark",
    accent: "#c24141",
    background: "#100808",
  },
  "dark-red-maroon": {
    label: "Red Maroon",
    group: "dark",
    accent: "#b91c1c",
    background: "#0a0606",
  },
  "light-default": {
    label: "Light Default",
    group: "light",
    accent: "#E50914",
    background: "#f4f6f8",
  },
  "light-red-snow": {
    label: "Red Snow",
    group: "light",
    accent: "#dc2626",
    background: "#fafafa",
  },
  "light-red-blush": {
    label: "Red Blush",
    group: "light",
    accent: "#e11d48",
    background: "#fff5f5",
  },
  "light-red-coral": {
    label: "Red Coral",
    group: "light",
    accent: "#f97316",
    background: "#fff7ed",
  },
  "light-red-peach": {
    label: "Red Peach",
    group: "light",
    accent: "#ea580c",
    background: "#fffbeb",
  },
  "light-red-dawn": {
    label: "Red Dawn",
    group: "light",
    accent: "#be123c",
    background: "#fdf4f6",
  },
};

export const THEME_BOOT_BODY: Record<ThemePresetId, { bg: string; fg: string }> = {
  "dark-default": { bg: "#0a0a0a", fg: "#fafafa" },
  "dark-red-neon": { bg: "#050508", fg: "#f8f8f9" },
  "dark-red-crimson": { bg: "#0c0a0a", fg: "#faf7f7" },
  "dark-red-ruby": { bg: "#0f0a0c", fg: "#fdf2f4" },
  "dark-red-merlot": { bg: "#100808", fg: "#f5eded" },
  "dark-red-maroon": { bg: "#0a0606", fg: "#f5f0f0" },
  "light-default": { bg: "#f4f6f8", fg: "#0f172a" },
  "light-red-snow": { bg: "#fafafa", fg: "#171717" },
  "light-red-blush": { bg: "#fff5f5", fg: "#1f1416" },
  "light-red-coral": { bg: "#fff7ed", fg: "#1c1917" },
  "light-red-peach": { bg: "#fffbeb", fg: "#1c1917" },
  "light-red-dawn": { bg: "#fdf4f6", fg: "#1a1014" },
};

type CssVarBundle = Record<string, string>;

const PRESET_CSS_SEMANTIC: Record<
  Exclude<ThemePresetId, "dark-default" | "light-default">,
  {
    muted: string;
    border: string;
    inputBg: string;
    inputBorder: string;
    inputBorderHover: string;
    tableRowHover: string;
    tableBorder: string;
    tableHead: string;
  }
> = {
  "dark-red-neon": {
    muted: "#a8a8b0",
    border: "rgba(255, 53, 94, 0.12)",
    inputBg: "rgba(255, 255, 255, 0.05)",
    inputBorder: "rgba(255, 255, 255, 0.12)",
    inputBorderHover: "rgba(255, 53, 94, 0.35)",
    tableRowHover: "rgba(255, 255, 255, 0.04)",
    tableBorder: "rgba(255, 255, 255, 0.07)",
    tableHead: "#a8a8b0",
  },
  "dark-red-crimson": {
    muted: "#b8a8a8",
    border: "rgba(239, 68, 68, 0.12)",
    inputBg: "rgba(255, 255, 255, 0.045)",
    inputBorder: "rgba(255, 255, 255, 0.1)",
    inputBorderHover: "rgba(239, 68, 68, 0.3)",
    tableRowHover: "rgba(255, 255, 255, 0.035)",
    tableBorder: "rgba(255, 255, 255, 0.06)",
    tableHead: "#b8a8a8",
  },
  "dark-red-ruby": {
    muted: "#c4a8b0",
    border: "rgba(244, 63, 94, 0.12)",
    inputBg: "rgba(255, 255, 255, 0.045)",
    inputBorder: "rgba(255, 255, 255, 0.1)",
    inputBorderHover: "rgba(244, 63, 94, 0.3)",
    tableRowHover: "rgba(255, 255, 255, 0.035)",
    tableBorder: "rgba(255, 255, 255, 0.06)",
    tableHead: "#c4a8b0",
  },
  "dark-red-merlot": {
    muted: "#b5a0a0",
    border: "rgba(194, 65, 65, 0.12)",
    inputBg: "rgba(255, 255, 255, 0.04)",
    inputBorder: "rgba(255, 255, 255, 0.09)",
    inputBorderHover: "rgba(194, 65, 65, 0.28)",
    tableRowHover: "rgba(255, 255, 255, 0.035)",
    tableBorder: "rgba(255, 255, 255, 0.06)",
    tableHead: "#b5a0a0",
  },
  "dark-red-maroon": {
    muted: "#a89898",
    border: "rgba(185, 28, 28, 0.1)",
    inputBg: "rgba(255, 255, 255, 0.04)",
    inputBorder: "rgba(255, 255, 255, 0.08)",
    inputBorderHover: "rgba(185, 28, 28, 0.28)",
    tableRowHover: "rgba(255, 255, 255, 0.03)",
    tableBorder: "rgba(255, 255, 255, 0.055)",
    tableHead: "#a89898",
  },
  "light-red-snow": {
    muted: "#737373",
    border: "rgba(23, 23, 23, 0.08)",
    inputBg: "rgba(255, 255, 255, 0.95)",
    inputBorder: "rgba(23, 23, 23, 0.1)",
    inputBorderHover: "rgba(220, 38, 38, 0.25)",
    tableRowHover: "rgba(220, 38, 38, 0.05)",
    tableBorder: "rgba(23, 23, 23, 0.08)",
    tableHead: "#737373",
  },
  "light-red-blush": {
    muted: "#7d6568",
    border: "rgba(225, 29, 72, 0.12)",
    inputBg: "rgba(255, 255, 255, 0.92)",
    inputBorder: "rgba(31, 20, 22, 0.1)",
    inputBorderHover: "rgba(225, 29, 72, 0.22)",
    tableRowHover: "rgba(225, 29, 72, 0.05)",
    tableBorder: "rgba(31, 20, 22, 0.08)",
    tableHead: "#7d6568",
  },
  "light-red-coral": {
    muted: "#78716c",
    border: "rgba(249, 115, 22, 0.14)",
    inputBg: "rgba(255, 255, 255, 0.95)",
    inputBorder: "rgba(28, 25, 23, 0.1)",
    inputBorderHover: "rgba(249, 115, 22, 0.25)",
    tableRowHover: "rgba(249, 115, 22, 0.06)",
    tableBorder: "rgba(28, 25, 23, 0.08)",
    tableHead: "#78716c",
  },
  "light-red-peach": {
    muted: "#78716c",
    border: "rgba(234, 88, 12, 0.14)",
    inputBg: "rgba(255, 255, 255, 0.95)",
    inputBorder: "rgba(28, 25, 23, 0.1)",
    inputBorderHover: "rgba(234, 88, 12, 0.25)",
    tableRowHover: "rgba(234, 88, 12, 0.06)",
    tableBorder: "rgba(28, 25, 23, 0.08)",
    tableHead: "#78716c",
  },
  "light-red-dawn": {
    muted: "#7a6570",
    border: "rgba(190, 18, 60, 0.12)",
    inputBg: "rgba(255, 255, 255, 0.93)",
    inputBorder: "rgba(26, 16, 20, 0.1)",
    inputBorderHover: "rgba(190, 18, 60, 0.22)",
    tableRowHover: "rgba(190, 18, 60, 0.05)",
    tableBorder: "rgba(26, 16, 20, 0.08)",
    tableHead: "#7a6570",
  },
};

export function getPresetCssVariables(id: ThemePresetId): CssVarBundle {
  const m = PRESET_META[id];
  const boot = THEME_BOOT_BODY[id];

  if (id === "dark-default") {
    return {
      "--app-bg": "#0a0a0a",
      "--app-fg": "#fafafa",
      "--app-muted": "#94a3b8",
      "--app-border": "rgba(255, 255, 255, 0.06)",
      "--app-input-bg": "rgba(42, 42, 42, 0.95)",
      "--app-input-border": "transparent",
      "--app-input-border-hover": "rgba(229, 9, 20, 0.35)",
      "--app-table-row-hover": "rgba(255, 255, 255, 0.04)",
      "--app-table-border": "rgba(255, 255, 255, 0.08)",
      "--app-table-head": "#a3a3a3",
      "--app-focus-ring": "#E50914",
    };
  }
  if (id === "light-default") {
    return {
      "--app-bg": "#f4f6f8",
      "--app-fg": "#0f172a",
      "--app-muted": "#64748b",
      "--app-border": "rgba(15, 23, 42, 0.08)",
      "--app-input-bg": "rgba(255, 255, 255, 0.95)",
      "--app-input-border": "rgba(15, 23, 42, 0.08)",
      "--app-input-border-hover": "rgba(229, 9, 20, 0.22)",
      "--app-table-row-hover": "rgba(15, 23, 42, 0.04)",
      "--app-table-border": "rgba(15, 23, 42, 0.1)",
      "--app-table-head": "#64748b",
      "--app-focus-ring": "#E50914",
    };
  }

  const s = PRESET_CSS_SEMANTIC[id];
  return {
    "--app-bg": m.background,
    "--app-fg": boot.fg,
    "--app-muted": s.muted,
    "--app-border": s.border,
    "--app-input-bg": s.inputBg,
    "--app-input-border": s.inputBorder,
    "--app-input-border-hover": s.inputBorderHover,
    "--app-table-row-hover": s.tableRowHover,
    "--app-table-border": s.tableBorder,
    "--app-table-head": s.tableHead,
    "--app-focus-ring": m.accent,
  };
}
