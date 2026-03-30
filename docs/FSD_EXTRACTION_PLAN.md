# FSD Extraction Plan (Pragmatic Audit)

## Scope
This report audits the current codebase against pragmatic Feature-Sliced Design (FSD) expectations:
- `src/pages/*` should be mostly routing + orchestration (URL params, conditional rendering, wiring feature slices).
- Firestore/Firebase data access should live in `features/<domain>/api/*` (or shared API helpers).
- Domain logic and stateful orchestration should live in `features/<domain>/model/*` as hooks/selectors.
- Presentational UI should live in `features/<domain>/ui/*` (or `src/shared/ui/*` for truly generic components).

## Files audited
### Pages under `src/pages/` (monolithic)
- `src/pages/pools/PoolsPage.jsx`
- `src/pages/pools/PoolHubPage.jsx`
- `src/pages/standings/StandingsPage.jsx`
- `src/pages/profile/ProfilePage.jsx`
- `src/pages/profile/PublicProfilePage.jsx`
- `src/pages/auth/ProfileSetupPage.jsx`
- `src/pages/landing/SplashPage.jsx`

### Pages under `src/pages/` (thin wrappers / mostly static)
- `src/pages/admin/AdminPage.jsx`
- `src/pages/picks/PicksPage.jsx`
- `src/pages/scoring/ScoringRulesPage.jsx`
- `src/pages/auth/PasswordResetCompletePage.jsx`

### Named feature components
- `src/features/admin/AdminForm.jsx`
- `src/features/picks/PicksForm.jsx`
- `src/features/scoring/Leaderboard.jsx`
- `src/features/profile/AccountSecurity.jsx`
- `src/features/auth/components/SplashAuthEntryCard.jsx`
- `src/features/auth/components/SplashSignInModal.jsx`
- `src/features/auth/components/SplashSignUpModal.jsx`

---

## Per-file extraction sections (template)
For each audited monolithic file, the report includes:
- **Current Violations**: what currently violates pragmatic FSD expectations.
- **UI Extractions**: new `features/<domain>/ui/*` component paths.
- **Logic Extractions**: new `features/<domain>/model/*` hook paths and `features/<domain>/api/*` data paths.
- **Target File State**: what the original file should look like after extraction (thin glue only).

---

## `src/pages/pools/PoolsPage.jsx`
### Current Violations
- Direct Firestore reads/writes inside the page component (`collection/query/where/getDocs`, `addDoc`, `updateDoc`, `getDoc`, `arrayUnion`).
- Mixing async domain orchestration with UI rendering (roster fetching, pool membership changes, invite code generation).
- Large local state surface (`userPools`, `rosterByPool`, `activeTab`, join/create inputs, `message`) co-located with Tailwind UI.
- Business rules live in the view:
  - roster sorting by `handle`
  - membership checks before join
  - invite code generation details

### UI Extractions
- `src/features/pools/ui/UserPoolsSection.jsx` (renders “my pools” list + member-count + roster `<details>` shell)
- `src/features/pools/ui/PoolRosterDetails.jsx` (renders roster status and member links)
- `src/features/pools/ui/PoolJoinCreateCard.jsx` (renders join/create tabs + join/create forms)

### Logic Extractions
- `src/features/pools/api/poolsApi.js`
  - `fetchPoolsByMemberUid(userUid)`
  - `createPool({ name, ownerId, members })`
  - `joinPoolByInviteCode({ inviteCode, userUid })`
- `src/features/pools/model/useUserPools.js`
  - owns `userPools` loading + refresh (driven by `user.uid`)
- `src/features/pools/model/usePoolRoster.js`
  - owns “rosterByPool” state and the “fetch once per pool” behavior
  - includes roster sorting by `handle`
- (Optional) `src/features/pools/model/inviteCode.js`
  - `generateInviteCode()` for deterministic/shared usage

### Target File State
- Remove all Firebase imports from the page.
- Keep only page-level concerns:
  - `user` presence/uid gating
  - wiring hook state/handlers into UI components
  - no direct Firestore calls

---

## `src/pages/pools/PoolHubPage.jsx`
### Current Violations
- Page contains Firestore reads and access logic:
  - `getDoc(doc(db, 'pools', poolId))`
  - member profile fetching via Firestore users queries and `getDoc`
