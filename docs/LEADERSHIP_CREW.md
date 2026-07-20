# Leadership Ops Crew

**Epic:** [#695](https://github.com/pat792/set-picks/issues/695)  
**Surfaces:** CrewAI (`crew/`) + Cursor skills (`.cursor/skills/`)  
**Sits above:** Comms execution squad — `comms-analyst` → `comms-triggers` → `comms-drafter` → `comms-architect`  
**Status:** **L1** for market intel (allowlisted read-only fetch); social/BD publish still **L0/L2-gated**; affiliate inject still **L3**

---

## Flexibility & learning (operating principles)

This org is a **living operating system**, not a frozen chart. As the product and team mature:

1. **Roles are hypotheses.** Add, merge, rename, or retire agents when RACI or pipeline runs prove the structure wrong. Prefer small edits to this doc + agent JSON over big-bang rewrites.
2. **Maturity is explicit (L0–L3).** Promote a capability only with evidence and guardrails; **demote** if live actions create risk or noise.
3. **Pipelines are experiments.** After each meaningful run, capture: what worked, what blocked, what to change next — comment on [#695](https://github.com/pat792/set-picks/issues/695) and/or append § [Changelog](#changelog).
4. **Dotted lines beat org politics.** Bridge roles (CoS, GPM, RevOps, Brand Systems) exist so peer chiefs do not fork truth.
5. **No premature automation.** Default is draft-only. L2 publish and L3 affiliate/sponsor e2e require explicit enablement and Phase 3 gates where in-product commercial applies.
6. **Execution stays in the squad.** Leadership briefs and oversees; the existing Cursor comms skills still open draft PRs to `staging`. Leadership agents do not replace them.

---

## Maturity ladder

| Level | Meaning | Live side effects |
|-------|---------|-------------------|
| **L0** | Agents, skills, RACI, pipelines, dry-run tool stubs | None |
| **L1** | Allowlisted public-web research → structured intel | Read-only HTTP |
| **L2** | Human-gated social / BD publish | Post/send only after approval |
| **L3** | Affiliate/sponsor e2e + in-product slots | Requires [COMMERCIAL_PHASE3.md](./comms-triggers/COMMERCIAL_PHASE3.md) |

**Current: L1 research enabled** via `web_fetch_allowlisted(..., dry_run=False)` and `python3.13 -m crew.scripts.market_intel_sweep`. Tools still default to `dry_run: true`. Social publish / affiliate inject remain blocked.

---

## Why four chiefs

Maps to **TTDMOM** ([FRAMEWORK.md](./comms-triggers/FRAMEWORK.md)):

| Chief | Owns | Failure if missing |
|-------|------|--------------------|
| **CCO** | Intent, voice, Optimize goals, demand-gen social | Wrong message, brand drift |
| **CTO** | Deliver systems, UI/design, integrations | Nowhere safe to land copy |
| **CDO** | Measure, insights, data architecture, intel quality | Optimize on vibes |
| **CRO** | Monetize framework, BD, affiliates, lead gen | Premature or unmeasured monetization |

**Architecture split:** CDO = data/event contracts; CTO = product/system + UI. They co-own boundary schemas (e.g. `comms_delivered`).

---

## Hierarchy

```text
C-suite (peers):  CCO · CRO · CDO · CTO

CCO ── Editor in Chief
    ├── Marketing Specialist
    ├── Social Media Specialist → Social Demand Gen Operator
    └── Comms Orchestration Lead → existing Cursor comms squad

CRO ── Business Analyst
    ├── Sponsor BD Orchestrator
    ├── Affiliate Program Manager
    ├── Lead Gen Specialist
    └── Monetization Strategist

CDO ── Customer Insights Analyst
    ├── Reporting Lead
    ├── Data Architect
    └── Market Intelligence Operator

CTO ── Software Architect
    ├── Product Design Lead
    └── Integrations Architect

Bridges (dotted): Chief of Staff · Growth Program Manager · RevOps Lead · Brand Systems Partner
```

### RACI (high-signal)

| Work | A | R | C |
|------|---|---|---|
| Optimize pack | Growth Program Manager | EiC, Reporting, Insights | CCO (goal), Software Architect |
| Campaign / demand gen | EiC (publish gate) | Marketing, Social Demand Gen | Brand Systems, Market Intel |
| Revenue framework v0 | CRO | BA, Monetization Strategist, RevOps | CDO, CCO, CTO, EiC |
| Sponsor BD plan | CRO | Sponsor BD, Lead Gen | Monetization Strategist, EiC |
| Affiliate e2e proposal | RevOps (coherence) | Affiliate Program Manager | Integrations, Data Architect, CCO |
| Market intel sweep | CDO | Market Intelligence Operator | Insights, Marketing |

**Guardrails:** draft-only default; PR base `staging`; never merge/deploy from agents; no ad-hoc Resend; no live social/BD without L2 approval; commercial/affiliate in-product only after Phase 3; night `show_recap` ≠ tour `tour_recap`; scrape allowlist only; facts-only setlists.

---

## Pipelines

| Id | Default agents (subset) | Output |
|----|-------------------------|--------|
| `optimize` | CoS → GPM → CCO → Reporting/Insights → EiC → Software Architect | PM pack + squad kickoff language |
| `campaign` | CCO → Insights → Marketing ∥ Social Demand Gen → Brand Systems → EiC → Reporting | `campaign-brief.md` |
| `revenue` | CRO → RevOps → BA + Monetization → CDO → CCO → Integrations → EiC | `revenue-framework-v0.md` |
| `market_intel` | Market Intel → Insights → Marketing digest | `intel/…` |
| `sponsor_bd` | Lead Gen + Sponsor BD → Monetization → CRO → EiC | `bd/sponsor-plan.md` |
| `affiliate_e2e` | Affiliate PM → RevOps → Data Architect → Integrations → Design → CCO/EiC | `affiliate/program-spec.md` |

Default CrewAI run: **`optimize`**.

### Kickoff prompts

**Cursor (Optimize oversight):**

```text
Using docs/LEADERSHIP_CREW.md and the leadership skills (Growth Program Manager + CCO + Editor in Chief),
run Optimize oversight for goal picks_lock covering the last 7 complete days.
Produce a PM review pack handoff for the comms squad; draft-only; do not merge or deploy.
```

**Terminal (after L0 install):**

```bash
cd crew && crewai run          # optimize
# See crew/README.md for other pipelines
```

---

## Mapping to existing skills

| Leadership role | Invokes when executing |
|-----------------|------------------------|
| Comms Orchestration Lead | `comms-analyst`, `comms-triggers`, `comms-drafter`, `comms-architect` |
| Software Architect | `comms-architect` for delivery review |
| Reporting Lead / Insights | `comms-analyst` + GA4 MCP for numbers |

---

## How to adapt (playbook)

When something feels wrong:

1. Run or simulate the pipeline once with the current roles.
2. Write a short learning note (blocker, duplicate ownership, missing seat).
3. Propose a minimal change: merge two agents, add a dotted line, or split a pipeline step.
4. Update this doc § Changelog + agent JSON / skill frontmatter in the same PR.
5. Comment on [#695](https://github.com/pat792/set-picks/issues/695).

Do **not** wait for a perfect org before shipping L1 research tools.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-20 | L0 scaffold: doc, `crew/`, Cursor skills, epic #695 — flexibility/learning principles documented |
| 2026-07-20 | L1: allowlisted HTTP fetch + `market_intel_sweep` script; tests; status promoted for research only |
