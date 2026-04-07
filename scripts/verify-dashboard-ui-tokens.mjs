#!/usr/bin/env node
/**
 * Guardrail for issue #150: reject legacy dashboard pill / panel class clusters
 * in high-traffic feature UI (see docs/THEME_CONTRACT.md).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const SCAN_DIRS = [
  path.join(ROOT, 'src/features/scoring/ui'),
  path.join(ROOT, 'src/features/pools/ui'),
  path.join(ROOT, 'src/features/picks/ui'),
];

const EXTRA_FILES = [
  path.join(ROOT, 'src/pages/profile/ProfilePage.jsx'),
  path.join(ROOT, 'src/pages/pools/PoolsPage.jsx'),
];

/** Literal substrings that indicate reintroduced pre-token dashboard chrome */
const BANNED_SUBSTRINGS = [
  'border border-slate-600 bg-slate-800',
  'border-slate-600/80 bg-slate-800/90',
  'bg-slate-800 px-3 py-1.5 rounded-full',
  'hover:border-emerald-500/40 hover:bg-slate-700 hover:text-emerald-400',
  'rounded-3xl border border-dashed border-slate-700 bg-slate-800/30',
];

function walkJsx(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walkJsx(full, out);
    else if (name.endsWith('.jsx')) out.push(full);
  }
  return out;
}

function main() {
  const files = new Set();
  for (const d of SCAN_DIRS) walkJsx(d).forEach((f) => files.add(f));
  for (const f of EXTRA_FILES) {
    if (fs.existsSync(f)) files.add(f);
  }

  const violations = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const needle of BANNED_SUBSTRINGS) {
      if (content.includes(needle)) {
        violations.push({ file: path.relative(ROOT, file), needle });
      }
    }
  }

  if (violations.length > 0) {
    console.error('verify-dashboard-ui-tokens: banned legacy class clusters found:\n');
    for (const v of violations) {
      console.error(`  ${v.file}\n    → contains: ${JSON.stringify(v.needle)}\n`);
    }
    console.error('Use shared primitives + semantic tokens (docs/THEME_CONTRACT.md).\n');
    process.exit(1);
  }

  console.log('verify-dashboard-ui-tokens: ok');
}

main();
