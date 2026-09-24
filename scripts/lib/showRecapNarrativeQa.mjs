/**
 * Post-show show_recap narrative QA (#779).
 * Deterministic checklist + sample render helpers (no Resend).
 */

/**
 * @typedef {{ title: string, gap?: number | null }} BustoutEntry
 * @typedef {{
 *   showDate?: string,
 *   setlist_highlight?: string | null,
 *   bustout_titles?: string[],
 *   bustout_entries?: BustoutEntry[],
 *   tour_debut_titles?: string[],
 *   opener_title?: string | null,
 *   encore_title?: string | null,
 *   show_moment_tags?: string[],
 * }} ShowContext
 */

/**
 * Fenway-class unlabeled single bustout (pre-#780) — must FAIL checklist.
 * @type {ShowContext}
 */
export const FIXTURE_FENWAY_UNLABELED = {
  showDate: "2026-07-31",
  setlist_highlight: "Melt the Guns - a 2051 show gap",
  set_flow_summary:
    "Set 1 opened with Carini (10 songs); Set 2 added 8; encore closed on A Life Beyond The Dream.",
  bustout_titles: ["Melt the Guns"],
  bustout_entries: [{ title: "Melt the Guns", gap: 2051 }],
  tour_debut_titles: ["Melt the Guns"],
  opener_title: "Carini",
  encore_title: "A Life Beyond The Dream",
  show_moment_tags: ["bustout", "tour_debut"],
};

/**
 * Expected post-#780 Fenway highlight.
 * @type {ShowContext}
 */
export const FIXTURE_FENWAY_LABELED = {
  ...FIXTURE_FENWAY_UNLABELED,
  setlist_highlight: "Bustout: Melt the Guns - a 2051 show gap.",
};

/**
 * Multi-bustout night.
 * @type {ShowContext}
 */
export const FIXTURE_MULTI_BUSTOUT = {
  showDate: "2026-07-15",
  setlist_highlight:
    "Bustouts: Curtain With - a 142 show gap; Fluffhead - an 87 show gap.",
  bustout_titles: ["Curtain With", "Fluffhead"],
  bustout_entries: [
    { title: "Curtain With", gap: 142 },
    { title: "Fluffhead", gap: 87 },
  ],
  tour_debut_titles: [],
  opener_title: "YEM",
  encore_title: "Slave",
  set_flow_summary: "Set 1 opened with YEM (6 songs); Set 2 added 5; encore closed on Slave.",
  show_moment_tags: ["bustout"],
};

/**
 * @param {string} highlight
 * @returns {boolean}
 */
export function looksLikeBustoutHighlight(highlight) {
  return /^Bustouts?:/i.test(String(highlight || "").trim());
}

/**
 * @param {ShowContext} ctx
 * @returns {{ id: string, ok: boolean, detail: string }[]}
 */
export function runHighlightChecklist(ctx) {
  /** @type {{ id: string, ok: boolean, detail: string }[]} */
  const checks = [];
  const highlight = String(ctx.setlist_highlight || "").trim();
  const entries = Array.isArray(ctx.bustout_entries)
    ? ctx.bustout_entries.filter((e) => e?.title)
    : [];
  const titles = Array.isArray(ctx.bustout_titles)
    ? ctx.bustout_titles.filter(Boolean)
    : [];
  const bustoutCount = entries.length || titles.length;

  if (bustoutCount > 0) {
    const expectLabel = bustoutCount === 1 ? "Bustout:" : "Bustouts:";
    const hasLabel = highlight.startsWith(expectLabel);
    checks.push({
      id: "bustout_label",
      ok: hasLabel,
      detail: hasLabel
        ? `highlight starts with ${expectLabel}`
        : `expected "${expectLabel}" prefix; got "${highlight.slice(0, 80)}"`,
    });

    const endsWithPeriod = highlight.endsWith(".");
    checks.push({
      id: "trailing_period",
      ok: endsWithPeriod,
      detail: endsWithPeriod
        ? "highlight ends with period"
        : "highlight missing trailing period",
    });

    if (bustoutCount >= 2) {
      const hasSemi = highlight.includes(";");
      checks.push({
        id: "multi_semicolon",
        ok: hasSemi,
        detail: hasSemi
          ? "multi-bustout uses semicolon separators"
          : "multi-bustout missing ';' separators",
      });
    }

    const gapsExpected = entries.filter(
      (e) => e.gap != null && Number.isFinite(e.gap),
    );
    if (gapsExpected.length) {
      const allPresent = gapsExpected.every((e) =>
        highlight.includes(String(e.gap)),
      );
      const shapeOk = / - (a|an) \d+ show gap/.test(highlight);
      checks.push({
        id: "gap_shape",
        ok: allPresent && shapeOk,
        detail:
          allPresent && shapeOk
            ? "gap numbers present with 'a/an N show gap' shape"
            : `missing gap shape in "${highlight.slice(0, 100)}"`,
      });
    }
  } else {
    checks.push({
      id: "bustout_label",
      ok: !looksLikeBustoutHighlight(highlight),
      detail: looksLikeBustoutHighlight(highlight)
        ? "highlight has Bustout label but context has no bustouts"
        : "no bustouts — label rule N/A",
    });
  }

  // Night-scoped: highlight should not look like a tour essay.
  const tourEssay =
    /end of (the )?tour|season recap|tour wrap/i.test(highlight);
  checks.push({
    id: "night_vs_tour",
    ok: !tourEssay,
    detail: tourEssay
      ? "highlight looks like tour-length copy (#510 boundary)"
      : "night-scoped highlight",
  });

  return checks;
}

