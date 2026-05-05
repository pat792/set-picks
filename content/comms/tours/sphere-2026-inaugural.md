# Tour recap — Sphere 2026 (inaugural Setlist Pick'em)

| Field | Value |
|--------|--------|
| **Template ID** | `sphere-2026-inaugural` |
| **Implementation** | `src/features/tour-recap/model/sphere2026Recap.js` |
| **In-app UI** | `src/features/tour-recap/ui/Sphere2026TourRecapInApp.jsx` |
| **Admin preview** | War Room → “Tour recap copy (Sphere '26)” (`AdminTourRecapPreview`) |

Edit **either** this file (proposal / source draft) **or** the implementation module. Production strings are the **JS module** until a content loader exists; keep this doc aligned when marketing copy changes.

---

## Headline

Sphere 2026: The Inaugural Setlist Pick'em Wrap-Up

---

## Opening (shared)

The visuals were mind-bending, haptics were rumbling, and the very first Setlist Pick'em tour is officially in the books.

Calling Phish setlists is an inexact science on a good day, but doing it during a 9-show run at the Sphere proved to be an entirely different beast. We saw massive bust-outs, masterful type II jams, and a some unpredictable encores. Despite the band keeping us on our toes, {{participantCount}} of you stepped up to the plate to lay down your picks.

Before we look ahead to summer tour, let's look at the final tape from the desert.

---

## The Podium (static snapshot for this edition)

Champion narrative + ordered podium + honorable mentions — see implementation `SPHERE_2026_PODIUM`.

---

## Your Final Sphere ’26 result (personalized per player)

**In-app + long email section:** `getSphere2026PersonalParagraph` in `sphere2026Recap.js`.  
**Placeholders:** `{{points}}`, `{{wins}}`, `{{rank}}`, `{{participantCount}}`, `{{showsPlayed}}` (sync these names into the implementation when copy changes).

### Branch: rank 1 (Champion)

You are the Champion. You navigated the Sphere run better than anyone else, taking the #1 overall spot with {{points}} points and {{wins}} nightly wins. Your prize is eternal bragging rights as the winner of the inaugural Setlist Pick'em tour. Soak it in, take a victory lap, and get ready to defend your title on the next tour.

### Branch: rank 2–5 (Top 5)

You finished in the Top 5. Coming in at #{{rank}} overall, you were right in the thick of the title hunt until the very last note. You proved you have a serious read on the band's current rotation—you were just one or two wildcard hits away from taking the whole thing down. We'll see you in the top tier next tour.

### Branch: rank 6–10 (Top 10)

You finished in the Top 10. You locked in a very respectable #{{rank}} finish out of {{participantCount}} players. Staying in the top half of the leaderboard over a 9-show run takes consistency and a good ear for the band's pacing. Adjust your strategy, study the stats, and the Top 5 is yours next time.

### Branch: rank 11+ and played all 9 shows

You finished at #{{rank}}. You played all 9 shows—which is a massive achievement in itself—but the band's curveballs kept you just outside the top 10 this time around. The Sphere run was notoriously unpredictable, so wipe the slate clean and get ready to climb the boards on the next run.

### Branch: rank 11+ and played fewer than 9 shows

You finished at #{{rank}}. You hopped into the tour for {{showsPlayed}} shows this run, dropping some great picks along the way. To climb the leaderboard next tour, make sure your picks are locked in for every single show. We'll see you on the next run!

### Fallback (edge cases)

You finished at #{{rank}}. Thanks for playing—see you on the next run.

---

## Email: one-line result teaser (not the full paragraph)

**Function:** `getSphere2026EmailTeaserResultLine` — used inside the abbreviated email body.

### Rank 1

You took #1 overall with {{points}} points and {{wins}} nightly wins — congratulations on winning the inaugural Setlist Pick'em tour at the Sphere.

### Rank 2+

You finished #{{rank}} overall with {{points}} points and {{wins}} nightly wins.

---

## Email teaser + CTA

`buildSphere2026EmailAbbreviatedPlainText` — short teaser, champion one-liner, log-in CTA to dashboard + site URL from `SEO_CONFIG`.

---

## Push

`buildSphere2026PushPayload` — title + body for FCM-style delivery (#272).

---

## Closing (shared)

Thank you to everyone who tested the waters, submitted picks, and made this inaugural run a massive success. The code is getting polished, the UI is getting tightened up, and Setlist Pick'em will be back and better than ever for summer tour.

Until then, read the book.
