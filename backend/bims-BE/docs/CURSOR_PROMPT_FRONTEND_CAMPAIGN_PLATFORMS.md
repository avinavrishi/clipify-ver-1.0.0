# Cursor prompt: Frontend – Campaign platforms & admin full CRUD on behalf of brand

Copy the following into Cursor to implement the frontend changes for the bims-BE campaign platform selection and admin campaign management (create, view, edit, delete on behalf of brands).

---

## Prompt

Implement these frontend updates for campaigns:

### 1. Platform selection when creating/editing a campaign (brand dashboard)

- When a **brand** creates or edits a campaign, add a **platform selection** step:
  - Call **GET /api/v1/campaigns/platforms** (with auth) to get the list of platforms. Response: `[{ "id": "<uuid>", "name": "Instagram" }, { "id": "<uuid>", "name": "YouTube" }, { "id": "<uuid>", "name": "TikTok" }, ...]`.
  - In the create/edit campaign form, show a **multi-select** or **checkboxes** for “Platforms for this campaign” using that list (show `name`, store `id`).
  - On **create** (POST /api/v1/campaigns), send the selected platform IDs in the request body as **`platform_ids`**: `["<id1>", "<id2>"]`. At least one platform can be required or optional depending on product; backend accepts empty array.
  - On **edit** (PUT /api/v1/campaigns/{id}), send **`platform_ids`** with the new selection to replace the campaign’s linked platforms.
- Ensure the create campaign payload includes all existing fields plus **`platform_ids`** (array of strings). Do not send **`brand_id`** when the user is a brand (backend uses the authenticated brand).

### 2. Show platforms on campaign card and campaign details page

- The API now returns **`platforms`** on every campaign object: `[{ "id": "<uuid>", "name": "Instagram" }, ...]`.
  - **Campaign list/cards:** For each campaign card, display the linked platforms (e.g. badges or tags with `platform.name`: “Instagram”, “YouTube”, “TikTok”).
  - **Campaign details page:** Show the same **`platforms`** list clearly (e.g. “Platforms: Instagram, TikTok” or a row of chips).
- Use the **`platforms`** array from the campaign response; do not assume a single platform.

### 2b. Show “Creators joined” on campaign card

- Every campaign response from **GET /api/v1/campaigns** and **GET /api/v1/campaigns/{id}** now includes:
  - **`participant_count`** (number): total number of creators who have participated (joined) in this campaign.
  - **`participant_avatars`** (array of strings): up to 5 profile picture URLs of participants, in reverse chronological order (most recent first), for showing a small avatar stack.
- On the **campaign card** (list/grid view), add a “Creators joined” row:
  - **Left:** Label such as “Creators joined” or “Participants”.
  - **Right:** A **stack of small circular avatars** (e.g. 24–32px) using the URLs in **`participant_avatars`** (show up to 5; overlap them slightly for a “queue” effect if desired), then immediately after the avatars show the **total count**: **`participant_count`** (e.g. “12” or “12 joined”).
- If **`participant_count`** is 0, show “0 joined” or “No participants yet”; you may hide the avatar stack in that case.
- Use **`participant_avatars`** only for the avatar images; use **`participant_count`** for the number. If a participant has no profile picture, the backend may omit that URL from the list (so the stack can have fewer than 5 images even when count > 5).

### 3. Admin: Full CRUD for campaigns (on behalf of brands)

Admins can **create, view, edit, and delete** any campaign—including campaigns belonging to any brand. Implement the following in the **admin panel**:

- **View (list):** Admin already receives **all campaigns** from **GET /api/v1/campaigns** (no filter). Show the full list in the admin campaign list; optionally show **brand** (e.g. company name) per campaign so admin can see which brand owns it (use `brand_id` and optionally GET /api/v1/admin/brands to resolve names if needed).
- **View (details):** Admin can open any campaign by ID. Use **GET /api/v1/campaigns/{id}** (admin is allowed). Show campaign details and **platforms** same as for brand dashboard.
- **Create (on behalf of a brand):**
  - **Brand selector:** Call **GET /api/v1/admin/brands**. Each item has `id`, `user_id`, `company_name`, `industry`, `website`. Show a **dropdown** (or searchable select) of brands by `company_name` and store the brand’s **`id`**.
  - **Platform selector:** Call **GET /api/v1/campaigns/platforms**; multi-select or checkboxes for **`platform_ids`**.
  - On submit, call **POST /api/v1/campaigns** with **`brand_id`** (selected brand UUID), **`platform_ids`**, and all other campaign fields. Do not use this “create on behalf” form for brand users; brand users create without a brand selector.
- **Edit:** Admin can **edit any campaign** (not only their own). Use **PUT /api/v1/campaigns/{id}** with any editable fields and optional **`platform_ids`**. In the admin campaign list or detail page, show an “Edit” action that opens the same edit form; admin can change title, dates, platforms, status, etc. Pre-fill with current campaign data including **platforms**.
- **Delete:** Admin can **delete any campaign**. Use **DELETE /api/v1/campaigns/{id}**. No request body. On success the API returns **204 No Content**. In the admin campaign list or detail page, show a “Delete” action; confirm before sending (e.g. “Are you sure you want to delete this campaign?”). After delete, redirect to campaign list or refresh the list.

Only show admin-only actions (brand selector on create, edit/delete for any campaign) to **admin** users; brand users only create/edit/delete their own campaigns.

### 4. Summary of API usage

| Action | Endpoint | Notes |
|--------|----------|--------|
| List platforms (for dropdown) | GET /api/v1/campaigns/platforms | Returns `[{ id, name }]`. Use for both brand and admin create/edit. |
| Create campaign (brand) | POST /api/v1/campaigns | Body: campaign fields + **platform_ids** (array). Do not send brand_id. |
| Create campaign (admin on behalf) | POST /api/v1/campaigns | Body: campaign fields + **platform_ids** + **brand_id** (selected brand UUID). |
| Update campaign | PUT /api/v1/campaigns/{id} | Brand: own campaigns only. Admin: any campaign. Body: editable fields + optional **platform_ids**. |
| Delete campaign | DELETE /api/v1/campaigns/{id} | Brand: own campaigns only. Admin: any campaign. Returns 204 No Content. |
| List campaigns | GET /api/v1/campaigns | Brand: only their campaigns. Admin: all campaigns. Response includes **platforms**, **participant_count**, **participant_avatars**. |
| Get campaign | GET /api/v1/campaigns/{id} | Any authenticated user (admin can view any campaign). Response includes **platforms**, **participant_count**, **participant_avatars**. |
| List brands (admin) | GET /api/v1/admin/brands | Use for admin create/edit brand dropdown and to show brand name in admin campaign list. |

### 5. Validation and UX

- When **platform_ids** is required: prevent submit until at least one platform is selected, and show an error if the user tries to submit without selecting.
- When **platform_ids** is optional: allow empty selection; backend accepts `[]`.
- On edit, pre-fill the platform multi-select with the campaign’s current **platforms** (using `platform.id` to match options from GET /campaigns/platforms).

Reference: Backend uses the `campaign_platforms` table to link campaigns to platforms; platforms are seeded as Instagram, YouTube, TikTok.
