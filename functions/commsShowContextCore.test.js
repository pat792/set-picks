/**
 * Unit tests for #572 show context builders.
 */

"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  COMMS_SHOW_CONTEXT_SCHEMA_VERSION,
  buildCommsShowContext,
  composeSetlistHighlight,
  tourDebutTitles,
  priorDatesForTourDebutLookup,
  groupOfficialSetlistBySet,
} = require("./commsShowContextCore");
const {
  resolveNarrativeBranch,
  buildUserShowScorecard,
  buildShowRecapEnrichment,
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

  it("regression: truncated 12-show priors invented Dick's Plasma debuts", () => {
    // writeCommsShowContext used priorDates.slice(-12). For 2026-09-04 that
    // dropped 2026-07-07..07-14 (including Plasma on 07-10 and 46 Days earlier),
    // so highlight became: "4 songs new to this tour — including Plasma."
    const early = [
      { officialSetlist: ["Plasma", "Tube"] }, // 2026-07-10
      { officialSetlist: ["46 Days", "Free"] },
    ];
    const recent12 = Array.from({ length: 12 }, (_, i) => ({
      officialSetlist: [`Recent${i}`, "Character Zero"],
    }));
    const dicksN1 = {
      officialSetlist: [
        "Plasma",
        "Ya Mar",
        "46 Days",
        "Lonely Trip",
        "Character Zero",
      ],
    };
    const falseDebuts = tourDebutTitles(dicksN1, recent12);
    assert.deepEqual(falseDebuts, [
      "Plasma",
      "Ya Mar",
      "46 Days",
      "Lonely Trip",
    ]);
    assert.equal(
      composeSetlistHighlight({
        bustoutTitles: [],
        tourDebuts: falseDebuts,
        openerTitle: "No Men In No Man's Land",
        encoreTitle: "Harry Hood",
      }),
      "4 songs new to this tour — including Plasma.",
    );
    assert.deepEqual(tourDebutTitles(dicksN1, [...early, ...recent12]), [
      "Ya Mar",
      "Lonely Trip",
    ]);
  });
});

describe("priorDatesForTourDebutLookup", () => {
  it("keeps the full prior itinerary (no trailing slice)", () => {
    const prior = Array.from(
      { length: 18 },
      (_, i) => `2026-07-${String(i + 1).padStart(2, "0")}`,
    );
    assert.deepEqual(priorDatesForTourDebutLookup(prior), prior);
    assert.equal(priorDatesForTourDebutLookup(prior).length, 18);
  });

  it("filters non-string entries", () => {
    assert.deepEqual(
      priorDatesForTourDebutLookup(["2026-07-07", null, "  ", 3, "2026-07-08"]),
      ["2026-07-07", "2026-07-08"],
    );
  });
});

describe("COMMS_SHOW_CONTEXT_SCHEMA_VERSION", () => {
  it("is 2 so ensureCommsShowContext rebuilds truncated-prior artifacts", () => {
    assert.equal(COMMS_SHOW_CONTEXT_SCHEMA_VERSION, 2);
    const ctx = buildCommsShowContext({
      showDate: "2026-09-04",
      setlistDoc: { officialSetlist: ["Ya Mar"], setlist: { s1o: "Ya Mar" } },
      priorTourSetlistDocs: [{ officialSetlist: ["Plasma"] }],
    });
    assert.equal(ctx.schemaVersion, 2);
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
    assert.equal(enriched.narrative_line, "You caught a bustout — Wolfman's - an 87 show gap.");
  });
});
