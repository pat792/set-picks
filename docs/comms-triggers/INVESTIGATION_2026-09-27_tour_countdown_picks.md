# Investigation: T-5 tour reminder sent to pickers, duplicate handle, blank picks card

**Status:** draft investigation (no product code in this change)
**Date:** 2026-09-27
**Trigger:** `tour_countdown` T-5 (Fall Tour first show `2026-10-02`, Boardwalk Hall)
**Reporter handles:** `CaesarTweezer1` (picks already in) and `CaesarTweezer` (thought deleted), same inbox

Production Firestore / Auth were not read. Firebase CLI on this run was not signed in, so the duplicate-account conclusion is from the send path plus the two greetings. Confirm with the queries at the end before deleting anything.

---

## What fired

Daily cron `scheduledTourCountdownComms` runs at 09:00 `America/Los_Angeles` (`functions/index.js`). On 2026-09-27 that is exactly five days before the Fall Tour opener in `src/shared/data/showDates.js` (`2026-10-02`). `findTourCountdownTargets` in `functions/commsEventAdapters.js` includes a tour when `daysRemaining` is 10, 5, 3, or 1.

The shipped email (not the catalog’s optional T-5 blurb) is `tour-countdown` in `functions/commsTemplates.js`:

- Subject: `{tour_name} starts in 5 days`
- Body: `{handle}, the run kicks off in 5 days.` / first show line / `Get your picks ready before the first downbeat.`
- Button: `Make Your Picks` → `https://www.setlistpickem.com/dashboard/picks` (no `showDate`)

Push uses the same “get your picks ready” line. `picks_secured` is computed and stored on the payload, and the email builder never reads it.

---

## Suppression that exists, and what it does not do

`email_suppression/{sha256(email)}` is a compliance list only: permanent bounce, complaint, Resend suppression, one-click unsubscribe, mailto unsubscribe, and the in-app “unsubscribe” action (`functions/commsEmailSuppression.js`, `functions/commsEmailWorker.js`). A hit blocks **every** comms email to that address. It is the wrong switch for “this person already picked.”

Other gates on this send:

| Gate | Scope | Effect on a picker |
|---|---|---|
| `notificationPrefs.lifecycle` | per user doc, default allow | Opt-out skips email, push, and in-app for all lifecycle mail, not just this reminder |
| Dedup `tour_countdown:{tourId}:{uid}:{days_remaining}` | per uid | Does not collapse two uids that share an inbox |
| Daily email cap | per uid | Both accounts can send the same morning |
| Fatigue cap (2) | per uid per run | Does not apply across uids |
| `picks_secured` | payload flag | In-app **button label** only (`View / Edit picks` for T-5/T-3/T-1). Body, push, and email stay “make your picks” |

Catalog audience is `users_active_60d` (`docs/comms-triggers/catalog.json`, `TRIGGER_CATALOG.md` §2). The job does not filter on last login. It loads `users` where `handle > ""`, limit 500, and skips only docs with an empty handle (`runScheduledTourCountdown`).

`picks_lock_reminder` is the trigger that already excludes people with picks (`audience: users_no_picks_tonight` in `functions/picksLockReminder.js`). `tour_countdown` was not built that way. Issue #509 only changed the in-app CTA when `picks_secured` is true. That matches the code: the flag is loaded in `loadUserIdsWithPicksForShowDates` and ignored by `BUILDERS['tour-countdown']`.

---

## Why both handles can hit one inbox

The greeting is `users/{uid}.handle` at send time. Two different greetings in one morning means two user documents were in the recipient list. A profile rename cannot do that: `updateUserProfileWithPickHandles` updates a single uid (and that uid’s pick docs). There is no second send with the previous handle.

`users.email` is the Auth email copied at profile setup (`createInitialUserProfile`). It is not unique. Unsubscribe already assumes one address can match many docs (`findUserDocsByEmail`, limit 20) and opts all of them out. The countdown sender does not dedupe by email, so two live profiles with the same `email` produce two messages.

Self-serve deletion (`functions/accountDelete.js`, `deleteAccountWithAudit`) removes pool membership, that uid’s picks, `private_fcmTokens`, `commsInbox`, the user doc, then the Auth user, and writes `account_deletion_reports` (includes `handle` and `email`). It refuses entirely if the uid still owns a pool. It does not consult Auth at send time. A leftover `users/{uid}` with a handle and email keeps receiving countdown mail even if the Auth user is already gone.

So `CaesarTweezer` was still a handled user doc at 09:00 PT. Either deletion never completed, or a second profile was created and the first was left in place. Confirm before treating it as deleted:

1. `users` where `handle == CaesarTweezer` and `handle == CaesarTweezer1` (uids, `email`, `notificationPrefs.lifecycle`, `createdAt`).
2. Auth `getUser` for each uid (missing Auth + present Firestore = orphan that the cron still mails).
3. `account_deletion_reports` where `handle == CaesarTweezer`.
4. `picks` for show date `2026-10-02` and each uid (`picks_secured` is true only when that show’s picks object is non-empty).

If the older doc should be gone, finish deletion through `deleteAccountWithAudit` (or the same cleanup) rather than adding the address to `email_suppression`. Suppression would also silence `CaesarTweezer1`.

