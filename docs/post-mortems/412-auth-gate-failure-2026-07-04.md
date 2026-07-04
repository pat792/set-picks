# Post-mortem — Auth gate failure (issue #412)

**Incident:** Production Google and email sign-in broken; marketing email links felt abysmally slow. User-reported ~17 hours after v1.18.0 promote. **Resolved** same day via PR #499 + direct `main` hotfix **v1.18.3**.

**Severity:** P0 — complete auth outage on custom `authDomain` (`www.setlistpickem.com`).

**Tracking:** #412 (security headers) · epic #411 · custom auth domain #282

---

## Timeline (UTC)

| When | Event |
|------|-------|
| 2026-07-03 22:26 | **#475** merges #412 — `X-Frame-Options: DENY` added to `vercel.json` catch-all `/(.*)` |
| 2026-07-03 23:25 | v1.18.0 promote (**#478**) ships headers to production |
| 2026-07-03 | Summer Tour marketing email (#468) sent — CTAs point at `/join/:code` |
| 2026-07-04 ~15:30 | User report: slow loads + Google "Sign-in was cancelled" + email sign-in stuck on "SIGNING IN…" |
| 2026-07-04 15:40 | **#499** merged to `staging` (v1.18.2) — negative-lookahead header exception + invite perf |
| 2026-07-04 15:41 | v1.18.2 promoted to `main` |
| 2026-07-04 15:51 | Production deploy of v1.18.2 — **auth still broken** (Vercel ignored lookahead regex) |
| 2026-07-04 15:54 | **v1.18.3** hotfix to `main` — explicit route allowlist for `X-Frame-Options` |
| 2026-07-04 15:55 | Verified live: `/__/auth/iframe` no longer returns `X-Frame-Options: DENY` |
| 2026-07-04 ~16:00 | User confirms sign-in works after hard reload |

---

## Root cause (primary) — `X-Frame-Options: DENY` on Firebase Auth proxy paths

Production uses a **custom Firebase Auth domain** (#282): `authDomain = www.setlistpickem.com`, with `/__/auth/*` proxied to Firebase Hosting via `vercel.json` rewrites.

Firebase Auth (popup **and** email/password) loads a hidden helper iframe from:

`https://www.setlistpickem.com/__/auth/iframe`

That document must be **embeddable cross-origin** by `accounts.google.com` (and Firebase's auth helper). #412 / #475 applied:

```json
{ "source": "/(.*)", "headers": [{ "key": "X-Frame-Options", "value": "DENY" }] }
```

Because `/(.*)` matches proxied auth paths, Vercel injected `X-Frame-Options: DENY` on the auth iframe response. Browsers refused to embed the iframe → OAuth handshake failed.

**User-visible symptoms:**

- Google: `auth/popup-closed-by-user` → UI copy **"Sign-in was cancelled."**
- Email/password: promise hung → button stuck **"SIGNING IN…"** (iframe token exchange never completed)

**Why it shipped:** #412 AC called for frame controls + auth smoke, but promote-day QA did not include `curl -sI …/__/auth/iframe` header inspection. Desktop-only popup smoke on default `firebaseapp.com` previews would also miss this — custom `authDomain` is prod-only (`VITE_FIREBASE_AUTH_DOMAIN`).

---

## Contributing factor — v1.18.2 fix did not work on Vercel

First hotfix (PR #499) moved `DENY` to a negative-lookahead source:

`/((?!__/auth/|__/firebase/).*)`

This works in Node/path-to-regexp tests but **Vercel still applied `DENY` to `/__/auth/iframe`** after deploy. Required second hotfix (**v1.18.3**): explicit `X-Frame-Options: DENY` on listed app routes only + dedicated `/__/auth/*` / `/__/firebase/*` blocks without `DENY`.

---

## Contributing factor (perf, not auth) — marketing `/join/:code` serverless path

Summer Tour email CTAs (#468) link to `/join/:code?utm_…`. That route hits `api/invite/[code].js`, which **queried Firestore Admin on every browser request** before serving the SPA shell (OG lookup only needed for crawlers).

On cold serverless starts this added hundreds of ms–seconds on top of an already heavy client bundle. Fixed in #499 by serving the SPA immediately for non-crawler user agents.

**Not the auth root cause**, but it explains why email links felt especially slow vs direct homepage visits.

---

## Residual risks / follow-ups

### 1. CSP enforce flip will re-break auth if unchanged (HIGH)

CSP is still **Report-Only** on `/(.*)`, including `frame-ancestors 'none'`. When we rename to enforcing `Content-Security-Policy` (promote-day step in `docs/SECURITY_HEADERS.md`), the **same catch-all will block auth iframes** unless `/__/auth/*` gets a separate policy without `frame-ancestors 'none'` (or with an explicit `frame-ancestors` allowlist for Google).

**Action:** Block CSP enforce until auth-proxy routes have an explicit exception. Add to `qa:preview-headers`.

### 2. `signInWithPopup` on mobile Safari (MEDIUM)

We use popup-only Google sign-in (`src/features/auth/api/splashAuthApi.js`). iOS Safari is notoriously flaky with popups even when headers are correct. If cancelled-sign-in reports persist, add `signInWithRedirect` + `getRedirectResult` for touch/narrow viewports.

### 3. Client JS weight on splash (MEDIUM, ongoing)

Production critical path ~**852 KB** raw JS before gzip (`firebase-core` 522 KB + `vendor-react` 190 KB + app chunks). Mobile parse/download dominates perceived load time after HTML arrives. Separate from this incident; tracked under perf work (#242 chunking).

### 4. `/__/firebase/init.json` returns 404 (LOW, monitor)

`GET https://www.setlistpickem.com/__/firebase/init.json` → 404 (rewrite destination may be missing on Firebase Hosting). Not observed to block sign-in after header fix; worth verifying if Auth SDK behavior changes.

### 5. App Check deferred init (LOW)

`whenFirebaseReady()` gates Firestore profile subscription, not Auth sign-in itself. Slow reCAPTCHA Enterprise on mobile could delay post-login routing to dashboard — separate from this outage.

---

## Detection gaps

| Gap | Fix shipped / proposed |
|-----|------------------------|
| No automated check for auth iframe framing headers | `qa:preview-headers` now asserts `/__/auth/iframe` has **no** `X-Frame-Options: DENY` (#499) |
| `qa:preview-headers` skipped on vercel.json-only PRs | CI path gate skipped it on #499 — consider `ci/full` or always run when `vercel.json` changes |
| Promote QA didn't smoke custom auth domain | Add promote checklist item: auth iframe header curl + mobile Safari Google sign-in |
| Negative lookahead assumed portable to Vercel | Documented in `SECURITY_HEADERS.md` — use explicit route lists |

---

## Resolution

| PR / version | Change |
|--------------|--------|
| PR #499 (v1.18.2) | Remove `DENY` from catch-all; skip Firestore on browser `/join/:code`; QA auth iframe check |
| `main` direct (v1.18.3) | Explicit `X-Frame-Options` route allowlist — Vercel-compatible |
| PR #500 | Sync `staging` ← `main` |

**Verification command (run on every security-header or auth-domain change):**

```bash
# Auth iframe must NOT have X-Frame-Options
curl -sI https://www.setlistpickem.com/__/auth/iframe | grep -i x-frame

# App shell SHOULD still have DENY
curl -sI https://www.setlistpickem.com/ | grep -i x-frame
```

---

## Lessons

1. **Custom `authDomain` is a distinct security surface** — frame headers on `/__/auth/*` are auth-critical, not general clickjacking policy.
2. **Catch-all `/(.*)` headers apply to Vercel rewrites/proxies**, not just the SPA.
3. **Test header behavior on deployed prod host**, not only report-only CSP console warnings.
4. **Vercel `headers[].source` regex ≠ Node** — don't rely on negative lookahead; use explicit routes.
5. **Marketing campaigns amplify latent perf issues** — serverless + Firestore on every click matters at cohort scale.

---

*Authored 2026-07-04 after user-confirmed recovery.*
