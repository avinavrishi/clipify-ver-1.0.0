# Frontend: OTP-based registration flow

Use this with Cursor (or any AI) to implement the registration UI that talks to the bims-BE OTP APIs.

## Backend API summary

Base URL: `{API_BASE}/api/v1/auth` (e.g. `http://localhost:8000/api/v1/auth`).

### Flow (3 steps)

1. **Request OTP** – user enters email only.
2. **Verify OTP** – user enters 6-digit OTP from email; backend returns a short-lived `registration_token`.
3. **Complete registration** – user sets **password only** (and confirm password on frontend); send request with `registration_token` in `Authorization` header. **Username is not collected here** – the user will set it when they enter the dashboard for the first time.

---

## Endpoints

### 1. POST `/register/request-otp`

- **Request body:** `{ "email": "user@example.com" }`
- **Response (200):** `{ "message": "OTP sent to your email", "expires_in_minutes": 10 }`
- **Errors:**
  - `400`: "Email already registered"
  - `503`: "Failed to send OTP email. Check server SMTP configuration."

**Frontend:** On success, show a screen asking for the 6-digit OTP (e.g. input or 6 boxes). Optionally show “Resend OTP” and a countdown/timer for ~10 minutes.

---

### 2. POST `/register/verify-otp`

- **Request body:** `{ "email": "user@example.com", "otp": "123456" }`
- **Response (200):** `{ "registration_token": "<jwt>", "expires_in": 900 }` (expires_in in seconds)
- **Errors:**
  - `400`: "No OTP found for this email. Request one first."
  - `400`: "OTP already used. Request a new one."
  - `400`: "OTP expired. Please request a new one."
  - `400`: "Invalid OTP."

**Frontend:** Store `registration_token` (e.g. in memory or short-lived sessionStorage). Navigate to “Complete registration” step (password + display name). On “OTP expired” or “Invalid OTP”, show the message and offer “Resend OTP”.

---

### 3. POST `/register/resend-otp`

- **Request body:** `{ "email": "user@example.com" }`
- **Response (200):** `{ "message": "New OTP sent to your email", "expires_in_minutes": 10 }`
- **Errors:**
  - `400`: "Email already registered."
  - `503`: "Failed to send OTP email. Check server SMTP configuration."

**Frontend:** Call after “Request OTP” or when user hits “Resend OTP” (e.g. after “OTP expired”). Reuse the same “Enter OTP” UI; optionally reset timer to 10 minutes.

---

### 4. POST `/register/complete`

- **Headers:** `Authorization: Bearer <registration_token>` (from verify-otp response)
- **Request body:** `{ "password": "secret" }` — **no display_name**; username is set later on first dashboard visit.
- **Response (201):** User object (e.g. `{ "id", "email", "username", "role", "status", "created_at", "updated_at" }`)
- **Errors:**
  - `401`: "Invalid or expired registration token. Verify OTP again."
  - `400`: "Email already registered." / "OTP expired or already used. Please verify OTP again."

**Frontend:** Only call when you have a valid `registration_token` from step 2. Collect **password** and **confirm password** (validate they match on frontend; do not send confirm_password to API). Send only `{ "password": "..." }` with the token. On success, redirect to login or dashboard.

---

## UI flow suggestion

1. **Step 1 – Email**
   - Single field: email.
   - Submit → call `POST /register/request-otp`.
   - On success → go to Step 2; show “Resend OTP” (calls `POST /register/resend-otp`) and a 10-minute countdown.

2. **Step 2 – OTP**
   - 6-digit OTP input (single field or 6 boxes).
   - Submit → call `POST /register/verify-otp` with same email + otp.
   - On success → save `registration_token`, go to Step 3.
   - On “OTP expired” or “Invalid OTP” → show message; “Resend OTP” → call resend, then stay on Step 2.

3. **Step 3 – Password only**
   - Fields: **password**, **confirm password** (no username/display_name; user sets username later on first dashboard visit).
   - Validate password === confirm password on frontend; send only `{ "password": "..." }`.
   - Submit → call `POST /register/complete` with `Authorization: Bearer <registration_token>` and body `{ "password": "..." }`.
   - On success → redirect to login or dashboard.

Keep `email` in component state or URL so you can pass it to request-otp, verify-otp, and resend-otp. Store `registration_token` only for the completion request; do not use it as the main app auth token (use login to get access/refresh tokens).

---

## Google OAuth (Login with Google)

### Flow

1. User clicks “Login with Google” on your login page.
2. User is redirected to **backend** URL: `GET {API_BASE}/api/v1/auth/login/google` (e.g. `http://localhost:8000/api/v1/auth/login/google`). The backend then redirects to Google’s sign-in page.
3. After the user signs in with Google, Google redirects back to the backend callback: `GET {API_BASE}/api/v1/auth/google/callback`.
4. Backend finds or creates the user by email (no password stored for Google users), creates a session and JWT tokens, then **redirects to your frontend** with the tokens in the URL **fragment** (hash).

### Frontend callback URL

Backend redirects to the URL set in `.env` as `OAUTH_FRONTEND_CALLBACK_URL` (default: `http://localhost:3000/auth/callback`) with tokens in the **URL fragment** (hash):

- `http://localhost:3000/auth/callback#access_token=<JWT>&refresh_token=<refresh>&token_type=bearer`

Implement a frontend route at `/auth/callback` that:

1. On load (e.g. `useEffect` or `onMount`), read `window.location.hash` (strip the leading `#`).
2. Parse `access_token`, `refresh_token`, `token_type` from the fragment (e.g. with `URLSearchParams` on the hash string).
3. Store `access_token` and `refresh_token` in your auth state (e.g. context, localStorage).
4. Replace the URL with a clean path (e.g. `window.location.replace("/dashboard")`) so tokens are not left in history.

### Login page button

Use a **full redirect** to the backend (not an API call), so the user leaves your app and goes to the backend, then to Google, then back to your app via the callback:

```html
<a href="http://localhost:8000/api/v1/auth/login/google">
  <button>Login with Google</button>
</a>
```

Replace `http://localhost:8000` with your API base URL in production.

### Backend behaviour

- **New Google user:** Backend creates a user with `email` from Google, `password_hash` = `null`, and a default profile/creator. Username is `null` until the user sets it on the dashboard.
- **Existing Google user:** Backend finds the user by email and issues new tokens.
- **Existing email/password user:** If someone previously registered with the same email (OTP flow), they can still use “Login with Google”; backend finds the same user and logs them in (password remains for password login).

### 400 on password login for Google-only users

If a user signed up only with Google and later tries to log in with email + password, the API returns **400** with detail: `"This account uses Google sign-in. Please use Login with Google."` Show this message and offer the “Login with Google” button.
