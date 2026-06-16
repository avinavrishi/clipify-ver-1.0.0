# How to Change the Website Color

Use this guide to try different brand colors across the app. The app uses **one primary brand color** (buttons, links, active states, accents). Change it in the places below.

---

## 1. **Main theme (primary color)**  
**File:** `theme/legacyDefaultThemes.ts`

Default **Dark** and **Light** themes use streaming red:

```ts
export const BRAND_RED_MAIN = "#E50914";
export const BRAND_RED_LIGHT = "#F40612";
export const BRAND_RED_DARK = "#B20710";
```

**Additional presets** (5 dark + 5 light red variants) live in `theme/buildCustomPresetTheme.ts` and `theme/presetMetadata.ts`. Use the theme dropdown in the navbar to switch.

---

## 2. **Input focus ring**  
**File:** `app/globals.css`

Find:

```css
.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
  border-color: #e50914 !important;
}
```

Set `border-color` to the same hex as your **PRIMARY_MAIN** (or any color you want for focused inputs).

---

## 3. **Auth page visual panel**  
**File:** `components/auth/AuthPageView.tsx`

The left column uses theme-aware gradients and blurred blobs (`background`, `alpha(primary…)`). Adjust those `sx` blocks to change the full-page auth look; it follows the active MUI theme (dark/light presets).

---

## 4. **Sidebar active state**  
**File:** `components/Sidebar.tsx`

Search for `rgba(110, 235, 131, ...)`. Those are the green active background and hover. Replace `110, 235, 131` with the RGB of your primary (e.g. for `#6EEB83`, R=110 G=235 B=131).

---

## 5. **Verification dialog code pill**  
**File:** `components/VerificationDialog.tsx`

Search for `rgba(110, 235, 131, 0.12)` and `rgba(110, 235, 131, 0.25)` (code pill background and border). Change to your primary’s RGB if you want the pill to match the brand color.

---

## 6. **Public / landing page**  
**File:** `app/(public)/layout.tsx`  
**File:** `app/(public)/page.tsx`

- **layout.tsx:** Radial gradient uses `rgba(110, 235, 131, ...)`. Change to your primary’s RGB for a subtle tint.
- **page.tsx:** Feature card icon backgrounds use `rgba(110, 235, 131, 0.15)`. Same RGB as above.

---

## 7. **Explore campaign cards**  
**File:** `app/(dashboard)/dashboard/explore/page.tsx`

- Card hover border: `rgba(110, 235, 131, 0.35)`.
- Placeholder gradient and ACTIVE chip: green `rgba(110, 235, 131, ...)`.

Replace with your primary’s RGB to keep cards on-brand.

---

## 8. **Account page hover**  
**File:** `app/(dashboard)/dashboard/account/page.tsx`

Edit icon hover uses `rgba(110, 235, 131, 0.08)`. Change to your primary’s RGB.

---

## Summary table

| What you want to change      | File(s) |
|-----------------------------|--------|
| **Entire primary color**    | `app/layout.tsx` (PRIMARY_MAIN / LIGHT / DARK) |
| **Input focus border**      | `app/globals.css` |
| **Auth page visuals**       | `components/auth/AuthPageView.tsx` |
| **Sidebar active/hover**   | `components/Sidebar.tsx` |
| **Verification code pill**  | `components/VerificationDialog.tsx` |
| **Landing gradients & icons** | `app/(public)/layout.tsx`, `app/(public)/page.tsx` |
| **Explore cards**          | `app/(dashboard)/dashboard/explore/page.tsx` |
| **Account page icons**      | `app/(dashboard)/dashboard/account/page.tsx` |

**Tip:** For a site-wide change, update **1** and **2** first, then adjust **3–8** if you want those elements to match the new primary exactly (some already inherit from the theme).
