#!/usr/bin/env node
/**
 * Canary / dry-run for durable `tour_recap` (#510) via Cloud Functions only.
 *
 * Does **not** use the retired Sphere War Room panel (callable is CLI-only).
 * Calls production `runCommsTrigger` over HTTPS after minting an admin ID token.
 *
 * Auth: same as `scripts/canary-comms.mjs` —
 *   GCP_CLIENT_EMAIL + GCP_PRIVATE_KEY (+ VITE_FIREBASE_API_KEY) in `.env`
 *   or process env.
 *
 * Usage:
 *   node scripts/canary-tour-recap.mjs                  # dryRun (default)
 *   node scripts/canary-tour-recap.mjs --live            # send to admin uid only
 *   node scripts/canary-tour-recap.mjs --live --force     # forceResend (bypass dedup)
 *   node scripts/canary-tour-recap.mjs --tour="2026 Summer Tour"
 *   node scripts/canary-tour-recap.mjs --uid=<otherAdminUid>  # still needs admin claim on caller
 *
 * Full cohort backfill (after canary): prefer force re-rollup of final show date:
 *   node scripts/canary-tour-recap.mjs --force-rollup --showDate=2026-09-06
 */

import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

/** @type {Record<string, string>} */
const fileEnv = {};
const envPath = resolve(root, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) fileEnv[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
  }
}

function env(key) {
  return (process.env[key] || fileEnv[key] || '').trim();
}

const args = process.argv.slice(2);
function flagValue(name) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] || null;
}
const live = args.includes('--live');
const forceResend = args.includes('--force');
const forceRollup = args.includes('--force-rollup');
const tourKey = flagValue('--tour') || '2026 Summer Tour';
const showDate = flagValue('--showDate') || '2026-09-06';
const onlyUid = flagValue('--uid');

const API_KEY = env('VITE_FIREBASE_API_KEY');
const PROJECT_ID = env('VITE_FIREBASE_PROJECT_ID');
const REGION = 'us-central1';
const ADMIN_EMAIL = env('COMMS_CANARY_ADMIN_EMAIL') || 'pat@road2media.com';
const clientEmail = env('GCP_CLIENT_EMAIL');
const privateKey = env('GCP_PRIVATE_KEY').replace(/\\n/g, '\n');

if (!API_KEY || !PROJECT_ID) {
  console.error('Missing VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID (.env or process env)');
  process.exit(1);
}
if (!clientEmail || !privateKey) {
  console.error('Missing GCP_CLIENT_EMAIL / GCP_PRIVATE_KEY (.env or process env)');
  console.error('Needed to mint an admin custom token for runCommsTrigger / rollupScoresForShow.');
  process.exit(1);
}

const admin = require('../functions/node_modules/firebase-admin/lib/index.js');
const {
  buildTourRecapPodium,
  buildTourRecapPayload,
  isFinalShowOfTour,
} = require('../functions/tourRecapCore.js');
const {
  aggregateTourStandings,
  assignDisplayRanks,
  tourDatesForKey,
} = require('../functions/tourRankingsDailyCore.js');

const FIRESTORE_IN_QUERY_LIMIT = 30;

function handleFromUser(data) {
  if (!data || typeof data !== 'object') return 'Anonymous';
  if (typeof data.handle === 'string' && data.handle.trim()) return data.handle.trim();
  return 'Anonymous';
}

/** @param {import('firebase-admin').firestore.Firestore} db @param {string[]} dates */
async function loadPicksByDates(db, dates) {
  /** @type {Map<string, Record<string, unknown>[]>} */
  const byDate = new Map();
  for (const d of dates) byDate.set(d, []);
  if (dates.length === 0) return [];
  for (let i = 0; i < dates.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    const chunk = dates.slice(i, i + FIRESTORE_IN_QUERY_LIMIT);
    // eslint-disable-next-line no-await-in-loop
    const snap = await db.collection('picks').where('showDate', 'in', chunk).get();
    for (const doc of snap.docs) {
      const data = doc.data() || {};
      const sd = typeof data.showDate === 'string' ? data.showDate.trim() : '';
      if (!byDate.has(sd)) continue;
      byDate.get(sd).push({ id: doc.id, ...data });
    }
  }
  return dates.map((date) => ({ date, picks: byDate.get(date) || [] }));
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: PROJECT_ID,
      clientEmail,
      privateKey,
    }),
    projectId: PROJECT_ID,
  });
}

const db = admin.firestore();

async function mintIdToken(uid) {
  const customToken = await admin.auth().createCustomToken(uid);
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://www.setlistpickem.com/',
        Origin: 'https://www.setlistpickem.com',
      },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(`Token exchange failed: ${json.error?.message}`);
  return json.idToken;
}