- Domain/view mixing:
  - “forbidden” vs “notFound” access policy is computed in the UI component
  - leaderboard-like sorting logic lives in data fetch helper (`fetchPoolMemberProfiles`)
- Clipboard side-effect (`navigator.clipboard.writeText`) exists alongside data loading.
- Past show computation (`pastShows`) is view + domain formatting logic together.

### UI Extractions
- `src/features/pools/ui/PoolHubHeader.jsx` (pool title + member count + invite code + copy button)
- `src/features/pools/ui/PoolHubLeaderboard.jsx` (renders member leaderboard list)
- `src/features/pools/ui/PoolHubShowArchive.jsx` (renders show archive links)

### Logic Extractions
- `src/features/pools/api/poolHubApi.js`
  - `fetchPoolById(poolId)`
  - `fetchPoolMemberProfiles({ poolId, memberUids })` (current helper logic)
  - `getPoolMemberCount(pool)` (small derived selector, optional)
- `src/features/pools/model/usePoolHub.js`
  - orchestrates loading pool + members
  - returns `{ loading, notFound, forbidden, pool, members }`
- `src/features/pools/model/formatShowLabel.js`
  - `todayYmd()` + `formatShowLabel()` extracted from view helpers (or moved to `src/shared/utils`)

### Target File State
- Remove all Firebase imports and move `fetchPoolMemberProfiles`/`todayYmd`/`formatShowLabel` out.
- Keep only:
  - `poolId` retrieval from `useParams()`
  - wiring of `usePoolHub()` result to `PoolHub*` UI components
  - clipboard handling (or move to a reusable hook in `src/shared/model/useClipboard.js` if desired)

---

## `src/pages/standings/StandingsPage.jsx`
### Current Violations
- Firestore data access inside the page:
  - pools membership query (`collection('pools')/where('members','array-contains', uid)`)
  - picks query (`collection('picks')/where('showDate','==', selectedDate)`)
  - official setlist read (`doc(db,'official_setlists', selectedDate)` + `getDoc`)
- URL/search param state is coupled with data loading and view rendering.
- Domain computation and filtering are mixed with UI:
  - in-memory filtering (`displayedPicks`) based on selected pool membership
  - show-status gating (`FUTURE`) mixed into component control flow
- UI for filter tabs, banners, empty states, and the actual leaderboard all live in one file.

### UI Extractions
- `src/features/scoring/ui/StandingsFilterTabs.jsx` (global + pool tabs, URL-aware)
- `src/features/scoring/ui/StandingsBannerWaitingSetlist.jsx` (amber banner when setlist missing)
- `src/features/scoring/ui/StandingsEmptyState.jsx` (no-picks UI, dependent on showStatus + activeFilter)

### Logic Extractions
- `src/features/scoring/api/picksApi.js`
  - `fetchPicksByShowDate(selectedDate)`
- `src/features/scoring/api/officialSetlistsApi.js`
  - `fetchOfficialSetlistByDate(selectedDate)`
- `src/features/scoring/model/useStandings.js`
  - returns `{ loading, showStatus, allPicks, actualSetlist, userPools }`
  - encapsulates the “fetch picks + setlist only when allowed” behavior
- (Reuse existing domain) `src/features/pools/api/poolsApi.js`
  - `fetchPoolsByMemberUid(userUid)` for the “userPools” list used for pool filter tabs
- `src/features/scoring/model/useDisplayedPicks.js`
  - computes filtered `displayedPicks` from `{ allPicks, userPools, activeFilter }`

### Target File State
- Page owns only URL/search param integration and selected date prop wiring.
- Remove Firestore imports from the page.
- The page should render:
  - `StandingsFilterTabs` (wired to URL)
  - `StandingsBannerWaitingSetlist`
  - existing `features/scoring/Leaderboard` as a leaf component
  - `StandingsEmptyState`

---

## `src/pages/profile/ProfilePage.jsx`
### Current Violations
- Page directly mutates Firestore across multiple collections:
  - reads user doc (`getDoc`)
  - reads all picks for the user (`query(collection('picks'), where('userId','==', uid))`)
  - updates user doc and fan-out updates to pick docs via `writeBatch` + commit chunking
