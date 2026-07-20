"""Load agents/*.jsonc + pipelines/*.jsonc and kickoff a CrewAI crew.

Usage (from repo root, with crew/.venv activated or PYTHONPATH set):

  cd crew && source .venv/bin/activate
  python -m scripts.run_pipeline smoke --smoke          # build only
  python -m scripts.run_pipeline smoke                  # live LLM (needs API key)
  python -m scripts.run_pipeline optimize \\
    --input optimize_for=picks_lock --input window=last_7_days

Or from repo root:

  crew/.venv/bin/python -m crew.scripts.run_pipeline smoke
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


def _strip_jsonc(text: str) -> str:
    """Remove // line comments and /* */ blocks for our simple JSONC files."""
    # block comments
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    # line comments (not inside strings — good enough for our agent files)
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
    raw = path.read_text(encoding="utf-8")
    return json.loads(_strip_jsonc(raw))


def load_dotenv() -> None:
    """Load crew/.env into os.environ without overriding existing vars."""
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
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            os.environ.setdefault(key, val)


def has_llm_credentials() -> bool:
    return bool(
        (os.environ.get("OPENAI_API_KEY") or "").strip()
        or (os.environ.get("ANTHROPIC_API_KEY") or "").strip()
        or (os.environ.get("GEMINI_API_KEY") or "").strip()
    )


def list_pipelines() -> list[str]:
    return sorted(p.stem for p in PIPELINES_DIR.glob("*.jsonc"))


def validate_pipeline(pipeline_id: str) -> dict[str, Any]:
    """Load pipeline + agent JSON and check references (no LLM / Agent objects)."""
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
        if not (AGENTS_DIR / f"{agent_id}.jsonc").is_file():
            raise FileNotFoundError(f"Missing agent for task: {agent_id}")
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
        description = task_spec["description"]
        tasks.append(
            Task(
                description=description
                + "\n\nUse any kickoff inputs provided (e.g. optimize_for, window). "
                "Stay draft-only; never claim to have merged, deployed, or sent production messages.",
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


def write_result(pipeline_id: str, result: Any, inputs: dict[str, str]) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out = OUTPUT_DIR / f"{pipeline_id}-{stamp}.md"
    text = getattr(result, "raw", None) or str(result)
    body = [
        f"# Crew run — `{pipeline_id}` — {stamp}",
        "",
        f"- **Epic:** #695",
        f"- **Inputs:** `{json.dumps(inputs)}`",
        "",
        "## Result",
        "",
        text,
        "",
    ]
    out.write_text("\n".join(body), encoding="utf-8")
    return out


def parse_inputs(pairs: list[str] | None) -> dict[str, str]:
    out: dict[str, str] = {}
    for pair in pairs or []:
        if "=" not in pair:
            raise SystemExit(f"Invalid --input {pair!r}; expected key=value")
        k, _, v = pair.partition("=")
        out[k.strip()] = v.strip()
    return out


def main(argv: list[str] | None = None) -> int:
    # Ensure repo root on path when run as python -m scripts.run_pipeline from crew/
    if str(REPO_ROOT) not in sys.path:
        sys.path.insert(0, str(REPO_ROOT))

    load_dotenv()

    parser = argparse.ArgumentParser(description="Run a Leadership Ops Crew pipeline")
    parser.add_argument(
        "pipeline",
        nargs="?",
        default="smoke",
        help=f"Pipeline id ({', '.join(list_pipelines())})",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List pipelines and exit",
    )
    parser.add_argument(
        "--smoke",
        action="store_true",
        help="Build Crew from JSON only — do not call the LLM",
    )
    parser.add_argument(
        "--input",
        action="append",
        dest="inputs",
        help="kickoff input key=value (repeatable)",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Less agent verbosity",
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
            n_agents = len(pipeline.get("agents", []))
            n_tasks = len(pipeline.get("tasks", []))
            print(
                f"Validated pipeline '{pipeline.get('id', args.pipeline)}' "
                f"with {n_agents} agents and {n_tasks} tasks "
                f"(maturity={pipeline.get('maturity', '?')})"
            )
            print("Smoke OK — JSON wiring valid; skipped Agent/LLM construction (--smoke).")
            return 0

        if not has_llm_credentials():
            print(
                "ERROR: No LLM API key found. Add OPENAI_API_KEY (or ANTHROPIC_API_KEY) to crew/.env\n"
                "  cp crew/.env.example crew/.env   # then paste your key\n"
                "Or re-run with --smoke to validate JSON wiring only.",
                file=sys.stderr,
            )
            return 2

        crew, pipeline = build_crew(args.pipeline, verbose=verbose)
    except (FileNotFoundError, KeyError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print(
        f"Built pipeline '{pipeline.get('id', args.pipeline)}' "
        f"with {len(crew.agents)} agents and {len(crew.tasks)} tasks "
        f"(maturity={pipeline.get('maturity', '?')})"
    )

    inputs = parse_inputs(args.inputs)
    if args.pipeline == "optimize" and "optimize_for" not in inputs:
        inputs.setdefault("optimize_for", "picks_lock")
        inputs.setdefault("window", "last_7_days")

    print(f"Kickoff inputs: {inputs or '{}'}")
    result = crew.kickoff(inputs=inputs or None)
    out = write_result(args.pipeline, result, inputs)
    print(f"Wrote {out}")
    print(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
