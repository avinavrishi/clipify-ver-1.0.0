import type { ThemePresetId } from "./presetIds";
import { buildCustomPresetTheme, CUSTOM_PRESET_DEFINITIONS } from "./buildCustomPresetTheme";
import { createDarkDefaultTheme, createLightDefaultTheme } from "./legacyDefaultThemes";

export function createThemeForPreset(id: ThemePresetId) {
  if (id === "dark-default") return createDarkDefaultTheme();
  if (id === "light-default") return createLightDefaultTheme();
  return buildCustomPresetTheme(CUSTOM_PRESET_DEFINITIONS[id]);
}

/** @deprecated use createThemeForPreset — kept for any stray imports */
export function createAppTheme(mode: "light" | "dark") {
  return mode === "light" ? createLightDefaultTheme() : createDarkDefaultTheme();
}

export {
  BRAND_RED_MAIN,
  BRAND_RED_LIGHT,
  BRAND_RED_DARK,
  OLIVE_MAIN,
  OLIVE_LIGHT,
  OLIVE_DARK,
} from "./legacyDefaultThemes";
