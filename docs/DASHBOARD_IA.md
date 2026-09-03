# Dashboard information architecture & vocabulary

Single reference for **support**, **product**, and **engineering** when adding routes or writing user-facing copy.

## Primary navigation (five-tab core)

| Tab (label) | Path | Purpose |
|-------------|------|---------|
| **Picks** | `/dashboard` | **Picks cluster** (#766): Make Picks / Picks Lab / Scorecard. Primary tab stays active on all three. Global date picker stays on. |
| **Pools** | `/dashboard/pools` | Pools **cluster**: My Pools, Create Pool, Join Pool (sub-nav). |
| **Standings** | `/dashboard/standings` | **Show standings** for the selected show (everyone or one pool). Tertiary: Show / Tour / Pools. |
| **Stats** | `/dashboard/stats` | **Stats cluster** (#769): Personal / Global / Band. Primary tab stays active on all three and on the `/dashboard/tour-stats` redirect hop. |
| **Profile** | `/dashboard/profile` | Profile **cluster**: identity, **Messages**, **Account** (sub-nav). |

**Admin** (sixth item, single admin user): `/dashboard/admin` — War Room. Bottom nav is **5 columns** for players, **6** when Admin is present.

### Stats cluster (#769)

Nested routes (not `?view=`). Icon: `BarChart3`. Personal is career-scoped (no global date picker). Global / Band keep the #555 tour scope picker (`?tour=`).

| Sub-nav | Path | Responsibility |
|---------|------|----------------|
| **Personal Stats** | `/dashboard/stats` and `/dashboard/stats/personal` | Profile self stats (`ProfileSelfStatsPanel` / season averages / heatmap). Profile may keep a quiet **View personal stats** link. |
| **Global Stats** | `/dashboard/stats/global` | Private tour explorer from #555 (`TourStatsView` / `useTourStatsScreen`) including self overlay. Leaderboards (points / picking averages) are **deferred**. |
| **Band Stats** | `/dashboard/stats/band` | Coming-soon shell. Phish song stats by tour live under Global until multi-band (#300). Links to Global — do not duplicate the explorer. |

**Legacy redirect:** `/dashboard/tour-stats` → `/dashboard/stats/global` (preserve `?tour=`). Stats primary stays active on the hop.

**Public marketing counterpart (#665):** `/tour-stats` and `/tour-stats/:tourSlug` — aggregate song datasets only (most played, bustouts, gaps); default tour is the **current** tour (newest `lastShowDate` on `_index`). Not a dashboard route; `robots.txt` still Disallows `/dashboard/*`. Do not unlock private Stats or self-overlay for anonymous users.

### Feature discovery “New” markers (#639)

Soft **New** labels (not coachmarks) may appear temporarily on:

- Stats chrome **Global** segment → clears after visiting `/dashboard/stats/global` (compact corner **dot**, not a “New” text label — keeps the Global Stats word readable). Same `tour-stats` feature id as the retired Standings Stats pill.
- Official setlist card on Standings → clears when the card is toggled open/closed
- Profile **Avatar** / **Badges** headings → clears after picking an avatar

Markers auto-expire by catalog `until` date and persist dismissals in `localStorage` per signed-in uid. Support can tell users: clear site data for the origin if a marker is stuck; otherwise ignore — they vanish by end of the window.

### Picks tertiary (#766)

Nested routes (not `?view=`). Primary **Picks** tab stays active. Lab segment is **always visible**; when `VITE_ENABLE_PREDICTION_LAB` is not `true`, Picks Lab shows an empty / coming-soon shell (do not hide the tab).

| Sub-nav | Path | Responsibility |
|---------|------|----------------|
| **Make Picks** | `/dashboard` and `/dashboard/picks` | Existing picks form (lock/edit). `utm_campaign` landed logging stays here. |
| **Picks Lab** | `/dashboard/picks/lab` | Prediction Lab (`PickPredictionPanel`) when the env flag is `true`; otherwise coming-soon. |
| **Scorecard** | `/dashboard/picks/scorecard` | Global, show-scoped self card + comparison metrics (#767). |

**Scorecard v1 (#767):** Global only (not pool-scoped). Show comes from the existing global date picker. Overlap (“N players also picked this song”) is **post-lock only** (LIVE / PAST or admin-locked NEXT). Pre-lock shows the player’s own card plus locked copy — no overlap. Odds are optional `playProb` from Storage `pick-recommendations.json` (same artifact as Lab); omit the odds row if the artifact is missing or for another night. Score / rank reuse the show-scoped standings query already used by `useStandings` / `computeStandingsSelfRecap` — no new collections or unbounded picks scans.

**Deferred (not v1):** pool-scoped Scorecard, live crowd %, pre-lock overlap.

Mobile: tertiary tray portals under the context bar via `ChromeSegmentedControl` (same primitive as Profile). Desktop: in-page tray at the cluster layout call site. Make Picks keeps scoring / lock-status tools (`PicksMobileFixedChrome`) on that destination only.

### Profile cluster (#418)

| Sub-nav | Path | Responsibility |
|---------|------|----------------|
| **Profile** | `/dashboard/profile` | Handle, favorite song, public preview, join date |
| **Messages** | `/dashboard/profile/notifications` | `commsInbox` + push/category/email prefs |
| **Account** | `/dashboard/profile/account` | Sign-in method, logout, delete, Privacy/Terms |

Legacy redirects (preserve bookmarks + email deep links):

- `/dashboard/notifications` → `/dashboard/profile/notifications` (query string preserved, e.g. `?openPush=1`)
- `/dashboard/account-security` → `/dashboard/profile/account`

Avatar in the mobile brand bar links to **Account**. Bell links to **Messages**.

### Pools parent / child (active state)

- **Pools** tab stays active on `/dashboard/pools`, `/dashboard/pools/create`, `/dashboard/pools/join`, **and** `/dashboard/pool/:poolId` (**pool details**).
- **Profile** tab stays active on the entire Profile cluster (including legacy redirect paths).
- **Standings** tab stays active on `/dashboard/standings` only (Show / Tour / Pools).
- **Stats** tab stays active on `/dashboard/stats`, `/dashboard/stats/personal`, `/dashboard/stats/global`, `/dashboard/stats/band`, **and** `/dashboard/tour-stats` (redirect hop).
- **Picks** tab stays active on `/dashboard`, `/dashboard/picks`, `/dashboard/picks/lab`, and `/dashboard/picks/scorecard`.

## Tertiary chrome contract (#765)

Single visual/interaction pattern for in-tab section navigation. **Canonical primitive:** `ChromeSegmentedControl` (`src/shared/ui/ChromeSegmentedControl.jsx`) — NavLink mode (route clusters) or `tablist` / button mode (`value` / `onChange` view switches). **Do not fork tray CSS** in features.

This documents the shared tray contract. Picks (#766), Pools (#768), and Stats (#769) use it. Account-as-primary is still a later child.

### Visual

- Rectangular **equal-width** tray (`flex w-full`, segments `flex-1`) — not auto-width pills
- Uppercase labels (`uppercase tracking-widest`)
- Active ring/fill: `bg-brand-primary/15 text-brand-primary ring-1 ring-inset ring-brand-primary/35`
- Inactive: `text-content-secondary` + inset hover
- Icons optional (Standings today; Profile text-only) — do not require icons on every cluster

### Placement

| Viewport | Pattern |
|----------|---------|
| **Mobile** | Fixed under the context bar via `useDashboardMobileChromePortal` (`ProfileMobileFixedChrome`, `StandingsMobileFixedChrome`) |
| **Desktop** | Sticky or in-page tray (Profile cluster pattern). Standings uses sticky in-page chrome (`StandingsStickyChrome`) |

Visibility (`hidden md:block` vs portal) lives at the **cluster layout call site**, not inside `ChromeSegmentedControl`.

### Behavior

1. **Primary tab stays active** on all child routes/views (mirror Pools → pool details and Profile cluster `isActive` in `DashboardLayout`).
2. **Snap-to-top** on tertiary change (`scrollAppToTop`) — already inside `ChromeSegmentedControl`.
3. `aria-label` on the tray; NavLink clusters use `<nav>`; view switches use `role="tablist"` + `role="tab"` / `aria-selected`.

### Landscape / `desk` screens (#704–#707)

Do **not** add new `md:`-as-device assumptions in **shared** chrome. Until `desk` / `mob` screens land, keep existing call-site `md:` splits (portal vs in-page) and prefer one tray primitive rather than a second desktop-only pill group.

### Checklist: adding a cluster

When you add or rename a tertiary cluster (or a `/dashboard/*` child):

1. Update **`getDashboardPageMeta`** (`contextTitle`, `showDatePicker`, `layoutDesktopHeading`, `layoutDetailEyebrow` if needed).
2. Update **`DashboardLayout`** nav **`isActive`** so the primary tab stays active on every child (mirror **Pools / pool details** and **Profile / account**).
3. Add a row to **`scripts/verify-dashboard-meta.mjs`** and run **`npm run verify:dashboard-meta`**.
4. Update **`src/shared/config/dashboardVocabulary.js`** (`NAV_LABEL_*`) and this doc.
5. If paths change: **`src/shared/config/dashboardRoutes.js`** (cluster constants + legacy redirects) and **`docs/API.md`** when a declared route is added/renamed.
6. Compose **`ChromeSegmentedControl`** — mobile portal chrome + desktop sticky/in-page tray. No per-feature tray class strings.
7. Run **`npm run verify:dashboard-ui`**.

### Current tertiary clusters

| Primary (stays active) | Tertiary segments | Notes |
|------------------------|-------------------|--------|
| **Pools** | My Pools · Create Pool · Join Pool | Nested routes; pool details stays a child, not a segment |
| **Picks** | Make Picks · Picks Lab · Scorecard | Nested routes (#766). Lab segment always visible; Scorecard is the #767 surface. |
| **Profile** | Profile · Messages · Account | Nested routes under `/dashboard/profile/*` |
| **Standings** | Show · Tour · Pools | Stats moved to the Stats primary (#769). |
| **Stats** | Personal · Global · Band | Nested routes (#769). Tray drops the redundant “Stats” suffix so three uppercase chips fit. Band is a coming-soon shell. |

`NAV_LABEL_STATS` is the **Stats** primary. **Account-as-primary** (relabel Profile vs rename `/dashboard/profile`) is an open question on #764 / #770 — do not change the user-visible Profile primary label until that child.

### Pools tertiary (#768)

| Sub-nav | Path | Responsibility |
|---------|------|----------------|
| **My Pools** | `/dashboard/pools` | `UserPoolsSection` list (default) |
| **Create Pool** | `/dashboard/pools/create` | Create flow (`PoolCreateCard` / `useUserPools` `handleCreate`) |
| **Join Pool** | `/dashboard/pools/join` | Join-by-code; pending-join / invite retry (`POOL_INVITE_STORAGE_KEY`) |
| **Pool details** | `/dashboard/pool/:id` | Unchanged Option C chrome; Pools primary stays active (not a tertiary segment) |

Nested routes (not `?view=`). After a successful create or join, navigate to that pool’s details. How-it-works is a **CircleHelp** icon in the mobile context-bar trailing slot and beside the desktop tertiary tray (Standings Scale pattern) — not a fourth tertiary segment or in-flow disclosure. Post-auth `/join/:code` with a pending invite lands on **Join Pool**.

## Pool details desktop chrome (decision: Option C)

**Player-facing name:** **Pool details** (internal code may still say “Pool Hub”).

| Layer | What users see |
|--------|----------------|
| Mobile context bar | **Pool Details** |
| Desktop shell | Eyebrow **POOL DETAILS** (same typographic tier as in-page section labels, e.g. Game Status) |
| Under Back | Breadcrumb **Pools · {pool name}** (`Pools` links to list) |
| In-page hero | Pool **name** as `<h1>` + members line (unchanged) |

Rationale: **Entity-first** detail view without a second full-width display title duplicating the pool name; wayfinding ties back to **Pools**.

## Vocabulary (`src/shared/config/dashboardVocabulary.js`)

| Term | Meaning |
|------|---------|
| **Picks** | Tab + context + desktop H1 for the Picks cluster (`NAV_LABEL_PICKS`) — `/dashboard`, `/dashboard/picks`, `/dashboard/picks/lab`, `/dashboard/picks/scorecard`. |
| **Make Picks** | Picks-cluster tertiary for the form (`NAV_LABEL_MAKE_PICKS`). |
| **Picks Lab** | Picks-cluster tertiary for Prediction Lab (`NAV_LABEL_PICKS_LAB`); path `/dashboard/picks/lab`. |
| **Scorecard** | Picks-cluster tertiary (`NAV_LABEL_SCORECARD`); path `/dashboard/picks/scorecard`. Global self card + post-lock metrics (#767). |
| **Pools** | Tab + context + desktop H1 for `/dashboard/pools`, `/dashboard/pools/create`, and `/dashboard/pools/join` (`NAV_LABEL_POOLS`) — same word in nav and shell. Tertiary labels: **My Pools** / **Create Pool** / **Join Pool**. |
| **Profile** | Tab + context for `/dashboard/profile` (`NAV_LABEL_PROFILE`); desktop in-page subheading matches. **Account-as-primary** is an open question (#764 / #770) — primary label stays Profile until that child. |
| **Messages** | Profile-cluster inbox + prefs (`NAV_LABEL_MESSAGES`); path `/dashboard/profile/notifications`. |
| **Account** | Profile-cluster account surface (`NAV_LABEL_ACCOUNT`); path `/dashboard/profile/account`. |
| **Admin** | Tab label for `/dashboard/admin` (`NAV_LABEL_ADMIN`); context + desktop H1 stay **War Room** (meta string in `dashboardPageMeta.js`). |
| **Standings** | Tab, context bar for `/dashboard/standings` (`NAV_LABEL_STANDINGS`). Desktop **Standings** title + Show/Tour/Pools tray live in sticky in-page chrome (not the layout H2) so banners and the leaderboard scroll underneath. View is URL-synced via `?view=show\|tour\|pools`. Pools view takes an optional `?pool=<id>` sub-selector. `?view=tour` hides the global date picker and shows the shared tour scope picker (`?tour=`). |
| **Stats** | Primary tab + context + desktop H1 for the Stats cluster (`NAV_LABEL_STATS`) — `/dashboard/stats`, `/dashboard/stats/personal`, `/dashboard/stats/global`, `/dashboard/stats/band`. Tertiary chips: **Personal** / **Global** / **Band**. |
| **Personal** | Stats-cluster tertiary for career self stats (`NAV_LABEL_PERSONAL_STATS`). Destination name: Personal Stats. |
| **Global** | Stats-cluster tertiary for the private tour explorer (`NAV_LABEL_GLOBAL_STATS`); path `/dashboard/stats/global`. Destination name: Global Stats. |
| **Band** | Stats-cluster tertiary shell (`NAV_LABEL_BAND_STATS`); path `/dashboard/stats/band`. Destination name: Band Stats. |
| **Show standings** | Ordered points for **one show date** only (Standings screen); use this phrase in glossary, help, and cross-links where the “one night” nuance matters. |
| **All-time standings** | Cumulative points / wins / shows across **every** finalized show (all tours). Canonical name on pool details (`POOL_ALL_TIME_STANDINGS_HEADING`) and optional global companion on Standings. Replaces legacy **Season totals**. See #148. |
| **Tour standings** | Cumulative points / wins / shows scoped to the **current tour** via `show_calendar.showDatesByTour` (`TOUR_STANDINGS_HEADING`). Global on Standings (#219), pool-scoped on pool details (#148). |
| **Season totals** | Legacy alias of **All-time standings** on pool details; retained as a `@deprecated` re-export while the pool-side migration (#148) lands. Avoid in new copy. |
| **Tonight's winner / winners** | Standings "Overall winner of the night" banner (#218). Singular on a clean win, plural on ties — `tonightsWinnerHeading(winnerCount)` picks automatically. On **Pools**, computed from pool-filtered picks (same audience as the leaderboard). |
| **Last show's winner / winners** | Standings callout for the **prior tour night** while the selected show is **NEXT** (picks still open) (#218, #305). Hidden once picks lock (**LIVE**). **Show tab:** global prior-night picks; **Pools tab:** pool-filtered prior night (same rules as tonight for that audience). Heading uses `lastShowWinnerHeading(winnerCount, poolName?)` — on Pools, suffix **`· {pool name}`** when known. |
| **View results** (Standings) | **Show tab only:** `DashboardRowPill` on the last-show winner banner jumps to `/dashboard/standings?showDate=<prior night>`; `DashboardLayout` syncs the global date picker (layout `setSelectedDate` + URL so repeat clicks work). **Pools:** banner may still show; **no** View results link (product lock #305). Implementation: `StandingsWinnerOfTheNightBanner`, `useStandingsScreen`, `StandingsPage` / `onSelectShowDate`. |
| **Wins** | For any scope (one show, a tour, all-time), the count of shows where a player ties/beats the global high score across every graded non-empty pick (`max === 0 → skip`). Same rule on Profile, Standings, Tour standings, and pool surfaces; implemented once in `src/shared/utils/showAggregation.js::reduceShowWinners`. |
| **Pool details** | Screen for one pool: roster, invites, game status, archive links, All-time and Tour standings (`NAV_LABEL_POOL_DETAILS`). |

### User-visible string ownership (support / engineering)

| Users see | Route / surface | Source of truth |
|-----------|-----------------|-----------------|
| Picks | `/dashboard`, `/dashboard/picks`, `/dashboard/picks/lab`, `/dashboard/picks/scorecard` | `NAV_LABEL_PICKS` |
| Make Picks | Picks cluster tertiary | `NAV_LABEL_MAKE_PICKS` |
| Picks Lab | `/dashboard/picks/lab` | `NAV_LABEL_PICKS_LAB` |
| Scorecard | `/dashboard/picks/scorecard` | `NAV_LABEL_SCORECARD` |
| Pools | `/dashboard/pools`, `/dashboard/pools/create`, `/dashboard/pools/join` | `NAV_LABEL_POOLS` |
| Pool Details (context) | `/dashboard/pool/:id` | `NAV_LABEL_POOL_DETAILS` |
| Pool details (desktop eyebrow) | Pool hub | `POOL_DETAILS_LAYOUT_EYEBROW` |
| Standings | `/dashboard/standings` | `NAV_LABEL_STANDINGS` |
| Stats | `/dashboard/stats`, `/dashboard/stats/personal`, `/dashboard/stats/global`, `/dashboard/stats/band` | `NAV_LABEL_STATS` |
| Personal | Stats cluster tertiary | `NAV_LABEL_PERSONAL_STATS` |
| Global | `/dashboard/stats/global` | `NAV_LABEL_GLOBAL_STATS` |
| Band | `/dashboard/stats/band` | `NAV_LABEL_BAND_STATS` |
| Profile | `/dashboard/profile` | `NAV_LABEL_PROFILE` |
| Messages | `/dashboard/profile/notifications` | `NAV_LABEL_MESSAGES` |
| Account | `/dashboard/profile/account` | `NAV_LABEL_ACCOUNT` |
| War Room | `/dashboard/admin` | `getDashboardPageMeta` (admin branch) |
| Admin (tab only) | `/dashboard/admin` | `NAV_LABEL_ADMIN` in `DashboardLayout.jsx` |

## Scoring rules (single primary surface)

- **Primary:** `ScoringRulesModal` via **`ScoringRulesModalProvider`** in the dashboard shell (`DashboardLayout`).
- **Entry:** “Scoring rules” actions call `useScoringRulesModal().openScoringRules`.
- **Deep link:** `/dashboard/scoring` **redirects** to `/dashboard?scoringRules=1`; query is consumed and stripped when the modal opens.
- **No** standalone scoring content page.

### Runtime contract: `useScoringRulesModal`

- **Only call** `useScoringRulesModal()` from components rendered **under** `ScoringRulesModalProvider` (today: route pages inside `DashboardLayout`).
- Calling it from the splash screen, Storybook stories, or tests **without** wrapping the provider will **throw** by design—wrap with `<ScoringRulesModalProvider>` in those environments, or open the modal via props on a test double.

## Continuous integration

GitHub Actions workflow **`.github/workflows/ci.yml`** runs:

1. `npm ci`
2. `npm run lint`
3. `npm run verify:dashboard-meta`

On **pull requests** (all branches) and on **push** to `main`, `master`, or `staging`. To cover other long-lived branches with push CI, add them under `on.push.branches` in that file.

**Locally:** same checks anytime with `npm run lint && npm run verify:dashboard-meta`.

## Route → meta map (engineering)

Implemented in `src/app/layout/model/dashboardPageMeta.js`. When you add a `/dashboard/*` route, follow the **Checklist: adding a cluster** above (meta + `isActive` + `verify-dashboard-meta` + vocabulary). Same steps apply when the new path is a tertiary child of an existing primary tab.

## IA diagram (high level)

```mermaid
flowchart TB
  subgraph tabs [Bottom / sidebar tabs]
    P[Picks]
    Po[Pools]
    S[Standings]
    St[Stats]
    Pr[Profile]
  end

  P --> PicksRoute["/dashboard · Make Picks"]
  P --> PicksAlias["/dashboard/picks · Make Picks"]
  P --> PicksLab["/dashboard/picks/lab · Picks Lab"]
  P --> PicksScore["/dashboard/picks/scorecard · Scorecard"]
  Po --> PoolsList["/dashboard/pools\nMy Pools"]
  Po --> PoolsCreate["/dashboard/pools/create\nCreate Pool"]
  Po --> PoolsJoin["/dashboard/pools/join\nJoin Pool"]
  Po --> PoolDetail["/dashboard/pool/:id\nPool details"]
  S --> StandingsRoute["/dashboard/standings"]
  St --> StatsPersonal["/dashboard/stats · Personal"]
  St --> StatsPersonalAlias["/dashboard/stats/personal · Personal"]
  St --> StatsGlobal["/dashboard/stats/global · Global"]
  St --> StatsBand["/dashboard/stats/band · Band"]
  St --> TourStatsRedirect["/dashboard/tour-stats → Global"]
  Pr --> ProfileRoute["/dashboard/profile"]
  Pr --> MessagesRoute["/dashboard/profile/notifications\nMessages"]
  Pr --> AccountRoute["/dashboard/profile/account\nAccount"]

  PicksAlias -.->|same tab active| PicksRoute
  PicksLab -.->|same tab active| PicksRoute
  PicksScore -.->|same tab active| PicksRoute
  PoolDetail -.->|breadcrumb| PoolsList
  MessagesRoute -.->|same tab active| ProfileRoute
  AccountRoute -.->|same tab active| ProfileRoute
  StatsPersonalAlias -.->|same tab active| StatsPersonal
  StatsGlobal -.->|same tab active| StatsPersonal
  StatsBand -.->|same tab active| StatsPersonal
  TourStatsRedirect -.->|same tab active| StatsPersonal

  subgraph modal [Global modal]
    SR[Scoring rules modal]
  end

  PicksRoute --> SR
  StandingsRoute --> SR
  DeepLink["/dashboard/scoring"] -->|redirect + query| SR
```

## Related code

- `getDashboardPageMeta`, `normalizeDashboardPathname` — `src/app/layout/model/dashboardPageMeta.js`
- `PROFILE_CLUSTER_PATHS`, `isProfileClusterPath`, `PICKS_CLUSTER_PATHS`, `isPicksClusterPath`, `POOLS_CLUSTER_PATHS`, `isPoolsClusterPath`, `STATS_CLUSTER_PATHS`, `isStatsClusterPath` — `src/shared/config/dashboardRoutes.js`
- Tertiary tray — `src/shared/ui/ChromeSegmentedControl.jsx`
- Profile cluster layout — `src/app/layout/ui/ProfileClusterLayout.jsx`
- Picks cluster layout — `src/app/layout/ui/PicksClusterLayout.jsx`
- Pools cluster layout — `src/app/layout/ui/PoolsClusterLayout.jsx`
- Stats cluster layout — `src/app/layout/ui/StatsClusterLayout.jsx`
- Nav items + active rules — `src/app/layout/DashboardLayout.jsx`
- Scoring modal provider — `src/features/scoring/ui/ScoringRulesModalProvider.jsx`

## Related documentation

User journeys and post-auth routing (new vs returning users, invite flows, remembered tab): [USER_ROUTING_AND_JOURNEYS.md](./USER_ROUTING_AND_JOURNEYS.md).