- Domain rule in view:
  - “propagate handle changes into every pick document”
  - `favoriteSong` fallback and `updatedAt` formatting
- Sign-out and navigation logic are mixed with the profile editing data logic.
- Large UI form co-located with persistence logic.

### UI Extractions
- `src/features/profile/ui/ProfileEditForm.jsx` (handle + favorite song inputs + save button + message)
- `src/features/profile/ui/EmailPasswordUpgradeNotice.jsx` (the “change email/password” block for email+password providers)
- `src/features/profile/ui/ProfileLogoutButton.jsx` (or keep logout wiring in page if minimal)

### Logic Extractions
- `src/features/profile/api/profileApi.js`
  - `fetchUserProfileByUid(uid)`
  - `updateUserHandleAndPropagateToPicks({ uid, newHandle, newFavoriteSong })` (includes batch chunking)
- `src/features/profile/model/useUserProfile.js`
  - loads `{ joinDate, handle, favoriteSong }`
- `src/features/profile/model/useProfileUpdate.js`
  - returns `handleSave` + `isSaving` + `message` state

### Target File State
- Page becomes:
  - state wiring from `useUserProfile()` and `useProfileUpdate()`
  - uses `signOut(auth)` only as route/auth glue (or moves to shared auth helpers if desired)
  - no Firestore imports or batch logic in the component

---

## `src/pages/profile/PublicProfilePage.jsx`
### Current Violations
- Firestore access is embedded in the view:
  - `getDoc(doc(db,'users', userId))`
  - `getDocs(query(collection('pools'), where('members','array-contains', userId)))`
- View-driven state machine:
  - `loading`, `error` and mapping to multiple UI states in one file
- Derived logic mixed with rendering:
  - favoriteSong normalization
  - `formatPlayingSince()` helper for createdAt

### UI Extractions
- `src/features/profile/ui/PublicProfileView.jsx` (main layout: header + favorite song + stats)
- `src/features/profile/ui/PublicProfilePools.jsx` (active pools chip list)
- `src/features/profile/ui/PublicProfileStates.jsx` (loading + not-found + fetch-error variants, optional)

### Logic Extractions
- `src/features/profile/api/publicProfileApi.js`
  - `fetchPublicUserProfile(userId)`
  - `fetchPoolsForUserMembership(userId)`
- `src/features/profile/model/usePublicProfile.js`
  - orchestrates loading + normalizes raw Firestore docs into view-friendly props
- `src/features/profile/model/formatPlayingSince.js`
  - extract `formatPlayingSince(createdAt)` helper (or move to `src/shared/utils`)

### Target File State
- Remove all Firestore imports.
- Keep only:
  - param extraction (`useParams()`)
  - glue between `usePublicProfile()` result and the `PublicProfile*` UI components

---

## `src/pages/auth/ProfileSetupPage.jsx`
### Current Violations
- Page handles persistence directly (`setDoc(doc(db,'users', uid), ...)`).
- Navigation side-effect (`window.location.href = '/dashboard'`) is mixed with form UI.
- Limited but still present: domain rule “initialize totalPoints = 0; createdAt = now”.

### UI Extractions
- `src/features/profile/ui/ProfileSetupForm.jsx` (handle + optional favorite song + save button + inline error)

### Logic Extractions
- `src/features/profile/api/profileSetupApi.js`
  - `createUserProfile({ uid, email, handle, favoriteSong })`
- `src/features/profile/model/useProfileSetup.js`
  - returns `{ isSaving, error, handleSave }`

### Target File State
- Remove Firebase imports from the page.
- Keep only route glue:
  - call `useProfileSetup()` on submit
  - redirect via `useNavigate()` (or keep existing behavior if consistent with app)

---

## `src/pages/landing/SplashPage.jsx`
### Current Violations
- The page contains view-orchestration logic (scroll/focus behavior, modal composition) alongside routing-level composition.
- The page is the “composition root” for multiple landing sections and auth modals; it becomes the place where several concerns meet:
  - scroll-to-section focus logic
  - auth modal wiring via `useSplashAuth`

