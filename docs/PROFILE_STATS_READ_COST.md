# Profile season stats: read-cost observability (#220)

`useUserSeasonStats` live-computes every visit to `/user/:userId`. This doc
is the engineering + product reference for how many Firestore reads each
view costs today, how we measure it, and at what point we should promote
the `users.totalPoints / users.wins / users.shows` materialization
follow-up.

## What gets computed per view

Every run of `computeUserSeasonStats(uid, showDates)` (see
`src/features/profile/api/profileSeasonStats.js`) executes two passes:

1. **Per-user point-reads.** `|showDates|` calls to
   `getDoc(picks/{showDate}_{uid})` to discover the graded, non-empty picks
   the viewed user actually submitted. Chunked at 24 parallel reads.
2. **Global-max collection queries.** For each show the user played, one
   `picks where showDate == {date}` query (via `fetchGlobalShowWinners` in
   `features/scoring`) to compute the global-max winner rule. Chunked at 10
   parallel queries.

Read formula (upper bound):

```
reads_per_view = |showDates|         // point reads
               + |shows_played|      // collection queries (each returns ~N player docs)
```

`|shows_played|` is typically much smaller than `|showDates|` — the average
profile is light on per-show activity.

## Instrumentation

Every successful `useUserSeasonStats` run ships one GA4 event:

```
profile_season_stats_computed
  shows_checked       // |showDates|
  shows_played        // graded non-empty picks for the viewed uid
  collection_queries  // collection reads performed for the wins pass
  elapsed_ms          // rounded ms from compute start to compute end
  self_view           // true when the viewer is looking at their own profile
```

Source: `src/features/profile/model/profileStatsTelemetry.js`. The event is
best-effort: GA failures are swallowed (with a `console.warn`) so telemetry
never breaks the profile view. In dev, the same payload is mirrored to
`console.info` so the signal is visible without GA4 credentials.

GA4 is already wired via `react-ga4` (see `src/shared/lib/ga4.js`), so no
new SDK is required. Create a GA4 Explorer / saved view filtered on
`event_name = profile_season_stats_computed` to watch reads × views over
time.

## Trigger thresholds

When either of the following conditions holds **sustained over at least 7
days**, file a materialize follow-up:

- **≥ 50 profile views / day** of `profile_season_stats_computed`, or
- **p95 `elapsed_ms` > 1500 ms**.

Thresholds are centralized in `PROFILE_STATS_TELEMETRY_THRESHOLDS` (same
module) so product + engineering share a single source of truth.

## Materialization follow-up (out of scope for #220)

When the thresholds trip, the natural next step is to materialize
`users.totalPoints / users.wins / users.shows` inside `rollupScoresForShow`
(`functions/index.js`). That function already has every pick for the show
loaded while it's running, so computing the global-max once per rollup and
incrementing `users.wins` for tied winners is a cheap incremental change.

Until then, the live-compute path stays the single source of truth so
Profile `Wins` can't drift from the Standings (#218) and Tour standings
(#219) surfaces — all three share
`src/shared/utils/showAggregation.js::reduceShowWinners`.
