#!/usr/bin/env node
/**
 * GA4 auth funnel readout for Google vs email sign-up health checks.
 *
 * Queries production auth events (sign_up, login, auth_error, auth_rollback*)
 * for the last N days and prints method / error_code breakdowns.
 *
 * Credentials (pick one):
 *   - GA4_ACCESS_TOKEN — OAuth bearer with analytics.readonly
 *   - gcloud auth print-access-token --scopes=https://www.googleapis.com/auth/analytics.readonly
 *
 * Env:
 *   GA4_PROPERTY_ID — default 527619709
 *   GA4_REPORT_DAYS — default 30
 *
 * See docs/AUTH_TELEMETRY_RUNBOOK.md for console setup (custom dimensions).
 */

import { execSync } from 'node:child_process';

const PROPERTY_ID = process.env.GA4_PROPERTY_ID?.trim() || '527619709';
const DAYS = Math.max(1, Number.parseInt(process.env.GA4_REPORT_DAYS || '30', 10) || 30);

/**
 * @returns {string | null}
 */
function resolveAccessToken() {
  const fromEnv = process.env.GA4_ACCESS_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  try {
    return execSync(
      'gcloud auth print-access-token --scopes=https://www.googleapis.com/auth/analytics.readonly',
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    ).trim();
  } catch {
    return null;
  }
}

/**
 * @param {string} token
 * @param {object} body
 */
async function runReport(token, body) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY_ID}:runReport`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error?.message || `runReport HTTP ${res.status}`);
  }
  return json;
}

/**
 * @param {object} report
 * @returns {Array<{ label: string, count: number }>}
 */
function rowsToCounts(report) {
  const headers = (report.dimensionHeaders || []).map((h) => h.name);
  const metricIdx = 0;
  return (report.rows || []).map((row) => {
    const dims = row.dimensionValues || [];
    const label = headers
      .map((name, i) => {
        const val = dims[i]?.value ?? '';
        return val ? `${name}=${val}` : '';
      })
      .filter(Boolean)
      .join(', ');
    const count = Number(row.metricValues?.[metricIdx]?.value || 0);
    return { label: label || '(not set)', count };
  });
}

function printSection(title, rows) {
  console.log(`\n### ${title}`);
  if (!rows.length) {
    console.log('(no rows — event may be rare or custom dimension not registered yet)');
    return;
  }
  const total = rows.reduce((s, r) => s + r.count, 0);
  for (const row of rows.sort((a, b) => b.count - a.count)) {
    const pct = total > 0 ? ((row.count / total) * 100).toFixed(1) : '0.0';
    console.log(`  ${String(row.count).padStart(6)}  (${pct}%)  ${row.label}`);
  }
  console.log(`  ${'—'.repeat(6)}`);
  console.log(`  ${String(total).padStart(6)}  total`);
}

async function main() {
  const token = resolveAccessToken();
  if (!token) {
    console.error(
      '[ga4-auth-funnel] No GA4 credentials. Set GA4_ACCESS_TOKEN or run:\n' +
        '  gcloud auth print-access-token --scopes=https://www.googleapis.com/auth/analytics.readonly\n' +
        'See docs/GA4_MCP_SETUP.md',
    );
    process.exit(2);
  }

  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - DAYS);

  const dateRange = [
    {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    },
  ];

  console.log(`## GA4 auth funnel — last ${DAYS} days`);
  console.log(`Property: ${PROPERTY_ID}`);
  console.log(`Range: ${dateRange[0].startDate} → ${dateRange[0].endDate}`);

  const signUp = await runReport(token, {
    dateRanges: dateRange,
    dimensions: [{ name: 'eventName' }, { name: 'customEvent:method' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: { matchType: 'EXACT', value: 'sign_up' },
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 20,
  });
  printSection('sign_up by method', rowsToCounts(signUp));

  const login = await runReport(token, {
    dateRanges: dateRange,
    dimensions: [
      { name: 'eventName' },
      { name: 'customEvent:method' },
      { name: 'customEvent:surface' },
    ],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: { matchType: 'EXACT', value: 'login' },
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 20,
  });
  printSection('login by method + surface', rowsToCounts(login));

  const authErrors = await runReport(token, {
    dateRanges: dateRange,
    dimensions: [
      { name: 'customEvent:method' },
      { name: 'customEvent:error_code' },
      { name: 'customEvent:surface' },
    ],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: { matchType: 'EXACT', value: 'auth_error' },
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 50,
  });
  printSection('auth_error by method + error_code + surface', rowsToCounts(authErrors));

  for (const eventName of ['auth_rollback', 'auth_rollback_failed', 'auth_partial_profile']) {
    const report = await runReport(token, {
      dateRanges: dateRange,
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: { matchType: 'EXACT', value: eventName },
        },
      },
    });
    const rows = rowsToCounts(report);
    printSection(eventName, rows);
  }

  console.log('\n### Interpretation hints');
  console.log(
    '  - sign_up google ≪ sign_up email for multiple weeks → Google create-account path issue or UX funnel bias',
  );
  console.log(
    '  - auth_error signin_modal_new_user_blocked ↑ → new users hitting Sign in modal (invite / ?login=true)',
  );
  console.log(
    '  - login google with surface=create_account ↑ → existing Google users using Create account (expected after #406)',
  );
  console.log(
    '  - auth_error auth/popup-closed-by-user or auth/popup-blocked ↑ → OAuth popup flake / #412-class infra',
  );
  console.log(
    '  - auth_rollback* ↑ → consent Firestore write failing after Auth account creation',
  );
}

main().catch((err) => {
  console.error('[ga4-auth-funnel] failed:', err.message || err);
  process.exit(1);
});