/**
 * @param {string} narrativeLine
 * @param {ShowContext} ctx
 * @param {string} branch
 * @returns {{ id: string, ok: boolean, detail: string }[]}
 */
export function runNarrativeLineChecklist(narrativeLine, ctx, branch, opts = {}) {
  /** @type {{ id: string, ok: boolean, detail: string }[]} */
  const checks = [];
  const line = String(narrativeLine || "").trim();
  const highlight = String(ctx.setlist_highlight || "").trim();
  const bustoutCount =
    (ctx.bustout_entries || []).filter((e) => e?.title).length ||
    (ctx.bustout_titles || []).filter(Boolean).length;
  const requireComposerBeats = opts.requireComposerBeats === true;

  if (branch === "bustout_hero") {
    const ok = /You caught a bustout/i.test(line);
    checks.push({
      id: "bustout_hero_prefix",
      ok,
      detail: ok
        ? "bustout_hero names You caught a bustout"
        : `unexpected bustout_hero line: "${line.slice(0, 80)}"`,
    });
  }

  if (bustoutCount > 0 && branch !== "bustout_hero" && highlight) {
    // Cold/hot/mixed must retain the labeled highlight when present.
    const retains =
      line.includes("Bustout:") ||
      line.includes("Bustouts:") ||
      (looksLikeBustoutHighlight(highlight) && line.includes(highlight));
    checks.push({
      id: "wrapper_keeps_label",
      ok: retains,
      detail: retains
        ? `${branch} retains Bustout label`
        : `${branch} dropped Bustout label — line="${line.slice(0, 100)}"`,
    });
  }

  if (requireComposerBeats) {
    const flow = String(ctx.set_flow_summary || "").trim();
    if (flow) {
      const needle = flow.replace(/\.$/, "").slice(0, 24);
      const ok = Boolean(needle) && line.includes(needle);
      checks.push({
        id: "arc_flow",
        ok,
        detail: ok
          ? "narrative includes set_flow_summary"
          : `missing arc from set_flow_summary — line="${line.slice(0, 100)}"`,
      });
    }

    const hasCard =
      /\d+ of \d+/.test(line) ||
      /you hit /i.test(line) ||
      /none of your six/i.test(line) ||
      /You caught a bustout/i.test(line) ||
      /Tough board/i.test(line) ||
      /Strong night/i.test(line);
    checks.push({
      id: "card_voice",
      ok: hasCard,
      detail: hasCard
        ? `${branch} includes a board/card beat`
        : `${branch} missing card beat — line="${line.slice(0, 100)}"`,
    });

    const hasRank = /#\d+/.test(line);
    checks.push({
      id: "relative_rank",
      ok: hasRank,
      detail: hasRank
        ? "narrative weaves #rank"
        : `missing relative rank — line="${line.slice(0, 100)}"`,
    });
  }

  return checks;
}

/**
 * Catalog example must document Bustout:/Bustouts: shape (#780), not freeform lore.
 * @param {string} catalogMd
 * @returns {{ id: string, ok: boolean, detail: string }}
 */
