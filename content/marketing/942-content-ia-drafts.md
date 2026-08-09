# Marketing content IA drafts — epic #942

**Status:** EiC-approved L0 draft (2026-08-08)  
**Pipeline:** marketing-specialist → brand-systems-partner → editor-in-chief  
**Epic:** [#942](https://github.com/pat792/set-picks/issues/942)  
**Children:** [#937](https://github.com/pat792/set-picks/issues/937) · [#940](https://github.com/pat792/set-picks/issues/940) · [#941](https://github.com/pat792/set-picks/issues/941)  
**Out of scope:** Game Format teaser on home (stays as shipped); tour-stats SEO [#926](https://github.com/pat792/set-picks/issues/926)

> Chat-originated. Canonical reference for implementation. Do not treat
> `src/features/landing/ui/PhishSetlistPredictionGamePageContent.copy.md` as the
> #940 source of truth — that file is a pre-tighten draft; use this doc.

---



## Coordination (avoid re-duplication)


| Surface                                 | Owns                                                                     | Does not own                                |
| --------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| Home **Game Format**                    | Teaser: short lede + 3 cards + CTA                                       | Full timeline, origin story, SEO definition |
| `/phish-setlist-prediction-game` (#940) | **Define** the category (prediction / fantasy vs archive) + short how-to | Show-night depth, brand biography           |
| `/how-it-works` (#937)                  | **Walkthrough** (card → night → pools → personal stats)                  | Category essay, origin story, point tables  |
| `/about` (#941)                         | **Origin / brand narrative**                                             | How to play steps, scoring math             |
| `/how-scoring-works` + `/tour-stats`    | Points detail / tour trends (linked, not restated)                       | —                                           |


**Rule of thumb:** keyword answers “what is this?”; how-it-works answers “what do I do tonight?”; about answers “where did this come from?”

**Home Game Format (no change):**  
“Lock in picks, track live setlists and scores, and watch the real-time leaderboard.” + existing 3 cards + links to `/how-it-works` and `/tour-stats`.

---



## #937 — `/how-it-works`



### Meta (proposed)


| Field            | Copy                                                                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1               | How to Play Setlist Pick'Em                                                                                                                                                                                      |
| title            | How to Play Setlist Pick'Em | Show-Night Walkthrough                                                                                                                                                             |
| meta description | Lock picks before showtime, score live as the setlist unfolds, compete in pools or global standings, and unlock personal stats as you play. Free setlist prediction game—live with Phish today, more bands soon. |




### Page body

**H1**  
How to Play Setlist Pick'Em

**Lede**  
Setlist Pick'Em is a free live [setlist prediction game](/phish-setlist-prediction-game) for Phish fans—and a home for more bands soon. Here’s the show-night walkthrough: what you lock, how scoring moves, and where your crew ranks.

**H2 — Your setlist card**  
Before the lights go down, you lock six calls:

- Set 1 opener and closer
- Set 2 opener and closer
- Encore
- Wildcard

Correct picks earn points; exact slot hits score more. Call rare songs and you can trigger a Bustout Boost™. For a full breakdown, check out [how scoring works](/how-scoring-works).

**H2 — Show-night timeline**

1. **Before the show** — Open tonight’s card, lock picks before showtime. Peek at [tour stats](/tour-stats) (song frequency, bustouts, gap highlights) that refresh every night the band plays live.
2. **During the show** — Scores and standings update as songs land. Follow the live setlist in the app, whether you're at the venue or on couch tour.
3. **After the show** — Final grades post for the night. Tour standings move. Personal stats grow every night you play.

**H2 — Pools vs global**  
Play two ways at once:

- **Private pools** — Invite friends for crew-only standings.
- **Global standings** — Compete with everyone on the board for the show and the tour.

Same picks. Different rivalries.

**H2 — Personal stats unlock when you play**  
Tour trends on [tour stats](/tour-stats) are open to everyone. Your personal story—picking average, Bustout Boost™ hits, pick heatmaps—unlocks as you earn points and climb the board.

**CTA:** Play for Free  

**Internal links:** `/phish-setlist-prediction-game` · `/how-scoring-works` · `/tour-stats` · signup

### Diff intent

- Replace Lock / Watch / Claim card clone with walkthrough (card → timeline → pools → stats).
- Keep scoring + tour-stats as deep links, not re-explained point tables.
- Update title/description/HowTo JSON-LD steps to match new structure when implementing.



### EiC

**APPROVED**

---



## #940 — `/phish-setlist-prediction-game`



### Meta (proposed)


| Field            | Copy                                                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1               | The free Phish setlist prediction game *(keep)*                                                                                                                                                                                   |
| title            | Phish Setlist Prediction Game | Setlist Pick'Em *(keep)*                                                                                                                                                                          |
| meta description | Free Phish setlist prediction game and fantasy setlist picks—lock openers, closers, encore, and a wildcard before showtime, score live, and compete with friends. Built for jam bands; live with Phish today, more soon. *(keep)* |




### Page body

**Eyebrow**  
Setlist Pick'Em

**H1**  
The free Phish setlist prediction game

**Lede**  
Setlist Pick'Em is a free live **setlist picks game** for fans who love predicting setlists—built first for Phish, designed as a home for more bands soon. Lock openers, closers, encore, and a wildcard before showtime; score as the night unfolds.

**H2 — What is a setlist prediction game?**  
A **setlist prediction game**—sometimes called a **fantasy setlist** game—asks you to call songs and where they land in the setlist before the show. You compete in private pools and on the global leaderboard while scores update live.

Use the app to:

- Call slots (openers, closers, encore, wildcard)
- Score live as songs are played
- Climb show and tour boards with friends, and everyone playing the game on the global leaderboard

Fans have called the set on paper and in group chats for years. Setlist Pick'Em turns that ritual into a live game. We’re live with Phish today and building toward more bands soon.

**H2 — Fantasy setlists, without the spreadsheet**  
We track points for slot hits, wildcards, and Bustout Boost™ longshots automatically. Full values: [how scoring works](/how-scoring-works).

- **Before:** lock picks before showtime
- **During:** live scoring and standings—at the venue or on couch tour
- **After:** final grades, tour standings, personal stats that grow every night you play

[Tour stats](/tour-stats) (frequency, bustouts, gaps) refresh every night the band plays live. Playing unlocks personal stats—picking average, Bustout Boost™ hits, and your pick heatmap.

**H2 — How to play** *(short; depth on* `/how-it-works`*)*

1. Create a free account—tonight’s setlist card opens.
2. Pick Set 1 opener/closer, Set 2 opener/closer, encore, and wildcard.
3. Watch scores update live; climb boards or invite a private pool.

[How it works](/how-it-works) · [How scoring works](/how-scoring-works) · [Tour stats](/tour-stats)

**CTA:** Start predicting setlists

### Diff intent

- Compress “What is…” essay into definition + bullets + archive disambiguation.
- Shorten spreadsheet/origin overlap; keep unique angle + before/during/after.
- How-to stays 3 steps; no Lock/Watch/Claim cards.



### EiC

**APPROVED**  
*(Optional polish later: FAQ JSON-LD answers can mirror the tighter definition when implementing.)*

---



## #941 — `/about` (new) + home teaser



### Meta (proposed)


| Field            | Copy                                                                                                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1               | About Setlist Pick'Em                                                                                                                                                                                          |
| title            | About Setlist Pick'Em | From Tour Ritual to Live Game                                                                                                                                                          |
| meta description | The origin of Setlist Pick'Em—a fan-made setlist prediction game that started on Phish tour in 2001 and grew from paper and spreadsheets into a live game for friends and crews. Phish first; more bands soon. |




### Page body — `/about`

**H1**  
About Setlist Pick'Em

**Pull quote**  
“Lock your picks, ride the scores, run with your crew—one show at a time.”

**Body**

In **2001**, on **Phish tour** that summer, **Ryan M**—known to friends as **Beaver**—cooked up a game to pass the miles between shows. **Glu** and **Andy F** rolled with him on the road; in those heady years the three of them shaped the ritual—debating picks, refining the format, and keeping the crew laughing until the lights went down.

The format was simple and addictive: pick a **first-set opener and closer**, a **second-set opener and closer**, plus **encore** and a **wildcard**. Suddenly every placement mattered—friendly competition, a little glory, and a reason to care where the next song might land.

**Pat** and Ryan met in **kindergarten** and grew up together; Pat was a fan of the game from the start. In the **2010s**, Pat moved it from **paper to a spreadsheet** so friends could play from different shows and cities—portable, easy to update, and a little more dynamic on the road.

Pat had always wished it could be **more automated** and **more interesting**. **Setlist Pick'Em** is that vision taken to its logical conclusion: an interactive home for passionate fans who crave competition, [tour stats](/tour-stats), and fun with friends. Live with Phish today—building toward more bands soon.

New here? Start with [how it works](/how-it-works). Want a brief explainer? See what makes this a [Phish setlist prediction game](/phish-setlist-prediction-game).

**CTA:** Get started  

**Footer nav links:** How it works · Tour stats · Get started

### Home About teaser

**H2**  
About Setlist Pick'Em

**Teaser (replace long splash narrative)**  
Born on Phish tour in 2001—from paper picks to spreadsheets to a live setlist prediction game for friends and crews. Phish first; more bands soon.

**Link:** [Read the full story](/about)

**Pull quote (optional keep on home):**  
“Lock your picks, ride the scores, run with your crew—one show at a time.”

**CTA:** Get started *(keep)*

### Diff intent

- Move full origin narrative to crawlable `/about`.
- Home keeps short teaser + link (no orphaned story).
- Light brand polish: consistent **Setlist Pick'Em**; multi-band line once at the end.



### EiC

**APPROVED**

---



## Implementation notes (when coding)

- Primary UI: `src/features/landing/ui/` — `HowItWorksPageContent.jsx`, `PhishSetlistPredictionGamePageContent.jsx`, new `AboutPageContent.jsx`; thin pages under `src/pages/marketing/`.
- Sync `seoRoutes.js` / prerender / sitemap / `llms.txt` / nav for #941; meta for #937 if title/description change.
- Marketing document only; no shared app `ScrollToTop` / `appBootPath` on cold-open graph. Safari private AC on new/changed routes.
- Prefer one PR for #937+#940 (copy), then #941 (route + SEO), or a single #942 tranche.
- **In progress (2026-08-08):** #940 + #941 landing in **v1.56.0**; #937 walkthrough still deferred.

