# Voice guide (marketing + editorial prose)

**Status:** Active (2026-09-27) · **Owner:** Editor in Chief · **Origin:** `marketing-voice-pass-2026-09.md`  
**Applies to:** `src/features/landing/ui/*`, `src/pages/marketing/*`, `seoRoutes.js` prerender paragraphs + FAQ/HowTo text, `content/marketing/*`, `content/comms/*`  
**Guard:** `npm run verify:marketing-voice` (runs in CI `verify`)

Read fan press before writing: phish.net show reviews, Live For Live Music recaps, JamBase. Write like that, about our product. The reader is a fan in a group chat, not a prospect on a landing page.

## Do

- Concrete nouns: venue, slot, gap count, show count, point value. "Set 1 opener", "30+ show gap", "+20 points".
- Fan verbs: call, lock, land, got the call, closed it out, bustout, couch tour.
- Commas, colons, parentheses, periods. Vary sentence length. Short ones are fine.
- Parentheses for nicknames and asides: "Ryan M (Beaver to his friends)".
- Bold labels end in a period: `**Before the show.** Open the card…`
- Say the Phish-first / more-bands line once per page, then stop.
- Cite phish.net when stating a setlist fact. Never invent a gap, a bustout, or a setlist order.

## Do not

- **Em dashes as the default joint.** One per page at most, and only when a comma or period would lose the meaning. Never a matched pair mid-sentence (`Ryan M—known as Beaver—cooked up`). The brand tagline ("…run with your crew—one show at a time.") is the standing exception.
- **Product verbs:** unlock, elevate, seamless, experience, leverage, empower.
- **Cliché tails:** "make every show count", "across the tour and beyond", "and so much more".
- **Bold-label-dash-sentence** list items (`**Label** — Sentence`).
- **Two-fragment punch lines** ("Same picks. Different rivalries."). Say the concrete thing instead ("Same six picks, two scoreboards.").
- **Restating the noun in its own modifier** ("a picks game for fans who love picking").
- **Slash lists in prose** ("opener/closer"). Use words.
- **Hedged triplets** ("at the venue, on couch tour, or anywhere in between").
- **Redundant modifiers:** "plays live" (the band plays), "free live game" (pick one), "real-time live".
- Tip-sheet framing. We are six locked slots in a scored game, not "tonight's Phish picks".

## Keyword pages

SEO phrases go in sentences a fan would say. If the exact-match phrase forces the syntax ("the six calls you lock in Setlist Pick'Em"), rewrite the sentence around the phrase, or move the phrase. Title / H1 / first paragraph placement rules stay in `pickem-search-plan-2026-08.md` § W2. Titles and meta descriptions are SERP-tested strings; change them in their own PR with GSC evidence, not as part of a voice pass.

## Check before handoff

```bash
npm run verify:marketing-voice
```

Counts em dashes in rendered marketing prose (JSX text, prerender paragraphs, FAQ/HowTo JSON-LD text) and fails above the threshold or on any banned phrase. If the number went up on your diff, you are not done. Attribute strings (`aria-label`, `og:image:alt`), code comments, titles, and meta descriptions are excluded.

## Related

- `marketing-voice-pass-2026-09.md` — the site-wide pass that produced this guide, with before/after per surface
- `974-owned-social-cadence-brief.md` § Voice and policy — social-specific rules (hashtags, UTMs, no song lists)
- `social-brand-approach.md` — visual layouts for social
- `content/comms/README.md` — lifecycle comms workflow
