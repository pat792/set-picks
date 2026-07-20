# Pre-lock disclosure: crowd pulse (#689 / #694)

**Decision (2026-07-20):** Pre-lock, **top songs stay visible**; gap / vintage / leaders / full tables **blur until showtime** (picks lock → LIVE).

**Ship status:** Standings crowd pulse productized in #694 (no “prototype” label). Stats deep-dive + picks helper remain P1/P2 on that issue.

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

- Top songs use **frequency meters** via `crowd-picks/ui/FrequencyMeterRow` (Standings brand gradient).
- Blur is presentation-only; aggregators still compute (needed for unlock + CLI).
- Gate: `blurDeepStats={showStatus === 'NEXT'}` on `CrowdNightPulsePanel` (wired in `StandingsCrowdPulse`).

## Out of scope (later)

- Opt-out pref for competitive players (“hide crowd pulse”)
- Picks helper: live consensus chips only post-lock; historical tour chalk pre-lock
- Telemetry: teaser expand attempts vs post-lock full expand
- Link to dedicated Stats surface (P1 on #694)