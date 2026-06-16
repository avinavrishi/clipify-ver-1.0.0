"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createThemeForPreset } from "../theme/createThemeForPreset";
import {
  DEFAULT_THEME_PRESET_ID,
  presetColorMode,
  resolveStoredPresetId,
  type ThemePresetId,
} from "../theme/presetIds";
import {
  getPresetCssVariables,
  LEGACY_THEME_STORAGE_KEY,
  THEME_BOOT_BODY,
  THEME_PRESET_STORAGE_KEY,
} from "../theme/presetMetadata";

export { THEME_PRESET_STORAGE_KEY, LEGACY_THEME_STORAGE_KEY };

/** @deprecated use THEME_PRESET_STORAGE_KEY */
export const THEME_STORAGE_KEY = LEGACY_THEME_STORAGE_KEY;

export type ThemeColorMode = "light" | "dark";

type ThemePresetContextValue = {
  presetId: ThemePresetId;
  setPresetId: (id: ThemePresetId) => void;
  /** light | dark derived from preset */
  colorMode: ThemeColorMode;
};

const ThemePresetContext = createContext<ThemePresetContextValue | null>(null);

function stripPresetClasses(el: HTMLElement) {
  Array.from(el.classList).forEach((c) => {
    if (c === "dark" || c === "light" || c.startsWith("theme-")) {
      el.classList.remove(c);
    }
  });
}

/** Apply preset class on `<html>`, CSS variables, and body colors */
export function applyHtmlPreset(id: ThemePresetId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const mode = presetColorMode(id);
  stripPresetClasses(root);
  root.setAttribute("data-theme-preset", id);
  root.setAttribute("data-theme", mode);
  root.classList.add(mode, `theme-${id}`);

  const vars = getPresetCssVariables(id);
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  const bodyColors = THEME_BOOT_BODY[id];
  document.body.style.backgroundColor = bodyColors.bg;
  document.body.style.color = bodyColors.fg;
}

function readStoredPresetId(): ThemePresetId {
  if (typeof window === "undefined") return DEFAULT_THEME_PRESET_ID;
  try {
    let raw = localStorage.getItem(THEME_PRESET_STORAGE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
      raw = legacy === "light" ? "light-default" : DEFAULT_THEME_PRESET_ID;
    }
    const resolved = resolveStoredPresetId(raw);
    localStorage.setItem(THEME_PRESET_STORAGE_KEY, resolved);
    return resolved;
  } catch {
    return DEFAULT_THEME_PRESET_ID;
  }
}

export function ThemePresetProvider({ children }: { children: React.ReactNode }) {
  const [presetId, setPresetIdState] = useState<ThemePresetId>(DEFAULT_THEME_PRESET_ID);

  useLayoutEffect(() => {
    const next = readStoredPresetId();
    applyHtmlPreset(next);
    setPresetIdState(next);
  }, []);

  const setPresetId = useCallback((id: ThemePresetId) => {
    try {
      localStorage.setItem(THEME_PRESET_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
    applyHtmlPreset(id);
    setPresetIdState(id);
  }, []);

  const colorMode = presetColorMode(presetId);

  const theme = useMemo(() => createThemeForPreset(presetId), [presetId]);

  const value = useMemo(
    () => ({ presetId, setPresetId, colorMode }),
    [presetId, setPresetId, colorMode]
  );

  return (
    <ThemePresetContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </ThemePresetContext.Provider>
  );
}

/** @deprecated use ThemePresetProvider */
export const ThemeModeProvider = ThemePresetProvider;

export function useThemePreset(): ThemePresetContextValue {
  const ctx = useContext(ThemePresetContext);
  if (!ctx) throw new Error("useThemePreset must be used within ThemePresetProvider");
  return ctx;
}

/** Legacy hook — maps preset to binary mode + toggles default light/dark pair */
export function useThemeMode(): {
  mode: ThemeColorMode;
  setMode: (m: ThemeColorMode) => void;
  toggleTheme: () => void;
  presetId: ThemePresetId;
  setPresetId: (id: ThemePresetId) => void;
} {
  const { presetId, setPresetId, colorMode } = useThemePreset();
  const setMode = useCallback(
    (m: ThemeColorMode) => {
      setPresetId(m === "light" ? "light-default" : "dark-default");
    },
    [setPresetId]
  );
  const toggleTheme = useCallback(() => {
    setPresetId(colorMode === "dark" ? "light-default" : "dark-default");
  }, [colorMode, setPresetId]);
  return { mode: colorMode, setMode, toggleTheme, presetId, setPresetId };
}
