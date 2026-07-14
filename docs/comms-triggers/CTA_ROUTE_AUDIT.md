# Comms CTA / route audit (#551)

Matrix of shipped / registry CTAs vs intended landing. Updated with Sprint 7 train.

Label rule: **never promise a surface the href does not deliver.** Inbox cards stay short teases; graded “your night” detail lives on Standings (`StandingsSelfRecapCard`, `#self-recap`).

## In-app registry (`commsTemplateRegistry.jsx`)

| templateId | CTA label | href | Intent match | Notes |
|------------|-----------|------|--------------|-------|
| `account-welcome` | Make your first picks | `/dashboard/picks` | yes | Was `/dashboard` |
| `tour-countdown` | varies by T-n / `picks_secured` | `/dashboard/picks` | yes | T-5/3/1 → **View / Edit picks** when secured (#509) |
| `picks-confirmed` | Review your picks | `/dashboard/picks` | yes | Was `/dashboard` |
| `score-first-points` | Watch it live | `/dashboard/standings` | yes | Was `/dashboard` |
| `score-leader` | Defend your lead | `/dashboard/standings` | yes | Was `/dashboard` |
| `show-recap` | See standings | `/dashboard/standings#self-recap` | yes | Was “See full recap” → standings (mismatch) |
| `tour-rankings-daily` | See standings | `/dashboard/standings#self-recap` | yes | Scrolls to self-recap card |
| `picks-lock-reminder` | Make your picks / View / Edit picks | `/dashboard/picks` | yes | Prod skips secured users; secured CTA for preview (#509) |
| `tour-engagement-reminder` | Make picks for next show / View / Edit picks | `/dashboard/picks` | yes | Branches on next-show `picks_secured` (#509) |
| `sphere-2026-inaugural` | (bespoke) | — | n/a | Legacy Sphere edition |

## Email (`functions/commsTemplates.js`)

| templateId | Primary CTA URL | Notes |
|------------|-----------------|-------|
| `account-welcome` | `/dashboard` | Generic app open OK for welcome |
| `tour-countdown` | `/dashboard/picks` | |
| `picks-confirmed` | `/dashboard` default | Prefer picks in a follow-up if still shipping |
| `show-recap` | `/dashboard/standings#self-recap` | Rare (email folded into morning send #451) |
| `tour-rankings_daily` | `/dashboard/picks` | Catalog: “Make picks for next show” |
| `picks-lock-reminder` | `/dashboard/picks` | |

## Push deep links

Prefers inbox (`/dashboard/profile/notifications`) for night-of show_recap tease; standings for tour rankings. Align when editing FCM payloads in delivery workers.

## Measurement & periodic review

Already coded (no new pipeline required for v1):

| Layer | What |
|-------|------|
| Server | `comms_delivered` (+ GA4 MP when secrets bound) |
| Client | `comms_opened`, `comms_cta_click` (`comms_cta` + `comms_destination`), `comms_push_tap` |
| Cadence | Weekly (show weeks) + monthly full catalog — `MEASUREMENT_PLAN.md` §4 |

**Recap-specific review (analyst):** each Monday of a show week, filter GA4 for `comms_trigger_id` ∈ `{show_recap, tour_rankings_daily}` — deliver / open / CTA rates and top `comms_destination` values. File a note under the issue or `#comms` channel if CTA→bounce patterns appear.

## Deferred (product)

- Dedicated written `/dashboard/.../recap` route beyond Standings self-recap card → #510 / future IA
- Email/auth return-URL latency → #535
- Dynamic View/Edit picks CTA → #509