### UI Extractions
- `src/features/landing/ui/SplashPageShell.jsx` (renders header + sections inside layout)
- `src/features/landing/ui/SplashAuthModals.jsx` (renders `SplashSignUpModal` + `SplashSignInModal` with props)

### Logic Extractions
- `src/features/landing/model/useScrollToSectionFocus.js`
  - extract the current `useScrollToSectionFocus()` hook logic out of the page

### Target File State
- Keep `SplashPage.jsx` as a thin composition layer:
  - call `useSplashAuth()`
  - call `useScrollToSectionFocus()` from `landing/model`
  - pass refs and handlers into `SplashPageShell` and `SplashAuthModals`

---

## `src/pages/admin/AdminPage.jsx` (thin wrapper)
### Current Violations
- None significant: delegates to `src/features/admin/AdminForm`.

### UI Extractions
- None required.

### Logic Extractions
- None required.

### Target File State
- Keep as-is: a small wrapper that passes `{ user, selectedDate }` to the feature component.

---

## `src/pages/picks/PicksPage.jsx` (thin wrapper)
### Current Violations
- None significant: delegates to `src/features/picks/PicksForm`.

### UI Extractions
- None required.

### Logic Extractions
- None required.

### Target File State
- Keep as-is: a small wrapper that passes `{ user, selectedDate }`.

---

## `src/pages/scoring/ScoringRulesPage.jsx` (mostly static)
### Current Violations
- None: static content and constants import only.

### UI Extractions
- (Optional) `src/features/scoring/ui/ScoringRulesContent.jsx` (move JSX content)

### Logic Extractions
- None required.

### Target File State
- Either keep as-is or re-export `ScoringRulesContent` from the page for consistency.

---

## `src/pages/auth/PasswordResetCompletePage.jsx` (static)
### Current Violations
- None: purely presentational.

### UI Extractions
- (Optional) `src/features/auth/ui/PasswordResetCompleteView.jsx`

### Logic Extractions
- None required.

### Target File State
- Keep as-is or re-export the new UI component.

---

## `src/features/admin/AdminForm.jsx`
### Current Violations
- One file mixes:
  - admin authorization logic (`user?.email === 'pat@road2media.com'`)
  - Firestore reads/writes for `official_setlists`
  - complex rollup scoring (queries `picks`, batches updates to `picks.score` and `users.totalPoints/showsPlayed`)
  - full form rendering with all slot fields and official setlist builder UI
- Domain rules inside the UI file:
  - which setlist fields apply to admin (`FORM_FIELDS.filter(field.id !== 'wild')`)
  - payload normalization/cleaning of setlist inputs
  - “rollup when finalized”

### UI Extractions
- `src/features/admin/ui/AdminSetlistSlotInputs.jsx`
  - renders each “Official <slot>” input using `SongAutocomplete`
- `src/features/admin/ui/AdminOfficialSetlistBuilder.jsx`
  - renders the ordered official setlist builder + removable list
- `src/features/admin/ui/AdminFinalizeAndSave.jsx`
  - finalized checkbox + primary save/lock button + success/error banner
- `src/features/admin/ui/AdminUnauthorizedNotice.jsx`
  - “UNAUTHORIZED ACCESS” state UI

### Logic Extractions
- `src/features/admin/api/officialSetlistsApi.js`
  - `fetchOfficialSetlistForDate(selectedDate)`
  - `lockOfficialSetlist({ selectedDate, setlistData, officialSetlist, updatedByEmail })` (current `setDoc` schema)
- `src/features/admin/api/adminRollupApi.js`
  - `rollupScoresForDate({ selectedDate, officialSetlistPayload })`
  - owns the Firestore batch chunking + updates to `picks` and `users`
- `src/features/admin/model/useAdminSetlistForm.js`
  - returns `{ setlistData, officialSetlist, isFinalized, isSaving, message, onSave, isAdmin }`
  - encapsulates admin field derivation and “load existing official setlist” effect
- (Optional) `src/features/admin/model/adminAccess.js`
  - centralize `isAdmin` rule

