#!/usr/bin/env node
/**
 * Reads PHISHNET_API_KEY from repo-root .env (non-VITE line) and uploads it to
 * Firebase Secret Manager as PHISHNET_API_KEY for Cloud Functions.
 *
 * Prerequisites: firebase CLI logged in, correct project (`firebase use set-picks`).
 * Does not print the key. Uses a short-lived chmod 600 temp file for the CLI.
 */
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env');

let key;
try {
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed) continue;
    const m = /^PHISHNET_API_KEY=(.*)$/.exec(trimmed);
    if (m) {
      key = m[1].replace(/^["']|["']$/g, '').trim();
      break;
    }
  }
} catch {
  console.error(`Missing or unreadable ${envPath}`);
  process.exit(1);
}

if (!key) {
  console.error(
    'No PHISHNET_API_KEY= line found in .env. Add a single line (no VITE_ prefix), e.g. PHISHNET_API_KEY=yourkey'
  );
  process.exit(1);
}

const tmp = join(tmpdir(), `phishnet-secret-${randomBytes(8).toString('hex')}.tmp`);
writeFileSync(tmp, key, { mode: 0o600 });

try {
  const r = spawnSync(
    'firebase',
    ['functions:secrets:set', 'PHISHNET_API_KEY', '--data-file', tmp],
    { cwd: root, stdio: 'inherit' }
  );
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
} finally {
  try {
    unlinkSync(tmp);
  } catch {
    /* ignore */
  }
}

console.log('\nNext: bind the new secret version to the function —');
console.log('  npm run deploy:functions:phishnet');
console.log('or: firebase deploy --only functions:getPhishnetSetlist\n');
