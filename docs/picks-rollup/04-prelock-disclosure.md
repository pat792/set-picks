# Pre-lock disclosure: crowd pulse (#689)

**Decision (2026-07-20):** Pre-lock, **top songs stay visible**; gap / vintage / leaders / full tables **blur until showtime** (picks lock → LIVE).

## Product split

| Surface | Pre-lock (`NEXT`) | Post-lock (`LIVE` / `PAST`) |
|---------|-------------------|-----------------------------|
| Pickers · unique song counts | Visible | Visible |
| **Top multi-picker songs** (named + % + meters) | **Visible** | Visible |
| Full multi list, highest gap, vintage, tour leaders tonight | **Blurred** (“Unlocks at showtime”) | Clear |

Rationale: named chalk is the engagement hook (“the room is on X”); deep catalog/leader meta is the competitive edge we withhold until nobody can edit. Aligns partially with opponent pick redaction — individual cards stay private; aggregate top lean is public social proof.

## Tradeoffs accepted

- Late editors can still lean into **visible** top songs.
- Gap coaching and “what leaders locked” stay locked — the higher-leverage edges.
- Expandable “Full crowd stats” remains discoverable pre-lock (blurred preview + lock affordance) so unlock feels like a reward at showtime.

## UI notes

- Top songs use profile-style **frequency meters** (Standings brand gradient, not profile red→blue).
- Blur is presentation-only; aggregators still compute (needed for unlock + CLI).
- Gate: `blurDeepStats={showStatus === 'NEXT'}` on `CrowdNightPulsePanel`.

## Out of scope (later)

- Opt-out pref for competitive players (“hide crowd pulse”)
- Picks helper: live consensus chips only post-lock; historical tour chalk pre-lock
- Telemetry: teaser expand attempts vs post-lock full expand
