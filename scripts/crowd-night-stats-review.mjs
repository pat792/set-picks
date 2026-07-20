#!/usr/bin/env node
/**
 * Local review CLI for crowd night stats (C1–C3 / #690–#692).
 *
 * Usage (repo root):
 *   node scripts/crowd-night-stats-review.mjs --date=2026-07-19
 *   node scripts/crowd-night-stats-review.mjs --date=2026-07-19 --tour="Summer Tour"
 *
 * Auth: gcloud auth application-default login
 * Project: GOOGLE_CLOUD_PROJECT or .env VITE_FIREBASE_PROJECT_ID
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import {
  aggregateCrowdNightSongs,
  crowdNightCardSummary,
} from '../src/features/crowd-picks/model/aggregateCrowdNightSongs.js';
import { aggregateCrowdNightCatalog } from '../src/features/crowd-picks/model/aggregateCrowdNightCatalog.js';
import {
  aggregateLeadersTonightPicks,
  LEADERS_TOP_K,
} from '../src/features/crowd-picks/model/aggregateLeadersTonightPicks.js';
import { aggregateTourStandings } from '../src/features/scoring/model/aggregateTourStandings.js';
import { PHISH_SONGS } from '../src/shared/data/phishSongs.js';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(REPO_ROOT, '.env');

/**
 * @param {string[]} argv
 */
function parseArgs(argv) {
  /** @type {Record<string, string | true>} */
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [k, ...rest] = arg.slice(2).split('=');
    out[k] = rest.length ? rest.join('=') : true;
  }
  return out;
}

function loadEnv() {
  /** @type {Record<string, string>} */
  const env = {};
  if (!fs.existsSync(ENV_PATH)) return env;
  for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    env[t.slice(0, eq).trim()] = t
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  return env;
}

function isShowDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

/**
 * @param {FirebaseFirestore.Firestore} db
 */
async function loadTourDates(db, tourNeedle) {
  const snap = await db.collection('show_calendar').doc('snapshot').get();
  const data = snap.exists ? snap.data() || {} : {};
  const byTour = Array.isArray(data.showDatesByTour) ? data.showDatesByTour : [];
  /** @type {string[]} */
  const dates = [];
  const needle =
    typeof tourNeedle === 'string' ? tourNeedle.trim().toLowerCase() : '';
  for (const group of byTour) {
    const tour = typeof group?.tour === 'string' ? group.tour : '';
    if (needle && !tour.toLowerCase().includes(needle)) continue;
    if (!Array.isArray(group?.shows)) continue;
    for (const s of group.shows) {
      if (s && isShowDate(s.date)) dates.push(s.date.trim());
    }
  }
  const unique = [...new Set(dates)].sort();
  if (!needle || !unique.length) return unique;
  const years = [...new Set(unique.map((d) => d.slice(0, 4)))].sort();
  if (years.length <= 1) return unique;
  const latest = years[years.length - 1];
  return unique.filter((d) => d.startsWith(latest));
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {string} showDate
 */
async function loadPicks(db, showDate) {
  const snap = await db
    .collection('picks')
    .where('showDate', '==', showDate)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
}

/**
 * @param {FirebaseFirestore.Firestore} db
 * @param {string[]} dates
 */
async function loadTourStandings(db, dates) {
  /** @type {Array<{ date: string, picks: Array<Record<string, unknown>> }>} */
  const byDate = [];
  const chunk = 8;
  for (let i = 0; i < dates.length; i += chunk) {
    const slice = dates.slice(i, i + chunk);
    const parts = await Promise.all(
      slice.map(async (date) => ({ date, picks: await loadPicks(db, date) }))
    );
    byDate.push(...parts);
  }
  return aggregateTourStandings(byDate);
}

/**
 * Prefer bundled fallback catalog for offline-friendly review.
 * @returns {Array<{ name?: string, gap?: string, debut?: string }>}
 */
/**
 * Prefer live Storage `song-catalog.json` (has debut); fall back to bundled.
 * @param {string} projectId
 */
async function loadCatalogSongs(projectId) {
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file('song-catalog.json');
    const [buf] = await file.download();
    const parsed = JSON.parse(buf.toString('utf8'));
    if (Array.isArray(parsed?.songs) && parsed.songs.length) {
      console.error(
        `  catalog: Storage song-catalog.json (${parsed.songs.length} songs)`
      );
      return parsed.songs;
    }
  } catch (err) {
    console.error(
      `  catalog: Storage fetch failed (${err?.message || err}); using bundled`
    );
  }
  console.error(
    `  catalog: bundled PHISH_SONGS (${PHISH_SONGS.length}) — may lack debut`
  );
  return Array.isArray(PHISH_SONGS) ? PHISH_SONGS : [];
}

