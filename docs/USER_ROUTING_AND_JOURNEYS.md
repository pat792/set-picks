# User routing and journeys

Canonical map of **entry URLs**, **auth gates**, and **where users land after sign-in** (including **remember-last-tab** and **pool invite** overrides). For dashboard tab names and copy, see [DASHBOARD_IA.md](./DASHBOARD_IA.md).

## Top-level routes

Defined in `src/app/App.jsx`.

| Path | Access | Purpose |
|------|--------|---------|
| `/` | Public (splash); redirects if session exists | Marketing / SEO landing; auth modals |
| `/invite/:handle` | Public | Site VIP invite landing; personalized when handle resolves; no pool storage |
| `/join` | Public | Missing invite code → redirect home (`PoolInviteMissingCodePage`) |
| `/join/:code` | Public | Stores invite code; VIP landing with optional `?from=` personalization |
| `/setup` | Signed-in only | Profile setup until Firestore user doc exists |
| `/dashboard/*` | Signed-in + profile | App shell (`DashboardLayout`) |
| `/user/:userId` | Public | Public player profile (no dashboard restore) |
| `/password-reset-complete` | Public | Firebase password reset continuation URL |

## Auth gates

### Dashboard shell

`src/app/routes/DashboardRoute.jsx`:

- **Loading** → auth loading screen
- **No Firebase user** → `Navigate` to `/`
- **No user profile doc** (first-time setup) → `Navigate` to `/setup`
- **Else** → `DashboardLayout`

### Setup

`src/app/routes/SetupRoute.jsx`:

- **No user** → `/`
- **Profile already exists** → `Navigate` to `getDashboardEntryHref(...)` (same post-auth target as home for signed-in users)
- **Else** → `ProfileSetupPage`

## Post-auth landing: `getDashboardEntryHref`

Implemented in `src/shared/lib/dashboardLastPath.js` and used from:

- `src/app/routes/HomeRoute.jsx` (signed-in visitor on `/`)
- Invite landings via `useInviteLanding` (signed-in visitor on `/invite/:handle` or `/join/:code`)
- `src/app/routes/SetupRoute.jsx` (profile already complete)
- `src/features/auth/model/useProfileSetup.js` (after first profile save, full page load)

### localStorage

- **Key:** `setpicks_dash_last_loc_v1`
- **Value:** JSON `{ "pathname": string, "search": string }` (search includes `?` when non-empty)

### When it updates

`src/app/layout/DashboardLayout.jsx` runs `persistDashboardPath(pathname, search, { isAdminUser })` on every `location` change while the shell is mounted. Only **eligible** paths are written (see below).

### Excluded from persist and restore

- Entire Profile cluster (`/dashboard/profile`, `/dashboard/profile/notifications`, `/dashboard/profile/account`)
- Legacy redirects: `/dashboard/notifications`, `/dashboard/account-security`

Rationale: users often open **Profile** / **Account** only to sign out; remembering those routes would send them back to Profile on every login. Visiting the cluster does **not** overwrite the last remembered game tab.

### Admin

- `/dashboard/admin` is remembered and restored **only** for the admin user (`isAdminUser` in callers; same rule as nav). Non-admins do not persist admin URL; stored admin URL is ignored on restore for non-admins.

### Fallback

If nothing is stored, stored JSON is invalid, or the path is ineligible → **`/dashboard`** (Picks tab).

### Eligible remembered paths (summary)

| Path pattern | Notes |
|--------------|--------|
| `/dashboard` | Picks (optional safe query, e.g. scoring modal deep link) |
| `/dashboard/pools` | Pool list |
| `/dashboard/standings` | Standings; query string must pass safe-character rules |
| `/dashboard/scoring` | Redirects in-app to Picks + modal; still a valid stored path |
| `/dashboard/pool/:poolId` | Pool details (`poolId` alphanumerics + `_-`) |
| `/dashboard/admin` | Admin only |
| Profile cluster (`/dashboard/profile…`) | **Not** eligible |
| Legacy `/dashboard/notifications`, `/dashboard/account-security` | **Not** eligible |

## Scenarios

### A. First-time user, no invite

1. Open `/` → `HomeRoute` → `LandingPage` / `SplashPage`.
2. Sign up or sign in → Firebase session.
3. `HomeRoute` → `<Navigate to={getDashboardEntryHref} />` → typically **`/dashboard`** (empty storage).
4. `DashboardRoute` → no profile → **`/setup`** → profile form.
5. After successful save → `window.location.href = getDashboardEntryHref(...)` → usually **`/dashboard`**.
6. `DashboardLayout` → default nested route **`/`** → **Picks**.

### B. First-time user with pool invite (`/join/:code`)

