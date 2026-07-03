# Legal document updates runbook

How to publish material Terms of Service or Privacy Policy changes and force in-app re-consent (#396).

## Version constants

Published version ids live in `src/shared/constants/legalDocVersions.js`:

- `LEGAL_TERMS_VERSION`
- `LEGAL_PRIVACY_VERSION`

Initial ids match the **Last updated** dates in `docs/TERMS_OF_SERVICE.md` and `docs/PRIVACY_POLICY.md` (`2026-05-08`).

## What the app stores

On accept (sign-up or dashboard re-consent gate), `recordTermsPrivacyConsent` writes:

| Field | Purpose |
|-------|---------|
| `users/{uid}.termsPrivacyAcceptedAt` | Legacy consent timestamp (profile / telemetry) |
| `users/{uid}.legalConsent.termsVersion` | Accepted Terms version id |
| `users/{uid}.legalConsent.privacyVersion` | Accepted Privacy version id |
| `users/{uid}.legalConsent.acceptedAt` | When the current versions were accepted |

Dashboard users whose stored versions do not match the constants see a **blocking** modal (`LegalReconsentModal`) until they check the box and accept.

## Material update checklist

1. Edit `docs/TERMS_OF_SERVICE.md` and/or `docs/PRIVACY_POLICY.md` (and any mirrored UI content under `src/features/legal/ui/`).
2. Set **Last updated** on the changed doc(s).
3. Bump the matching constant(s) in `legalDocVersions.js` to a new id (prefer `YYYY-MM-DD`).
4. Ship via normal PR → `staging` → promote. No Firestore migration — clients gate on mismatch.
5. Smoke: sign in as a user with the previous versions; confirm modal appears; accept; confirm modal dismisses and `legalConsent` updates.

## Non-material edits

Typos / formatting that do not change user obligations: update the markdown only; **do not** bump version constants (avoids unnecessary re-consent).

## Sign-up path

New accounts already accept Terms/Privacy on splash sign-up and receive current version ids via the same `recordTermsPrivacyConsent` write. They should not see the dashboard gate unless versions are bumped later.
