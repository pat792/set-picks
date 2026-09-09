# Incident — live `tour_recap` for archive `2026 Sphere`

| Field | Value |
|--------|--------|
| **Status** | contained in code (deploy required) |
| **Detected** | 2026-09-09 (Resend review + user report) |
| **Sent** | 2026-09-09 **15:00:10Z–15:00:25Z** (~8:00 AM PT) |
| **Issue** | GitHub #1033 |
| **Trigger** | `tour_recap` / template `tour-recap` via `scheduledTourRankingsDailyComms` → `deliverPendingTourRecaps` |
| **Tour key** | `2026 Sphere` (subject: **`2026 Sphere recap is in`**) |
| **Intended path** | Archive / War Room only (`deliverSphere2026TourRecapInbox` / `sphere-2026-inaugural`) |

## What happened

The 8am PT pending scanner walked **every** past tour in `show_calendar.showDatesByTour`. Sphere players had never received dedup docs under `tour_recap:2026 Sphere:{uid}` (historical wrap used the archive template), so the first eligible cron after #510 adapters were live treated Sphere as a never-sent end-of-tour wrap.

Summer 2026 (`2026 Summer Tour recap is in`, sent 2026-09-08) was protected by dedup on this tick.

## Blast radius (Resend)

- **21** unique emails / recipients
- Subject: `2026 Sphere recap is in`
- From: `Setlist Pick'em <updates@setlistpickem.com>`
- Recipients (lowercase):

```
adamlassanske@gmail.com
bradley.odice@gmail.com
cukenchang@yahoo.com
drgluhanick@gmail.com
ethanice3@gmail.com
gmholsom@gmail.com
hi@chrisjensen.me
jdk2champ@gmail.com
jeffg9@gmail.com
jeffreyursillo@gmail.com
meaghanflynn@gmail.com
mugleason@gmail.com
pat@road2media.com
pshea79@gmail.com
pshea79@yahoo.com
rtmeyer007@gmail.com
ryanknisely@gmail.com
sheamathew@gmail.com
tjparker2112@googlemail.com
trevorgagstetter@gmail.com
wahector@gmail.com
```

Also check in-app `commsInbox` rows and FCM for the same cohort (channels share the delivery orchestrator).

## Fix

1. **14-day lookback** on pending finales (late grades before first send).
2. **Hard-skip** tour keys matching `/\bsphere\b/i` (+ write `skipped_archive`).
3. **Once-ever tour state** — `comms_tour_recap_state/{tourId}` (`sent` / `skipped_archive` / `closed`) so **every** tour is hard-skipped after the single end-of-tour send (not Sphere-only).
4. Seed Summer `sent` + Sphere `skipped_archive` via `node functions/scripts/seedTourRecapState.js --confirm`.
5. **Deploy** `scheduledTourRankingsDailyComms` (+ adapter hosts) and Firestore rules to prod before the next 8am PT tick.

Already-delivered uids are mostly protected by `tour_recap:2026 Sphere:{uid}` dedup; tour state stops prefs-off / other historical tours from being retried forever.

## Follow-ups (human)

- [ ] Optional clarification / apology email (PM call — do not auto-send)
- [ ] Confirm no further Sphere subjects appear in Resend after deploy
- [ ] Spot-check Messages inbox for mistaken `tour-recap` Sphere payloads vs archive `sphere-2026-inaugural`
