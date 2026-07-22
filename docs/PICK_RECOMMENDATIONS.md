# Pick recommendations artifact (#650)

Versioned Storage JSON for the upcoming show’s slot-aware song recommendations. Powers Prediction Lab (#651) and Predictive Mode (#652). Complements the song catalog — join by normalized title.

## Publish path

1. Resolve upcoming show from `show_calendar/snapshot` via `getNextShow`.
2. Load prior `official_setlists` docs with document id `< targetDate` (leakage-safe).
3. Rank with `v0.1.0-explainable` (`functions/pickRecommendationsModel.js`).
4. Write live **`pick-recommendations.json`** (+ optional private archive).

| Trigger | Export |
|---------|--------|
| Schedule `15 */6 * * *` ET | `scheduledPickRecommendations` |
| Admin callable | `refreshPickRecommendations` |

**No-op** when: no upcoming show, invalid target, or empty history (`skipped: true` + `reason`).

Deploy: `npm run deploy:functions:phishnet` (includes both exports). Storage rules: `firebase deploy --only storage`.

## Client

- `usePickRecommendations()` in `features/picks` — Storage `getDownloadURL` + 6h localStorage TTL + stale fallback; `null` when missing.
- Override: `VITE_PICK_RECOMMENDATIONS_URL`.

## Payload (summary)

```json
{
  "generatedAt": "ISO",
  "modelVersion": "v0.1.0-explainable",
  "targetShow": { "date", "venue", "city", "tour", "timeZone" },
  "historyShowCount": 80,
  "topK": 25,
  "slots": {
    "s1o": [{ "name", "normalizedName", "rank", "score", "playProb", "slotAffinity", "confidence", "riskBand", "reasons" }],
    "s1c": [],
    "s2o": [],
    "s2c": [],
    "enc": [],
    "wild": []
  }
}
```

Model methodology: `docs/scoring-analysis/08-recommendation-model.md`.
