"""Load agents/*.jsonc + pipelines/*.jsonc and kickoff a CrewAI crew.

Usage (from repo root):

  crew/.venv/bin/python -m crew.scripts.run_pipeline smoke --smoke
  crew/.venv/bin/python -m crew.scripts.ga4_snapshot --window last_7_days
  crew/.venv/bin/python -m crew.scripts.run_pipeline optimize \\
    --input optimize_for=picks_lock --input window=last_7_days \\
    --ga4-snapshot crew/output/intel/ga4-picks_lock-….md
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

CREW_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = CREW_ROOT.parent
AGENTS_DIR = CREW_ROOT / "agents"
PIPELINES_DIR = CREW_ROOT / "pipelines"
OUTPUT_DIR = CREW_ROOT / "output" / "runs"
INTEL_DIR = CREW_ROOT / "output" / "intel"


def _strip_jsonc(text: str) -> str:
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    lines = []
    for line in text.splitlines():
        if "//" in line:
            in_str = False
            out = []
            i = 0
            while i < len(line):
                ch = line[i]
                if ch == '"' and (i == 0 or line[i - 1] != "\\"):
                    in_str = not in_str
                    out.append(ch)
                elif ch == "/" and i + 1 < len(line) and line[i + 1] == "/" and not in_str:
                    break
                else:
                    out.append(ch)
                i += 1
            lines.append("".join(out))
        else:
            lines.append(line)
    return "\n".join(lines)


def load_jsonc(path: Path) -> dict[str, Any]:
    return json.loads(_strip_jsonc(path.read_text(encoding="utf-8")))


def load_dotenv() -> None:
    env_path = CREW_ROOT / ".env"
    if not env_path.is_file():
        return
    try:
        from dotenv import load_dotenv as _load

        _load(env_path, override=False)
    except ImportError:
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


def has_llm_credentials() -> bool:
    return bool(
        (os.environ.get("OPENAI_API_KEY") or "").strip()
        or (os.environ.get("ANTHROPIC_API_KEY") or "").strip()
        or (os.environ.get("GEMINI_API_KEY") or "").strip()
    )


def list_pipelines() -> list[str]:
    return sorted(p.stem for p in PIPELINES_DIR.glob("*.jsonc"))


def validate_pipeline(pipeline_id: str) -> dict[str, Any]:
    pipeline_path = PIPELINES_DIR / f"{pipeline_id}.jsonc"
    if not pipeline_path.is_file():
        raise FileNotFoundError(
            f"Unknown pipeline '{pipeline_id}'. Available: {', '.join(list_pipelines())}"
        )
    pipeline = load_jsonc(pipeline_path)
    agent_ids = list(pipeline.get("agents", []))
    for agent_id in agent_ids:
        agent_path = AGENTS_DIR / f"{agent_id}.jsonc"
        if not agent_path.is_file():
            raise FileNotFoundError(f"Missing agent file: {agent_path}")
        load_jsonc(agent_path)
    for task_spec in pipeline.get("tasks", []):
        agent_id = task_spec["agent"]
        if agent_id not in agent_ids:
            raise KeyError(
                f"Task {task_spec.get('id')} references agent {agent_id} "
                f"not listed in pipeline.agents"
            )
    return pipeline


def build_crew(pipeline_id: str, *, verbose: bool = True):
    from crewai import Agent, Crew, Process, Task

    pipeline = validate_pipeline(pipeline_id)
    agents_by_id: dict[str, Any] = {}
    for agent_id in pipeline.get("agents", []):
        spec = load_jsonc(AGENTS_DIR / f"{agent_id}.jsonc")
        agents_by_id[agent_id] = Agent(
            role=spec["role"],
            goal=spec["goal"],
            backstory=spec.get("backstory") or spec["goal"],
            verbose=verbose and bool(spec.get("verbose", True)),
            allow_delegation=bool(spec.get("allow_delegation", False)),
        )

    tasks: list[Any] = []
    for task_spec in pipeline.get("tasks", []):
        agent_id = task_spec["agent"]
        tasks.append(
            Task(
                description=task_spec["description"]
                + "\n\nUse kickoff inputs (optimize_for, window, ga4_snapshot_path, ga4_snapshot). "
                "Stay draft-only; never claim to have merged, deployed, or sent production messages. "
                "Never invent metrics — cite ga4_snapshot or write unknown.",
                expected_output=task_spec["expected_output"],
                agent=agents_by_id[agent_id],
            )
        )

    ordered_agents = [agents_by_id[a] for a in pipeline["agents"] if a in agents_by_id]
    crew = Crew(
        agents=ordered_agents,
        tasks=tasks,
        process=Process.sequential,
        verbose=verbose,
    )
    return crew, pipeline


def latest_ga4_snapshot() -> Path | None:
    if not INTEL_DIR.is_dir():
        return None
    candidates = sorted(INTEL_DIR.glob("ga4-*.md"), key=lambda p: p.stat().st_mtime, reverse=True)
    return candidates[0] if candidates else None


def resolve_ga4_snapshot(explicit: str | None) -> Path | None:
    if explicit:
        path = Path(explicit)
        if not path.is_file():
            raise FileNotFoundError(f"GA4 snapshot not found: {path}")
        return path
    return latest_ga4_snapshot()


def write_result(
    pipeline_id: str,
    result: Any,
    inputs: dict[str, str],
    *,
    task_outputs: list[tuple[str, str]] | None = None,
) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    run_dir = OUTPUT_DIR / f"{pipeline_id}-{stamp}"
    run_dir.mkdir(parents=True, exist_ok=True)

    text = getattr(result, "raw", None) or str(result)
    final_path = run_dir / "final.md"
    body = [
        f"# Crew run — `{pipeline_id}` — {stamp}",
        "",
        f"- **Epic:** #695 · **Issue:** #697",
        f"- **Inputs:** `{json.dumps({k: v for k, v in inputs.items() if k != 'ga4_snapshot'})}`",
        "",
        "## Result",
        "",
        text,
        "",
    ]
    if inputs.get("ga4_snapshot_path"):
        body.insert(4, f"- **GA4 snapshot:** `{inputs['ga4_snapshot_path']}`")
    final_path.write_text("\n".join(body), encoding="utf-8")

    # Also keep legacy flat path for convenience
    flat = OUTPUT_DIR / f"{pipeline_id}-{stamp}.md"
    flat.write_text(final_path.read_text(encoding="utf-8"), encoding="utf-8")

    if task_outputs:
        tasks_dir = run_dir / "tasks"
        tasks_dir.mkdir(exist_ok=True)
        index = ["# Task outputs", ""]
        for i, (name, content) in enumerate(task_outputs, start=1):
            safe = re.sub(r"[^a-zA-Z0-9_-]+", "_", name)[:80] or f"task_{i}"
            path = tasks_dir / f"{i:02d}-{safe}.md"
            path.write_text(
                f"# Task {i}: {name}\n\n{content}\n",
                encoding="utf-8",
            )
            index.append(f"{i}. [{name}]({path.name})")
        (tasks_dir / "README.md").write_text("\n".join(index) + "\n", encoding="utf-8")

    return final_path


def extract_task_outputs(result: Any, crew: Any) -> list[tuple[str, str]]:
    outputs: list[tuple[str, str]] = []
    tasks = getattr(crew, "tasks", None) or []
    for task in tasks:
        name = getattr(task, "description", None) or getattr(task, "name", None) or "task"
        # first line of description as short name
        short = str(name).split("\n", 1)[0][:100]
        out = getattr(task, "output", None)
        if out is None:
            continue
        raw = getattr(out, "raw", None) or str(out)
        outputs.append((short, raw))
    if not outputs and getattr(result, "tasks_output", None):
        for i, item in enumerate(result.tasks_output, start=1):
            raw = getattr(item, "raw", None) or str(item)
            outputs.append((f"task_{i}", raw))
    return outputs


def parse_inputs(pairs: list[str] | None) -> dict[str, str]:
    out: dict[str, str] = {}
    for pair in pairs or []:
        if "=" not in pair:
            raise SystemExit(f"Invalid --input {pair!r}; expected key=value")
        k, _, v = pair.partition("=")
        out[k.strip()] = v.strip()
    return out


def main(argv: list[str] | None = None) -> int:
    if str(REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(REPO_ROOT))

    load_dotenv()

    parser = argparse.ArgumentParser(description="Run a Leadership Ops Crew pipeline")
    parser.add_argument("pipeline", nargs="?", default="smoke")
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--smoke", action="store_true")
    parser.add_argument("--input", action="append", dest="inputs")
    parser.add_argument("--quiet", action="store_true")
    parser.add_argument(
        "--ga4-snapshot",
        help="Path to GA4 facts markdown (Optimize). Default: latest crew/output/intel/ga4-*.md",
    )
    parser.add_argument(
        "--allow-no-ga4",
        action="store_true",
        help="Allow Optimize without snapshot (agents must mark metrics unknown)",
    )
    args = parser.parse_args(argv)

    if args.list:
        for name in list_pipelines():
            print(name)
        return 0

    verbose = not args.quiet
    try:
        if args.smoke:
            pipeline = validate_pipeline(args.pipeline)
            print(
                f"Validated pipeline '{pipeline.get('id', args.pipeline)}' "
                f"with {len(pipeline.get('agents', []))} agents and "
                f"{len(pipeline.get('tasks', []))} tasks "
                f"(maturity={pipeline.get('maturity', '?')})"
            )
            print("Smoke OK — JSON wiring valid; skipped Agent/LLM construction (--smoke).")
            return 0

        if not has_llm_credentials():
            print(
                "ERROR: No LLM API key. Set OPENAI_API_KEY in crew/.env or use --smoke.",
                file=sys.stderr,
            )
            return 2

        inputs = parse_inputs(args.inputs)
        if args.pipeline == "optimize":
            inputs.setdefault("optimize_for", "picks_lock")
            inputs.setdefault("window", "last_7_days")
            snapshot = resolve_ga4_snapshot(args.ga4_snapshot)
            if snapshot is None and not args.allow_no_ga4:
                print(
                    "ERROR: Optimize requires a GA4 snapshot.\n"
                    "  crew/.venv/bin/python -m crew.scripts.ga4_snapshot --window last_7_days\n"
                    "  # or Cursor GA4 MCP export + --ga4-snapshot path\n"
                    "  # or pass --allow-no-ga4 (metrics must be unknown)\n"
                    "See issue #697.",
                    file=sys.stderr,
                )
                return 3
            if snapshot:
                inputs["ga4_snapshot_path"] = str(snapshot)
                # Cap injected snapshot size for context
                snap_text = snapshot.read_text(encoding="utf-8")
                if len(snap_text) > 24_000:
                    snap_text = snap_text[:24_000] + "\n\n…(truncated)…"
                inputs["ga4_snapshot"] = snap_text
            else:
                inputs["ga4_snapshot_path"] = "none"
                inputs["ga4_snapshot"] = (
                    "NO SNAPSHOT PROVIDED. All metrics must be marked unknown. "
                    "Do not invent numbers."
                )

        crew, pipeline = build_crew(args.pipeline, verbose=verbose)
    except (FileNotFoundError, KeyError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(
        f"Built pipeline '{pipeline.get('id', args.pipeline)}' "
        f"with {len(crew.agents)} agents and {len(crew.tasks)} tasks "
        f"(maturity={pipeline.get('maturity', '?')})"
    )
    safe_inputs = {k: v for k, v in inputs.items() if k != "ga4_snapshot"}
    print(f"Kickoff inputs: {safe_inputs or '{}'}")

    result = crew.kickoff(inputs=inputs or None)
    task_outputs = extract_task_outputs(result, crew)
    out = write_result(args.pipeline, result, inputs, task_outputs=task_outputs)
    print(f"Wrote {out}")
    if task_outputs:
        print(f"Wrote {len(task_outputs)} per-task artifacts under {out.parent / 'tasks'}")
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
