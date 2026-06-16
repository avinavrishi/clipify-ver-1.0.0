# Assets (icons, banners, wallpapers, brand logos)

All app assets are organized here and referenced via `lib/assets.ts`.

## Folders

| Folder       | Purpose                    | Helper in code              |
|-------------|----------------------------|-----------------------------|
| `icons/`    | Social/platform icons (PNG) | `getIconUrl('instagram')`   |
| `banners/`  | Hero / campaign banners     | `getBannerUrl('file.ext')`  |
| `wallpapers/` | Background images        | `getWallpaperUrl('file.ext')` |
| `brand/`    | App & brand logos          | `getBrandLogoUrl('file.ext')` |

## Using the server for assets

To serve assets from your API or CDN instead of the Next.js `public` folder:

1. Set the env variable:
   ```bash
   NEXT_PUBLIC_ASSETS_BASE_URL=https://your-api.com/static
   ```
   (No trailing slash; the helpers append `/assets/icons/...` etc.)

2. On the server, expose the same structure under that base path, e.g.:
   - `GET /static/assets/icons/instagram.png`
   - `GET /static/assets/banners/hero.webp`
   - etc.

3. Optionally upload/replace assets via your API and keep filenames in sync with what the app requests.

## Replacing dummy icons

The Connect Account modal uses PNGs from `icons/`:

- `icons/instagram.png` – replace with your Instagram logo PNG
- `icons/youtube.png` – replace with your YouTube logo PNG

Current files are minimal placeholders; drop in your real assets with the same names.
