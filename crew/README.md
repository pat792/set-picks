# Leadership Ops Crew (CrewAI)

**Epic:** [#695](https://github.com/pat792/set-picks/issues/695)  
**Canon:** [`docs/LEADERSHIP_CREW.md`](../docs/LEADERSHIP_CREW.md)  
**Maturity:** **L1** research + **L2** human-gated social/BD publish queue. Affiliate inject still L3.

This folder is a **flexible** multi-agent workspace. Roles and pipelines are hypotheses: adapt them as the team learns (update agents/pipelines + the doc Changelog + comment on #695).

## Requirements

- Python **3.10–3.13** (3.14 is out of range for CrewAI). On this machine: `python3.13`.
- [`uv`](https://github.com/astral-sh/uv) recommended.

```bash
# CLI (once)
uv tool install crewai --python 3.13   # optional global CLI

cd crew
cp .env.example .env   # add OPENAI_API_KEY (required for live kickoff)
uv venv --python 3.13
source .venv/bin/activate
uv pip install -e .    # or: uv pip install 'crewai>=0.80.0'
```

## Run crew agents (LLM)

```bash
crew/.venv/bin/python -m crew.scripts.run_pipeline --list
crew/.venv/bin/python -m crew.scripts.run_pipeline smoke --smoke
crew/.venv/bin/python -m crew.scripts.run_pipeline smoke
```

### Optimize (evidence-backed — issue #697)

**Default for now:** Cursor GA4 MCP → snapshot file → embed in kickoff (not gcloud ADC).

Snapshot **must** include recipe sections A–C in [`knowledge/optimize_snapshot_recipe.md`](knowledge/optimize_snapshot_recipe.md) (aggregates + trigger×channel + email UTM). Pipeline task `challenge_evidence` blocks unqualified email “open cliff” claims when §C is missing.

```bash
# After saving an MCP export (or regenerating via --from-file):
crew/.venv/bin/python -m crew.scripts.ga4_snapshot --from-file path/to/mcp-export.md
crew/.venv/bin/python -m crew.scripts.run_pipeline optimize \
  --input optimize_for=picks_lock --input window=last_7_days \
  --ga4-snapshot crew/output/intel/ga4-….md
```

See `docs/GA4_MCP_SETUP.md` §5. Results: `crew/output/runs/optimize-<stamp>/final.md` + `tasks/`. Cite snapshot only — no invented metrics.

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

## Tools

```python
from crew.tools import web_fetch_allowlisted, social_draft_pack, social_publish

web_fetch_allowlisted("https://www.setlistpickem.com/llms.txt", dry_run=False)  # L1 GET
social_draft_pack("x", "Lock your picks.", dry_run=False)  # persists draft
social_publish(draft_id="…", dry_run=True)  # plan only until approved + env
```

### Market intel sweep (L1)

```bash
python3.13 -m crew.scripts.market_intel_sweep --dry-run
python3.13 -m crew.scripts.market_intel_sweep
```

Artifacts: `crew/output/intel/` (gitignored).

### Social / BD demand gen (L2)

```bash
python3.13 -m crew.scripts.social_demand_gen draft --platform x --body "Show night. Lock your picks."
python3.13 -m crew.scripts.social_demand_gen approve <draft_id> --approver eic
CREW_SOCIAL_PUBLISH_ENABLED=true python3.13 -m crew.scripts.social_demand_gen publish <draft_id> --live
python3.13 -m crew.scripts.social_demand_gen list
```

Publish writes `crew/output/demand_gen/<kind>/published/` (manual post queue). Optional `SOCIAL_PUBLISH_WEBHOOK` POSTs JSON after gates pass.

```bash
python3.13 -m unittest discover -s crew/tests -v
```
## Cursor skills

Mirrored under `.cursor/skills/<role-kebab>/SKILL.md`. Meta router: `leadership-crew`.

## Adaptability

After a run: note learnings → update this README or `docs/LEADERSHIP_CREW.md` Changelog → comment on #695. Merge/rename agents freely; keep RACI honest.