### Target File State
- `AdminForm.jsx` becomes a glue component:
  - calls `useAdminSetlistForm({ user, selectedDate })`
  - renders `AdminSetlistSlotInputs`, `AdminOfficialSetlistBuilder`, and `AdminFinalizeAndSave`
- No Firestore imports in the UI layer.

---

## `src/features/picks/PicksForm.jsx`
### Current Violations
- One component mixes:
  - Firestore read of existing pick doc (`getDoc` by `${selectedDate}_${user.uid}`)
  - Firestore write of pick doc (`setDoc`)
  - additional Firestore reads for handle/pools (`getDoc(users/<uid>)`, query pools by membership)
  - form state + “showStatus gating”
  - full rendering loop for all `FORM_FIELDS`
- Domain rules live in the view:
  - deriving `customHandle` fallback rules
  - embedding `pools` snapshot into pick document
  - building `pickId` schema

### UI Extractions
- `src/features/picks/ui/PicksFieldsForm.jsx`
  - renders the `FORM_FIELDS` loop with `SongAutocomplete`
- `src/features/picks/ui/PicksLockButton.jsx`
  - save button with loading/disabled logic
- `src/features/picks/ui/PicksSaveMessage.jsx`
  - renders `saveMessage` banner styling

### Logic Extractions
- `src/features/picks/api/picksApi.js`
  - `fetchPickDoc({ userUid, selectedDate })`
  - `savePickDoc({ user, selectedDate, picks, customHandle, poolsSnapshot })`
- `src/features/picks/model/usePicksForm.js`
  - owns `{ picks, isSaving, saveMessage }`
  - encapsulates loading existing picks and saving
- (Reuse shared domain)
  - `src/features/pools/api/poolsApi.js` for `fetchPoolsByMemberUid(userUid)`
  - `src/features/profile/api/profileApi.js` for fetching `handle` if needed (or keep inside picks api as helper)

### Target File State
- `PicksForm.jsx` becomes a glue wrapper:
  - uses `usePicksForm({ user, selectedDate })`
  - derives `showStatus` in model (or keeps it as a small shared logic call)
  - renders UI-only components for the form
- No Firestore imports in the view layer.

---

## `src/features/scoring/Leaderboard.jsx`
### Current Violations
- While it’s largely presentational, it still mixes:
  - scoring breakdown decisioning (exact hit / in-set hit / bustout boost styling)
  - payload normalization for legacy docs (`getPickPayload` logic)
  - sorting computation (`sortedPicks`) and then rendering
- The file is a single large component, which makes it harder to test/maintain the view logic separately from scoring computations.

### UI Extractions
- `src/features/scoring/ui/LeaderboardList.jsx`
  - renders the list container + expanded-row state coordination (or receives expandedUser from parent)
- `src/features/scoring/ui/LeaderboardRow.jsx`
  - renders each player row + expand/collapse header
- `src/features/scoring/ui/ScoreBreakdownGrid.jsx`
  - renders the per-slot breakdown grid for expanded state

### Logic Extractions
- `src/features/scoring/model/leaderboardModel.js`
  - `getPickPayload(pickEntry)` (including legacy compatibility)
  - `sortPicksByScore(poolPicks, actualSetlist)`
  - helpers for `isExactHit`, `isInSetHit`, and points-to-label/styling mapping

### Target File State
- `Leaderboard.jsx` becomes a thin wrapper:
  - calls `leaderboardModel` helpers
  - delegates rendering to `Leaderboard*` UI components

---

## `src/features/profile/AccountSecurity.jsx`
### Current Violations
- Feature boundary mismatch:
  - The UI component lives in `features/profile/` but depends on `useAccountSecurity` from `features/auth/`.
  - Practically, account-security domain logic is “authentication adjacent”, but for FSD it still needs a consistent ownership boundary.
- `AccountSecurity.jsx` is mostly UI; the heavy logic is already in the hook, but the ownership is cross-feature.

### UI Extractions
- `src/features/profile/ui/AccountSecurityCard.jsx`
  - the wrapper card + unsupported notice UI
- `src/features/profile/ui/AccountSecurityForm.jsx`
  - the actual form layout (fields, submit button, messages)

### Logic Extractions
- `src/features/profile/model/useAccountSecurity.js`
  - move/duplicate the hook currently in `src/features/auth/useAccountSecurity.js`
