# #974 — Social creative path (Canva)

**Status:** draft (Brand Systems + Integrations — not a maturity promotion)  
**2026-09-23 session:** Canva MCP connected. `slot-card` is the Canva master (`DAHWEIn-uPI`). The cadence brief was EiC-approved the same day. Demand Gen has not yet written a `social_demand_gen` pack, and the frame has not been posted.  
**Date:** 2026-09-23  
**Issue:** #974 · epic #972 · crew epic #695  
**Parents:** [`974-owned-social-cadence-brief.md`](./974-owned-social-cadence-brief.md) · [`974-execution-next-2026-09-11.md`](./974-execution-next-2026-09-11.md)  
**Does not:** authorize a live post. The cadence brief was approved separately on 2026-09-23. Canva is connected.

Copy already has a path (`social_demand_gen` → caption + URL). Creative does not. This note is how to add it without a new role or a freeform design bot.

---

## Recommendation

Connect **Canva’s remote design MCP** to this Cursor account and fill **locked templates**. Do not add a second image generator, and do not treat Canva’s Dev MCP as the design tool.

| Server | URL / command | Use |
|--------|----------------|-----|
| Remote design MCP | `https://mcp.canva.com/mcp` | Create, edit, search, export designs in the signed-in Canva account. This is the integration. |
| Dev MCP | `npx @canva/cli mcp` | Docs for building Canva apps. Not a post designer. |

Official reference: [Canva MCP](https://www.canva.dev/docs/mcp/) · [MCP tools and plan limits](https://www.canva.dev/docs/mcp/tools/). This workspace has neither server connected.

`generate-design` and `export-design` work on all Canva plans. Brand templates and brand kits need **Pro or above**. Autofill (`autofill-design`) is **Enterprise only** — skip it. OAuth is per user in the browser. Tokens stay in Canva’s session, not in this repo.

The existing “no one-off Canva” rule still holds. It forbids a new layout every post. A fixed template that only swaps the line of copy is the governed version of Canva.

---

## Roles (no new seat)

| Role | Job |
|------|-----|
| **Brand Systems Partner** | Owns the template. Locks layout, type, and the vinyl / gradient from `public/branding/`. Reviews the export before EiC sees the pack. Moves from Consulted to Responsible for the visual on campaign work. |
| **Social Demand Gen** | Still owns the caption, platform, and UTM. Adds a creative block to the pack: template name, Canva design link, export path. Does not invent a new layout. |
| **Editor in Chief** | Still the publish gate. Approves copy and the exported frame together. |
| **Integrations Architect** | Connects the MCP (and later a Canva Connect app only if the CLI must export without a chat). Does not build a Meta/X poster in the same step. |
| **Product Design Lead** | Consulted once, so the Canva brand kit matches the splash vinyl and gradient wordmark. |

Social Media Specialist still picks the slot (how-it-works, card open, tour-stats). That choice names which template to fill. The run order is [`974-social-post-loop.md`](./974-social-post-loop.md).

---

## What “integrated” means

1. You sign into Canva once from Cursor (remote MCP via OAuth).
2. Brand Systems locks a **menu** of layouts, not one frame. Spec: [`974-social-template-menu.md`](./974-social-template-menu.md). First build is `slot-card` at 1080×1350.
3. Demand Gen writes the caption as it does today.
4. The agent fills that template and exports a PNG next to the draft pack.
5. EiC approves. You upload the PNG with the caption. Highlights and carousels reuse the same template family later.

The local pack in `crew/tools/social.py` is still `platform` + `body` only. Until that JSON grows a `creative` field, the export lives beside the pack as a file path in the marketing note for that post. Do not block the first post on a schema change.

---

## Explicitly later

- Canva Connect autofill (Enterprise) so `social_demand_gen publish` exports without a chat.
- `SOCIAL_PUBLISH_WEBHOOK` attaching the PNG to a scheduler.
- Highlight-cover templates (four titles). Those wait until a Story exists.
- A repo image pipeline (`generate:og-card` is for the link preview, not a post frame).

---

## Do not

- Connect the Dev MCP and expect designs.
- Let `generate-design` freestyle a new look per post.
- Put Canva tokens or the OAuth client secret in git.
- Auto-post the export to Instagram.
