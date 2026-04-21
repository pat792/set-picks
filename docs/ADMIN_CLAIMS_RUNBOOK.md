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

### 2b. Self-grant the claim (from the browser)

As the super-admin (or legacy email holder), open the app while signed in and run in devtools:

```js
import('firebase/functions').then(async ({ getFunctions, httpsCallable }) => {
  const { app } = await import('/src/shared/lib/firebase.js');
  const fn = httpsCallable(getFunctions(app, 'us-central1'), 'setAdminClaim');
  const res = await fn({ admin: true });
  console.log(res.data);
});
```

> The exact import path for `app` will vary with Vite/import config. Alternatively, call from a temporary admin-only button (acceptable during bootstrap) or use the Firebase Functions emulator + Admin SDK script (see §4).

Force a token refresh so the claim is visible to the client and Firestore rules:

```js
await firebase.auth().currentUser.getIdTokenResult(true);
```

Or simply sign out and back in.

### 2c. Verify

In the app devtools:

```js
const t = await firebase.auth().currentUser.getIdTokenResult();
console.log(t.claims.admin); // expect: true
```

`useAuth().isAdmin` should now return `true` via the claim (not the email fallback).

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
3. Tighten `firestore.rules` (claim-only).
4. Keep `SUPER_ADMIN_UIDS` so the break-glass path exists.
