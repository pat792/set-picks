/**
 * Comms email preview script — sends every email-capable v1 trigger template
 * to the admin account so the actual rendered Resend output can be reviewed
 * before flipping `COMMS_EVENT_ADAPTERS_ENABLED` on in production.
 *
 * Reuses the auth flow from `scripts/canary-comms.mjs` (mint a custom token
 * for the admin uid, exchange for an ID token, call `runCommsTrigger` over
 * HTTPS — no password or browser needed).
 *
 * Uses `bypassDailyCap: true` (admin-only, QA-only — see `commsEmailWorker.js`)
 * so all 5 templates land in one sitting instead of being capped to 1/day.
 * Uses `forceResend: true` so re-running this script always sends again
 * instead of getting deduped against a prior test send.
 *
 * Usage:
 *   node scripts/canary-comms-preview.mjs
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, '../.env');
const envVars = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) envVars[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
}

const API_KEY = envVars.VITE_FIREBASE_API_KEY;
const PROJECT_ID = 'set-picks';
const REGION = 'us-central1';
const ADMIN_EMAIL = 'pat@road2media.com';

const serviceAccount = {
  projectId: PROJECT_ID,
  clientEmail: envVars.GCP_CLIENT_EMAIL,
  privateKey: envVars.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

const admin = require('../functions/node_modules/firebase-admin/lib/index.js');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
  });
}

async function getAdminUid() {
  const user = await admin.auth().getUserByEmail(ADMIN_EMAIL);
  return user.uid;
}

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

async function callRunCommsTrigger(idToken, payload) {
  const url = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/runCommsTrigger`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ data: payload }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Function error ${res.status}: ${JSON.stringify(json)}`);
  return json.result ?? json;
}

// Every trigger whose catalog `channels` includes "email"
// (functions/commsCatalog.js TRIGGER_SPECS). Payload keys match the
// placeholders each template reads in functions/commsTemplates.js; vars
// keys only affect the dedup doc id (harmless with forceResend: true).
const TRIGGERS_TO_PREVIEW = [
  {
    triggerId: 'account_welcome',
    payload: {
      handle: 'Pat',
      next_show_date: 'Sat, Sep 12',
      next_show_venue: 'Sphere, Las Vegas',
    },
  },
  {
    triggerId: 'tour_countdown',
    payload: {
      tour_name: "Fall Tour '26",
      days_remaining: 3,
      lock_time_local: '7:30 PM',
      first_show_date: 'Fri, Sep 11',
      first_show_venue: 'Madison Square Garden',
      first_show_city: 'New York, NY',
    },
    vars: { tourId: 'preview-tour', days_remaining: 3 },
  },
  {
    triggerId: 'picks_lock_reminder',
    payload: {
      venue_name: 'Madison Square Garden',
      lock_time_local: '7:30 PM',
    },
    vars: { showYmd: '2026-09-11' },
  },
  {
    triggerId: 'tour_rankings_daily',
    payload: {
      venue_name: 'Madison Square Garden',
      venue_city: 'New York',
      show_score: 42,
      global_rank: 7,
      global_total_pickers: 3120,
      correct_picks_count: 3,
      total_picks_count: 4,
      tour_rank: 12,
      total_tour_pickers: 890,
      tour_points: 156,
      rank_change: '+4',
      next_show_venue: 'TD Garden',
      next_show_date: 'Sun, Sep 13',
    },
    vars: { showDate: '2026-09-11' },
  },
  {
    triggerId: 'tour_engagement_reminder',
    payload: {
      global_rank: 12,
      shows_remaining: 6,
    },
    vars: { tourId: 'preview-tour' },
  },
];

try {
  console.log(`\u2192 Looking up admin uid for ${ADMIN_EMAIL}\u2026`);
  const uid = await getAdminUid();
  console.log(`\u2713 uid = ${uid}\n`);

  console.log('\u2192 Minting ID token via service account\u2026');
  const idToken = await mintIdToken(uid);
  console.log('\u2713 ID token obtained\n');

  for (const { triggerId, payload, vars } of TRIGGERS_TO_PREVIEW) {
    console.log(`\u2192 runCommsTrigger  triggerId=${triggerId}  dryRun=false  bypassDailyCap=true`);
    // eslint-disable-next-line no-await-in-loop
    const result = await callRunCommsTrigger(idToken, {
      triggerId,
      recipients: [{ uid, payload, vars }],
      dryRun: false,
      forceResend: true,
      bypassDailyCap: true,
    });
    console.log(JSON.stringify(result, null, 2), '\n');
  }

  console.log(`Done. Check ${ADMIN_EMAIL} for ${TRIGGERS_TO_PREVIEW.length} preview emails.`);
} catch (err) {
  console.error('\n\u2717', err.message);
  process.exit(1);
}
