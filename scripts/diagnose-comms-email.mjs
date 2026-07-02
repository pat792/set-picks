/**
 * Read-only diagnostic for "push/in-app fired but no email" (#453/#442 area).
 *
 * Checks, for the admin test address:
 *   1. Whether it's on the `email_suppression` list (and why/when, if so).
 *   2. The most recent `email_cap:{uid}:{day}` doc, so a bad daily-cap read
 *      isn't mistaken for a suppression issue.
 *
 * Uses the same local service-account credentials as scripts/canary-comms.mjs.
 * Read-only — does not modify Firestore.
 *
 * Usage:
 *   node scripts/diagnose-comms-email.mjs
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, '../.env');
const envVars = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) envVars[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
}

const PROJECT_ID = 'set-picks';
const ADMIN_EMAIL = 'pat@road2media.com';

const serviceAccount = {
  projectId: PROJECT_ID,
  clientEmail: envVars.GCP_CLIENT_EMAIL,
  privateKey: envVars.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

const admin = require('../functions/node_modules/firebase-admin/lib/index.js');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: PROJECT_ID });
}
const db = admin.firestore();

function emailSuppressionDocId(email) {
  return crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

try {
  console.log(`→ Looking up admin uid for ${ADMIN_EMAIL}…`);
  const user = await admin.auth().getUserByEmail(ADMIN_EMAIL);
  const uid = user.uid;
  console.log(`✓ uid = ${uid}\n`);

  // 1. Suppression check
  const docId = emailSuppressionDocId(ADMIN_EMAIL);
  const suppressionSnap = await db.collection('email_suppression').doc(docId).get();
  if (suppressionSnap.exists) {
    console.log('✗ SUPPRESSED — this is almost certainly why no email arrived:');
    console.log(JSON.stringify(suppressionSnap.data(), null, 2));
  } else {
    console.log('✓ Not on the email_suppression list.');
  }

  // 2. Daily cap check (America/Los_Angeles calendar day)
  const day = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const capDocId = `email_cap:${uid}:${day}`;
  const capSnap = await db.collection('fcm_notification_log').doc(capDocId).get();
  console.log(`\n→ Daily cap doc (${capDocId}):`);
  console.log(capSnap.exists ? JSON.stringify(capSnap.data(), null, 2) : '(no doc — cap not yet used today)');

  // 3. User doc notificationPrefs (in case lifecycle/results got flipped off by
  //    the earlier one-click-unsubscribe test flow, if that was ever run)
  const userSnap = await db.collection('users').doc(uid).get();
  console.log('\n→ notificationPrefs on the user doc:');
  console.log(JSON.stringify(userSnap.data()?.notificationPrefs ?? '(none set — defaults apply)', null, 2));
} catch (err) {
  console.error('\n✗', err.message);
  process.exit(1);
}
