"""Unit tests for L2 social demand-gen gates."""

from __future__ import annotations

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from crew.tools import social


class SocialL2Tests(unittest.TestCase):
    def setUp(self):
        self._tmpdir = tempfile.TemporaryDirectory()
        self.root = Path(self._tmpdir.name)
        self.patcher = patch.object(social, "SOCIAL_ROOT", self.root)
        self.patcher.start()

    def tearDown(self):
        self.patcher.stop()
        self._tmpdir.cleanup()

    def test_draft_approve_publish_local_queue(self):
        draft = social.social_draft_pack(
            "x",
            "Lock your picks before showtime.",
            dry_run=False,
            persist=True,
        )
        self.assertTrue(draft.ok)
        draft_id = draft.data["id"]

        bad = social.social_publish(draft_id=draft_id, dry_run=False)
        self.assertFalse(bad.ok)
        self.assertIn("not approved", bad.message.lower())

        approved = social.approve_social_draft(draft_id, approver="eic")
        self.assertTrue(approved.ok)
        self.assertEqual(approved.data["status"], "approved")

        blocked_env = social.social_publish(draft_id=draft_id, dry_run=False)
        self.assertFalse(blocked_env.ok)
        self.assertIn("CREW_SOCIAL_PUBLISH_ENABLED", blocked_env.message)

        with patch.dict(os.environ, {"CREW_SOCIAL_PUBLISH_ENABLED": "true"}):
            published = social.social_publish(draft_id=draft_id, dry_run=False)
        self.assertTrue(published.ok)
        self.assertEqual(published.data["status"], "published")
        self.assertEqual(published.data["delivery"], "local_queue")
        self.assertTrue(Path(published.data["path"]).is_file())

    def test_reject_unknown_approver(self):
        draft = social.social_draft_pack("linkedin", "hello", dry_run=False, persist=True)
        result = social.approve_social_draft(draft.data["id"], approver="intern")
        self.assertFalse(result.ok)

    def test_dry_run_publish_no_side_effects(self):
        draft = social.social_draft_pack("bluesky", "hello", dry_run=False, persist=True)
        social.approve_social_draft(draft.data["id"], approver="cco")
        with patch.dict(os.environ, {"CREW_SOCIAL_PUBLISH_ENABLED": "true"}):
            result = social.social_publish(draft_id=draft.data["id"], dry_run=True)
        self.assertTrue(result.ok)
        self.assertTrue(result.dry_run)
        self.assertEqual(len(list((self.root / "social" / "published").glob("*.json"))), 0)


if __name__ == "__main__":
    unittest.main()
