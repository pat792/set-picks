# Outbound auth handoff (#830)

**Release train:** `docs/RELEASE_TRAIN_COLD_OPEN.md` Phase B  
**Depends on:** Bucket A (#832 / v1.47.0) — marketing document without Firebase; app auth entry at `/login`.  
**Auth boot rules (once on `/login` / invite auth):** `docs/AUTH_BOOT_PRACTICES.md` (#850 / #858 / #859) — warm Auth after paint; never await App Check before Google OAuth; Safari/iOS prefer `signInWithRedirect`.

After marketing cold opens stop booting `AuthProvider`, every outbound link must still land on the correct document: marketing shell, app shell, invite OG shell, or `/login`.

---

## Classification

| Class | Meaning |
|-------|---------|
| `app-ok` | Hard-open on authenticated SPA (`app.html` / dashboard boot / spa-boot). No change needed for dual-doc. |
| `retarget-auth` | Was splash-modal (`/?login=true`) or unauth bounce to `/`. Emit or redirect to `/login` (app-document auth entry today — #890; HTML-first door in epic [#889](https://github.com/pat792/set-picks/issues/889)). |
| `public-static` | Marketing document (`index.html` → `marketingMain`). No Firebase on cold open. |
| `invite-shell` | `/join/*` / `/invite/*` via OG API → prefer `dist/app.html`. Auth modals stay on app shell. |

---

## Inventory (shipped state)

| Link pattern | Sources | Class | Notes |
|--------------|---------|-------|-------|
| `/dashboard`, `/dashboard/picks`, `/dashboard/standings(#…)`, `/dashboard/profile`, `/dashboard/profile/notifications` | Comms email CTAs, inbox, push `fcmOptions.link` | `app-ok` | `vercel.json` → dashboard / spa boot shells |
| `/setup` | New-user profile gate | `app-ok` | Dashboard boot shell |
| Push → `/dashboard/profile/notifications` | `fcmMessagingCore`, messaging SW | `app-ok` | |
| `/`, `/how-it-works`, `/how-scoring-works`, `/phish-setlist-prediction-game` | Marketing entry; some email allowlist paths | `public-static` | No Firebase until CTA → `/login` |
| `/tour-stats*` | Public Firestore UI | `public-static` | **#853:** marketing document; Firebase only at aggregate fetch (not AuthProvider) |
| `/join/:code`, `/invite/:handle` | Invite kits, OG `api/invite` | `invite-shell` | Prefers `dist/app.html` |
| Marketing splash CTAs | `MarketingHomePage` | `retarget-auth` | **Done (#832 / #834 / #835 / #872 / #860):** hard-nav `/login` / `/login?mode=signup` with leave chrome + intent prefetch of login UI (no Firebase on marketing). Mid-page Get Started chooser removed — hero/header/section CTAs go straight to auth. |
| App-shell splash CTAs | `SplashPage` (after soft-nav / sign-out) | `retarget-auth` | **Done (1.48.1):** navigate to `/login` (no splash modals). Invite VIP still modal (#844). |
| Marketing shell Home | `MarketingPageShell` | `public-static` | **Done (1.48.1):** `<a href="/">` hard-nav so app-doc surfaces reload marketing `index.html` |
| Password-reset success | `PasswordResetCompletePage` | `retarget-auth` | **Done (#881 / #890):** hard `<a href="/login">` |
| `/?login=true` (+ optional `signup=1`) | Legacy deep links, older QA | `retarget-auth` | Compat hops: `marketingMain` + `SplashPage` → `/login` |
| Unauth hard-open `/dashboard/*` or `/setup` | `DashboardRoute` / `SetupRoute` | `retarget-auth` | **#830 / #881:** hard-nav to `/login` thin entry (keeps `persistDashboardPath`) |
| Firebase Auth `%LINK%` → `/password-reset-complete` | Console email templates | `app-ok` | spa-boot / app path |

### Production emitters — no URL rewrites required

Service + marketing email CTAs, in-app inbox CTAs, and push links already target `/dashboard/*` or invite kits. Grep of `functions/`, `emails/`, `content/comms/`, and `comms/` found **no** `/?login=true` emitters.

### Email click allowlist (#830)

`comms/emailLinks.cjs` / `functions/comms/emailLinks.cjs` allow:

- `/dashboard`, `/join`, `/how-it-works`, `/how-scoring-works`, `/`
- **Plus** `/login`, `/invite`, `/setup` for future tracked CTAs

---

## Compat shims (keep one release)

| Shim | Behavior |
|------|----------|
| `src/marketingMain.jsx` | `?login=true` → `location.replace('/login')` |
| `src/pages/landing/SplashPage.jsx` | `?login=true` → `navigate('/login')` (app soft-nav) |

Remove only after QA/docs stop emitting the query form.

---

## Verify

```bash
# Marketing cold open still Firebase-free
npm run build && npm run preview
# Private window: / — Network must not request firebase-core until /login

# Auth entry
# /login → inline full-page forms (no role=dialog)
# From /login → Home → marketing /; Sign in again → /login (not splash modal)
# /dashboard (signed out) → /login, then post-auth restores persisted path
# /join/:code and /invite/:handle still open app shell + auth modals (#844)
```

