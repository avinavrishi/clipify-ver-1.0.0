/**
 * Central asset URLs for icons, banners, wallpapers, and brand logos.
 * Use these helpers so we can switch to server/CDN later via env.
 *
 * Server: set NEXT_PUBLIC_ASSETS_BASE_URL to your API or CDN base (e.g. https://api.example.com/assets)
 * Local: leave unset to use Next.js public folder (/assets/...).
 */

const ASSETS_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_ASSETS_BASE_URL ?? "")
    : (process.env.NEXT_PUBLIC_ASSETS_BASE_URL ?? "");

const paths = {
  icons: "assets/icons",
  banners: "assets/banners",
  wallpapers: "assets/wallpapers",
  brand: "assets/brand",
} as const;

export type AssetCategory = keyof typeof paths;

/**
 * Build full URL for an asset. Prefer the specific helpers below.
 * @param category - icons | banners | wallpapers | brand
 * @param filename - e.g. "instagram.png" or "hero.webp"
 */
export function getAssetUrl(category: AssetCategory, filename: string): string {
  const base = ASSETS_BASE.replace(/\/$/, "");
  const path = paths[category];
  return base ? `${base}/${path}/${filename}` : `/${path}/${filename}`;
}

/** Icon path for social/platform icons (e.g. instagram, youtube). Use .png. */
export function getIconUrl(name: string, ext: string = "png"): string {
  return getAssetUrl("icons", `${name}.${ext}`);
}

/** Banner image URL (e.g. explore hero). */
export function getBannerUrl(filename: string): string {
  return getAssetUrl("banners", filename);
}

/** Wallpaper / background image URL. */
export function getWallpaperUrl(filename: string): string {
  return getAssetUrl("wallpapers", filename);
}

/** Brand / app logo URL (e.g. clipify logo). */
export function getBrandLogoUrl(filename: string): string {
  return getAssetUrl("brand", filename);
}
