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
  it("formats bustout as Song - gap", () => {
    assert.equal(
      composeSetlistHighlight({
        bustoutTitles: ["Curtain With"],
        bustoutEntries: [{ title: "Curtain With", gap: 142 }],
        tourDebuts: [],
        openerTitle: "YEM",
        encoreTitle: "Tweeprise",
      }),
      "Curtain With - 142",
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
    assert.equal(ctx.setlist_highlight, "Wolfman's - 87");
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
    assert.equal(enriched.narrative_line, "You caught a bustout — Wolfman's - 87.");
  });
});
