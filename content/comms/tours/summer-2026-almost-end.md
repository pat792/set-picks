# Tour recap — Summer 2026 almost-end (pre–Dick’s)

| Field | Value |
|-------|--------|
| **templateId** | `summer-2026-almost-end` |
| **triggerId** | `marketing_summer_2026_almost_end` (batch — not #510 end-of-tour) |
| **campaignId** | `summer_2026_almost_end` |
| **Snapshot** | Through **2026-08-01** (Fenway N2) — 18 graded shows; Dick’s 2026-09-04–06 still ahead |
| **Audience** | **Email:** Summer Tour players (`seasonStats` shows ≥ 1). **In-app:** all users. Both omit QA/clouddev test accounts (and MrPickPhive). |
| **Channels** | emailFull + inApp (forced fanout, no prefs) |
| **Prefs** | Email: `lifecycle`. In-app: none (forced). |
| **Dedup** | Email: `marketing:summer_2026_almost_end:{uid}` · Inbox doc: `marketing_summer_2026_almost_end` |
| **Implementation** | `functions/marketingAlmostEndDelivery.js` · React Email · `scheduledMarketingSummer2026AlmostEnd` (2026-08-03 08:00 America/Denver) |
| **CTAs** | Players: Invite a friend → `/dashboard/standings` · No-play: Check it out on Standings |
| **Status** | **Wired** — re-verify Top 5 / ranks on send day. |

Edit this file as the editorial source. Do not invent bustouts, gaps, or standings — refresh from Firestore before execute.

**Email HTML (preserve):** full-bleed white `MarketingLayout` + shared `emails/src/styles/marketingEmailText.js` (18px body; section titles as bold `<p>`/`Text` — never `<h2>`/Heading). No footer `<hr>`; unique `messageNonce` + unique preview subjects so Gmail doesn’t trim “identical” thread content.

---

## Subject

Between the Past and Future, Where We Drift in Time: An almost Tour End Recap

## Preheader

18 shows in the books · Fenway wrapped · Dick’s still ahead · your (almost) tour-end tape inside

---

## Opening (shared)

Hey {{greeting_name}},

Well, that's a wrap. Or is it? The Phab Four earned a well deserved break ahead of the official tour-closing Dick's Run. With so much time on our hands between shows (I'm not crying, you're crying), here's some stats to chew on.

---

## Tour tape (shared narrative — facts through 2026-08-01)

Eighteen nights. **188** unique songs. **310** total songs played from Madison through Fenway.

And then there was New York. The five-night MSG run (July 22–29) wasn't just another Garden residency — it was a full-on **'90s time machine**. The band's **92nd through 96th** appearances at the Garden, each night a setlist drawn entirely from one year: **'92 thru '96**. From my seat (and my scorecard), some of the best Phish of the last decade — bicycle kicks and beach balls back from the dead, deep cuts raining from the rafters, and a picking board that refused to behave.

That theme explains half the chaos on the tape. MSG alone coughed up these show gaps: **Cold as Ice** (1,468), **Big Ball Jam** (1,170), **The Vibration of Life** (1,027), **Suspicious Minds** (1,021), plus the cover pile — **Highway to Hell**, **Purple Rain**, **Johnny B. Goode**, **La Grange** — and a full **Forbin → Mockingbird → Harpua** suite. Across those five nights, the field banked **44** <span style="color:#ea580c;font-weight:800;">Bustout Boost™</span> hits. Fenway N1 dropped **Melt the Guns** after **2,051** shows — the longest gap between performances in Phish history. They absolutely nailed this post-punk/new wave relic.

*Email note: brand “Bustout Boost™” **once** (first mention) in orange (`#ea580c` / `orange-600`) for contrast on white — not yellow. Later references = plain “bustout” / “bustouts.” Stat = MSG picks matching `official_setlists.bustouts` (2026-08-02: 44 / 14 players).*

Not every story needed a 1,000-show gap. Merriweather brought **Ass Handed** back after 138; Savannah lit **Fire** (132); and just under the bustout line, songs like **The Old Home Place** (28) and **Izabella** (25) kept the “almost” lane spicy.

The rotation favorites? **Character Zero**, **Free**, **Ghost**, **Hood**, **Possum**, **Antelope**, and **Sand** each showed up **four** times through Fenway — the 1.0 stalwarts that I know and love.

---

## Pre Dick's Leaderboard

*Refresh before send. Snapshot 2026-08-02. Picking avg = correct ÷ (shows × 6); field avg = mean of per-player avgs.*

Field picking average across **28** players: **.231**. The Top 5 all clear it — Rivertranced by the widest margin. It just shows that a few well-placed bustouts can **Catapult** a player to the top in a hurry.

| Rank | Handle | Points | Wins | Nights | Picking avg |
|------|--------|-------:|-----:|-------:|------------:|
| 1 | **I have the book** | 385 | 5 | 18 | .296 |
| 2 | **TheManMulcahy** | 320 | 4 | 18 | .278 |
| 3 | **ArmenianMan** | 285 | 2 | 18 | .296 |
| 4 | **Rivertranced** | 270 | 1 | 17 | .353 |
| 5 | **HotDog Billy** | 250 | 2 | 18 | .269 |

*Email note: if 6 columns wrap poorly on mobile, collapse to Rank / Handle / Points / Avg with wins + nights under the handle.*

Three more nights at Dick’s. The Top 5 is bunched enough that one hot run — or a couple of bustouts — can reshuffle the whole podium. And if you’re sitting just outside looking in: you’re closer than you think. Commerce City is where chasers become contenders.

---

## Your (almost) tour-end tape (personalized)

**Placeholders:** `{{rank}}`, `{{points}}`, `{{wins}}`, `{{showsPlayed}}`, `{{avg_points}}`, `{{batting_avg}}`, `{{participantCount}}`

### Branch: rank 1

You're sitting #1 overall with {{points}} points, {{wins}} nightly wins, and {{avg_points}} points per show across {{showsPlayed}} nights. Own the break — Dick’s is where titles get defended.

### Branch: rank 2–5

You're in the Top 5 at #{{rank}} — {{points}} points, {{wins}} wins, {{avg_points}} pts/show, picking avg {{batting_avg}} over {{showsPlayed}} shows. One hot Dick’s run (or a rival cold streak) and this whole picture redraws.

### Branch: rank 6+ and played ≥12 shows

You're #{{rank}} of {{participantCount}} with {{points}} points across {{showsPlayed}} shows ({{avg_points}} pts/show, batting {{batting_avg}}). Full-tour grinders get paid at Dick’s — keep the card sharp.

### Branch: rank 6+ and played &lt;12 shows

You're #{{rank}} with {{points}} points over {{showsPlayed}} shows ({{avg_points}} pts/show). Spot duty still counts — lock all three Dick’s nights and watch the climb.

### Branch: no rank / no Summer Tour plays

You've been in the mix — just not on the board yet this tour. Three nights at Dick's is a clean slate: lock picks for opener, closer, encore, and a wildcard, and you'll have a tape of your own when the final wrap hits. The field picking average through Fenway is only **.231** — this game is very beatable.

### Fallback (has rank, edge cases)

You're #{{rank}} with {{points}} points. Thanks for playing — see you at Dick’s.

---

## One huge favor (players only — `showsPlayed ≥ 1`)

Before Dick's, can I ask a huge favor? **Invite at least one friend** to join and lock picks for the three-night run. Growing the number of players is my measure of success — and you know I love stats.

→ CTA: Invite a friend from Standings → `/dashboard/standings`  
*(Wire with invite share block when available: `/join/{code}?from={handle}` or `/invite/{handle}` + UTM `summer_2026_almost_end` / `invite_friend`.)*

*Skip this section for the no-rank / no-plays branch — their job is to get on the board first.*

---

## Building between now and then (shared)

Between now and Dick’s, I'm staying busy building out new features. If you haven't checked these out, they are worth taking a look:

**Live setlist** — Updates as songs land, with **bustout** badges and **last-played / gap** insights so you can see how rare each hit really was.

**Crowd pulse** — How the field is picking that night — consensus heat, where your card sits vs the room, and which songs the crowd is riding.

**Stats** — Personal and tour insights (bustouts, gaps, frequency — the same tape above, live in the app).

**Profile** — Milestone **badges** and **avatars** so you can personalize how you show up on the board.

→ CTA: Check it out on Standings → `/dashboard/standings`

---

## Closing (shared)

Three nights in Commerce City still to go. Rest up, study the gaps, and don’t sleep on the wildcard.

See you at Dick’s.

— Pat  
from the Setlist Pick 'Em desk

---

## Email structure (channel notes)

1. Subject + preheader (above)
2. Opening
3. Tour tape narrative
4. Top 5 table (or compact ranked list for mobile email)
5. Your (almost) tour-end tape (rank / no-play branch)
6. One huge favor — invite a friend (players only)
7. Feature callouts
8. Closing + sign-off
9. Standard footer (prefs / unsubscribe) — no in-body “manage preferences”

**Primary CTA (players):** Invite a friend from Standings → `/dashboard/standings`  
**Primary CTA (no-play):** Check it out on Standings → `/dashboard/standings`

---

## Delivery notes

- CLI: `cd functions && npm run comms:deliver-summer-2026-almost-end` (dry-run default; `--execute`, `--uid`, `--force-resend`)
- Scheduler: `scheduledMarketingSummer2026AlmostEnd` — 2026-08-03 08:00 America/Denver; abort via `comms_marketing_runs/summer_2026_almost_end` status `cancelled`
- Email: Summer Tour players only · In-app: all users (QA excluded) · no-play branch when missing tour stats
- Re-pull Top 5 on send day; do **not** treat as `#510` `tour_recap`
