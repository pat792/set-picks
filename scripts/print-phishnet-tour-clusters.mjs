#!/usr/bin/env node
/**
 * Prints Phish.net show clusters + computed tour labels (same heuristics as Cloud Function
 * before merge with snapshot/overrides). Use for manual tour_overrides authoring.
 *
 * Usage: repo root, `npm run print:phishnet-tour-clusters`
 * Requires: `PHISHNET_API_KEY` in `.env` (same as diagnose:phishnet).
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const {
  fetchAllShowsNormalized,
  buildShowDatesByTour,
} = require(join(root, 'functions/phishnetShowCalendar.js'));

function loadKey() {
  const envPath = join(root, '.env');
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.startsWith('#') || !t) continue;
    const m = /^PHISHNET_API_KEY=(.*)$/.exec(t);
    if (m) return m[1].replace(/^["']|["']$/g, '').trim();
  }
  return '';
}

const key = loadKey();
if (!key) {
  console.error('Add PHISHNET_API_KEY=... to .env (repo root).');
  process.exit(1);
}

const shows = await fetchAllShowsNormalized({ apiKey: key });
const groups = buildShowDatesByTour(shows);

console.log('# Computed tour clusters (pre–snapshot merge)\n');
for (const g of groups) {
  console.log(`## ${g.tour}`);
  for (const s of g.shows) {
    console.log(`  ${s.date}  ${s.venue}`);
  }
  console.log('');
}

console.log(
  '# To lock names: Firestore → show_calendar → tour_overrides → field byShowDate (map each date → string).'
);
console.log(
  '# Overrides beat previous snapshot on the next sync. Process B reviewQueue only lists dates NEW vs last snapshot.'
);
