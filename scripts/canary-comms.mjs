/**
 * Comms canary test script.
 *
 * Uses firebase-admin (from functions/node_modules) to mint a custom token
 * for the admin account, exchanges it for an ID token, then calls
 * `runCommsTrigger` with dryRun:true — no password or browser needed.
 *
 * Usage:
 *   node scripts/canary-comms.mjs
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dep needed)
const envPath = resolve(__dirname, '../.env');
const envVars = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) envVars[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
}

// ── config ────────────────────────────────────────────────────────────────────
const API_KEY      = envVars.VITE_FIREBASE_API_KEY;
const PROJECT_ID   = 'set-picks';
const REGION       = 'us-central1';
const ADMIN_EMAIL  = 'pat@road2media.com';

// Service account from .env (GCP_CLIENT_EMAIL + GCP_PRIVATE_KEY)
const serviceAccount = {
  projectId: PROJECT_ID,
  clientEmail: envVars.GCP_CLIENT_EMAIL,
  privateKey: envVars.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// ── firebase-admin (from functions/node_modules) ──────────────────────────────
const admin = require('../functions/node_modules/firebase-admin/lib/index.js');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID,
  });
}

// ── helpers ───────────────────────────────────────────────────────────────────
async function getAdminUid() {
  const user = await admin.auth().getUserByEmail(ADMIN_EMAIL);
  return user.uid;
}

async function mintIdToken(uid) {
  // 1. Mint a custom token (Admin SDK)
  const customToken = await admin.auth().createCustomToken(uid);

  // 2. Exchange for an ID token (Firebase Auth REST API)
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://www.setlistpickem.com/',
        'Origin': 'https://www.setlistpickem.com',
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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ data: payload }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Function error ${res.status}: ${JSON.stringify(json)}`);
  return json.result ?? json;
}

// ── main ──────────────────────────────────────────────────────────────────────
try {
  console.log(`→ Looking up admin uid for ${ADMIN_EMAIL}…`);
  const uid = await getAdminUid();
  console.log(`✓ uid = ${uid}\n`);

  console.log('→ Minting ID token via service account…');
  const idToken = await mintIdToken(uid);
  console.log('✓ ID token obtained\n');

  // ── 1. dry run ──────────────────────────────────────────────────────────
  console.log('→ runCommsTrigger  triggerId=account_welcome  dryRun=true');
  const dryResult = await callRunCommsTrigger(idToken, {
    triggerId: 'account_welcome',
    recipients: [{ uid }],
    dryRun: true,
  });
  console.log('Dry-run result:\n', JSON.stringify(dryResult, null, 2));

  // ── 2. real send ────────────────────────────────────────────────────────
  console.log('\n→ runCommsTrigger  triggerId=account_welcome  dryRun=false');
  const liveResult = await callRunCommsTrigger(idToken, {
    triggerId: 'account_welcome',
    recipients: [{ uid }],
    dryRun: false,
  });
  console.log('Live result:\n', JSON.stringify(liveResult, null, 2));

} catch (err) {
  console.error('\n✗', err.message);
  process.exit(1);
}
