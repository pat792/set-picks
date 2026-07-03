"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  setlistHasAnyPlayedSong,
  actualSetlistFromOfficialDoc,
  persistableActualSetlistFromOfficialDoc,
  shouldSkipLiveScoreRecompute,
} = require("./scoringCore");

test("setlistHasAnyPlayedSong: false when all slots empty and no ordered list", () => {
  const doc = {
    setlist: { s1o: "", s1c: "", s2o: "", s2c: "", enc: "" },
    officialSetlist: [],
  };
  assert.equal(setlistHasAnyPlayedSong(actualSetlistFromOfficialDoc(doc)), false);
});

test("setlistHasAnyPlayedSong: true when a slot has a song", () => {
  const doc = {
    setlist: { s1o: "Fee", s1c: "", s2o: "", s2c: "", enc: "" },
    officialSetlist: [],
  };
  assert.equal(setlistHasAnyPlayedSong(actualSetlistFromOfficialDoc(doc)), true);
});

test("setlistHasAnyPlayedSong: true when ordered official list only", () => {
  const doc = {
    setlist: { s1o: "", s1c: "", s2o: "", s2c: "", enc: "" },
    officialSetlist: ["Tweezer"],
  };
  assert.equal(setlistHasAnyPlayedSong(actualSetlistFromOfficialDoc(doc)), true);
});

test("persistableActualSetlistFromOfficialDoc: ignores junk slot keys not in SCORE_FIELDS", () => {
  const doc = {
    setlist: {
      s1o: "",
      s1c: "",
      s2o: "",
      s2c: "",
      enc: "",
      wild: "",
      junkSlot: "Ghost",
    },
    officialSetlist: [],
  };
  assert.equal(setlistHasAnyPlayedSong(actualSetlistFromOfficialDoc(doc)), true);
  assert.equal(setlistHasAnyPlayedSong(persistableActualSetlistFromOfficialDoc(doc)), false);
});

test("shouldSkipLiveScoreRecompute: true when only non-scoring metadata changes", () => {
  const playable = {
    setlist: { s1o: "Fee", s1c: "", s2o: "", s2c: "", enc: "", wild: "" },
    officialSetlist: ["Fee"],
  };
  const before = { ...playable, updatedAt: "t1", source: "phishnet" };
  const after = { ...playable, updatedAt: "t2", source: "admin", notes: "typo fix" };
  assert.equal(shouldSkipLiveScoreRecompute(before, after), true);
});

test("shouldSkipLiveScoreRecompute: false when a scored slot changes", () => {
  const before = {
    setlist: { s1o: "Fee", s1c: "", s2o: "", s2c: "", enc: "", wild: "" },
    officialSetlist: ["Fee"],
  };
  const after = {
    setlist: { s1o: "Ghost", s1c: "", s2o: "", s2c: "", enc: "", wild: "" },
    officialSetlist: ["Ghost"],
  };
  assert.equal(shouldSkipLiveScoreRecompute(before, after), false);
});

test("shouldSkipLiveScoreRecompute: false on first write (no before doc)", () => {
  const after = {
    setlist: { s1o: "Fee", s1c: "", s2o: "", s2c: "", enc: "", wild: "" },
    officialSetlist: ["Fee"],
  };
  assert.equal(shouldSkipLiveScoreRecompute(null, after), false);
});
