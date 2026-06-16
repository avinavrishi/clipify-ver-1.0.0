# Cursor prompt: Frontend auth updates (OTP complete + Google login)

Copy the following into Cursor to implement the frontend changes for the bims-BE auth updates.

---

## Prompt

Implement these two auth updates in the frontend:

### 1. Register complete: password and confirm password only

- The **complete registration** step (after OTP verification) should collect **only**:
  - **Password**
  - **Confirm password**
- Do **not** collect display name or username here. The user will set their **username when they enter the dashboard for the first time**.
- Validate on the frontend that password and confirm password match; send only `password` in the request body.
- **API:** `POST /api/v1/auth/register/complete` with header `Authorization: Bearer <registration_token>` and body `{ "password": "..." }`.
- On success, redirect to login or dashboard.

### 2. Login with Google (OAuth)

- Add a **“Login with Google”** button on the login page.
- The button should **navigate the user to** (full page redirect, not fetch):  
  `{API_BASE}/api/v1/auth/login/google`  
  e.g. `http://localhost:8000/api/v1/auth/login/google`.
- The backend will redirect to the frontend with tokens in the **URL fragment**: `http://localhost:3000/auth/callback#access_token=<JWT>&refresh_token=<refresh>&token_type=bearer`
- Implement a frontend route at `/auth/callback` that:
  - On load, reads `window.location.hash`, parses `access_token`, `refresh_token`, `token_type` (e.g. `new URLSearchParams(window.location.hash.slice(1))`).
  - Stores the access token and refresh token in your auth state/localStorage/context.
  - Redirects to dashboard/home with `window.location.replace("/dashboard")` so tokens are not left in the URL.
- If the user tries to log in with **email + password** but their account was created with Google only, the API returns **400** with message: `"This account uses Google sign-in. Please use Login with Google."` Show this message and keep the “Login with Google” option visible.

Reference: see `docs/FRONTEND_OTP_REGISTRATION_PROMPT.md` for full API details and Google OAuth flow.
