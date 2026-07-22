# Phish Pool - Testing Protocols

## How to Test the "First-Time User" Experience
To prevent breaking the global admin account (pat@road2media.com) or messing up existing pool data, use a dedicated test email for all new-user flows.

**Designated Test Account:** `[Insert Your Personal/Test Email Here]`

### The Reset Protocol
Whenever you need to simulate a brand new user hitting the site for the very first time, follow these exact steps to scrub the test account from the database:

1. **Delete Auth Record:**
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Navigate to **Authentication** -> **Users**.
   - Search for your test email.
   - Click the three dots (⋮) on the right and select **Delete account**.

2. **Delete Database Record:**
   - Navigate to **Firestore Database** -> **Data**.
   - Open the `users` collection.
   - Find the document that matches the UID of the deleted test account (or search by the test user's handle).
   - Click the three dots (⋮) next to the Document ID and select **Delete document**.

3. **Verify Clean Slate:**
   - Open a fresh **Incognito/Private Window** in your browser.
   - Navigate to the local testing URL (`http://localhost:5173`).
   - The app should treat you as a 100% unrecognized user.

## Firebase App Check (Local Dev)

- **Debug token:** `38422efd-029f-45b4-b028-7cf7fcaeeffc`
- Use this token in the Firebase Console App Check debug-token allowlist for local development.

## Cloud Agent / Playwright QA harness

**One command (Cloud Agents):**

```bash
npm run qa:setup          # materialize-env + qa:cache + qa:google-signup gating
npm run qa:auth-scenarios # full auth telemetry + routing matrix (QA_TEST_* only)
# includes UR-B2: create pool → /join/:code → existing user (already-member)
```

This materializes `.env.qa.local` from injected secrets, runs `qa:cache` (email returning user), and `qa:google-signup` gating tests.

**Pool invite E2E (`qa:auth-scenarios`):**
- **UR-B2** — `QA_TEST_*` creates a pool, signs out, rejoins via `/join/:code` (**already-member**).
- **UR-B3** — same create path, then a **disposable** email signup completes Almost There (pool-enter copy), joins as a first-time member, and self-deletes via Account → Delete account (no second permanent QA secret).

### Secret inventory

| Secret | Purpose |
|--------|---------|
| `QA_TEST_EMAIL` / `QA_TEST_PASSWORD` | Email/password **returning** user (`qa:cache`, dev sign-in) |
| `QA_GOOGLE_TEST_EMAIL` / `QA_GOOGLE_TEST_PASSWORD` | Dedicated Gmail for **new-user Google OAuth** (`qa:google-signup` OAuth phase) |
| `QA_APPCHECK_DEBUG_TOKEN` | Optional; defaults to debug UUID above |
| `QA_PUBLIC_PROFILE_UID` | Optional; auto-resolved from `QA_TEST_EMAIL` |

### Google new-user test account (one-time manual)

1. Create a **dedicated Gmail** not used elsewhere (e.g. `setlistpickem.qa.<random>@gmail.com`).
2. Do **not** sign up on setlistpickem.com with it until the automated test runs — Firebase must treat it as a new Google user.
3. Add `QA_GOOGLE_TEST_EMAIL` and `QA_GOOGLE_TEST_PASSWORD` to **Cursor Cloud Agents → Secrets** and **GitHub Actions secrets**.
4. Run `npm run qa:setup` again — OAuth phase should land on `/setup`.
5. After each OAuth test run, follow **The Reset Protocol** below to delete the Auth user and Firestore doc so the next run sees `isNewUser: true` again.

**Note:** The existing `QA_TEST_EMAIL` account (`pat@road2media.com`) is email/password only — it cannot exercise Google OAuth.


