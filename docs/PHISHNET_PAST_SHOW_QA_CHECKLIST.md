# Phish.net Past-Show QA Checklist

Use this checklist for issue `#159` validation before go-live.

## Preconditions

- [ ] `npm run diagnose:phishnet`
- [ ] `npm run secrets:sync-phishnet`
- [ ] `npm run deploy:functions:phishnet`
- [ ] Build/runtime env:
  - [ ] `VITE_SETLIST_API_SOURCE=phishnet`
  - [ ] `VITE_USE_CALLABLE_PHISHNET_SETLIST=true`
- [ ] Signed in as designated admin account

## Test Dates

Record 2-3 known past shows:

- [ ] Date A: `YYYY-MM-DD`
- [ ] Date B: `YYYY-MM-DD`
- [ ] Date C: `YYYY-MM-DD` (optional)

## Historical Picks UI Lock Workaround

If picks are locked in UI for historical dates (expected by design), seed test picks directly in Firestore:

- [ ] Choose a source date that already has picks (for one or more users)
- [ ] Dry-run clone:
  - `cd functions`
  - `npm run qa:clone-picks-for-show -- --from=YYYY-MM-DD --to=YYYY-MM-DD`
- [ ] Apply clone:
  - `npm run qa:clone-picks-for-show -- --from=YYYY-MM-DD --to=YYYY-MM-DD --apply`
- [ ] Optional user filter:
  - `npm run qa:clone-picks-for-show -- --from=YYYY-MM-DD --to=YYYY-MM-DD --userIds=uid1,uid2 --apply`

## A) Fetch + Parse

- [ ] Fetch succeeds for each date with no blocking config/callable errors
- [ ] Parsed slots (`s1o`, `s1c`, `s2o`, `s2c`, `enc`) are reasonable
- [ ] Ordered songs match source data for at least one date

## B) Save + Triggered Re-score

- [ ] Save writes `official_setlists/{showDate}` with expected `setlist` and `officialSetlist`
- [ ] All `picks` docs for the same `showDate` receive refreshed `score`
- [ ] Multiple users on same date are updated in one save cycle
- [ ] Edit and re-save causes score recompute again

## C) Finalize + Rollup

- [ ] Finalize still sets graded state fields correctly
- [ ] Re-finalize does not duplicate rollup effects

## D) Access + Environment Smoke

- [ ] Non-admin cannot fetch via Phish.net callable path
- [ ] Staging smoke completed with same env flags
- [ ] Production smoke completed (if applicable)

## Failure-Mode Notes

- [ ] Invalid date format gives actionable error
- [ ] Empty or unavailable API response gives actionable error
- [ ] Secret misconfiguration recovery path confirmed (staging only)

## Run Log

Capture each run briefly:

- Date/time:
- Environment (local/staging/prod):
- Show date(s):
- Result:
- Notes / defects filed:

### 2026-04-09 validation notes

- Save-only path validated: after fetching setlist and clicking **Save Official Setlist** (without finalize), `picks.score` updated in Firestore for seeded users on historical date.
- Edit-save recompute validated: removing a song from official setlist and saving again recalculated scores as expected.
- Known UX/data-entry caveat (tracked separately): admin "build official setlist in order" can duplicate songs that also fill slot fields (`s1o`, `s1c`, `s2o`, `s2c`, `enc`). This does not break scoring, but removing a duplicated song from ordered list alone does not clear it from `setlist` slots in Firestore; slot value must also be cleared. Track under related issue `#145`.
