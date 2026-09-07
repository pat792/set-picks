# Tour recap — reusable end-of-tour template

| Field | Value |
|--------|--------|
| **Status** | draft / live runtime in `tourRecap.js` |
| **Date** | 2026-09-04 |
| **Trigger** | `tour_recap` (#510) |
| **Template ID** | `tour-recap` |
| **Implementation** | `src/features/tour-recap/model/tourRecap.js` |
| **In-app UI** | `src/features/tour-recap/ui/TourRecapInApp.jsx` |
| **Server render** | `functions/commsTemplates.js` (`tour-recap`) |
| **Edition flavor** | Per-tour Markdown under `content/comms/tours/<edition>.md` + send-time payload. Do not hardcode a live tour (including Sphere) in the catalog. |

Night `show_recap` is a different trigger. This file is the reusable tour wrap-up contract.

---

## Headline

{{tour_name}}: Setlist Pick'em Wrap-Up

---

## Opening (shared)

{{tour_name}} is officially in the books.

Calling setlists is an inexact science on a good day, and a {{show_count}}-show run kept everyone honest. Despite the curveballs, {{participantCount}} of you stepped up to lay down your picks.

Before the next run, here is the final tape.

---

## The Podium

Computed from tour standings at send time (top 3 + two honorable mentions). Do not ship a static live-tour snapshot in the catalog.

---

## Your final result (personalized)

**Function:** `getTourRecapPersonalParagraph`  
**Placeholders:** `{{rank}}`, `{{points}}`, `{{wins}}`, `{{showsPlayed}}`, `{{participantCount}}`, `{{showCount}}`, `{{tourName}}`

### Branch: champion (rank 1)

You are the Champion. You navigated {{tourName}} better than anyone else, taking the #1 overall spot with {{points}} points and {{wins}} nightly wins. Soak it in, take a victory lap, and get ready to defend your title on the next tour.

### Branch: top 5 (rank 2–5)

You finished in the Top 5. Coming in at #{{rank}} overall, you were right in the thick of the title hunt until the very last note. You were just one or two wildcard hits away from taking the whole thing down. We'll see you in the top tier next tour.

### Branch: top 10 (rank 6–10)

You finished in the Top 10. You locked in a very respectable #{{rank}} finish out of {{participantCount}} players. Staying in the top half of the leaderboard over a {{showCount}}-show run takes consistency. Adjust your strategy, study the stats, and the Top 5 is yours next time.

### Branch: full-run outside top 10

You finished at #{{rank}}. You played all {{showCount}} shows—which is a massive achievement in itself—but the curveballs kept you just outside the top 10 this time around. Wipe the slate clean and get ready to climb the boards on the next run.

### Branch: partial attendance

You finished at #{{rank}}. You hopped into the tour for {{showsPlayed}} shows this run, dropping some great picks along the way. To climb the leaderboard next tour, make sure your picks are locked in for every single show. We'll see you on the next run!

### Fallback

You finished at #{{rank}}. Thanks for playing—see you on the next run.

---

## Email (abbreviated)

Teaser + champion/finish line + CTA to log in. Full narrative stays in-app.

---

## Push

Title: `Tour recap is in`  
Body: rank-aware teaser → inbox / standings.

---

## Sphere ’26

Historical edition only: `content/comms/tours/sphere-2026-inaugural.md` + War Room replay callable. Not the live catalog template.
