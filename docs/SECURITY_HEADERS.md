# Security headers (Vercel)

Browser-facing headers for the Vite SPA on Vercel. Configured in [`vercel.json`](../vercel.json). Issue [#412](https://github.com/pat792/set-picks/issues/412) / epic [#411](https://github.com/pat792/set-picks/issues/411).

## Always-on headers

Applied to all routes (`/(.*)`):

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Block MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `X-Frame-Options` | `DENY` | Clickjacking (legacy; CSP `frame-ancestors` is primary) |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable unused powerful APIs |

Cache-Control rules for HTML vs hashed assets are unchanged (see existing `vercel.json` entries).

## Content-Security-Policy (tiered)

### Current train phase: **Report-Only**

`Content-Security-Policy-Report-Only` is set on all routes. Browsers **do not block** violations; they only report in DevTools (and to a `report-uri` if we add one later). This is intentional for preview **and** production until reports are clean.

### Promote-day / follow-up: **Enforce**

When Realtime / field reports show no unexpected violations on production traffic:

1. In `vercel.json`, rename `Content-Security-Policy-Report-Only` → `Content-Security-Policy` (same value).
2. Deploy and smoke: Google sign-in, App Check, Firestore, FCM, GA4 (prod host only), admin Phish.in fetch.
3. Keep `frame-ancestors 'none'` and the always-on headers.

Do **not** enforce on a half-broken policy — prefer report-only soak over a login outage.

## CSP directives and exceptions

Policy (keep in sync with `vercel.json`):

```text
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://apis.google.com https://www.recaptcha.net;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https:;
connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://*.firebaseapp.com https://*.firebasestorage.app https://firebasestorage.googleapis.com https://storage.googleapis.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://analytics.google.com https://www.google.com https://www.gstatic.com https://phish.in wss://*.googleapis.com wss://*.firebaseio.com;
frame-src https://accounts.google.com https://*.firebaseapp.com https://www.google.com https://www.recaptcha.net https://recaptcha.google.com;
worker-src 'self' blob:;
manifest-src 'self';
upgrade-insecure-requests
```

| Directive | Why these hosts |
|-----------|-----------------|
| `script-src` | Vite bundles (`'self'`); GA4; Google Identity / gapi; App Check **reCAPTCHA Enterprise** (`google.com`, `gstatic.com`, `recaptcha.net`) |
| `style-src` | App CSS; Google Fonts CSS; `'unsafe-inline'` for runtime style attributes (Tailwind / UI) |
| `font-src` | Inter from `fonts.gstatic.com` |
| `img-src` | Local assets, avatars, Google favicon on splash, HTTPS images |
| `connect-src` | Firebase (Auth, Firestore, Storage, Installations, App Check, Functions), GA4 beacons, Phish.in admin fetch, WebChannel `wss://` |
| `frame-src` | Google sign-in, Firebase auth helper frames, reCAPTCHA challenges |
| `worker-src` | FCM service worker + module workers |
| `frame-ancestors` | No embedding (pairs with `X-Frame-Options: DENY`) |

### Explicitly not allowed

- `'unsafe-eval'` — not required by current Vite production builds
- Arbitrary third-party ads / tag managers beyond GA4
- `data:` / `blob:` in `script-src`

### Local `npm run dev`

Vite HMR and `@vite/client` need looser rules; **`vercel.json` does not apply to localhost**. Dev is ungated by design. Validate CSP on a Vercel preview or production deploy.

## Verification

1. **Deployed preview / staging:** DevTools → Network → document → Response Headers:
   - Always-on headers present
   - `content-security-policy-report-only` present (not `content-security-policy` until enforce flip)
2. **Smoke:** sign-in, dashboard load, picks save, pool invite, notifications bell (FCM path).
3. **Console:** filter `Content-Security-Policy` — note any report-only violations; fix policy before enforce.
4. **Optional automation:** `npm run qa:preview-headers` (with `QA_PREVIEW_BASE_URL`) asserts cache-control **and** the always-on security headers + report-only CSP.

## Related

- [`vercel.json`](../vercel.json)
- [`docs/RELEASE_TRAIN_SPRINT_5_6.md`](RELEASE_TRAIN_SPRINT_5_6.md) Wave 4
- Client GA gate: `src/shared/lib/ga4.js` (prod hostnames only)
