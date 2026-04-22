# Admin claim runbook

Operational guide for granting, revoking, and auditing the `admin: true` Firebase Auth custom claim used by Set Picks.

Introduced in issue #139 PR A. In PR A the claim is the preferred signal for admin UI gating (`useAuth().isAdmin`) but a **legacy email fallback** (`pat@road2media.com`) is still accepted so existing admin flows keep working during transition. PR B removes the email fallback and tightens Firestore rules to require the claim.

---

## 1. Related functions

Both live in `functions/index.js`:

| Function | Type | Purpose |
|---------|------|---------|
| `setAdminClaim` | HTTPS callable | Grant or revoke `admin: true` on a target Auth user |
| `rollupScoresForShow` | HTTPS callable | Server-side replacement for `adminRollupApi.js`; gated by `admin: true` claim OR legacy email |

`setAdminClaim` authorization:

- Caller must be signed in.
- Caller must be a **super-admin** — either `SUPER_ADMIN_UIDS` env var listed, or the legacy `pat@road2media.com` email holder (transition only) — **or** caller must already hold `admin: true`.
- Callers can set the claim on themselves (bootstrap) or on another uid (delegation).

---

## 2. One-time bootstrap (first admin)

The first time you roll this out, no one has the claim yet. Seed the first admin via the super-admin env var.

### 2a. Set `SUPER_ADMIN_UIDS`

Find the bootstrap admin's Firebase Auth uid (Firebase console → Authentication → Users, or `firebase auth:export` → pick the row). Then set the env var on the deployed `setAdminClaim` function.

For Cloud Functions Gen 2 (v2) on Firebase, environment variables are set via `.env.<project>` files at `functions/` root, or via `firebase functions:config:set` (v1 API) / `--set-env-vars` on deploy. The simplest approach used elsewhere in this repo is a `functions/.env.<project>` file (git-ignored):

```bash
# functions/.env.setlistpickem (or whatever alias you use)
SUPER_ADMIN_UIDS=abc123xyz,defgh456
```

Then redeploy:

```bash
firebase deploy --only functions:setAdminClaim --project <alias>
```

> The legacy `pat@road2media.com` email holder is implicitly treated as a super-admin in PR A, so you can skip this env var during initial rollout and still bootstrap from the browser as that user. Remove that fallback in PR B.

### 2b. Self-grant the claim (preferred: in-app UI)

As the super-admin (or legacy email holder), sign into the app and navigate to `/admin`. If your account does **not** yet hold the `admin: true` claim, the `AdminClaimBootstrap` card (amber) renders above the "Locking the official setlist" warning with a single button:

**Grant admin claim to myself**

Click it. The UI:
1. Invokes `setAdminClaim({ admin: true })` against your own uid.
2. Force-refreshes the ID token (`getIdTokenResult(true)`) so the new claim is visible to the client without re-login.
3. Flips the card to green: "Admin claim active on your account."

`useAuth().isAdmin` now resolves via the claim, not the legacy email fallback.

> **Note:** An earlier version of this runbook documented a devtools `import()` snippet for bootstrap. That snippet worked against source paths (`/src/shared/lib/firebase.js`) that **don't exist** in the Vite production bundle on Vercel, so it's not viable in deployed environments. The in-app button replaces it. If you're working against the local dev server and want to script the call, see §4 (Admin SDK).

### 2c. Verify

The green "Admin claim active" pill on `/admin` is sufficient — it's rendered by reading the live ID token's `claims.admin`. If the page still shows the amber bootstrap card after clicking, see the Troubleshooting section below.

---

## 3. Grant the claim to another admin

Once you hold `admin: true`, you can delegate to other users:

```js
const fn = httpsCallable(getFunctions(app, 'us-central1'), 'setAdminClaim');
await fn({ admin: true, targetUid: '<other-user-uid>' });
```

The target user must refresh their ID token (`getIdTokenResult(true)`) or sign out/in before their client sees the new claim.

---

## 4. Revoke the claim

```js
await fn({ admin: false, targetUid: '<uid>' });
```

Revocations remove the `admin` key from custom claims entirely.

---

## 5. Audit current claims

From a machine with the Firebase Admin SDK and appropriate service-account credentials:

```js
const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.applicationDefault() });
const all = [];
let next;
do {
  const page = await admin.auth().listUsers(1000, next);
  for (const u of page.users) {
    if (u.customClaims?.admin === true) all.push({ uid: u.uid, email: u.email });
  }
  next = page.pageToken;
} while (next);
console.log(all);
```

