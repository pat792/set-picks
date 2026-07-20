# Leadership Ops Crew (CrewAI)

**Epic:** [#695](https://github.com/pat792/set-picks/issues/695)  
**Canon:** [`docs/LEADERSHIP_CREW.md`](../docs/LEADERSHIP_CREW.md)  
**Maturity:** **L0** — design scaffold; tools default to dry-run; no live scrape/post/BD/affiliate injection.

This folder is a **flexible** multi-agent workspace. Roles and pipelines are hypotheses: adapt them as the team learns (update agents/pipelines + the doc Changelog + comment on #695).

## Requirements

- Python **3.10–3.13** (3.14 is out of range for CrewAI). On this machine: `python3.13`.
- [`uv`](https://github.com/astral-sh/uv) recommended.

```bash
# CLI (once)
uv tool install crewai --python 3.13

cd crew
cp .env.example .env   # add keys when you want live LLM runs
uv venv --python 3.13
source .venv/bin/activate
uv pip install -e .
```

L0 is useful **without** an LLM run: agents, pipelines, Cursor skills, and tool stubs are the deliverable.

## Layout

| Path | Purpose |
|------|---------|
| `crew.jsonc` | Default crew metadata (`optimize`) |
| `agents/*.jsonc` | Role definitions (living) |
| `pipelines/*.jsonc` | Task graphs per workflow |
| `tools/stubs.py` | Dry-run tool interfaces |
| `knowledge/` | Allowlists + pointers |
| `output/` | Gitignored run artifacts |

## Pipelines

| File | When |
|------|------|
| `pipelines/optimize.jsonc` | Default — Optimize oversight |
| `pipelines/campaign.jsonc` | Campaign brief |
| `pipelines/revenue.jsonc` | Revenue framework v0 |
| `pipelines/market_intel.jsonc` | Market intel (L1-ready design) |
| `pipelines/sponsor_bd.jsonc` | Sponsor BD plan drafts |
| `pipelines/affiliate_e2e.jsonc` | Affiliate program proposal |

Wire a pipeline into your CrewAI runner of choice (JSON-first or classic). Until a thin `main.py` runner is added in a follow-up, treat pipeline JSON as the **source of truth** for task order and use Cursor leadership skills for chat execution.

## Tools (L0)

```python
from tools.stubs import web_fetch_allowlisted, social_publish

web_fetch_allowlisted("https://www.setlistpickem.com/")  # dry_run plan
social_publish("x", "hello", dry_run=True, approved=False)  # blocked publish
```

## Cursor skills

Mirrored under `.cursor/skills/<role-kebab>/SKILL.md`. Meta router: `leadership-crew`.

## Adaptability

After a run: note learnings → update this README or `docs/LEADERSHIP_CREW.md` Changelog → comment on #695. Merge/rename agents freely; keep RACI honest.
