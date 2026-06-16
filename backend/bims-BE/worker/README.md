# Instagram Verification Worker

Separate process that consumes Instagram verification jobs from RabbitMQ and performs bio verification using Playwright. No HTTP server.

## Run

From project root:

```bash
pip install -r requirements.txt
playwright install chromium
```

**Env:** Use a `.env` file in the **project root** (same as the FastAPI app). The worker loads it automatically when you run `python -m worker.main` from the project root. Optional vars (defaults shown):

```bash
# In .env (project root) – optional, defaults shown
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
INSTAGRAM_VERIFICATION_QUEUE=instagram_verification
INSTAGRAM_VERIFICATION_ENABLED=true
INSTAGRAM_SESSION_STATE_PATH=
INSTAGRAM_USERNAME=
INSTAGRAM_PASSWORD=
DATABASE_URL=sqlite:///./brandfluence.db
```

Then run:

```bash
python -m worker.main
```

## Flow

1. **FastAPI (your API)**  
   When a creator completes Instagram verification (they add a code to their bio and call the “complete” endpoint), the API enqueues a job to the RabbitMQ queue `instagram_verification` and sets the verification status to `PENDING`.

2. **Worker (this process)**  
   Runs in a loop: connect to RabbitMQ → listen on the queue → when a message arrives, process it **one at a time** (prefetch=1).

3. **Processing one job**  
   - Read the message (request_id, username, verification_code).  
   - Load the verification record from the DB (must be status `PENDING`).  
   - **Instagram client**: get a logged-in browser context (saved session file, or auto-login with INSTAGRAM_USERNAME / INSTAGRAM_PASSWORD), open the creator’s Instagram profile page, and check whether the verification code appears in the page content (e.g. in the bio).  
   - Update the DB: set status to `VERIFIED` (code found), `FAILED` (code not found), or `ERROR` (automation/login failed).  
   - Acknowledge the message so it’s removed from the queue (or requeue on transient failure).

4. **No HTTP in the worker**  
   The worker has no web server. It only talks to RabbitMQ and the database.

### Stages you see when running the worker (prints)

When you run `python -m worker.main`, you’ll see `[WORKER] Stage: ...` messages so you can follow where the process is:

| Stage | Meaning |
|-------|--------|
| Loaded .env from ... | Environment variables loaded from project root `.env`. |
| Starting worker process | Main entry; signals registered. |
| Entering RabbitMQ consumer loop | Starting the loop that waits for jobs. |
| Connecting to RabbitMQ... | Connecting to the broker. |
| Connected to RabbitMQ | Connection succeeded. |
| Listening on queue 'instagram_verification' | Subscribed to the queue; waiting for messages. |
| Message received from queue, processing... | A job message was received; starting to process it. |
| Verification service received job request_id=... | Payload parsed; verification service is handling this job. |
| Fetching verification record from DB... | Loading the verification row from the database. |
| Calling Instagram client to check bio... | About to open Instagram (browser). |
| Loading saved Instagram session from file... | Using INSTAGRAM_SESSION_STATE_PATH if set. |
| Saved session valid; using it | Session file was valid; no login needed. |
| Saved session expired or invalid; will try credential login | Session file missing/expired; will log in with username/password. |
| Navigating to Instagram login URL... | Opening Instagram login page for auto-login. |
| Instagram login page loaded; waiting for username field... | Waiting for the login form to appear (up to 15s). |
| Filling username and password... / Submitting login form... | Auto-login in progress. |
| Login succeeded / Saved new session to ... | Logged in and (if path set) session saved for next time. |
| Opening profile page: https://instagram.com/... | Opening the creator’s profile to check the bio. |
| Bio check done; code present in page: True/False | Result of the check. |
| Code FOUND in bio; marking VERIFIED (or NOT in bio; marking FAILED) | DB status updated. |
| Job completed successfully; acknowledging message | Message acked; queue can remove it. |
| Message processed, waiting for next... | Ready for the next job. |

If login fails (e.g. timeout waiting for username field, or CAPTCHA), you’ll see `[WORKER] Stage: Login failed: ...` and the job will be marked `ERROR` in the DB.

## Safety

