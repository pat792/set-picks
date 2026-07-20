"""Tests for run_pipeline JSON loading (no LLM)."""

from __future__ import annotations

import unittest

from crew.scripts.run_pipeline import list_pipelines, validate_pipeline


class RunPipelineTests(unittest.TestCase):
    def test_lists_core_pipelines(self):
        names = list_pipelines()
        for expected in ("smoke", "optimize", "campaign", "revenue"):
            self.assertIn(expected, names)

    def test_validate_smoke_and_optimize(self):
        for pid in ("smoke", "optimize"):
            pipeline = validate_pipeline(pid)
            self.assertTrue(pipeline.get("agents"))
            self.assertTrue(pipeline.get("tasks"))


if __name__ == "__main__":
    unittest.main()
