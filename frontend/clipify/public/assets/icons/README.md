# Icons

Place PNG (or SVG) assets here. Used by the app for social/platform icons and UI.

## Expected files (replace dummies with real assets)

- `instagram.png` – Instagram logo (used in Connect Account modal, account cards)
- `youtube.png` – YouTube logo (used in Connect Account modal, account cards)

Names are referenced in code via `getIconUrl('instagram')` etc. If you serve assets from a server, set `NEXT_PUBLIC_ASSETS_BASE_URL` so these paths resolve from your API/CDN.
