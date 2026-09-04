/**
 * Unit tests for #572 show context builders.
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildCommsShowContext,
  composeSetlistHighlight,
  tourDebutTitles,
  groupOfficialSetlistBySet,
} = require("./commsShowContextCore");
const {
  resolveNarrativeBranch,
  buildUserShowScorecard,
  buildShowRecapEnrichment,
  composeShowRecapNarrative,
} = require("./showRecapNarrativeCore");

describe("groupOfficialSetlistBySet", () => {
  it("splits on s2o and encoreSongs", () => {
    const g = groupOfficialSetlistBySet({
      officialSetlist: ["A", "B", "C", "D", "E"],
      s2o: "C",
      encoreSongs: ["E"],
      setlist: { s1o: "A", enc: "E" },
    });
    assert.deepEqual(g.set1, ["A", "B"]);
    assert.deepEqual(g.set2, ["C", "D"]);
    assert.deepEqual(g.encore, ["E"]);
  });
});

describe("tourDebutTitles", () => {
  it("returns titles not seen on prior tour shows", () => {
    const tonight = {
      officialSetlist: ["YEM", "Tweezer", "Ghost"],
      setlist: { s1o: "YEM" },
    };
    const prior = [{ officialSetlist: ["YEM", "Bowie"] }];
    assert.deepEqual(tourDebutTitles(tonight, prior), ["Tweezer", "Ghost"]);
  });
});

describe("composeSetlistHighlight", () => {
  it("labels a single bustout as Bustout: Song - gap.", () => {
    assert.equal(
      composeSetlistHighlight({
        bustoutTitles: ["Curtain With"],
        bustoutEntries: [{ title: "Curtain With", gap: 142 }],
        tourDebuts: [],
        openerTitle: "YEM",
        encoreTitle: "Tweeprise",
      }),
      "Bustout: Curtain With - a 142 show gap.",
    );
  });

  it("labels multiple bustouts with Bustouts: and semicolon separators", () => {
    assert.equal(
      composeSetlistHighlight({
        bustoutTitles: ["Curtain With", "Fluffhead"],
        bustoutEntries: [
          { title: "Curtain With", gap: 142 },
          { title: "Fluffhead", gap: 87 },
        ],
        tourDebuts: [],
        openerTitle: "YEM",
        encoreTitle: "Tweeprise",
      }),
      "Bustouts: Curtain With - a 142 show gap; Fluffhead - an 87 show gap.",
    );
  });
});

describe("buildCommsShowContext", () => {
  it("builds highlight + flow + tags", () => {
    const ctx = buildCommsShowContext({
      showDate: "2026-07-15",
      tourKey: "Summer Tour 2026",
      setlistDoc: {
        officialSetlist: ["YEM", "Wolfman's", "Tweezer", "Slave"],
        s2o: "Tweezer",
        encoreSongs: ["Slave"],
        bustouts: ["Wolfman's"],
        setlist: { s1o: "YEM", enc: "Slave" },
      },
      priorTourSetlistDocs: [{ officialSetlist: ["YEM", "Bowie"] }],
      phishnetRows: [
        { title: "YEM", gap: 2 },
        { title: "Wolfman's", gap: 87 },
        { title: "Tweezer", gap: 5 },
        { title: "Slave", gap: 10 },
      ],
    });
    assert.equal(ctx.setlist_highlight, "Bustout: Wolfman's - an 87 show gap.");
    assert.match(ctx.set_flow_summary, /Set 1 opened with YEM/);
    assert.ok(ctx.show_moment_tags.includes("bustout"));
    assert.ok(ctx.tour_debut_titles.includes("Wolfman's"));
    assert.equal(ctx.bustout_entries[0].gap, 87);
  });
});

describe("narrative branch", () => {
  it("bustout_hero beats hot_night", () => {
    assert.equal(
      resolveNarrativeBranch({
        show_score: 80,
        correct_picks_count: 4,
        total_picks_count: 4,
        user_hit_bustout: true,
      }),
      "bustout_hero",
    );
  });

  it("marks cold nights", () => {
    assert.equal(
      resolveNarrativeBranch({
        show_score: 5,
        correct_picks_count: 0,
        total_picks_count: 4,
        user_hit_bustout: false,
      }),
      "cold",
    );
  });
});

describe("buildUserShowScorecard", () => {
  it("counts correct slots and bustout hits", () => {
    const actual = {
      s1o: "YEM",
      s1c: "Bowie",
      s2o: "Tweezer",
      s2c: "Hood",
      enc: "Slave",
      officialSetlist: ["YEM", "Bowie", "Tweezer", "Hood", "Slave"],
      bustouts: ["YEM"],
    };
    const card = buildUserShowScorecard(
      { s1o: "YEM", s1c: "Wrong", s2o: "Tweezer", s2c: "Hood", enc: "Slave", wild: "" },
      actual,
    );
    assert.equal(card.opener_result, "✓");
    assert.equal(card.user_hit_bustout, true);
    assert.ok(card.bustout_bonus >= 20);
    assert.equal(card.correct_picks_count, 4);
    assert.equal(card.total_picks_count, 6);
  });
});

describe("buildShowRecapEnrichment", () => {
  it("formats bustout hero as Song - gap", () => {
    const enriched = buildShowRecapEnrichment({
      showLevel: {
        setlist_highlight: "Wolfman's - 87",
        bustout_entries: [{ title: "Wolfman's", gap: 87 }],
      },
      userPicks: { s1o: "Wolfman's" },
      actualSetlist: {
        s1o: "Wolfman's",
        officialSetlist: ["Wolfman's"],
        bustouts: ["Wolfman's"],
      },
      show_score: 30,
    });
    assert.equal(enriched.narrative_branch, "bustout_hero");
    assert.equal(
      enriched.narrative_line,
      "You caught a bustout — Wolfman's - an 87 show gap on your opener (1 of 6).",
    );
    assert.equal(enriched.slot_hits, undefined);
  });
});

const COMPOSER_SHOW = {
  set_flow_summary:
    "Set 1 opened with Carini (8 songs); Set 2 added 7; encore closed on A Life Beyond The Dream.",
  opener_title: "Carini",
  encore_title: "A Life Beyond The Dream",
  setlist_highlight: "Bustout: Melt the Guns - a 2051 show gap.",
  bustout_titles: ["Melt the Guns"],
  bustout_entries: [{ title: "Melt the Guns", gap: 2051 }],
};

const COMPOSER_ACTUAL = {
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
    "Melt the Guns",
    "Run Like an Antelope",
    "A Life Beyond The Dream",
  ],
  bustouts: ["Melt the Guns"],
};

const EMPTY_BOARD = {
  s1o: "Wrong One",
  s1c: "Wrong Two",
  s2o: "Wrong Three",
  s2c: "Wrong Four",
  enc: "Wrong Five",
  wild: "Wrong Six",
};

describe("show_recap composer (#985)", () => {
  it("cold weaves arc + card + relative rank", () => {
    const enriched = buildShowRecapEnrichment({
      showLevel: COMPOSER_SHOW,
      userPicks: EMPTY_BOARD,
      actualSetlist: COMPOSER_ACTUAL,
      show_score: 10,
      global_rank: 184,
      global_total_pickers: 210,
    });
    assert.equal(enriched.narrative_branch, "cold");
    assert.match(enriched.narrative_line, /Set 1 opened with Carini/);
    assert.match(enriched.narrative_line, /none of your six landed/);
    assert.match(enriched.narrative_line, /Bustout: Melt the Guns - a 2051 show gap/);
    assert.match(enriched.narrative_line, /That lands you #184 of 210 globally/);
    assert.doesNotMatch(enriched.narrative_line, /Wrong One|Wrong Two/);
  });

  it("mixed weaves arc + which slots hit + rank and pool", () => {
    const enriched = buildShowRecapEnrichment({
      showLevel: COMPOSER_SHOW,
      userPicks: { ...EMPTY_BOARD, s1o: "Carini", s2c: "Run Like an Antelope" },
      actualSetlist: COMPOSER_ACTUAL,
      show_score: 25,
      global_rank: 18,
      global_total_pickers: 80,
      pool_name: "Couch Tour",
      pool_rank: 3,
      pool_total_pickers: 12,
    });
    assert.equal(enriched.narrative_branch, "mixed");
    assert.match(enriched.narrative_line, /Set 1 opened with Carini/);
    assert.match(enriched.narrative_line, /you hit the opener and closer \(2 of 6\)/i);
    assert.match(enriched.narrative_line, /Bustout: Melt the Guns - a 2051 show gap stayed off your board/);
    assert.match(enriched.narrative_line, /You sit #18 of 80 globally and #3 of 12 in Couch Tour/);
  });

  it("hot_night weaves arc + all-six card + top-band rank", () => {
    const enriched = buildShowRecapEnrichment({
      showLevel: COMPOSER_SHOW,
      userPicks: {
        s1o: "Carini",
        s1c: "Harry Hood",
        s2o: "What's Going Through Your Mind",
        s2c: "Run Like an Antelope",
        enc: "A Life Beyond The Dream",
        wild: "Fuego",
      },
      actualSetlist: COMPOSER_ACTUAL,
      show_score: 70,
      global_rank: 4,
      global_total_pickers: 200,
    });
    assert.equal(enriched.narrative_branch, "hot_night");
    assert.match(enriched.narrative_line, /Set 1 opened with Carini/);
    assert.match(enriched.narrative_line, /Strong night — you hit all six/);
    assert.match(enriched.narrative_line, /Bustout: Melt the Guns - a 2051 show gap stayed off your board/);
    assert.match(enriched.narrative_line, /That puts you #4 of 200 globally/);
  });

  it("bustout_hero weaves arc + caught bustout + rank", () => {
    const enriched = buildShowRecapEnrichment({
      showLevel: COMPOSER_SHOW,
      userPicks: { ...EMPTY_BOARD, wild: "Melt the Guns" },
      actualSetlist: COMPOSER_ACTUAL,
      show_score: 30,
      global_rank: 1,
      global_total_pickers: 11,
    });
    assert.equal(enriched.narrative_branch, "bustout_hero");
    assert.match(enriched.narrative_line, /Set 1 opened with Carini/);
    assert.match(
      enriched.narrative_line,
      /You caught a bustout — Melt the Guns - a 2051 show gap on your wildcard \(1 of 6\)/,
    );
    assert.match(enriched.narrative_line, /That puts you #1 of 11 globally/);
    assert.doesNotMatch(enriched.narrative_line, /Wrong One/);
  });

  it("soft-fails to highlight wrappers when context is missing", () => {
    const line = composeShowRecapNarrative({
      narrative_branch: "cold",
      setlist_highlight: "Bustout: Melt the Guns - a 2051 show gap.",
    });
    assert.equal(
      line,
      "Tough board. Still a night to remember: Bustout: Melt the Guns - a 2051 show gap.",
    );
  });

  it("uses opener/encore titles when set_flow_summary is absent", () => {
    const line = composeShowRecapNarrative({
      narrative_branch: "mixed",
      opener_title: "Carini",
      encore_title: "Tweeprise",
      correct_picks_count: 2,
      total_picks_count: 6,
      slot_hits: [
        { fieldId: "s1o", label: "opener", title: "Carini", hit: true, submitted: true },
        { fieldId: "s2c", label: "closer", title: "Tweeprise", hit: true, submitted: true },
      ],
      global_rank: 40,
      global_total_pickers: 100,
    });
    assert.match(line, /Carini opened; Tweeprise closed the night/);
    assert.match(line, /you hit the opener and closer \(2 of 6\)/i);
    assert.match(line, /You sit #40 of 100 globally/);
  });
});
