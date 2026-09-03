# #974 — Owned IG/X cadence brief (show-week + always-on)

**Status:** draft (EiC-facing — not approved)  
**Date:** 2026-09-03  
**Epic:** #972 (Pick'em Search)  
**Issue:** #974  
**Plan:** `content/marketing/pickem-search-plan-2026-08.md` § W4 / Phase 3  
**UTMs:** `docs/SEO_GEO_PLAYBOOK.md` §6 — **every public URL uses `utm_campaign=seo_geo`**  
**Crew:** Social Media Specialist → Social Demand Gen (L2) → Brand Systems → EiC  
**CLI:** `crew/scripts/social_demand_gen.py`  
**This PR ships the brief only.** Accounts, first live post, and monthly GSC/UTM notes remain human AC. **Do not treat #974 as closed.**

---

## Goal

Close the phishpicks.net-style **IG → indexed posts → referring domains** gap with **owned** Instagram (Business/Creator) and optional X / Threads. Cadence is **show-week plus always-on**, not show-week only.

Every post is a **product moment**: card open, lock, Bustout Boost™ hit, pool board, tour-stats aggregate, scoring explain, origin beat. **Not** a tip sheet of songs to play tonight, **not** a predicted full-night setlist, **not** a last-night recap blog.

---

## Voice and policy (non-negotiable)