- `src/features/profile/api/accountSecurityApi.js`
  - move the underlying actions currently in `src/features/auth/accountSecurityActions.js`
  - keep Firebase Auth + Firestore update responsibilities in the API layer

### Target File State
- `src/features/profile/AccountSecurity.jsx` becomes a glue component:
  - imports `useAccountSecurity` from `profile/model`
  - imports `AccountSecurityCard` / `AccountSecurityForm` from `profile/ui`
- No auth/Firebase action imports in the UI components.

---

## `src/features/auth/components/SplashAuthEntryCard.jsx`
### Current Violations
- Not logic-heavy, but violates UI folder convention:
  - file lives under `features/auth/components` rather than `features/auth/ui`.

### UI Extractions
- Move to: `src/features/auth/ui/SplashAuthEntryCard.jsx`

### Logic Extractions
- None (pure UI).

### Target File State
- Keep the component as a presentational leaf, used by the splash/landing composition.

---

## `src/features/auth/components/SplashSignInModal.jsx`
### Current Violations
- UI-only component but located under `features/auth/components` rather than `features/auth/ui`.
- Some modal layout duplication exists across SignIn/SignUp (shared modal shell would reduce repetition).

### UI Extractions
- Move to: `src/features/auth/ui/SplashSignInModal.jsx`
- Shared shell (optional): `src/features/auth/ui/SplashAuthModalShell.jsx`

### Logic Extractions
- None (handlers provided via props from `useSplashAuth`).

### Target File State
- Keep as a pure UI component.
- Reduce duplicated modal wrapper JSX by using `SplashAuthModalShell` (optional).

---

## `src/features/auth/components/SplashSignUpModal.jsx`
### Current Violations
- UI-only component but located under `features/auth/components` rather than `features/auth/ui`.
- Some layout duplication exists across SignIn/SignUp.

### UI Extractions
- Move to: `src/features/auth/ui/SplashSignUpModal.jsx`
- Shared shell (optional): `src/features/auth/ui/SplashAuthModalShell.jsx`

### Logic Extractions
- None (handlers provided via props from `useSplashAuth`).

### Target File State
- Keep as a presentational leaf used by `SplashAuthModals`.

---

## Cross-cutting extraction patterns (no code changes proposed)
### 1. Standard async state handling
- Introduce a shared pattern (or components) for:
  - loading spinners
  - “not found / forbidden / empty” states
  - error banners
- Candidates for shared UI locations:
  - `src/shared/ui/AsyncStatus.jsx`
  - `src/shared/ui/StatusBanner.jsx`

### 2. Centralize Firestore access in `api/*`
- All direct Firestore calls currently scattered across pages/features should move into:
  - `src/features/<domain>/api/*`
  - or `src/shared/api/*` for shared helpers
- The key win is eliminating Firebase imports from `src/pages/*` and UI components.

### 3. Move view-local helpers into `model/*` or `shared/utils`
- Examples from audited code:
  - date formatting helpers (`todayYmd`, `formatShowLabel`)
  - invite code generation (`generateInviteCode`)
  - legacy payload normalization (`getPickPayload` in `Leaderboard`)

### 4. Encapsulate URL/search param behavior in page-level glue
- Keep `useSearchParams` / `useParams` in pages.
- Move everything else (fetching, filtering, setlist/picks logic) into `model/*`.

### 5. Reuse existing shared utilities
- Prefer existing shared logic:
  - `src/shared/utils/timeLogic.js` (`getShowStatus`)
  - `src/shared/utils/scoring.js` (scoring calculations and rules)
- Where needed, create domain wrappers around shared utils inside `model/*` for testable orchestration.

---

## Final notes
- The biggest pragmatic FSD wins are removing Firestore imports from `src/pages/*` components (`PoolsPage`, `PoolHubPage`, `StandingsPage`, `ProfilePage`, `PublicProfilePage`, `ProfileSetupPage`).
- Next biggest win is splitting the large feature components (`AdminForm`, `PicksForm`) into `ui/*` + `model/*` + `api/*` boundaries so that Firebase mutations and scoring side-effects become testable and reusable.

