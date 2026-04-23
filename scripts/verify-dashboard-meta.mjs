#!/usr/bin/env node
/**
 * Guardrail: `getDashboardPageMeta` must match product IA (context title, headings, date picker).
 * Run: `npm run verify:dashboard-meta`
 */

import {
  getDashboardPageMeta,
  normalizeDashboardPathname,
} from '../src/app/layout/model/dashboardPageMeta.js';
import {
  NAV_LABEL_ACCOUNT_SECURITY,
  NAV_LABEL_PICKS,
  NAV_LABEL_POOL_DETAILS,
  NAV_LABEL_POOLS,
  NAV_LABEL_PROFILE,
  NAV_LABEL_STANDINGS,
  POOL_DETAILS_LAYOUT_EYEBROW,
} from '../src/shared/config/dashboardVocabulary.js';

const CASES = [
  {
    path: '/dashboard',
    expect: {
      contextTitle: NAV_LABEL_PICKS,
      showDatePicker: true,
      layoutDesktopHeading: NAV_LABEL_PICKS,
      layoutDetailEyebrow: null,
    },
  },
  {
    path: '/dashboard/',
    expect: {
      contextTitle: NAV_LABEL_PICKS,
      showDatePicker: true,
      layoutDesktopHeading: NAV_LABEL_PICKS,
      layoutDetailEyebrow: null,
    },
  },
  {
    path: '/dashboard/standings',
    expect: {
      contextTitle: NAV_LABEL_STANDINGS,
      showDatePicker: true,
      layoutDesktopHeading: NAV_LABEL_STANDINGS,
      layoutDetailEyebrow: null,
    },
  },
  {
    path: '/dashboard/standings',
    search: '?view=show',
    expect: {
      contextTitle: NAV_LABEL_STANDINGS,
      showDatePicker: true,
      layoutDesktopHeading: NAV_LABEL_STANDINGS,
      layoutDetailEyebrow: null,
    },
  },
  {
    path: '/dashboard/standings',
    search: '?view=pools&pool=abc',
    expect: {
      contextTitle: NAV_LABEL_STANDINGS,
      showDatePicker: true,
      layoutDesktopHeading: NAV_LABEL_STANDINGS,
      layoutDetailEyebrow: null,
    },
  },
  {
    // #255: Tour view is cumulative; global date picker hidden for clarity.
    path: '/dashboard/standings',
    search: '?view=tour',
    expect: {
      contextTitle: NAV_LABEL_STANDINGS,
      showDatePicker: false,
      layoutDesktopHeading: NAV_LABEL_STANDINGS,
      layoutDetailEyebrow: null,
    },
  },
  {
    path: '/dashboard/pools',
    expect: {
      contextTitle: NAV_LABEL_POOLS,
      showDatePicker: true,
      layoutDesktopHeading: NAV_LABEL_POOLS,
      layoutDetailEyebrow: null,
    },
  },
  {
    path: '/dashboard/pool/test-pool-id',
    expect: {
      contextTitle: NAV_LABEL_POOL_DETAILS,
      showDatePicker: false,
      layoutDesktopHeading: null,
      layoutDetailEyebrow: POOL_DETAILS_LAYOUT_EYEBROW,
    },
  },
  {
    path: '/dashboard/profile',
    expect: {
      contextTitle: NAV_LABEL_PROFILE,
      showDatePicker: false,
      layoutDesktopHeading: null,
      layoutDetailEyebrow: null,
    },
  },
  {
    path: '/dashboard/account-security',
    expect: {
      contextTitle: NAV_LABEL_ACCOUNT_SECURITY,
      showDatePicker: false,
      layoutDesktopHeading: null,
      layoutDetailEyebrow: null,
    },
  },
  {
    path: '/dashboard/admin',
    expect: {
      contextTitle: 'War Room',
      showDatePicker: true,
      layoutDesktopHeading: 'War Room',
      layoutDetailEyebrow: null,
      desktopHeadingTone: 'warRoom',
    },
  },
];

let failed = false;

for (const { path, search, expect: exp } of CASES) {
  const meta = getDashboardPageMeta(path, search);
  const normalized = normalizeDashboardPathname(path);
  const label = search ? `${path}${search}` : path;
  for (const key of Object.keys(exp)) {
    if (meta[key] !== exp[key]) {
      console.error(
        `[verify-dashboard-meta] ${label} (normalized: ${normalized}) — ${key}: got ${JSON.stringify(meta[key])}, expected ${JSON.stringify(exp[key])}`,
      );
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(`verify-dashboard-meta: ${CASES.length} cases OK`);
