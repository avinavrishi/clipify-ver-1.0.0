# Cursor prompt: Frontend – Apply to Campaign (face) vs Submit Link (faceless)

Copy the following into Cursor to implement the campaign participation flow based on creator type.

---

## Prompt

On the **campaign details page** (after entering a campaign), show different participation options depending on whether the logged-in creator is **face** or **faceless**:

### 1. Use creator type from profile

- The current user’s **creator type** is in **GET /api/v1/profiles/me**: `creator_type` is `"FACE"` or `"FACELESS"` (or `null` if not set).
- Use this to decide which option to show on the campaign page. Do not show both “Apply to Campaign” and “Submit Link” for the same user.

### 2. Face creators: “Ready to participate? [Apply to Campaign]”

- **When:** `creator_type === "FACE"`.
- **UI:** Show the existing “Ready to participate?” line with an **“Apply to Campaign”** button/link.
- **Action:** On click, call **POST /api/v1/creator/participations** with body `{ "campaign_id": "<campaign_id>" }`. On success, show a message that the application was submitted and is pending approval. Do not show “Submit Link” for face creators.
- If the user has already applied, the API returns **400** “You have already applied to this campaign”; show that message and hide or disable the Apply button.

### 3. Faceless creators: “Submit Link” only

- **When:** `creator_type === "FACELESS"`.
- **UI:** Do **not** show “Apply to Campaign”. Instead show a **“Submit Link”** option (button or link).
- **Action:** On click, open a small form or modal with:
  - **Content URL** (required): the link to the creator’s content (e.g. reel, video).
  - **Social account** (required): dropdown of the creator’s **connected social accounts**. Get the list from **GET /api/v1/creator/social-accounts** (or your existing endpoint for connected accounts). Each item should have `id` and a label (e.g. platform + username).
  - Optional: **Platform content ID** if your UI collects it.
- **Submit:** Call **POST /api/v1/creator/submit-link** with body:
  - `{ "campaign_id": "<campaign_id>", "content_url": "<url>", "social_account_id": "<id>", "platform_content_id": "<optional>" }`.
- **Success:** API returns **201** with `{ "participation_id", "submission_id", "message": "Link submitted. Your submission is under review." }`. Show the message and close the form; optionally refresh participation/submission state.
- **Errors:**  
  - **403** “Submit Link is only for faceless creators” → user is not faceless; do not show Submit Link for them.  
  - **400** “You have already participated in this campaign” → show message and offer “Add another link” via normal content submission flow if applicable.  
  - **400** “This content URL has already been submitted” / “Maximum submissions limit reached” → show the API message.

### 4. If creator type is not set

- If **`creator_type`** is `null` or missing, the user has not completed the creator-type step (face vs faceless). You can either:
  - Show a single message: “Complete your profile (choose face or faceless creator) to participate in campaigns,” and link to profile/onboarding, or  
  - Hide both “Apply to Campaign” and “Submit Link” until `creator_type` is set.

### 5. API summary

| Creator type | Action on campaign page        | Endpoint                              | Body |
|-------------|--------------------------------|----------------------------------------|------|
| FACE        | “Apply to Campaign”            | POST /api/v1/creator/participations   | `{ "campaign_id": "..." }` |
| FACELESS    | “Submit Link” (form: URL + account) | POST /api/v1/creator/submit-link  | `{ "campaign_id", "content_url", "social_account_id", "platform_content_id?" }` |

- **Apply to Campaign** is only for face creators; the API returns **403** if a faceless creator calls it.
- **Submit Link** is only for faceless creators; the API returns **403** if a face creator calls it.

### 6. Summary

- **Face:** Show “Ready to participate? [Apply to Campaign]” → POST `/creator/participations`.
- **Faceless:** Show “Submit Link” → open form (content URL + social account) → POST `/creator/submit-link`.
- Use **GET /profiles/me** `creator_type` to choose which option to show. Do not show both for the same user.
