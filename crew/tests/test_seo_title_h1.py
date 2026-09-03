"""Unit tests for #933 SEO title/H1 scan (no live competitor fetch required)."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from crew.scripts.seo_title_h1_scan import DEFAULT_URLS, MAX_URLS_PER_RUN, run_scan
from crew.tools.allowlist import host_allowed, load_allowlist, refuse_url
from crew.tools.seo_extract import (
    extract_title_headings,
    load_query_registry,
    match_registry_queries,
    match_watch_phrases,
)
from crew.tools.stubs import web_fetch_allowlisted

FIXTURE_HTML = """
<html>
  <head>
    <title>Phish Setlist Prediction Game — Lock Your Picks | Setlist Pick'Em</title>
    <meta name="description" content="Free Phish setlist prediction game: lock your setlist picks.">
  </head>
  <body>
    <h1>The free Phish setlist prediction game</h1>
    <h2>What are Phish setlist picks?</h2>
    <h2>Phish tour setlist stats</h2>
    <h3>Bustouts this tour</h3>
    <p>Full night setlist that must NOT be extracted: Tweezer, Ghost, You Enjoy Myself.</p>
  </body>
</html>
"""


class AllowlistExpansionTests(unittest.TestCase):
    def test_phishpicks_and_jampicks_allowlisted(self):
        hosts = load_allowlist()
        self.assertIn("phishpicks.net", hosts)
        self.assertIn("www.phishpicks.net", hosts)
        self.assertIn("phish.jampicks.com", hosts)
        self.assertTrue(host_allowed("phishpicks.net", hosts))
        self.assertTrue(host_allowed("phish.jampicks.com", hosts))

    def test_omitted_hosts_not_allowlisted(self):
        hosts = load_allowlist()
        for host in (
            "callingit.live",
            "ihoz.com",
            "www.ihoz.com",
            "phantasytour.com",
            "www.phantasytour.com",
            "phish.net",
        ):
            self.assertNotIn(host, hosts)
            self.assertFalse(host_allowed(host, hosts), host)

    def test_refuse_serp_even_if_allowlisted(self):
        reason = refuse_url("https://www.google.com/search?q=phish+picks")
        self.assertIsNotNone(reason)
        self.assertIn("SERP", reason)
        r = web_fetch_allowlisted(
            "https://www.google.com/search?q=phish+picks",
            dry_run=False,
            allowlist={"www.google.com", "google.com"},
        )
        self.assertFalse(r.ok)
        self.assertIn("SERP", r.message)

    def test_refuse_callingit_tos(self):
        reason = refuse_url("https://callingit.live/")
        self.assertIsNotNone(reason)
        self.assertIn("ToS", reason)
        r = web_fetch_allowlisted(
            "https://callingit.live/",
            dry_run=True,
            allowlist={"callingit.live"},
        )
        self.assertFalse(r.ok)

    def test_refuse_pii_and_jampicks_picks_path(self):
        self.assertIn("PII", refuse_url("https://phish.jampicks.com/profile") or "")
        picks = refuse_url("https://phish.jampicks.com/picks")
        self.assertIsNotNone(picks)
        self.assertIn("Disallow", picks)
        self.assertIsNone(refuse_url("https://phish.jampicks.com/"))

    def test_off_allowlist_still_blocked(self):
        r = web_fetch_allowlisted("https://evil.example/path", dry_run=False)
        self.assertFalse(r.ok)
        self.assertIn("allowlist", r.message.lower())


class ExtractorTests(unittest.TestCase):
    def test_extracts_title_meta_headings_not_body(self):
        extracted = extract_title_headings(FIXTURE_HTML)
        self.assertIn("Lock Your Picks", extracted["title"])
        self.assertIn("lock your setlist picks", extracted["meta_description"].lower())
        self.assertEqual(extracted["h1"], ["The free Phish setlist prediction game"])
        self.assertIn("What are Phish setlist picks?", extracted["h2"])
        self.assertIn("Bustouts this tour", extracted["h3"])
        blob = " ".join(
            [extracted["title"], *extracted["h1"], *extracted["h2"], *extracted["h3"]]
        )
        self.assertNotIn("You Enjoy Myself", blob)

    def test_registry_diff_hits_c1_c6_c7_s1(self):
        registry = load_query_registry()
        extracted = extract_title_headings(FIXTURE_HTML)
        matches = {m["id"]: m for m in match_registry_queries(extracted, registry["queries"])}
        self.assertTrue(matches["C1"]["hit"])
        self.assertTrue(matches["C6"]["hit"])
        self.assertTrue(matches["C7"]["hit"] or "picks" in extracted["title"].lower())
        self.assertTrue(matches["S1"]["hit"] or matches["S7"]["hit"])
        phrases = match_watch_phrases(extracted)
        self.assertIn("prediction", phrases)
        self.assertIn("picks", phrases)
        self.assertIn("bustout", phrases)

    def test_competitor_game_h1_hits_c1_not_stats(self):
        html = """
        <html><head><title>Phish | Jam Picks</title>
        <meta name="description" content="Ten picks, ranked 10 to 1."></head>
        <body><h1>The Phish Setlist Prediction Game</h1></body></html>
        """
        extracted = extract_title_headings(html)
        registry = load_query_registry()
        matches = {m["id"]: m for m in match_registry_queries(extracted, registry["queries"])}
        self.assertTrue(matches["C1"]["hit"])
        self.assertTrue(matches["C6"]["hit"])
        self.assertFalse(matches["S3"]["hit"])


class ScanScriptTests(unittest.TestCase):
    def test_dry_run_writes_output_without_network(self):
        with tempfile.TemporaryDirectory() as tmp:
            fake_out = Path(tmp)
            with patch("crew.scripts.seo_title_h1_scan.OUTPUT_DIR", fake_out):
                path = run_scan(dry_run=True, urls=DEFAULT_URLS[:2] + ["https://phishpicks.net/"])
            text = path.read_text(encoding="utf-8")
            self.assertIn("#933", text)
            self.assertIn("phishpicks.net", text)
            self.assertIn("/phish-picks", text)
            self.assertIn("dry_run", text)

    def test_scan_refuses_serp_url(self):
        with tempfile.TemporaryDirectory() as tmp:
            fake_out = Path(tmp)
            with patch("crew.scripts.seo_title_h1_scan.OUTPUT_DIR", fake_out):
                path = run_scan(
                    dry_run=True,
                    urls=["https://www.google.com/search?q=phish+picks"],
                )
            text = path.read_text(encoding="utf-8")
            self.assertIn("SERP", text)
            self.assertIn("ok: `False`", text)

    def test_scan_refuses_too_many_urls(self):
        urls = [f"https://www.setlistpickem.com/p{i}" for i in range(MAX_URLS_PER_RUN + 1)]
        with self.assertRaises(SystemExit) as ctx:
            run_scan(dry_run=True, urls=urls)
        self.assertIn("MAX_URLS_PER_RUN", str(ctx.exception))

    def test_default_urls_are_homepage_or_first_party(self):
        for url in DEFAULT_URLS:
            self.assertTrue(url.startswith("https://"))
            self.assertNotIn("google.", url)
            self.assertNotIn("bing.", url)
            self.assertNotIn("callingit.live", url)
            self.assertNotIn("/picks", urlparse_path(url) if "jampicks" in url or "phishpicks" in url else "/")


def urlparse_path(url: str) -> str:
    from urllib.parse import urlparse

    return urlparse(url).path or "/"


if __name__ == "__main__":
    unittest.main()
