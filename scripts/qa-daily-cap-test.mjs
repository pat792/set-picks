/**
 * #453/#456 daily-cap manual test plan: fires two real, non-exempt
 * email-eligible triggers for the same user on the same day WITHOUT
 * `bypassDailyCap`, and confirms exactly one sends email while the other is
 * capped (`skipReason: "daily_email_cap"`, logged as `comms_capped`).
 *
 * One-off QA script — not part of the regular canary preview flow.
 *
 * Usage:
 *   node scripts/qa-daily-cap-test.mjs
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

// Both non-exempt (account_welcome is the only EXEMPT_TRIGGERS entry in
// commsEmailDailyCap.js), so whichever runs first wins today's one
// discretionary-email slot for this uid.
const FIRST = {
  triggerId: 'tour_countdown',
  payload: {
    tour_name: "Fall Tour '26",
    days_remaining: 2,
    lock_time_local: '7:55 PM',
    first_show_venue: 'Madison Square Garden',
  },
  vars: { tourId: 'daily-cap-qa', days_remaining: 2 },
};
const SECOND = {
  triggerId: 'picks_lock_reminder',
  payload: { venue_name: 'Madison Square Garden', lock_time_local: '7:55 PM' },
  vars: { showYmd: '2026-09-12' },
};

try {
  console.log(`\u2192 Looking up admin uid for ${ADMIN_EMAIL}\u2026`);
  const uid = await getAdminUid();
  console.log(`\u2713 uid = ${uid}\n`);

  console.log('\u2192 Minting ID token\u2026');
  const idToken = await mintIdToken(uid);
  console.log('\u2713 ID token obtained\n');

  console.log(`\u2192 [1/2] runCommsTrigger triggerId=${FIRST.triggerId} (no bypassDailyCap, expect email:1)`);
  const first = await callRunCommsTrigger(idToken, {
    triggerId: FIRST.triggerId,
    recipients: [{ uid, payload: FIRST.payload, vars: FIRST.vars }],
    dryRun: false,
    forceResend: true,
  });
  console.log(JSON.stringify(first, null, 2), '\n');

  console.log(`\u2192 [2/2] runCommsTrigger triggerId=${SECOND.triggerId} (no bypassDailyCap, expect email:0 / capped)`);
  const second = await callRunCommsTrigger(idToken, {
    triggerId: SECOND.triggerId,
    recipients: [{ uid, payload: SECOND.payload, vars: SECOND.vars }],
    dryRun: false,
    forceResend: true,
  });
  console.log(JSON.stringify(second, null, 2), '\n');

  const firstEmail = first?.byChannel?.email;
  const secondEmail = second?.byChannel?.email;
  const secondSkip = second?.results?.[0]?.status === 'skipped' ? second.results[0] : null;

  console.log('--- Result ---');
  console.log(`First trigger (${FIRST.triggerId}) email delivered: ${firstEmail === 1 ? 'YES' : 'NO'}`);
  console.log(`Second trigger (${SECOND.triggerId}) email delivered: ${secondEmail === 1 ? 'YES' : 'NO'}`);
  if (firstEmail === 1 && secondEmail === 0) {
    console.log('PASS: exactly one discretionary email sent today; the second was capped.');
  } else {
    console.log('UNEXPECTED: check output above against #453/#456 test plan expectations.');
  }
} catch (err) {
  console.error('\n\u2717', err.message);
  process.exit(1);
}
