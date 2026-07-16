# `comms_show_context` schema (#572)

Night-of show narrative artifact for `show_recap` and the “Tonight” section of
`tour_rankings_daily`. Written **only** by Cloud Functions (Admin SDK). Clients
have no read/write access (`firestore.rules`).

Standalone collection (same rationale as `rollup_audit`): do not nest on
`official_setlists/{showDate}` or metadata writes will re-fire live scoring.

## Document path

`comms_show_context/{showDate}` where `{showDate}` is `YYYY-MM-DD`.

## Fields

| Field | Type | Notes |
|-------|------|-------|
| `showDate` | string | Same as doc id |
| `tourKey` | string \| null | From `show_calendar.showDatesByTour` |
| `opener_title` | string \| null | Slot / set1 first |
| `encore_title` | string \| null | Slot / encore first |
| `bustout_titles` | string[] | From `official_setlists.bustouts` |
| `tour_debut_titles` | string[] | Tonight titles not seen earlier this tour |
| `set_flow_summary` | string \| null | Short S1/S2/E structure line |
| `setlist_highlight` | string \| null | One-liner for push / Tonight |
| `show_moment_tags` | string[] | e.g. `bustout`, `tour_debut`, `multi_encore` |
| `set_counts` | map | `{ set1, set2, encore }` lengths |
| `schemaVersion` | number | `1` |
| `updatedAt` | timestamp | Server write time |

## Write hooks

1. After Phish.net live setlist persist (`phishnetLiveSetlistAutomation.pollSingleShowDate`) when the setlist changes
2. Safety net in `deliverPostRollupComms` / `runScheduledTourRankingsDaily` via `ensureCommsShowContext`

## Consumers

- `functions/commsEventAdapters.js` → `showLevelPayloadFields` + `buildShowRecapEnrichment`
- Templates: `show-recap`, `tour-rankings-daily` (`setlist_highlight` / `narrative_line`)

## Related

- [`OFFICIAL_SETLISTS_SCHEMA.md`](./OFFICIAL_SETLISTS_SCHEMA.md)
- [`docs/comms-triggers/TRIGGER_CATALOG.md`](./comms-triggers/TRIGGER_CATALOG.md) § `show_recap`
