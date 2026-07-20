const test = require("node:test");
const assert = require("node:assert/strict");

const {
  aggregateNight,
  aggregateWindow,
  aggregateSongsAcrossDocs,
  renderMarkdownReport,
} = require("./picksRollupReportCore");

const SAMPLE = [
  {
    userId: "a",
    showDate: "2026-07-18",
    isGraded: true,
    pools: [{ id: "p1", name: "Crew" }],
    picks: {
      s1o: "Tweezer",
      s1c: "Bathtub Gin",
      s2o: "Ghost",
      s2c: "Harry Hood",
      enc: "Character Zero",
      wild: "Free",
    },
  },
  {
    userId: "b",
    showDate: "2026-07-18",
    isGraded: true,
    pools: [],
    picks: {
      s1o: "Tweezer",
      s1c: "Bathtub Gin",
      s2o: "Down with Disease",
      s2c: "Harry Hood",
      enc: "First Tube",
      wild: "Ghost",
    },
  },
  {
    userId: "c",
    showDate: "2026-07-18",
    isGraded: false,
    pools: [],
    picks: {
      s1o: "Sample in a Jar",
      s1c: "Run Like an Antelope",
      s2o: "Ghost",
      s2c: "You Enjoy Myself",
      enc: "Character Zero",
      wild: "Tweezer",
    },
  },
  {
    userId: "d",
    showDate: "2026-07-18",
    isGraded: false,
    pools: [],
    picks: { s1o: "  ", s1c: "" },
  },
];

test("aggregateNight: counts submitted, graded, pools, consensus, rare", () => {
  const night = aggregateNight("2026-07-18", SAMPLE, { consensusPct: 50 });
  assert.equal(night.totalDocs, 4);
  assert.equal(night.submitted, 3);
  assert.equal(night.graded, 2);
  assert.equal(night.emptyOrDraft, 1);
  assert.equal(night.poolAffiliated, 1);
  // Tweezer + Ghost both appear on 3 cards; title tie-break is alphabetical.
  assert.equal(night.topOverall[0].count, 3);
  assert.ok(
    night.topOverall.some((r) => r.title === "Tweezer" && r.count === 3)
  );
  assert.ok(night.consensus.some((c) => c.title === "Tweezer"));
  assert.ok(night.rareCount >= 1);
  assert.equal(night.slotFillPct.s1o, 100);
});

test("aggregateNight: consensusVsActual when setlist present", () => {
  const night = aggregateNight("2026-07-18", SAMPLE, {
    setlist: {
      s1o: "Tweezer",
      s1c: "Possum",
      s2o: "Ghost",
      s2c: "Harry Hood",
      enc: "Character Zero",
    },
  });
  assert.ok(Array.isArray(night.consensusVsActual));
  const s1o = night.consensusVsActual.find((r) => r.slotId === "s1o");
  assert.equal(s1o.matched, true);
  const s1c = night.consensusVsActual.find((r) => r.slotId === "s1c");
  assert.equal(s1c.matched, false);
  assert.equal(s1c.actual, "Possum");
});

test("aggregateWindow + tour songs + markdown", () => {
  const n1 = aggregateNight("2026-07-18", SAMPLE);
  const n2 = aggregateNight("2026-07-19", [
    {
      userId: "a",
      isGraded: true,
      pools: [],
      picks: {
        s1o: "Free",
        s1c: "Tweezer",
        s2o: "Ghost",
        s2c: "Hood",
        enc: "Zero",
        wild: "Gin",
      },
    },
  ]);
  const window = aggregateWindow([n1, n2]);
  assert.equal(window.nightCount, 2);
  assert.equal(window.submitted.total, 4);
  assert.equal(window.series[0].showDate, "2026-07-18");

  const songs = aggregateSongsAcrossDocs([
    ...SAMPLE,
    {
      picks: {
        s1o: "Free",
        s1c: "Tweezer",
        s2o: "Ghost",
        s2c: "Hood",
        enc: "Zero",
        wild: "Gin",
      },
    },
  ]);
  assert.ok(songs.uniqueSongs >= 5);
  assert.ok(songs.top[0].cardAppearances >= 1);

  const md = renderMarkdownReport({
    title: "Test",
    generatedAt: "2026-07-19T00:00:00.000Z",
    window,
    nights: [n1, n2],
    tourSongs: songs,
    meta: { issue: "#687" },
  });
  assert.match(md, /Nightly picker trend/);
  assert.match(md, /2026-07-18/);
  assert.doesNotMatch(md, /userId/);
});
