# Cursor prompt: Frontend – Creator onboarding (username → face/faceless) and profile

Copy the following into Cursor to implement the creator first-time flow and profile face-details editing.

---

## Prompt

Implement these frontend changes for **creators**:

### 1. Creator onboarding flow (first login only)

When a **creator** logs in for the first time, show these steps **in order**. Do **not** show the creator-type step on the "Connect social account" page—keep it only in this onboarding flow.

**Step 1 – Set username (one-time)**  
- If the user is a creator and **username is not set** (e.g. from **GET /api/v1/profiles/me**: `username` is null/undefined), show the **Set username** form.
- On submit: **PATCH /api/v1/profiles/me/username** with body `{ "username": "..." }`.
- Validate: username at least 2 characters; show error if API returns "Username already taken".
- After success, proceed to Step 2 (do not redirect to connect account yet).

**Step 2 – Face creator vs faceless creator (one-time)**  
- After username is set, if **creator type is not set** (from **GET /api/v1/profiles/me**: `creator_type` is null/undefined), show this step **once**:
  - Ask: **"Are you a face creator or faceless creator?"** (two options: Face creator / Faceless creator).
  - If user selects **Faceless creator**:  
    - Call **PATCH /api/v1/profiles/me/creator-type** with body `{ "creator_type": "FACELESS" }`.  
    - No extra form. Then redirect to dashboard or connect account as per your app flow.
  - If user selects **Face creator**:  
    - Show a **form** to collect face creator details:
      - **name** (string)
      - **category** (string)
      - **reel_price** (number)
      - **story_price** (number)
      - **reel_story_price** (number)
      - **state** (string)
      - **city** (string)
      - **language** (string)
    - On submit, call **PATCH /api/v1/profiles/me/creator-type** with body:
      - `{ "creator_type": "FACE", "name": "...", "category": "...", "reel_price": ..., "story_price": ..., "reel_story_price": ..., "state": "...", "city": "...", "language": "..." }`.
    - Then redirect to dashboard or connect account.
- **One-time only:** The API will return **400** with message *"Creator type is already set. You can update your face creator details from your profile."* if the user has already set creator type. In that case do not show this step; go to dashboard/connect account.

**Remove from Connect account page**  
- On the **Connect social account** (or "Connect account") page, **remove** the "face creator vs faceless creator" choice and the face creator form.  
- That page should only handle connecting social accounts (e.g. Instagram). Creator type is set only in the onboarding flow above (after username).

**How to know onboarding is done**  
- After login, call **GET /api/v1/profiles/me** (or **GET /api/v1/profiles/me/creator-type**).  
- Creator with `username == null` → show Step 1 (set username).  
- Creator with `username` set and `creator_type == null` → show Step 2 (face/faceless + form if face).  
- Creator with both `username` and `creator_type` set → onboarding complete; go to dashboard (or connect account if you require that next).

### 2. Profile: show and edit face creator details

- On the **creator profile** page, show the same **face creator** fields when the user is a face creator:
  - **GET /api/v1/profiles/me** for creators returns:
    - **creator_type**: `"FACE"` or `"FACELESS"`
    - **creator_face_details**: when `creator_type === "FACE"`, an object with:  
      `name`, `category`, `reel_price`, `story_price`, `reel_story_price`, `state`, `city`, `language`  
      (some may be null if not set.)
  - Display these fields on the profile (e.g. a "Face creator details" or "Creator info" section). If `creator_type === "FACELESS"`, do not show this section or show a simple "Faceless creator" label.
- **Editing:** For **face creators**, provide an **Edit** (or "Update face creator details") action that:
  - Opens a form pre-filled with current `creator_face_details` (from profile).
  - On submit, call **PATCH /api/v1/profiles/me/creator-face-details** with body containing only the fields being updated (all optional):  
    `{ "name": "...", "category": "...", "reel_price": ..., "story_price": ..., "reel_story_price": ..., "state": "...", "city": "...", "language": "..." }`.
  - After success, refresh profile (e.g. GET /profiles/me) and show updated values.
- Do **not** allow changing creator type (FACE ↔ FACELESS) from profile; that is set once during onboarding. Only the face creator **details** (name, category, prices, state, city, language) are editable on profile.

### 3. API summary

| Action | Endpoint | Notes |
|--------|----------|--------|
| Get profile (creator) | GET /api/v1/profiles/me | Returns `username`, `creator_type`, `creator_face_details` (for FACE). Use to drive onboarding and profile UI. |
| Set username (one-time) | PATCH /api/v1/profiles/me/username | Body: `{ "username": "..." }`. Only when username not set. |
| Get creator type | GET /api/v1/profiles/me/creator-type | Returns `creator_type` and face fields. Optional; profile GET also has this. |
| Set creator type (one-time) | PATCH /api/v1/profiles/me/creator-type | Body: `{ "creator_type": "FACE" or "FACELESS", ... }`. If FACE, include name, category, reel_price, story_price, reel_story_price, state, city, language. One-time only; 400 if already set. |
| Update face creator details | PATCH /api/v1/profiles/me/creator-face-details | Body: any of name, category, reel_price, story_price, reel_story_price, state, city, language (all optional). Only for creators with creator_type FACE. Use on profile edit. |

### 4. Flow summary

1. Creator first login → if no username → **Set username** → then if no creator_type → **Face or faceless?** → if face → **Face creator form** → then dashboard/connect account.
2. **Connect account** page: no face/faceless step; only connect social accounts.
3. **Profile**: show `creator_face_details` for face creators; allow **edit** via PATCH **/me/creator-face-details**.
