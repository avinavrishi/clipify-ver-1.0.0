/** All supported UI theme presets (`theme-${id}` on <html>) */
export const THEME_PRESET_IDS = [
  "dark-default",
  "dark-red-neon",
  "dark-red-crimson",
  "dark-red-ruby",
  "dark-red-merlot",
  "dark-red-maroon",
  "light-default",
  "light-red-snow",
  "light-red-blush",
  "light-red-coral",
  "light-red-peach",
  "light-red-dawn",
] as const;

export type ThemePresetId = (typeof THEME_PRESET_IDS)[number];

export const DEFAULT_THEME_PRESET_ID: ThemePresetId = "dark-default";

/** Map removed preset ids → replacement (localStorage migration) */
export const DEPRECATED_THEME_PRESET_MAP: Record<string, ThemePresetId> = {
  "dark-blue-neon": "dark-red-neon",
  "dark-purple": "dark-red-ruby",
  "dark-minimal-gray": "dark-red-maroon",
  "light-soft-beige": "light-red-peach",
  "light-pastel-blue": "light-red-coral",
  "light-modern-white": "light-red-snow",
  "dark-pro": "dark-red-crimson",
  "dark-midnight-blue": "dark-red-neon",
  "dark-graphite": "dark-red-maroon",
  "dark-royal-purple": "dark-red-merlot",
  "dark-emerald-night": "dark-red-ruby",
  "dark-velvet-burgundy": "dark-red-merlot",
  "dark-slate-teal": "dark-red-crimson",
  "dark-obsidian-amber": "dark-red-maroon",
  "dark-nord-frost": "dark-red-ruby",
  "light-soft-white-pro": "light-red-snow",
  "light-warm-beige": "light-red-peach",
  "light-pastel-sky": "light-red-coral",
  "light-minimal-gray": "light-red-dawn",
  "light-elegant-ivory": "light-red-blush",
  "light-sage-linen": "light-red-dawn",
  "light-blush-quartz": "light-red-blush",
  "light-sea-mist": "light-red-coral",
  "light-lavender-haze": "light-red-blush",
};

export function isThemePresetId(value: string | null | undefined): value is ThemePresetId {
  return !!value && (THEME_PRESET_IDS as readonly string[]).includes(value);
}

export function presetColorMode(id: ThemePresetId): "light" | "dark" {
  return id.startsWith("light-") ? "light" : "dark";
}

export function resolveStoredPresetId(raw: string | null): ThemePresetId {
  if (!raw) return DEFAULT_THEME_PRESET_ID;
  if (isThemePresetId(raw)) return raw;
  const migrated = DEPRECATED_THEME_PRESET_MAP[raw];
  return migrated ?? DEFAULT_THEME_PRESET_ID;
}
