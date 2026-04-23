#!/usr/bin/env node
/**
 * Guardrail: dashboard + scoring surface shells should use semantic tokens/components,
 * not direct slate background/border classes.
 *
 * Run: npm run verify:theme-contract
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());

const TARGETS = [
  'src/app/layout/DashboardLayout.jsx',
  'src/app/layout/ui/DashboardMobileBrandBar.jsx',
  'src/app/layout/ui/DashboardMobileContextBar.jsx',
  'src/pages/picks/PicksPage.jsx',
  'src/features/scoring/ui/LeaderboardList.jsx',
  'src/features/scoring/ui/LeaderboardRow.jsx',
  'src/features/scoring/ui/ScoreBreakdownGrid.jsx',
  'src/features/scoring/ui/ScoringRulesContent.jsx',
  'src/features/scoring/ui/ScoringRulesModal.jsx',
  'src/features/scoring/ui/StandingsPoolPicker.jsx',
  'src/features/scoring/ui/StandingsViewToggle.jsx',
];

const FORBIDDEN = /(bg-slate-|border-slate-)/g;

let failed = false;
for (const relPath of TARGETS) {
  const absPath = resolve(ROOT, relPath);
  const source = await readFile(absPath, 'utf8');
  const matches = source.match(FORBIDDEN);
  if (matches && matches.length > 0) {
    console.error(
      `[verify-theme-contract] ${relPath} has forbidden class usage (${[...new Set(matches)].join(', ')})`
    );
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`verify-theme-contract: ${TARGETS.length} files OK`);
