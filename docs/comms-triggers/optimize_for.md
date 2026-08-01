# Optimize goal rotation (#778 / #573)

**Source of truth** for scheduled Optimize kickoffs. Agents and
`.github/workflows/comms-optimize-schedule.yml` read this file via
`scripts/comms-optimize-kickoff.mjs`.

<!-- Machine-readable override (empty = ISO-week rotation). Do not fence this line. -->
current_override:

## Override (optional)

Set `current_override:` above to a single snake_case goal to force the next
weekly kickoff. Clear it (leave empty) to resume automatic rotation.

Valid goals: `picks_lock` · `return_14d` · `tour_retention` · `push_opt_in` ·
`email_open` · `show_recap_uniqueness`

## Automatic rotation

### Post-show (morning after a calendar show date)

Always: **`show_recap_uniqueness`**  
Window: that show date (GA4 still uses last 7 complete days for funnels).  
Narrative QA checklist: [#779](https://github.com/pat792/set-picks/issues/779).

### Weekly (Monday, America/Denver) — show week

ISO week number → goal (cycle of 4):

| ISO week mod 4 | `optimize_for` |
|----------------|----------------|
| 0 | `picks_lock` |
| 1 | `email_open` |
| 2 | `show_recap_uniqueness` |
| 3 | `tour_retention` |

Show week = at least one `FALLBACK_SHOW_DATES` / calendar date in
`[today−7d, today+7d]` (script uses committed show-date fallback until
Firestore is available in Actions).

### Weekly (Monday) — off-tour

| ISO week mod 2 | `optimize_for` |
|----------------|----------------|
| 0 | `return_14d` |
| 1 | `push_opt_in` |

## Priority when Monday follows a show night

1. **Post-show** kickoff (`show_recap_uniqueness`) if yesterday was a show
2. Else **weekly** kickoff

## Manual kickoff

```bash
npm run comms:optimize-kickoff -- --mode weekly
npm run comms:optimize-kickoff -- --mode post_show --show-date 2026-07-31
npm run comms:optimize-kickoff -- --mode weekly --post   # comment on #573
```
