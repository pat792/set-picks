# show_recap composer — arc + your card + relative rank

**Status:** night map shipped  
**Date:** 2026-10-08  
**Issue:** #1083 (sentences) · #985 (composer)  
**Parents:** #1081 · #573 (Optimize L3) · predecessor #572 (spine shipped)  
**Map:** `SHOW_RECAP_FACT_INVENTORY.md`

Night `show_recap` ≠ tour `tour_recap` (#510).

---

## Intent

The night paragraph follows the night map: one line per set, one player line, and the rank. It reports the night through this player’s game night.

Not a new ingest pipeline. Not LLM essays. Not per-send PM approval — approve the composer once; every send stays automatic.

## Contract (2–4 sentences)

Every `narrative_line` / inbox Tonight / morning night-para must do all three **when facts exist**:

1. **Arc** — one sentence per set from the night map (length, then the highlight, then every encore title). The saved `set_flow_summary` is that paragraph. Opener and venue are fallbacks.
2. **Your card** — the first player slot that is true. A caught bustout is spoken here and left out of the set highlight. A title that was not in the official setlist is not a bustout.
3. **Relative night** — weave global (and pool when present) rank into the voice (`#184 of 210`). Tour `rank_change` stays on the morning email’s standings paragraph.

Push stays a short tease. `buildShowScorecardSentence` folds when the composer already weaves `#rank`, so rank is not a trailing dump.

When the night’s songs are missing, the paragraph falls back to the saved arc and the older highlight wrapper. A missing fact drops its clause. The send still goes.

## Branches

Deterministic via `resolveNarrativeBranch`: `bustout_hero` · `hot_night` · `mixed` · `cold`.

## Code homes

- `functions/showRecapNarrativeCore.js` — `composeShowRecapNarrative` / `buildShowRecapEnrichment`
- `functions/commsTemplates.js` — `show-recap`, `tour-rankings-daily`
- `src/features/notifications/ui/commsTemplates/commsTemplateRegistry.jsx` — inbox Tonight uses `narrative_line`
- Tests: `functions/commsShowContextCore.test.js`, `scripts/lib/showRecapNarrativeQa.*`

## Out of scope

- Auto-merge / `comms:deploy`
- End-of-tour `tour_recap` (#510)
- Freeform LLM “what the night felt like”
- New Firestore collections or client reads of `comms_show_context`
- #573 pack-review / L2 cron work
- #512 email-open Optimize, #498 badge, #704 SEO trees

## Acceptance

- [x] Cold / mixed / hot / bustout_hero each include arc + card + relative rank when facts exist
- [x] `set_flow_summary` appears in the shipped paragraph
- [x] Soft-fail to today’s scorecard+highlight if context is missing
- [x] `cd functions && npm test` + narrative QA fixtures
- [ ] Dick’s N1–N3 canary (human) reads as a fan of *that* night and *that* board