function printSection(title) {
  console.log(`\n## ${title}\n`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      'Usage: node scripts/crowd-night-stats-review.mjs --date=YYYY-MM-DD [--tour="Summer Tour"] [--out=path.json]'
    );
    process.exit(0);
  }
  const showDate = String(args.date || '').trim();
  if (!isShowDate(showDate)) {
    console.error('Error: --date=YYYY-MM-DD is required');
    process.exit(1);
  }

  const fileEnv = loadEnv();
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT || fileEnv.VITE_FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error('Missing project id (.env VITE_FIREBASE_PROJECT_ID)');
    process.exit(1);
  }

  admin.initializeApp({
    projectId,
    storageBucket:
      fileEnv.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
  });
  const db = admin.firestore();

  const tourNeedle =
    typeof args.tour === 'string' ? args.tour : 'Summer Tour';
  console.error(`crowd-night-stats-review  date=${showDate}  tour=${tourNeedle}`);

  const tonightDocs = await loadPicks(db, showDate);
  const night = aggregateCrowdNightSongs(showDate, tonightDocs);
  const card = crowdNightCardSummary(night, { topN: 3 });

  const catalogSongs = await loadCatalogSongs(projectId);
  const catalogStats = aggregateCrowdNightCatalog(night, catalogSongs);

  const tourDates = await loadTourDates(db, tourNeedle);
  const priorDates = tourDates.filter((d) => d < showDate);
  console.error(
    `  tour dates for standings: ${priorDates.length} prior to ${showDate}`
  );
  const tourLeaders = await loadTourStandings(db, priorDates);
  const leaders = aggregateLeadersTonightPicks(tourLeaders, tonightDocs, {
    topK: LEADERS_TOP_K,
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    showDate,
    tourFilter: tourNeedle,
    card,
    night: {
      pickers: night.pickers,
      uniqueSongs: night.uniqueSongs,
      multiPickerSongs: night.multiPickerSongs,
      songs: night.songs,
    },
    catalog: catalogStats,
    leaders,
  };

  printSection('Card v1 summary');
  console.log(JSON.stringify(card, null, 2));

  printSection('Multi-picker songs (≥2)');
  console.table(
    night.multiPickerSongs.slice(0, 15).map((s) => ({
      title: s.title,
      cards: s.cardCount,
      pct: s.pctOfPickers,
      slots: s.slotFills,
    }))
  );

  printSection('Highest gap (top 10)');
  console.table(
    catalogStats.highestGap.map((s) => ({
      title: s.title,
      gap: s.gap,
      cards: s.cardCount,
    }))
  );

  printSection('Slot-weighted vintage');
  console.log(JSON.stringify(catalogStats.vintage, null, 2));

  printSection(`Leaders tonight (${leaders.lockedInLabel})`);
  console.log(
    leaders.leaders
      .map((l) => `#${l.rank} ${l.handle} (${l.totalPoints} pts)`)
      .join('\n')
  );
  console.table(
    leaders.songs.slice(0, 15).map((s) => ({
      title: s.title,
      amongTop5: s.cardCount,
      who: s.amongLeaders.join(', '),
    }))
  );

  if (typeof args.out === 'string' && args.out.trim()) {
    const outPath = path.resolve(process.cwd(), args.out.trim());
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
    console.error(`\nWrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
