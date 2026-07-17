# Comms Optimize autonomy (L0 playbook)

**Epic:** [#573](https://github.com/pat792/set-picks/issues/573)  
**Status:** L0 — playbook documented. Agents run Optimize when invoked; PM still kicks every session.  
**Does not replace:** automated **delivery** (`deliverCommsTrigger` / epic #441). This doc is the **editorial + measurement + recommendation** loop.

---

## Kickoff

```text
Run Optimize for goal <optimize_for> covering <date window / show dates>
```

| Input | Examples |
|-------|----------|
| `optimize_for` | `picks_lock` · `return_14d` · `tour_retention` · `push_opt_in` · `email_open` · `show_recap_uniqueness` |
| Window | Show dates (YYYY-MM-DD…) or “last completed show week” |
| Constraints | Draft-only; PR base **`staging`**; never `comms:deploy` / never merge without PM |

Post the finished pack as a comment on **#573** (and link any draft PRs).

---

## Cycle order (always)

```text
comms-analyst → comms-triggers → comms-drafter → comms-architect → PM
```

| Step | Skill | Does |
|------|-------|------|
| 1 | **analyst** | GA4 + delivery-log funnels, gaps, recommendations slot |
| 2 | **triggers** | Catalog proposals (new / deprecate / experiment) tied to goal |
| 3 | **drafter** | Optional **draft** PR for low-risk copy (`content/comms` + builders) |
| 4 | **architect** | Flag missing ingest / adapter / var wiring; dry-run notes |
| 5 | **PM** | Approve/reject PRs + recommendations; set next `optimize_for` |

Agents **open draft PRs and proposal issues only**. They do **not** auto-merge, auto-approve, or production-deploy.

---

## Night vs tour boundary

| Surface | Issue | Trigger / template | When |
|---------|-------|--------------------|------|
| **Night show recap** | [#572](https://github.com/pat792/set-picks/issues/572) | `show_recap` (+ morning absorb) | After a single show grades |
| **End-of-tour recap** | [#510](https://github.com/pat792/set-picks/issues/510) | `tour_recap` (generalize Sphere edition) | When a tour’s final show grades |

Do **not** put tour-length narrative into night `show_recap`, or night setlist flow into `tour_recap`. Sphere ’26 is an **edition archive / QA replay**, not the permanent production trigger.

---

## Data spine (facts only — no invented setlist lore)

| Source | Path / doc | Use in Optimize |
|--------|------------|-----------------|
| Official setlists | `docs/OFFICIAL_SETLISTS_SCHEMA.md` · `official_setlists/{showDate}` | Slots, `officialSetlist`, `bustouts`, `songGaps` |
| Tour calendar | `show_calendar` / `showDatesByTour` | Tour membership, final-show detection |
| Show context | `docs/COMMS_SHOW_CONTEXT_SCHEMA.md` · `comms_show_context/{showDate}` | Deterministic night highlights (#572) |
| Measurement | `docs/comms-triggers/MEASUREMENT_PLAN.md` | Deliver → open → CTA |
| Delivery | `functions/commsDelivery.js` + workers | Prefs, dedup, fatigue, canary/`dryRun` |

**Composer rule (v1):** build `setlist_highlight` (and related vars) **deterministically** from the spine. No LLM freeform “what the night felt like” until L3+ and only on approved fact slots.

---

## Draft-only write surface

| Allowed | Forbidden |
|---------|-----------|
| Draft PR to **`staging`** | Merge without PM |
| `[SKIP-PRD]` child issues / catalog `planned` rows | Production `comms:deploy` from an agent |
| War Room / `runCommsTrigger` canaries (`dryRun` default) | Resend MCP / ad-hoc production sends |
| Pack comment on #573 | Changing prefs/caps/dedup without architect + PM |

---

## PM review pack template (every cycle)

Agents **must** use this shape:

```markdown
## Comms Optimize pack — <YYYY-MM-DD> (goal: <goal>)

### Summary
<2–3 sentences>

### Funnels
| trigger_id | delivered | opened | CTA | Δ vs prior |

### Gaps
- …

### Draft changes
- PR(s): …
- Canaries: …

### Recommendations (new / change)
1. … → goal: … → metric: …
2. …

### Show-recap uniqueness (when #572 ready)
- tags/branches: …
- samples: …
- canaries: …

### Maturity note
- Current ladder level: L0–L4
- Blockers to next level: …

### Ask for PM
- [ ] Approve / request changes on draft PR(s)
- [ ] Accept / reject recommendations (log on epic)
- [ ] Pick goal inputs for next cycle
```

---

## Maturity ladder (pointer)

Full L0→L4 table lives on [#573](https://github.com/pat792/set-picks/issues/573). This playbook exits **L0**. Next: **L1** on-demand pack end-to-end (Action 2 on the epic).

Related Wave 5 siblings: [#512](https://github.com/pat792/set-picks/issues/512) (email open signal), [#513](https://github.com/pat792/set-picks/issues/513) (prefs hub).
