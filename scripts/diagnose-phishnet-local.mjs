#!/usr/bin/env node
/**
 * Calls Phish.net directly from your machine using PHISHNET_API_KEY from repo-root .env.
 * Does not print the key. Use to verify the key works outside Firebase.
 *
 * Usage: from repo root, `npm run diagnose:phishnet`
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');

let key;
try {
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.startsWith('#') || !t) continue;
    const m = /^PHISHNET_API_KEY=(.*)$/.exec(t);
    if (m) {
      key = m[1].replace(/^["']|["']$/g, '').trim();
      break;
    }
  }
} catch {
  console.error(`Cannot read ${envPath}`);
  process.exit(1);
}

if (!key) {
  console.error('Add PHISHNET_API_KEY=... to .env (repo root, no VITE_ prefix).');
  process.exit(1);
}

// Completed show — should have setlist rows if key is valid (Phish.net uses error:false for OK).
const testDate = '2024-07-19';
const url = `https://api.phish.net/v5/setlists/showdate/${testDate}.json?apikey=${encodeURIComponent(key)}`;

console.log(`GET setlists/showdate/${testDate}.json (key hidden)…`);

let res;
try {
  res = await fetch(url, { headers: { Accept: 'application/json' } });
} catch (e) {
  console.error('Network error:', e instanceof Error ? e.message : e);
  process.exit(1);
}

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  console.error('Non-JSON response', res.status, text.slice(0, 200));
  process.exit(1);
}

const err = json?.error;
const msg = json?.error_message;
const data = json?.data;
const n = Array.isArray(data) ? data.length : -1;

console.log('HTTP', res.status, '| error field:', err, '| error_message:', msg ?? '(none)');
console.log('data rows:', n);

const phishNetOk =
  err === undefined || err === null || err === false || err === 0 || err === '0';
if (!phishNetOk) {
  console.error('\n→ Phish.net rejected the key or request. Fix key at phish.net, then npm run secrets:sync-phishnet + deploy.');
  process.exit(1);
}

if (n <= 0) {
  console.error('\n→ Key accepted but no rows for this date. Try another past date or check Phish.net for that show.');
  process.exit(1);
}

console.log('\n→ Key works; Phish.net returned', n, 'rows. If admin fetch still fails, check Firebase logs + signed-in admin email + App Check.');
