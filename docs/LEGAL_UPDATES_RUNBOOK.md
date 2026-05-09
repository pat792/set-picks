# Legal updates & consent runbook

Operational guide for changing **Terms of Service**, **Privacy Policy**, or anything that affects **in-app consent** and **`users/{uid}.legalConsent`** in Firestore.

Related product work: GitHub **#392** (auth consent UX). OAuth console URLs and public routes: **#287**.

---

## 1. Canonical document sources

| Document | Markdown source (edit here) |
|----------|-----------------------------|
| Terms of Service | `docs/TERMS_OF_SERVICE.md` |
| Privacy Policy | `docs/PRIVACY_POLICY.md` |

The public routes **`/terms`** and **`/privacy`** render that markdown through the legal feature (`src/features/legal/ui/TermsOfServiceContent.jsx`, `PrivacyPolicyContent.jsx`). Those pages must stay **unauthenticated** so OAuth console and crawlers can fetch them.

---

## 2. Keep “last updated” and version ids in sync

When you **materially change** either markdown file, update **all** of the following so users, auditors, and Firestore see the same revision:

1. **`lastUpdated` string** on the matching React wrapper (human-readable, shown in the legal page header):
   - `src/features/legal/ui/TermsOfServiceContent.jsx` → prop on `LegalPageLayout`
   - `src/features/legal/ui/PrivacyPolicyContent.jsx` → same pattern

2. **Machine version ids** in `src/shared/constants/legalDocVersions.js`:
   - `LEGAL_TERMS_VERSION`
   - `LEGAL_PRIVACY_VERSION`

Use **ISO `YYYY-MM-DD`** for the constants (one id per doc; bump only the doc(s) you changed).

**Why the constants matter:** Splash **sign-in** and **sign-up** call `upsertUserLegalConsentIfOutdated` (`src/features/auth/api/userLegalConsentApi.js`). That helper compares the user’s stored `legalConsent.termsVersion` / `legalConsent.privacyVersion` to these constants. If either differs, the client **merge-writes** a fresh `legalConsent` object (new `acceptedAt`, current `method`). If both already match, **no write** (preserves the original acceptance time).

---

## 3. Firestore shape: `users/{uid}.legalConsent`

Written only by the **authenticated** client after successful email or Google auth (same modal flow for both).

| Field | Type | Notes |
|-------|------|--------|
| `termsVersion` | string | Copy of `LEGAL_TERMS_VERSION` at write time |
| `privacyVersion` | string | Copy of `LEGAL_PRIVACY_VERSION` at write time |
| `acceptedAt` | Timestamp | `serverTimestamp()` |
| `method` | string | `'email'` or `'google'` |

**Profile onboarding:** `createInitialUserProfile` (`src/features/auth/api/profileSetupApi.js`) uses **`setDoc` with `{ merge: true }`** so a consent-only stub created before handle setup is **not** wiped when the profile is first saved.

**Failure behavior:** If consent write fails after Auth succeeded, the client **signs the user out** and shows an error so the flow can be retried (see `useSplashSignIn` / `useSplashSignUp`).

---

## 4. GCP OAuth consent screen (when URLs matter)

If you change **paths** or **host** for Privacy / Terms (not just copy inside the same URLs), update the **Google Cloud Console → APIs & Services → OAuth consent screen** “Application privacy policy link” and “Application terms of service link” to match production (`https://www.setlistpickem.com/privacy`, `https://www.setlistpickem.com/terms`, or whatever the canonical public URLs are). See **#287** for context.

---

## 5. Post-change checklist (developer)

- [ ] Markdown updated; typos / broken links checked on `/terms` and `/privacy` locally (`npm run dev`).
- [ ] `lastUpdated` updated on the touched legal page component(s).
- [ ] `LEGAL_*_VERSION` bumped in `legalDocVersions.js` for any doc that changed materially.
- [ ] `npm run lint` and `npm test` pass.
- [ ] Spot-check: sign **out**, then **sign in** again — user with old versions should get a new `legalConsent` row after next successful auth (inspect `users/{uid}` in Firebase console). User already on current versions should **not** see `acceptedAt` change on every login.

Optional (rules / emulator): `npm run test:rules` includes a merge-write case for `legalConsent` on `users/{userId}`.

---

## 6. Non-goals (legal advice)

This runbook is **engineering process** only. **What** you put in the policies, **whether** checkbox vs clickwrap is sufficient, and **GDPR / CCPA** bases for processing are **legal questions** — not covered here.