export function runCatalogExampleCheck(catalogMd) {
  const hasBustoutExample =
    /Bustout: .+ show gap/i.test(catalogMd) ||
    /Bustouts: .+ show gap/i.test(catalogMd);
  const hasStaleReba = /first time Reba opened/i.test(catalogMd);
  return {
    id: "catalog_example",
    ok: hasBustoutExample && !hasStaleReba,
    detail: hasStaleReba
      ? "TRIGGER_CATALOG still has stale freeform Reba example"
      : hasBustoutExample
        ? "catalog documents Bustout:/Bustouts: shape"
        : "catalog missing Bustout: example",
  };
}

/**
 * Scorecard fixtures that force each narrative branch when passed to enrichment.
 * @returns {Record<string, { show_score: number, userPicks: Record<string, string>, actualSetlist: Record<string, unknown> }>}
 */
export function branchScorecardFixtures(bustoutTitle = "Melt the Guns") {
  const emptyBoard = {
    s1o: "Wrong One",
    s1c: "Wrong Two",
    s2o: "Wrong Three",
    s2c: "Wrong Four",
    enc: "Wrong Five",
    wild: "Wrong Six",
  };
  const hotBoard = {
    s1o: "Carini",
    s1c: "Harry Hood",
    s2o: "What's Going Through Your Mind",
    s2c: "Run Like an Antelope",
    enc: "A Life Beyond The Dream",
    wild: "Fuego",
  };
  const actual = {
    s1o: "Carini",
    s1c: "Harry Hood",
    s2o: "What's Going Through Your Mind",
    s2c: "Run Like an Antelope",
    enc: "A Life Beyond The Dream",
    officialSetlist: [
      "Carini",
      "Harry Hood",
      "What's Going Through Your Mind",
      "Fuego",
      bustoutTitle,
      "Run Like an Antelope",
      "A Life Beyond The Dream",
    ],
    bustouts: [bustoutTitle],
  };

  return {
    cold: { show_score: 10, userPicks: emptyBoard, actualSetlist: actual },
    mixed: {
      show_score: 25,
      userPicks: {
        ...emptyBoard,
        s1o: "Carini",
        s2c: "Run Like an Antelope",
      },
      actualSetlist: actual,
    },
    hot_night: { show_score: 70, userPicks: hotBoard, actualSetlist: actual },
    bustout_hero: {
      show_score: 30,
      userPicks: { ...emptyBoard, wild: bustoutTitle },
      actualSetlist: actual,
    },
  };
}

/**
 * @param {{ id: string, ok: boolean, detail: string }[]} checks
 * @returns {{ pass: boolean, failed: typeof checks, passed: typeof checks }}
 */
export function summarizeChecks(checks) {
  const failed = checks.filter((c) => !c.ok);
  const passed = checks.filter((c) => c.ok);
  return { pass: failed.length === 0, failed, passed };
}

/**
 * Build markdown pack section for #573.
 * @param {{
 *   showDate: string,
 *   context: ShowContext,
 *   recomposedHighlight?: string | null,
 *   samples: { branch: string, narrative_line: string, emailNightExcerpt?: string }[],
 *   checks: { id: string, ok: boolean, detail: string }[],
 *   source: string,
 * }} input
 */
export function buildNarrativeQaReportMarkdown(input) {
  const summary = summarizeChecks(input.checks);
  const status = summary.pass ? "PASS" : "FAIL → DRAFT_PR";
  const checkLines = input.checks
    .map((c) => `- [${c.ok ? "x" : " "}] \`${c.id}\` — ${c.detail}`)
    .join("\n");

  const sampleBlocks = input.samples
    .map(
      (s) =>
        `#### \`${s.branch}\`\n\n> ${s.narrative_line}\n${
          s.emailNightExcerpt
            ? `\n\`\`\`\n${s.emailNightExcerpt}\n\`\`\`\n`
            : ""
        }`,
    )
    .join("\n");

  return `## Show-recap uniqueness QA — ${input.showDate}

**Status:** **${status}**  
**Source:** ${input.source}  
**Stored highlight:** \`${input.context.setlist_highlight || "(none)"}\`${
    input.recomposedHighlight != null
      ? `  
**Recomposed highlight:** \`${input.recomposedHighlight}\``
      : ""
  }  
**Tags:** ${(input.context.show_moment_tags || []).join(", ") || "—"}

### Checklist
${checkLines}

### Branch samples
${sampleBlocks}

### Ask for PM
- [ ] ${
    summary.pass
      ? "No copy change required"
      : "Open/approve draft PR for mechanical label/copy fix"
  }
- [ ] Accept uniqueness samples for the pack
`;
}