- **Rate limit**: Max 1 verification at a time (single consumer, prefetch=1).
- **Kill switch**: Set `INSTAGRAM_VERIFICATION_ENABLED=false` to stop processing (messages are acked and skipped).
- **Graceful shutdown**: SIGINT/SIGTERM; current message is finished, then process exits (pending message is nack'd and requeued).
- **Requeue on failure**: On transient errors the message is nack'd with requeue=True.
- **Idempotent**: Updates are by `request_id`; already-processed statuses are skipped.

## Session: saved file or automatic login

You can either save a session manually (browser opens once) or provide Instagram credentials so the worker can log in automatically when the session is missing or expired.

### Option A – Automatic login with username/password (for servers)

Set these env vars so the worker can log in when there is no valid session:

```bash
set INSTAGRAM_USERNAME=your_instagram_username
set INSTAGRAM_PASSWORD=your_instagram_password
set INSTAGRAM_SESSION_STATE_PATH=C:\path\to\bims-BE\worker\instagram_state.json
```

- **INSTAGRAM_USERNAME** / **INSTAGRAM_PASSWORD**: Used only when the saved session is missing or expired. The worker will open the login page, submit the form, then **save the new session** to `INSTAGRAM_SESSION_STATE_PATH`. Later jobs reuse that file until it expires again.
- **INSTAGRAM_SESSION_STATE_PATH**: Where to load/save the session. If you provide credentials, the worker will write a new session here after the first successful login so it doesn’t log in on every job.

**Security:** Use a dedicated Instagram account (e.g. for verification only). Store credentials in env vars or a secrets manager, never in code. Instagram may flag or limit automated login; if you see CAPTCHA or blocks, use Option B once to create a fresh session file. You can override login form XPaths via `INSTAGRAM_XPATH_USERNAME`, `INSTAGRAM_XPATH_PASSWORD`, and `INSTAGRAM_XPATH_LOGIN_BUTTON` in `.env` if Instagram changes their DOM.

### Option B – Save session manually (browser opens once)

If you prefer not to put credentials on the server:

1. **Save the session once** (on your machine or a one-time run):

   ```bash
   python -m worker.save_instagram_session
   ```

   - A Chromium window opens to Instagram’s login page.
   - Log in in that window, then press **Enter** in the terminal.
   - The script saves the session to `worker/instagram_state.json` (or `INSTAGRAM_SESSION_STATE_PATH` if set).

2. **Copy the session file to the server** and set:

   ```bash
   set INSTAGRAM_SESSION_STATE_PATH=C:\path\to\bims-BE\worker\instagram_state.json
   python -m worker.main
   ```

When the session expires, either run `save_instagram_session` again and replace the file, or use Option A with credentials so the worker can re-login and overwrite the file automatically.

## Testing and account validation

### Validate Instagram account (session or credentials)

From project root, run:

```bash
python -m worker.validate_instagram_account
```

This script:

1. **XPath check** (when using credentials, no session file): Loads the Instagram login page and verifies that the configured XPaths (username, password, login button) find visible elements. If they don’t, Instagram’s DOM may have changed — update `INSTAGRAM_XPATH_*` in `.env`.
2. **Login**: Uses `instagram_state.json` (or `INSTAGRAM_SESSION_STATE_PATH`) if present and valid; otherwise logs in with `INSTAGRAM_USERNAME` and `INSTAGRAM_PASSWORD` using the same XPath-based flow as the worker.
3. **Verification**: Opens Instagram and confirms we are not on the login page (i.e. logged in).

Requires either a valid session file or `INSTAGRAM_USERNAME` + `INSTAGRAM_PASSWORD` in `.env`.

### Pytest tests

From project root:

```bash
pip install -r requirements.txt
playwright install chromium
pytest tests/ -v
```

- **Unit tests** (no network): Run by default. They cover `_mask_password`, `_has_credentials`, `_is_login_page`, and profile URL building.
- **Integration tests** (live Instagram): Skipped unless you set `RUN_INSTAGRAM_INTEGRATION=1` then run `pytest tests/ -v`. Integration tests include:
  - **XPath tests** (`tests/test_instagram_xpaths.py`): Load the real login page and assert that the configured XPaths find the username, password, and login button elements.
  - **Account validation** (`tests/test_instagram_client.py`): Get a logged-in context (session or credentials), open Instagram, and confirm we are not on the login page; and run `check_bio_contains_code` to ensure the full flow works.

Run only unit tests (no Instagram, no credentials):

```bash
pytest tests/ -v -m "not instagram_integration"
```