1. `usePoolInviteCodeStorage` (`src/features/pool-invite/model/usePoolInviteCodeStorage.js`): valid code → saved under pool-invite storage key → **VIP landing stays on `/join/:code`** (`InviteVipLanding` via `PoolInvitePage`). Optional `?from=` resolves inviter handle for personalized H1.
2. User taps **Create account** or **Sign in** → splash auth modals with pool join banner (`poolInvitePending`). Create account honors legal checkbox (#577).
3. After auth → `useInviteLanding` redirect → `getDashboardEntryHref` → **`/dashboard/pools`** while invite breadcrumb is present (overrides remembered last-tab for that session, #728).
4. `DashboardRoute` → **`/setup`** if no profile; after setup → **`/dashboard/pools`** again via the same invite override.
5. `usePendingPoolJoin` (`src/features/pool-invite/model/usePendingPoolJoin.js`) inside `DashboardLayout`: status machine `idle | joining | succeeded | failed`; consumes invite code, joins pool. Pools UI shows **“Joining your pool…”** (never empty-state) while `joining`. On **`joined`** / **`already-member`** → toast + navigate to **pool detail** when id known, else **`/dashboard/pools`**. Timeout (~15s) keeps breadcrumb + Retry (#729).
6. Invalid/expired code: no navigation to pool detail; user stays on Pools; breadcrumb cleared.

### B2. First-time user with site invite (`/invite/:handle`)

1. `InviteLandingPage` → `useInviteLanding` with `inviteKind: 'site'`. Resolves handle via `resolveInviterProfile`; generic VIP copy if missing/renamed. **Does not** write `phish_pool_pending_invite`.
2. User taps **Create account** or **Sign in** → splash auth modals (no pool join banner).
3. After auth → `getDashboardEntryHref` → **`/dashboard`** (or remembered tab) → setup if needed → normal dashboard flow. **No** `usePendingPoolJoin` side effects.

### C. Existing user, no invite (organic return)

1. Open `/` while signed in → `getDashboardEntryHref` → **last eligible tab** or **`/dashboard`**.
2. Open a bookmark like `/dashboard/standings` directly → gates pass → layout mounts → persistence updates storage for the next “home” entry.

### D. Existing user with a new invite link

1. **Pool:** Same as B.1–B.2 (code stored on landing; signed-in visitors redirect immediately to dashboard with code already in storage).
2. After sign-in, **`getDashboardEntryHref`** returns **`/dashboard/pools`** while the invite breadcrumb is present (not the remembered tab). **`usePendingPoolJoin`** runs with honest joining chrome on Pools.

**Priority:** pending-invite entry to **Pools** + successful **invite join navigation** (pool detail when known) override the restored tab for those outcomes.

### E. Signed out → sign in again

- Last screen was **Profile** (typical sign-out path): Profile is **not** persisted, so restore uses the **previous** eligible tab or **`/dashboard`**.
- Cleared site data / new browser: no storage → **`/dashboard`**.
- Deep link **`/?login=true`**: splash opens **Sign in** (password reset, QA, returning users) — not Create account.

### F. Other entry points

| Situation | Behavior |
|-----------|----------|
| Visit `/setup` with profile already present | `SetupRoute` → `getDashboardEntryHref` |
| Visit `/join` without `:code` | `PoolInviteMissingCodePage` → `/` |
| Visit `/invite/:handle` while signed in | `useInviteLanding` → `getDashboardEntryHref` (no pool storage) |
| Visit `/user/:userId` | Public profile only; no `getDashboardEntryHref` |
| Password reset completion | `/password-reset-complete` (public); flow continues per Firebase / app handling |

## End-to-end flow (high level)

```mermaid
flowchart TD
  entry[Entry_URL]
  inviteLanding{Invite_VIP_landing?}
  authGates[DashboardRoute_gates]
  restore[getDashboardEntryHref_or_URL_unchanged]
  layout[DashboardLayout_persist_path]
  pendingJoin{usePendingPoolJoin_invite_code?}
  poolsNav[Navigate_to_/dashboard/pools]

  entry --> inviteLanding
  inviteLanding -->|site_/invite| authGates
  inviteLanding -->|pool_/join| authGates
  authGates --> restore
  restore --> layout
  layout --> pendingJoin
  pendingJoin -->|joined_or_already_member| poolsNav
  pendingJoin -->|no_code_or_other_outcome| endStay[Stay_on_current_route]
```

## Related code (quick index)

| Concern | File |
|---------|------|
| Route table | `src/app/App.jsx` |
| Signed-in `/` redirect | `src/app/routes/HomeRoute.jsx` |
| Dashboard / setup gates | `src/app/routes/DashboardRoute.jsx`, `src/app/routes/SetupRoute.jsx` |
| Remember path read/write | `src/shared/lib/dashboardLastPath.js` |
| Persist on navigation | `src/app/layout/DashboardLayout.jsx` |
| Invite code capture | `src/features/pool-invite/model/usePoolInviteCodeStorage.js` |
| Site + pool VIP landing | `src/features/invite/ui/InviteVipLanding.jsx`, `src/features/invite/model/useInviteLanding.js` |
| Post-auth join + Pools redirect | `src/features/pool-invite/model/usePendingPoolJoin.js` |
| Profile completion redirect | `src/features/auth/model/useProfileSetup.js` |
| Splash + legacy pool modal prompt | `src/pages/landing/SplashPage.jsx` |