async function callCallable(name, idToken, data) {
  const url = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${name}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ data }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Function error ${res.status}: ${JSON.stringify(json)}`);
  return json.result ?? json;
}

function tourDatesFromCalendar(calData, key) {
  const byTour = Array.isArray(calData?.showDatesByTour) ? calData.showDatesByTour : [];
  for (const entry of byTour) {
    const label = typeof entry?.tourLabel === 'string' ? entry.tourLabel : entry?.tourKey;
    if (label === key && Array.isArray(entry?.dates)) {
      return entry.dates.filter((d) => typeof d === 'string' && d.trim()).slice().sort();
    }
  }
  // Alternate shape: map of tour → dates
  const map = calData?.showDatesByTour;
  if (map && typeof map === 'object' && !Array.isArray(map) && Array.isArray(map[key])) {
    return map[key].filter((d) => typeof d === 'string' && d.trim()).slice().sort();
  }
  return [];
}

async function buildRecipientsForTour(targetUid) {
  const calSnap = await db.collection('show_calendar').doc('snapshot').get();
  const calData = calSnap.exists ? calSnap.data() || {} : {};
  const showDatesByTour = calData.showDatesByTour ?? null;
  let tourDates = tourDatesForKey(showDatesByTour, tourKey);
  if (tourDates.length === 0) {
    tourDates = tourDatesFromCalendar(calData, tourKey);
  }
  if (tourDates.length === 0) {
    throw new Error(`No dates found for tour "${tourKey}" in show_calendar/snapshot`);
  }
  const finalDate = tourDates[tourDates.length - 1];
  console.log(`✓ tour="${tourKey}" shows=${tourDates.length} final=${finalDate}`);
  if (showDate && !isFinalShowOfTour(tourDates, showDate)) {
    console.warn(
      `⚠ --showDate=${showDate} is not the final calendar date (${finalDate}). Continuing with standings anyway.`
    );
  }

  const picksByDate = await loadPicksByDates(db, tourDates);
  const leaders = aggregateTourStandings(picksByDate);
  if (leaders.length === 0) throw new Error('No eligible players with graded picks on this tour');
  const ranked = assignDisplayRanks(leaders);
  const podium = buildTourRecapPodium(leaders);
  const participantCount = leaders.length;
  const showCount = tourDates.length;

  /** @type {Array<{ uid: string, payload: object, vars: object }>} */
  const recipients = [];
  for (const row of leaders) {
    if (targetUid && row.uid !== targetUid) continue;
    const info = ranked.get(row.uid);
    const rank = info?.rank ?? recipients.length + 1;
    // eslint-disable-next-line no-await-in-loop
    const userSnap = await db.collection('users').doc(row.uid).get();
    const userData = userSnap.exists ? userSnap.data() || {} : {};
    recipients.push({
      uid: row.uid,
      payload: buildTourRecapPayload({
        handle: row.handle || handleFromUser(userData),
        rank,
        points: row.totalPoints,
        wins: row.wins,
        showsPlayed: row.shows,
        participantCount,
        tourId: tourKey,
        tourName: tourKey,
        showCount,
        podium,
      }),
      vars: { uid: row.uid, tourId: tourKey },
    });
  }
  if (recipients.length === 0) {
    throw new Error(
      targetUid
        ? `uid ${targetUid} has no graded picks on "${tourKey}" — cannot canary that user`
        : 'No recipients'
    );
  }
  return { recipients, finalDate, participantCount };
}

async function main() {
  console.log(`→ Looking up admin uid for ${ADMIN_EMAIL}…`);
  const adminUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
  const callerUid = adminUser.uid;
  console.log(`✓ caller uid = ${callerUid}`);

  console.log('→ Minting ID token…');
  const idToken = await mintIdToken(callerUid);
  console.log('✓ ID token obtained\n');

  if (forceRollup) {
    console.log(`→ rollupScoresForShow  showDate=${showDate}  force=true`);
    console.log('  (production fan-out: show_recap + tour_recap if final show + adapters on)');
    const result = await callCallable('rollupScoresForShow', idToken, {
      showDate,
      force: true,
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const canaryUid = onlyUid || callerUid;
  console.log(`→ Building tour_recap recipient(s) for uid=${canaryUid} tour="${tourKey}"…`);
  const { recipients, finalDate, participantCount } = await buildRecipientsForTour(canaryUid);
  const me = recipients[0];
  console.log(
    `✓ canary payload: rank=#${me.payload.rank} points=${me.payload.points} wins=${me.payload.wins} shows=${me.payload.showsPlayed} / field=${participantCount} final=${finalDate}`
  );
  console.log(`  headline: ${me.payload.headline}`);
  console.log(`  podium: ${me.payload.podium.rows.map((r) => r.handle).join(', ')}`);

  const payload = {
    triggerId: 'tour_recap',
    recipients,
    dryRun: !live,
    forceResend: forceResend || false,
  };

  console.log(
    `\n→ runCommsTrigger  triggerId=tour_recap  dryRun=${payload.dryRun}  forceResend=${payload.forceResend}  recipients=${recipients.length}`
  );
  const result = await callCallable('runCommsTrigger', idToken, payload);
  console.log(JSON.stringify(result, null, 2));

  if (!live) {
    console.log('\nDry-run only. Re-run with --live to deliver to the canary uid via Cloud Functions.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
