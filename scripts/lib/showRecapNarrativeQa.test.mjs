import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FIXTURE_FENWAY_LABELED,
  FIXTURE_FENWAY_UNLABELED,
  FIXTURE_MULTI_BUSTOUT,
  runCatalogExampleCheck,
  runHighlightChecklist,
  runNarrativeLineChecklist,
  summarizeChecks,
} from "./showRecapNarrativeQa.mjs";

describe("showRecapNarrativeQa", () => {
  it("fails Fenway-class unlabeled single bustout", () => {
    const checks = runHighlightChecklist(FIXTURE_FENWAY_UNLABELED);
    const summary = summarizeChecks(checks);
    assert.equal(summary.pass, false);
    assert.ok(summary.failed.some((c) => c.id === "bustout_label"));
  });

  it("passes labeled Fenway highlight", () => {
    const checks = runHighlightChecklist(FIXTURE_FENWAY_LABELED);
    assert.equal(summarizeChecks(checks).pass, true);
  });

  it("requires semicolons for multi bustouts", () => {
    const bad = {
      ...FIXTURE_MULTI_BUSTOUT,
      setlist_highlight:
        "Bustouts: Curtain With - a 142 show gap, Fluffhead - an 87 show gap.",
    };
    const checks = runHighlightChecklist(bad);
    assert.ok(checks.some((c) => c.id === "multi_semicolon" && !c.ok));

    const good = runHighlightChecklist(FIXTURE_MULTI_BUSTOUT);
    assert.equal(summarizeChecks(good).pass, true);
  });

  it("flags cold wrapper that drops Bustout label", () => {
    const checks = runNarrativeLineChecklist(
      "Tough board. Still a night to remember: Melt the Guns - a 2051 show gap",
      FIXTURE_FENWAY_LABELED,
      "cold",
    );
    assert.ok(checks.some((c) => c.id === "wrapper_keeps_label" && !c.ok));
  });

  it("accepts cold wrapper that keeps Bustout label", () => {
    const checks = runNarrativeLineChecklist(
      "Tough board. Still a night to remember: Bustout: Melt the Guns - a 2051 show gap.",
      FIXTURE_FENWAY_LABELED,
      "cold",
    );
    assert.equal(summarizeChecks(checks).pass, true);
  });

  it("rejects stale Reba catalog example", () => {
    const stale = runCatalogExampleCheck(
      '3. **Setlist context** — `{{setlist_highlight}}` (e.g., "It was the first time Reba opened a show in 6 years").',
    );
    assert.equal(stale.ok, false);

    const good = runCatalogExampleCheck(
      "3. **Setlist context** — `{{setlist_highlight}}` (e.g., `Bustout: Melt the Guns - a 2051 show gap.`).",
    );
    assert.equal(good.ok, true);
  });
});