Related audience bugs, separate from picks:

- The 60-day activity rule is documented and not implemented, so dormant handled profiles are mailed.
- `.limit(500)` ordered by handle silently drops everyone after the first 500 handles.

---

## Options for people who already have picks

`picks_secured` is already on the payload for the tour’s first show. `lock_time_local` on that payload is the hardcoded string `"7:30 PM"` inside `findTourCountdownTargets`, not the per-show lock. Do not put that field in new copy until it is the real cutoff. The catalog also says countdown copy should not state an absolute lock clock; the show-day reminder owns that. “Showtime on {first_show_date}” is the show date, which is safe.

### A. Suppress the reminder when `picks_secured`

Skip email and push (and optionally in-app) for T-5/T-3/T-1 when the uid has non-empty picks for `first_show_date`. Same idea as `picks_lock_reminder`.

- Stops the false “you haven’t picked” mail.
- Drops a real “the run starts in five days” note for people who already played.
- Does nothing for the other handle if that uid has no picks. `CaesarTweezer` would still get the make-picks version.

### B. Keep the send, change the copy when `picks_secured` (best fit)

When the flag is true, email, push, and in-app body become a confirmation, for example: you’ve made picks for the first show, and you can change them any time up to showtime on `{first_show_date}`. Button: `View / Edit picks` (already the in-app CTA). When the flag is false, keep today’s make-picks copy.

- Uses data the job already loads.
- Matches the on-screen line already shown after picks load: “Your picks are secured. You can edit them until showtime.”
- Still sends two emails if two profiles share the inbox. The ghost profile keeps the make-picks variant until that doc is removed or itself has picks.

### C. Email-only branch or email-only suppress

In-app is cheap and already switches the button. The inbox is what felt wrong. Branch or drop email (and push) for secured pickers; leave in-app as the edit reminder.

### Do not

- Do not write `email_suppression` because picks exist. That blocks the whole address, including the account that should keep mail.
- Do not rely on `lifecycle: false` as the picks rule. That opts the person out of welcome and other lifecycle mail too.

**Recommendation:** B for `tour_countdown` T-5/T-3/T-1, plus a one-time check (and deletion if intended) of the `CaesarTweezer` user doc. Optionally also dedupe countdown email by normalized address so two uids cannot double-send, and implement or correct the catalog’s 60-day audience and the 500-doc cap. Leave `picks_lock_reminder` as a hard exclude: that one is “you have not picked,” and a secured picker should not get it.

T-10 can stay the exploratory “picks open soon” note for everyone. Secured picks that early are rare, and the copy does not claim the card is empty.

---

## Blank card, then saved picks

The email button opens `/dashboard/picks` with no show date. The dashboard selects the next show on its own. On 2026-09-27 that is `2026-10-02`, including on the first paint: `ShowCalendarProvider` exposes the bundled fallback calendar while the Firestore snapshot is still in flight, and that fallback includes the Fall opener.

`/login` does not render the picks card. `/login` is `login.html`; `/dashboard/picks` is the app document. An unsigned visitor on the dashboard is hard-redirected to `/login` after the path is saved, and a restored session on the login document is hard-navigated back with `getDashboardEntryHref`. That hop can sit in front of the picks page. It does not fill or clear the card.

The empty-then-filled card is `usePicksForm` (`src/features/picks/model/usePicksForm.js`) plus `PicksPage`:

1. `formData` starts as `{}` and `isLoadingPicks` starts as `false`.
2. The Make Picks card renders immediately. Each slot is an empty “Search and choose a song…” field. The green “Your picks are secured…” banner stays hidden, because `hasExistingPicks` requires a finished load and non-empty fields.
3. The fetch starts in an effect (`fetchPickDoc` → `picks/{showDate}_{uid}`), after that first paint. While it runs, inputs are only `disabled`. They still look empty. There is no skeleton of the saved songs. The Scorecard route has a “Loading scorecard…” state; Make Picks does not.
4. When the doc returns, the fields fill and the secured banner appears.

Song catalog load does not cause this. The input `value` is `formData`, not the catalog. A slow Firestore read (cold document, App Check) makes the empty card visible, which matches “at first empty, then the saved picks.”

Login makes that easier to notice, without being the card itself:

- Dashboard auth stays in `DashboardBootSkeleton` until the user and handle exist (`decideDashboardRoute`). The empty card starts only after that.
- If the session hint is missing, `/login` paints the sign-in form before Firebase boots (`AuthContext` comment on #835: `loading: false` and `user: null`). `warmLoginAuthSurface` then starts auth. A persisted IndexedDB session can resolve, replace the form with the continue overlay, and hard-nav to the saved `/dashboard/picks` URL. The picks card then does step 1–4 again.
- If the hint is present, the click never shows `/login`, and the empty card is only the picks form.

**Resolution:** treat “waiting for this show’s pick doc” as loading on first paint (skeleton or reserved slots), and do not render the empty editable card or withhold the secured banner until `isLoadingPicks` is false. Keep the login deferral for anonymous visitors; once `warmLoginAuthSurface` finds a user, the continue overlay already covers the form (`LoginPage` sets it when `user` is set). The gap is the picks card after arrival, not a picks card inside `/login`.
