# Tour recap — reusable end-of-tour template

| Field | Value |
|--------|--------|
| **Status** | live runtime. Copy follows the tour-wrap fact map (#1084). |
| **Date** | 2026-10-08 |
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

Then the first fact that exists:

1. The rarest hit of the run — song and gap. A title counts only when that exact title was in that night’s official setlist.
2. How often the tour lead changed hands.
3. The last venue after N shows.

If none of those exist, keep: “Calling setlists is an inexact science on a good day, and a {{show_count}}-show run kept everyone honest. Despite the curveballs, {{participantCount}} of you stepped up to lay down your picks.”

Before the next run, here is the final tape.

---

## The Podium

Computed from tour standings at send time (top 3 + two honorable mentions). Do not ship a static live-tour snapshot in the catalog.

---

## Your final result (personalized)

The rank band (`champion`, `top5`, `top10`, `full_run`, `partial`, `fallback`) is still stored on the send. It does not choose a flavor sentence.

You finished #{{rank}} of {{participantCount}} with {{points}} points and {{wins}} nightly wins, playing {{showsPlayed}} of {{showCount}} shows.

When the fact exists, add:

- Your best night was {{date}} with {{score}} points.
- You caught {{songs}}. Skip a song already named in the personal sentence below.
- You sat out {{count}} shows. Say this only when the count is greater than zero.

Then one sentence, the first that is true:

1. You caught {{song}} — a {{gap}} show gap — on {{date}}.
2. You took the lead on {{date}}. Or: You lost the lead on {{date}}.
3. This is your highest tour point total. Or: This is the most nightly wins you've had on a tour. Only when another tour on the account is already lower. A one-tour account does not get this sentence.

If none of those are true, the rank paragraph stands alone.

---

## Email (abbreviated)

Teaser + finish line + at most the one personal sentence above. Primary CTA **View Recap** → `/dashboard/profile/notifications` (Messages inbox). The rank paragraph, best night, caught songs, and shows sat out stay in-app.

---

## Push

Title: `Tour recap is in`  
Body: rank-aware teaser → Messages inbox (FCM default deep link).

---

## In-app CTA

After reading the recap body: **View tour standings** → `/dashboard/standings?view=tour`.

---

## Sphere ’26

Historical edition only: `content/comms/tours/sphere-2026-inaugural.md` + War Room replay callable. Not the live catalog template.
