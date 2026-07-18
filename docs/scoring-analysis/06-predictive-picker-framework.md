# Predictive song picker framework

Epic: [#646](https://github.com/pat792/set-picks/issues/646). Children: #647–#653. Complements scoring analysis #645.

## Product model

One recommendation engine, two opt-in surfaces:

1. **Prediction Lab panel** — Safe / Slot-fit / Long-shot, reasons, “Use for this slot.” Preferred first UI.
2. **Predictive Mode** — default-off; focus shows 5–8 slot-aware suggestions; typed search uses same score.

Rules:

- Manual search remains default; never auto-fill.
- Do **not** use current-show user picks as model input (consensus / feedback loop).
- Cross-slot uniqueness unchanged.

## Ranking (leakage-safe)

### Play likelihood

Recency (10/25/50 shows), lifetime frequency with shrinkage, nonlinear gap vs song cadence, last-played, run/tour repeat penalties, calendar (tour, venue/run, days since prior).

### Slot affinity

Smoothed affinity for s1o/s1c/s2o/s2c/first encore/later encore/wildcard.

```text
slotScore = calibratedPlayProbability × smoothedSlotAffinity
wildcardScore = calibratedPlayProbability
```

Bustout upside as **Long-shot** band, not mixed into “most likely.”

Gap ≠ “lowest first.” Current autocomplete in `rankCatalogSongMatches.js` is a search heuristic; gap 0 after prior night can *reduce* next-show odds.

## Critical data constraint

`song-catalog.json` is overwritten every ~6 hours → historical pre-show `gap`/`last`/`total` cannot be reconstructed from today’s file. Target-night `songGaps` only lists songs that played → never use as candidate features for that night.

Backtest v1: prior `official_setlists` + calendar + bounded Phish.net history. In parallel: **archive dated catalog snapshots** (#647).

## Artifact

Versioned Storage JSON (alongside catalog), e.g. `pick-recommendations.json`: `generatedAt`, `modelVersion`, target show, per-song per-slot ranks, confidence, risk band, explanation components. Refresh during tours / after finalize. Client: Storage + TTL + stale/fallback like song catalog—not Firestore per keystroke.

## FSD

Keep in `features/picks` (api/model/ui). Extend `SongAutocomplete` only with generic featured options / injected ranker. Pages stay composition-only.

## Rollout

1. Offline backtest (#648–#649)  
2. Artifact (#650)  
3. Prediction Lab (#651)  
4. Predictive Mode if panel evidence OK (#652)  
5. Provenance + metrics + tour recalibration (#653)

## Measurement

Zero-score rate, selection rate, recommended-pick outcomes, pick entropy/concentration, ties. Optional pick provenance: `manual` | `panel` | `predictive_mode` + modelVersion/rank.

## SemVer / docs when shipping

MINOR bump; CHANGELOG; `docs/API.md`; update `docs/SONG_CATALOG.md` schedule/cache wording; model methodology doc.
