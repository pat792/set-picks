"""Tests for GA4 snapshot helpers + optimize evidence gate (no live API required)."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from crew.scripts.ga4_snapshot import _window_to_dates, render_markdown
from crew.scripts.run_pipeline import resolve_ga4_snapshot, validate_pipeline


class Ga4SnapshotHelpers(unittest.TestCase):
    def test_window_mapping(self):
        self.assertEqual(_window_to_dates("last_7_days"), ("7daysAgo", "yesterday"))

    def test_render_includes_facts_rules(self):
        md = render_markdown(
            property_id="527619709",
            window="last_7_days",
            start="7daysAgo",
            end="yesterday",
            rows=[{"eventName": "submit_picks", "eventCount": "65", "totalUsers": "19"}],
            source="test",
        )
        self.assertIn("unknown", md)
        self.assertIn("submit_picks", md)
        self.assertIn("527619709", md)


class OptimizeEvidenceGate(unittest.TestCase):
    def test_optimize_pipeline_mentions_snapshot(self):
        pipeline = validate_pipeline("optimize")
        blob = json_dumps_tasks(pipeline)
        self.assertIn("ga4_snapshot", blob)
        self.assertIn("unknown", blob)

    def test_optimize_has_challenge_evidence_and_squad_kickoff(self):
        pipeline = validate_pipeline("optimize")
        ids = [t["id"] for t in pipeline.get("tasks", [])]
        self.assertIn("challenge_evidence", ids)
        self.assertIn("data_architect", pipeline.get("agents", []))
        blob = json_dumps_tasks(pipeline)
        self.assertIn("SQUAD_KICKOFF", blob)
        self.assertIn("BLOCK_EMAIL_CONCLUSION", blob)
        self.assertIn("optimize_snapshot_recipe", blob)

    def test_render_includes_email_utm_section(self):
        md = render_markdown(
            property_id="527619709",
            window="last_7_days",
            start="7daysAgo",
            end="yesterday",
            rows=[{"eventName": "submit_picks", "eventCount": "65", "totalUsers": "19"}],
            source="test",
        )
        self.assertIn("Email UTM proxy", md)
        self.assertIn("Trigger × channel", md)
        self.assertIn("optimize_snapshot_recipe.md", md)

    def test_resolve_explicit_snapshot(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "ga4.md"
            path.write_text("# facts\n", encoding="utf-8")
            resolved = resolve_ga4_snapshot(str(path))
            self.assertEqual(resolved, path)


def json_dumps_tasks(pipeline: dict) -> str:
    import json

    return json.dumps(pipeline.get("tasks", []))


if __name__ == "__main__":
    unittest.main()
