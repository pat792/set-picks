# #974 addendum — Owned-social autonomy (create vs manage)

**Status:** draft (ops — not a maturity promotion)  
**Date:** 2026-09-03  
**Parent:** `content/marketing/974-owned-social-cadence-brief.md`  
**Issue:** #974 · epic #972 · crew epic #695  
**Does not change:** L2 gates, `docs/LEADERSHIP_CREW.md` maturity, or Meta/X API adapters in-repo

---

## Split the problem

| Job | Can crew automate? | Why |
|-----|-------------------|-----|
| **Create** IG / X / Threads accounts | **No** | Phone/email CAPTCHA, identity, Business verification. Meta and X ToS forbid automated signup. Browser bots get banned. |
| **Kit** the profile (handle, bio, UTM, avatar) | **Assist only** | Agents draft copy + asset list. A human pastes into the native apps once. |
| **Draft + approve** posts | **Yes today** | `social_demand_gen` L2 queue. |
| **Publish** to the network | **Not yet** | `publish` writes a local queue. Optional `SOCIAL_PUBLISH_WEBHOOK` is the designed hook — unused until you connect a publisher. |
| **Manage** after OAuth (schedule, insights) | **Yes, after you connect** | Human OAuth once; then approved packs can post without copy-paste. |

Autonomy here means **approved packs go live without you opening Instagram**. It does **not** mean agents create or log into network accounts.

---

## Phase 0 — Human bootstrap (one sitting, ~45 min)

Do this in the native apps on your phone. Do not script it.

1. **Instagram** → Professional account → **Business** (or Creator). Display name **Setlist Pick'Em**. Handle: prefer `setlistpickem` (or closest available; record the live handle on #974).
2. **Facebook Page** with the same display name. Link the IG Business account to that Page (required for later Graph / Meta Business Suite / most schedulers).
3. **Threads** from the same IG account if you want it. Same display name.
4. **X** → same display name + handle. Do not use a personal account as the brand unless you convert it and accept the risk.
5. **Bios + link-in-bio** from [`974-owned-social-profile-pack.md`](./974-owned-social-profile-pack.md) (EiC-approved strings; UTM contract — `utm_campaign=seo_geo`):

   `https://www.setlistpickem.com/?utm_source=instagram&utm_medium=social&utm_campaign=seo_geo&utm_content=link-in-bio`

   Swap `utm_source` to `x` / `threads` on those bios.
6. **Brand Systems kit** — avatar, cover, highlight covers, wordmark. Brand Systems Partner drafts; you upload. No one-off Canva drift.
7. Comment the live handles + bio URLs on #974. Agents still must not log in.

Until this lands, #974 acceptance stays open and crew `publish` is a folder, not a post.

---

## Phase 1 — Autonomy you already have (no new code)

Keep the L2 loop. A human is the last mile.

```bash
python3 -m crew.scripts.social_demand_gen draft --platform instagram --title "…" --body "…"
python3 -m crew.scripts.social_demand_gen approve <id> --approver eic
CREW_SOCIAL_PUBLISH_ENABLED=true python3 -m crew.scripts.social_demand_gen publish <id> --live
```

Then paste from `crew/output/demand_gen/social/published/` into IG/X.

This is the correct default until the first live post exists and EiC has approved the cadence brief.

---

## Phase 2 — Real posting autonomy (connect, do not rebuild)

Goal: `publish` POSTs an approved pack to a **publisher you own**, instead of a local JSON file.

The hook is already in `crew/tools/social.py`:

```bash
# crew/.env (never commit)
CREW_SOCIAL_PUBLISH_ENABLED=true
SOCIAL_PUBLISH_WEBHOOK=https://<your-publisher>/hooks/social
```

**Recommended order (Integrations Architect, not a Cloud Agent):**

1. Pick a **scheduler / social API aggregator** that already holds Meta + X OAuth (examples: Postiz, Ayrshare, Buffer, Later, or a self-hosted n8n/Make scenario). Do not start with a first-party Meta Graph + X API v2 app unless you want App Review and paid X tiers now.
2. In that tool, connect **Instagram (via Facebook Page)** and **X** with **your** login. Tokens live in the publisher, not in this repo.
3. Add a thin webhook that maps the crew payload (`platform`, `title`, `body`, `id`) to that tool’s create-post API. Keep `dry_run` / approval gates; do not bypass `approve`.
4. Run one **approved** pack with `CREW_SOCIAL_PUBLISH_ENABLED=true` and confirm it appears as a scheduled or published post.
5. Only then treat “human copy-paste” as optional.

**Keep gated:** EiC/CCO `approve` before webhook fire. Do not enable the env flag in CI or on Cloud Agents. Do not add in-repo Meta/X SDK adapters in this phase.

---

## Phase 3 — First-party APIs (only if Phase 2 is too limiting)

Needed only for insights pull-back, Stories/Reels constraints, or leaving the scheduler.

| Network | What you actually need | Human still required |
|---------|------------------------|----------------------|
| Instagram | Meta Business / Developer app → Instagram Graph **Content Publishing** → App Review for production | Business verification, Page admin, token refresh |
| X | X Developer Project + App, write scopes, current paid API tier | Developer portal, billing, OAuth |
| Threads | Threads API via the same Meta app (after IG is Professional) | Same Meta admin |

RACI if this ships: **CTO / Integrations Architect** designs; **CCO / EiC** remain the publish gate; **Brand Systems** owns kit; **Reporting** notes UTM/`seo_geo` monthly. Promote crew maturity only with evidence (successful live posts, no brand incidents) — do not jump L2 → “unattended create+post.”

Out of scope forever: automated **account creation**, buying aged accounts, logging in as the user, or Playwright against instagram.com / x.com signup.

---

## What “done” looks like for #974 vs autonomy

| Outcome | Owner | Blocks #974 AC? |
|---------|-------|-----------------|
| Accounts live + UTM bios + kit | You + Brand Systems | **Yes** |
| ≥1 L2 cycle posted on the network | You after EiC approve | **Yes** |
| Webhook auto-posts approved packs | Integrations, later | No — Phase 2, after AC |
| Agents create accounts | Nobody | Never |

---

## Explicitly not this brief

- Enabling `CREW_SOCIAL_PUBLISH_ENABLED` in CI
- Building Meta/X adapters in `crew/tools/`
- Paid amplification
- Changing Leadership Ops maturity in `docs/LEADERSHIP_CREW.md`
