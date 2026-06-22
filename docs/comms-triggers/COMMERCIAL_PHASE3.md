# Commercial communications — Phase 3

Sponsor integrations, offers, and affiliate placements **after** triggered lifecycle and show comms are engaging users and driving retention.

## Entry gates (all required)

| Gate | Threshold |
|------|-----------|
| V1 P0/P1 triggers stable | ≥ 30 days production without dedup incidents |
| Measurement live | `comms_delivered` + `comms_opened` baselines for recap + lock reminders |
| Engagement tier defined | e.g. `active_picker` = pick submitted in last 3 shows |
| Legal | Disclosure copy approved; privacy policy updated |
| User control | `notificationPrefs.commercial` (default **opt-in** or **opt-out** — product decision) |

Do not enable `commercial` templates in registry until gates pass.

## Commercial slot types

| Slot | Placement | Example |
|------|-----------|---------|
| `sponsor_footer` | Bottom of in-app recap / email full | “Presented by …” |
| `offer_inline` | Mid-message CTA block | Merch discount code |
| `affiliate_link` | CTA button | Ticket partner link (geo-gated) |

Slots are **additive** — parent trigger message must stand alone without the slot.

## Allowed parent triggers (initial)

Only attach commercial slots to:

- `tour_recap_*`
- `show_recap_*` (future)
- `pool_standings_digest` (optional, P2+)

**Never attach to:**

- `first_login_welcome`, `profile_incomplete_nudge`
- `picks_lock_reminder`, `picks_lock_t24h`
- `post_show_win`, `post_show_near_miss` (unless explicit sponsor campaign with legal sign-off)
- Any `system` trigger

## Frequency caps

| Cap | Limit |
|-----|-------|
| Commercial messages per user per week | 1 |
| Commercial push per month | 0 (in-app/email only initially) |
| Same sponsor per user per tour | 1 recap footer |

## Template requirements

Commercial templates must include:

- `commercial: true` flag in registry metadata (future extension)
- Visible disclosure label (“Sponsored”, “Affiliate link”)
- `sponsorName`, `sponsorUrl` in payload (no secrets in `content/comms/`)

## Measurement (commercial-specific)

| Event | Params |
|-------|--------|
| `comms_commercial_impression` | `sponsor_id`, `slot`, `trigger_id` |
| `comms_commercial_click` | `sponsor_id`, `slot`, `destination` |

Primary ROI: incremental revenue per MAU vs control (no commercial slot).

Guardrail: `comms_pref_changed` where `pref_key=commercial` and unsubscribe rate vs pre-Phase-3 baseline.

## Squad workflow

1. **Analyst** — proposes tier + expected ROI
2. **Triggers** — adds `commercial_*` row to catalog with `status: phase3`
3. **Drafter** — sponsor copy in `content/comms/commercial/`
4. **Architect** — slot injection in delivery helper; respects caps + prefs
5. Legal + PM sign-off before `status: shipped`

## Reference trigger

See [TRIGGER_CATALOG.md](./TRIGGER_CATALOG.md) → `commercial_sponsor_recap_footer`.
