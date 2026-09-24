# show_recap composer — arc + your card + relative rank

**Status:** implemented  
**Date:** 2026-09-04  
**Issue:** #985  
**Parents:** #573 (Optimize L3) · predecessor #572 (spine shipped)  
**Live tape:** Dick’s 2026-09-04–06 (composer only — do not rebuild ingest)

Night `show_recap` ≠ tour `tour_recap` (#510).

---

## Intent

Nightly variables already pull themselves. Recaps still read as a **scorecard + shared bustout sticker**. The composer turns one short paragraph into a fan reporting the night **through this player’s game night**.

Not a new ingest pipeline. Not LLM essays. Not per-send PM approval — approve the composer once; every send stays automatic.

## Contract (2–4 sentences)

Every `narrative_line` / inbox Tonight / morning night-para must do all three **when facts exist**:

1. **Arc** — `set_flow_summary` + opener/encore titles (not only `setlist_highlight`)
2. **Your card** — which of *their* slots hit; bustout they caught or missed. Do not name songs they did not pick unless the line is clearly show-context
3. **Relative night** — weave global (and pool when present) rank into the voice (`#184 of 210` or percentile from existing fields). No new ingest. Tour `rank_change` stays on the morning email

Push stays a short tease. `buildShowScorecardSentence` folds when the composer already weaves `#rank`, so rank is not a trailing dump.

Soft-fail to today’s scorecard + highlight wrappers if context is missing.

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