| Rule | Do | Do not |
|------|----|--------|
| Product vs tips | Six lock slots, live scoring, pools, Bustout Boost™ | “Tonight’s Phish picks” / predicted setlist lists |
| Tour-stats | Aggregates already on `/tour-stats` (frequency, unique songs, 30+ bustouts this tour) | Full-night setlists, song-by-song recaps, archive encyclopedias |
| Attribution | Cite phish.net when discussing official setlist facts | Compete on completeness with phish.net / PT / ihoz |
| Links | Playbook §6 UTMs; **`utm_campaign=seo_geo` on every URL** | Bare URLs, paid/bought links, PBNs |
| Routes | Home, `/how-it-works`, `/how-scoring-works`, `/about`, `/phish-setlist-prediction-game`, `/tour-stats`, `/tour-stats/2026-summer-tour` | **`/phish-picks`** (#975 gated — no build) |
| Research | Allowlisted fetch / GSC / owned analytics | Google/Bing SERP HTML scraping |
| Community | Reddit/Discord: reply when useful; link tour-stats or how-it-works | Spam, over-post, bought comments |
| Publish | L2 draft → EiC/CCO approve → local published queue → **human** posts | Auto-post to Meta/X APIs; `CREW_SOCIAL_PUBLISH_ENABLED` without explicit kickoff |
| Night vs tour | Show-week **product** beats | Lifecycle `show_recap` ≠ `tour_recap` copy; do not paste inbox recaps into social |

Brand Systems owns visual/voice kit alignment before first publish. Marketing entry stays Firebase-free; this brief does not change app chrome or Dashboard IA.

---

## UTM contract (playbook §6)

Owned-social sources are not in the playbook’s community list (`reddit`, `discord`, `newsletter`, `forum`, `manual`). Use the **network name** as `utm_source`; keep the rest of §6.

| Param | Value for this program |
|-------|------------------------|
| `utm_source` | `instagram` · `x` · `threads` |
| `utm_medium` | `social` |
| `utm_campaign` | **`seo_geo`** (required — do not swap to `seo_657` / `seo_926` on owned posts) |
| `utm_content` | Short slug from the table below |

**Link-in-bio (canonical):**

`https://www.setlistpickem.com/?utm_source=instagram&utm_medium=social&utm_campaign=seo_geo&utm_content=link-in-bio`

X / Threads bios use the same path with `utm_source=x` or `utm_source=threads` and `utm_content=link-in-bio`.

| Beat | `utm_content` | Path |
|------|---------------|------|
| Bio / profile | `link-in-bio` | `/` |
| Card is open | `card-open` | `/` or `/phish-setlist-prediction-game` |
| How Pick'em works | `how-it-works` | `/how-it-works` |
| Scoring / Bustout Boost™ | `how-scoring-works` | `/how-scoring-works` |
| Summer tour-stats | `tour-stats-summer-2026` | `/tour-stats/2026-summer-tour` |
| Tour-stats hub | `tour-stats` | `/tour-stats` |
| Origin / brand | `about` | `/about` |
| Recycled carousel CTA | `evergreen-carousel` | Match the original beat’s path |

**Worked examples**

```
https://www.setlistpickem.com/how-it-works?utm_source=instagram&utm_medium=social&utm_campaign=seo_geo&utm_content=how-it-works
https://www.setlistpickem.com/tour-stats/2026-summer-tour?utm_source=x&utm_medium=social&utm_campaign=seo_geo&utm_content=tour-stats-summer-2026
https://www.setlistpickem.com/about?utm_source=instagram&utm_medium=social&utm_campaign=seo_geo&utm_content=about
https://www.setlistpickem.com/phish-setlist-prediction-game?utm_source=instagram&utm_medium=social&utm_campaign=seo_geo&utm_content=card-open
```

One campaign string for the whole owned program so GA4 / GSC referring-domain notes stay comparable month to month.

---

## Show weeks — 2–4 posts / week

A **show week** is any week with at least one Phish show on the live tour calendar. Target **2–4** owned posts across IG + X (Threads optional). Prefer IG for carousels / Reels; X for short lock + stats beats. Do not 1:1 match competitor volume.

### Slot A — Pre: card is open (required when a card exists)

- **When:** After the show card is open; before lock.
- **Moment:** “Card is open. Lock six slots — opener, closer, opener, closer, encore, wildcard.”
- **CTA:** App / keyword URL with `utm_content=card-open`.
- **Not:** A list of songs we think they should pick.

**IG caption seed**

> Card is open. Lock six slots before showtime — set 1 opener and closer, set 2 opener and closer, encore, and a wildcard. Live scoring, not a tip sheet.  
> https://www.setlistpickem.com/phish-setlist-prediction-game?utm_source=instagram&utm_medium=social&utm_campaign=seo_geo&utm_content=card-open

**X seed**

> Card is open. Lock your six slots, then ride the scores.  
> https://www.setlistpickem.com/?utm_source=x&utm_medium=social&utm_campaign=seo_geo&utm_content=card-open

### Slot B — Mid / post: Bustout Boost™ (when it actually hits)

- **When:** A locked pick earns Bustout Boost™ (correct pick on a song with a **30+ show gap**; **+20** on top of base — `/how-scoring-works`).
- **Moment:** The **score event** (“Boost landed”) plus a link to scoring or tour-stats bustouts.
- **Not:** A full-night setlist recap. Do not paste official setlists.

**IG / X seed**

> Bustout Boost™ is +20 on a 30+ show gap — the longshot slot, not the heavy rotation. How scoring works:  
> https://www.setlistpickem.com/how-scoring-works?utm_source=instagram&utm_medium=social&utm_campaign=seo_geo&utm_content=how-scoring-works

### Slot C — Mid / post: pool boards

- **When:** After scores update; a private pool or the global board has a shareable moment (lead change, tight pack, first lock of the night).
- **Moment:** Screenshot of **in-product** standings (no emails, no other players’ PII beyond display names already on the board).
- **CTA:** Home or how-it-works — invite the crew, don’t dump songs.

### Slot D — Mid / post: tour-stats “most played” / frequency

- **When:** After the tour-stats nightly refresh, or the morning after a run of shows.
- **Moment:** One aggregate already on `/tour-stats/2026-summer-tour` (most played, unique songs, bustout list this tour).
- **CTA:** Summer slug with `utm_content=tour-stats-summer-2026`.
- **Not:** Last night’s full set. Night show notes stay gated; social points at **tour aggregates**.

If the week only supports two posts: **A + one of B/C/D**. If four: A, then B and/or C, then D. Skip B when no Boost hit — do not invent one.

---

## Always-on (beyond show week)

Off-week and between tours, keep the accounts alive so IG/X stay indexable and the bio is not a dead end. **1–3 posts / week** is enough. Recycle show-week winners; do not invent tip-sheet filler.

| Pillar | Angle | Primary URL | `utm_content` |
|--------|-------|-------------|---------------|
| Product education | How Pick'em works — six slots, lock before showtime | `/how-it-works` | `how-it-works` |
| Product education | Scoring + Bustout Boost™ (30+ gap, +20) | `/how-scoring-works` | `how-scoring-works` |
| Product education | Keyword game frame (prediction **game**, not a picks blog) | `/phish-setlist-prediction-game` | `card-open` or `how-it-works` |
| Tour-stats authority | Evergreen “most played / unique / bustouts this tour” from live HTML | `/tour-stats/2026-summer-tour` | `tour-stats-summer-2026` |
| Soft brand | Origin: 2001 tour game → spreadsheet → Setlist Pick'Em (`/about`) | `/about` | `about` |
| Recycle | Best show-week creative → evergreen carousel (same CTA as the original beat) | Match original | `evergreen-carousel` |

**About beat (soft, not spam):** one slide or short post from the `/about` origin — Beaver / Glu / Andy on 2001 tour; six-slot ritual; Pat’s spreadsheet years; now a live game with tour-stats. Quote allowed: “Lock your picks, ride the scores, run with your crew—one show at a time.” Always link `/about` with UTMs. Max **one** origin post per calendar month unless EiC asks for more.

**Recycle rule:** If a show-week Bustout Boost or pool screenshot performed (saves, profile visits, UTM sessions), rebuild as a 4–6 slide carousel in the following off-week. Do not add song-tip slides to “fill” the carousel.

---

## Suggested first L2 cycle (after accounts exist)

Human posts from the **published queue** — Demand Gen does not hit network APIs.

1. **IG** — Slot A (card open) or always-on how-it-works if no card is open.
2. **X** — Same beat, shorter, same `utm_campaign=seo_geo`, `utm_source=x`.
3. Next show week: Slot B or D so tour-stats gets a referring hit.

Seed bodies for Demand Gen (replace nothing about UTMs):

**Instagram (always-on education)**

> Setlist Pick'Em is a scored live game: lock six slots before showtime, then watch points land — including Bustout Boost™ on 30+ show gaps. Not a tip sheet.  
> https://www.setlistpickem.com/how-it-works?utm_source=instagram&utm_medium=social&utm_campaign=seo_geo&utm_content=how-it-works

**X (tour-stats authority)**

> Summer tour stats for pickers: frequency, unique songs, bustouts this tour. Aggregates, not last night’s full set.  
> https://www.setlistpickem.com/tour-stats/2026-summer-tour?utm_source=x&utm_medium=social&utm_campaign=seo_geo&utm_content=tour-stats-summer-2026

---

## L2 CLI (Demand Gen) — dry-run first

Repo module: `python3 -m crew.scripts.social_demand_gen` (skills mention `python3.13`; this environment has `python3` 3.12 — same module).

`--dry-run` prints a pack and **does not write** `crew/output/`. Omit `--dry-run` to persist a draft under `crew/output/demand_gen/social/draft/` (gitignored). **Never** set `CREW_SOCIAL_PUBLISH_ENABLED` or pass `--live` until EiC/CCO kickoff.

### Dry-run (plan only)

```bash
python3 -m crew.scripts.social_demand_gen draft \
  --platform instagram \
  --title "974 always-on how-it-works" \
  --body "Setlist Pick'Em is a scored live game: lock six slots before showtime, then watch points land — including Bustout Boost™ on 30+ show gaps. Not a tip sheet.
https://www.setlistpickem.com/how-it-works?utm_source=instagram&utm_medium=social&utm_campaign=seo_geo&utm_content=how-it-works" \
  --dry-run

python3 -m crew.scripts.social_demand_gen draft \
  --platform x \
  --title "974 tour-stats summer slug" \
  --body "Summer tour stats for pickers: frequency, unique songs, bustouts this tour. Aggregates, not last night’s full set.
https://www.setlistpickem.com/tour-stats/2026-summer-tour?utm_source=x&utm_medium=social&utm_campaign=seo_geo&utm_content=tour-stats-summer-2026" \
  --dry-run
```

### Persist draft → approve → queue (human posts)

```bash
# persist (no --dry-run)
python3 -m crew.scripts.social_demand_gen draft --platform instagram --title "…" --body "…"
python3 -m crew.scripts.social_demand_gen list --status draft

python3 -m crew.scripts.social_demand_gen approve <draft_id> --approver eic   # or cco

# writes crew/output/demand_gen/social/published/ — still a MANUAL post queue
CREW_SOCIAL_PUBLISH_ENABLED=true python3 -m crew.scripts.social_demand_gen publish <draft_id> --live
```

`publish` without `SOCIAL_PUBLISH_WEBHOOK` only writes the local queue. A human copies the pack to IG/X. Do not enable the env flag in CI or on a Cloud Agent unless the owner asked.

Allowed `--platform` values include `instagram`, `x`, `threads` (`crew/tools/social.py`).

---

## Human checklist (not agent-automatable)

Complete before claiming #974 acceptance. Agents must not create network accounts.

- [ ] Create **Instagram Business or Creator** for Setlist Pick'Em (handle + display name aligned with Brand Systems).
- [ ] Optional: **X** and/or **Threads** with the same display name.
- [ ] **Bio** + link-in-bio → `https://www.setlistpickem.com/?utm_source=instagram&utm_medium=social&utm_campaign=seo_geo&utm_content=link-in-bio` (swap `utm_source` on X/Threads).
- [ ] **Brand Systems kit**: avatar, cover, highlight covers, wordmark, caption voice — Brand Systems Partner + this brief; no one-off Canva drift.
- [ ] EiC **approves this cadence brief** (show-week **and** always-on).
- [ ] ≥1 full L2 cycle: `draft` → `approve` → `published/` queue → **posted on the network**.
- [ ] Monthly: note referring-domain / UTM (`utm_campaign=seo_geo`) trend in GSC or a comment on #972 / #974.

---

## Measurement (W4 / W5)

- Goal is a **trend**, not vanity DR.
- Log off-site shares in playbook §5 / §9 or an epic comment when a UTM’d post ships (same habit as #930).
- Do not invent GA4 numbers. Optimize packs stay facts-only (#697).

---

## Out of scope (this brief and #974 execution)

- Agents creating or logging into IG/X/Threads
- Auto-post adapters to Meta / X APIs
- Paid amplification or bought links
- `/phish-picks` doorway (#975)
- Full-night setlists on social
- Google/Bing SERP HTML scraping
- Dashboard IA / `dashboardPageMeta.js` / `docs/DASHBOARD_IA.md`
- App code, Firebase on marketing entry, ScrollToTop / `appBootPath` on `marketingMain`

---

## Remaining #974 acceptance (after this draft)

| AC | Owner | This PR |
|----|--------|---------|
| Cadence brief on disk (show-week + always-on, UTMs, CLI) | Demand Gen / Marketing | **Yes — draft** |
| EiC approval of the brief | EiC | No |
| Accounts live + bio UTMs + Brand Systems kit | Human + Brand Systems | No |
| ≥1 posted L2 cycle | Human after approve | No |
| Monthly GSC / UTM note | Reporting / GPM | No |
