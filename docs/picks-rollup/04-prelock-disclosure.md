# Pre-lock disclosure: crowd pulse tradeoffs (#689)

**Question:** Should crowd stats show **before picks lock** (Standings NEXT), or only after?  
**User lean:** Engagement yes, but competitive edge risk → **teaser pre-lock, full stats post-lock**; UI can use profile-style frequency meters.

## Context we already ship

| Behavior | Pre-lock (NEXT) | Post-lock (LIVE+) |
|----------|-----------------|-------------------|
| Opponent **individual** picks | Redacted (`shouldRedactOpponentPicksPreLock`) | Visible |
| Crowd pulse prototype | Currently visible (full expand) | Visible |

Showing **named** multi-picker songs + % + leaders’ songs pre-lock is a **partial undo** of pick privacy: you don’t see Alice’s card, but you see “53% of the room is on Sample in a Jar.”

At current N (≈9–16), that signal is strong enough to change picks — especially gap teasers (“Walfredo gap 464”) and leaders’ lean.

## Merits of pre-lock **full** disclosure

| Pro | Con |
|-----|-----|
| Social proof → more pickers lock in (“room is live”) | Rewards late submitters / editors who refresh Standings |
| Fun / FOMO; fits “play with the crowd” tone | Punishes players who want independent edge |
| Feeds picks helper narrative early | High-gap + consensus = meta coach for free |
| Standings feels alive before showtime | Conflicts with existing pick-redaction philosophy |

**Verdict:** Full disclosure pre-lock is **engagement-positive, fairness-negative**. Fine for a labeled prototype; risky as default product.

## Merits of **post-lock only**

| Pro | Con |
|-----|-----|
| Preserves competitive integrity through the edit window | Loses pre-show social loop on Standings |
| Aligns with opponent pick redaction | “Dead” crowd pulse until lock may feel empty |
| Full analysis becomes a **post-lock reward** | Picks helper can’t use live consensus until lock (unless separate opt-in) |

**Verdict:** Cleanest fairness story; weaker engagement on the NEXT card.

## Recommended compromise: teaser → unlock

### Pre-lock (NEXT) — teaser only

Show **non-actionable** social proof:

- Pickers tonight count (and maybe unique song count)
- Soft copy: “Crowd is filling in — full pulse after lock”
- Optional: anonymous intensity only — e.g. “Top song has **8** of **14** pickers” **without naming the song**
- Optional: vintage as a single vibe number (less stealable than song lists)
- **Do not** show: song titles, gap top 10, leaders’ song lists, by-slot favorites, % tables

CTA: “Make picks” remains primary; teaser is secondary.

### Post-lock (LIVE / PAST with locked picks) — full pulse

Unlock everything from the Phase C slate:

1. Multi-picker songs (named) + %  
2. Consolidated / full list  
3. Highest gap top 10  
4. Slot-weighted vintage  
5. Tour top-5 leaders’ tonight picks  

Plus optional crowd-vs-setlist later (post-show).

### Why this split works

- **Engagement:** Standings still shows “the room is here” before lock.  
- **Fairness:** Song-level meta stays hidden until nobody can edit.  
- **Product clarity:** Matches redaction mental model (“private until lock”).  
- **Picks helper:** Can stay **opt-in / post-lock** for consensus chips, or use **historical** tour chalk (not tonight’s live card) pre-lock.

## UI enhancement: profile-style meters

Profile `TopPicksFrequencyStrip` already uses a **frequency bar** (intensity = count / max). Reuse that language for post-lock crowd pulse:

| Element | Pre-lock teaser | Post-lock full |
|---------|-----------------|----------------|
| Header | “Crowd pulse” + picker count | Same + “Unlocked after lock” isn’t needed if state is obvious |
| Body | Single meter track: “Room fill” or anonymous “top song share” bar without label | Named song rows with intensity bars (profile strip pattern) |
| Expand | Disabled or “Available after lock” | Gap / vintage / leaders sections |
| Heatmap feel | One aggregate bar | Ranked strip; optional slot facets later |

Avoid copying profile’s red→blue gradient blindly if Standings chrome wants quieter meters — same **geometry** (track + fill + ×N), Standings tokens.

## Implementation sketch (when we leave prototype)

1. Gate `CrowdNightPulsePanel` on `showStatus === 'NEXT'` → **teaser mode**; `LIVE` / locked PAST → **full mode**.  
2. Teaser props: `{ pickers, uniqueSongs, topSharePct? }` only — no titles.  
3. Extract shared `FrequencyMeterRow` (shared or crowd-picks ui) from profile strip patterns.  
4. Keep CLI / aggregators unchanged — gating is presentation-only.  
5. Telemetry: `crowd_pulse_teaser_view` vs `crowd_pulse_full_expand` to measure whether teasers drive picks without leaking meta.

## Recommendation

**Adopt teaser pre-lock / full post-lock** as the product default. Keep today’s full prototype behind an explicit “prototype / always full” flag for local QA only.

Optional follow-ups:

- Pref for “hide crowd pulse” (competitive players)  
- Picks helper: historical chalk pre-lock; live consensus only post-lock  

## Decision ask

1. Lock **teaser / full** split as default?  
2. Teaser includes **anonymous top-share %** (no title), or **counts only**?  
3. Proceed to implement gating + meter UI on the prototype next?
