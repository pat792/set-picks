"""Unit tests for L1 allowlist + fetch (no network required)."""

from __future__ import annotations

import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from crew.tools.allowlist import host_allowed, load_allowlist
from crew.tools.stubs import social_publish, web_fetch_allowlisted


class AllowlistTests(unittest.TestCase):
    def test_loads_domains_md(self):
        hosts = load_allowlist()
        self.assertIn("www.setlistpickem.com", hosts)
        self.assertIn("github.com", hosts)

    def test_subdomain_match(self):
        allowed = {"github.com"}
        self.assertFalse(host_allowed("raw.githubusercontent.com", allowed))
        self.assertTrue(host_allowed("github.com", allowed))
        self.assertTrue(host_allowed("www.github.com", allowed))


class FetchTests(unittest.TestCase):
    def test_dry_run_no_network(self):
        r = web_fetch_allowlisted("https://www.setlistpickem.com/llms.txt", dry_run=True)
        self.assertTrue(r.ok)
        self.assertTrue(r.dry_run)

    def test_blocks_non_allowlisted(self):
        r = web_fetch_allowlisted("https://evil.example/path", dry_run=False)
        self.assertFalse(r.ok)
        self.assertIn("allowlist", r.message.lower())

    def test_live_fetch_mocked(self):
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.getcode.return_value = 200
        mock_resp.headers = {"Content-Type": "text/plain"}
        mock_resp.read.return_value = b"hello intel"
        mock_resp.__enter__.return_value = mock_resp
        mock_resp.__exit__.return_value = False

        with patch("crew.tools.stubs.urlopen", return_value=mock_resp):
            r = web_fetch_allowlisted(
                "https://www.setlistpickem.com/llms.txt",
                dry_run=False,
            )
        self.assertTrue(r.ok)
        self.assertFalse(r.dry_run)
        self.assertEqual(r.data.get("excerpt"), "hello intel")

    def test_social_publish_still_gated(self):
        r = social_publish("x", "hi", dry_run=False, approved=True)
        self.assertFalse(r.ok)
        self.assertIn("CREW_SOCIAL_PUBLISH_ENABLED", r.message)


if __name__ == "__main__":
    unittest.main()
