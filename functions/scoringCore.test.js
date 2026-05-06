"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  setlistHasAnyPlayedSong,
  actualSetlistFromOfficialDoc,
  persistableActualSetlistFromOfficialDoc,
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