Cloud Logging also records every `setAdminClaim` call with caller uid, target uid, grant/revoke, and whether the caller was acting as a super-admin. Filter by `jsonPayload.message="setAdminClaim"`.

---

## 6. Safety notes

- `setAdminClaim` only manipulates Auth custom claims; it never touches `picks`, `users`, or `official_setlists`.
- A token refresh is required for client-side `isAdmin` to flip. The app's `useAuth` subscribes to `onIdTokenChanged` so this propagates automatically after `getIdTokenResult(true)` without re-login.
- Firestore rules in PR A are **unchanged**; the claim is purely for UI gating and for `rollupScoresForShow` authorization. PR B makes the rules require the claim for writes to `picks` / `users` / `official_setlists`.
- If you accidentally revoke your own claim and no longer match the email fallback or `SUPER_ADMIN_UIDS`, re-bootstrap from a machine with Admin SDK credentials using `setCustomUserClaims(uid, { admin: true })` directly.

---

## 7. PR B follow-ups

After soaking PR A in staging:

1. Grant the claim to every current admin via `setAdminClaim`.
2. Remove the legacy email fallback from `resolveIsAdmin` in `src/features/auth/api/authApi.js` and from `assertAdminClaimOrEmail` in `functions/index.js`.
3. Tighten `firestore.rules` (claim-only). Include a rule for the new `rollup_audit/{showDate}` collection — admin-read-only, no client writes (Admin SDK writes from `rollupScoresForShow` bypass rules).
4. Keep `SUPER_ADMIN_UIDS` so the break-glass path exists.

---

## 8. Rollup audit collection

Each successful `rollupScoresForShow` invocation writes a record to `rollup_audit/{showDate}` with:

| Field | Type | Meaning |
|-------|------|---------|
| `lastRolledUpAt` | serverTimestamp | When the rollup committed. Updated on every run. |
| `processedPicks` | number | Picks regraded in this run. |
| `skippedPicks`   | number | Picks skipped (missing `userId`). |
| `totalPicks`     | number | Total matching `picks` docs for this `showDate`. |
| `callerUid`      | string \| null | Firebase UID of the admin who triggered it. |

This is a **Firestore-visible "when did the last rollup run"** signal, separate from per-pick `gradedAt` which only stamps the first grade. Useful for PM-level sanity-checking after idempotent re-runs (where pick `score` and `gradedAt` may not visibly change even though the batch committed).

Do not write to this collection from the client. It's a pure server-side audit log.

---

## 9. Troubleshooting

### `setCustomUserClaims failed … (auth/insufficient-permission): Credential implementation provided to initializeApp() via the "credential" property has insufficient permission to access the requested resource.`

**Cause:** The Cloud Functions runtime service account lacks `roles/firebaseauth.admin`. This is a **fresh-project** / **first-time-deploy** symptom — Gen-2 Cloud Functions run as `<project-number>-compute@developer.gserviceaccount.com`, which gets `roles/editor` by default but not always the Firebase Auth management role needed to read users or set custom claims.

**Fix:** Grant the role once per project. Either run `scripts/grant-functions-auth-admin.sh <project-id>` (preferred) or the raw gcloud command:

```bash
PROJECT_ID=set-picks
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/firebaseauth.admin"
```

IAM changes propagate to the running function within ~30–60s. No redeploy needed. Retry the **Grant admin claim to myself** button.

### `No Auth user for uid=…` or generic `Lookup failed …`

The v1 PR A code masked every `admin.auth().getUser` failure as a misleading "No Auth user" error. If you see that exact message, your deployed function is pre-fix — redeploy from a branch that includes the error-surface fix (PR #197). The current code logs the real firebase-admin error code (`auth/insufficient-permission`, etc.) via `logger.warn("setAdminClaim.getUser failed", ...)` — filter Cloud Logging on that message to diagnose.

### Finalize and rollup "succeeded" but Firestore looks unchanged

Expected when re-running Finalize on an already-graded show: `gradedAt` is only stamped on the first grade (`isFirstGrade` check in `rollupScoresForShow`), and scores/user totals don't visibly change if the computation is deterministic and the inputs haven't changed. Check `rollup_audit/{showDate}.lastRolledUpAt` (added in §8) for a current timestamp, or filter Cloud Logging for `jsonPayload.message="rollupScoresForShow"`.
