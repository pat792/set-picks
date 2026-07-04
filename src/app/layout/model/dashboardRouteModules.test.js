import { describe, expect, it } from 'vitest';

import {
  DASHBOARD_NAV_PRELOAD_BY_PATH,
  dashboardRouteImport,
  dashboardRouteKeysForPathname,
} from './dashboardRouteModules';

describe('dashboardRouteModules', () => {
  it('defines a dynamic import factory for every dashboard lazy route', () => {
    expect(Object.keys(dashboardRouteImport).sort()).toEqual(
      [
        'account',
        'admin',
        'notifications',
        'picks',
        'poolHub',
        'pools',
        'profile',
        'standings',
      ].sort()
    );
  });

  it('maps primary nav paths to preload keys', () => {
    expect(DASHBOARD_NAV_PRELOAD_BY_PATH['/dashboard']).toEqual(['picks']);
    expect(DASHBOARD_NAV_PRELOAD_BY_PATH['/dashboard/profile']).toEqual(['profile']);
  });

  it('derives active route keys from pathname', () => {
    expect(dashboardRouteKeysForPathname('/dashboard/')).toEqual(['picks']);
    expect(dashboardRouteKeysForPathname('/dashboard/pools')).toEqual(['pools']);
    expect(dashboardRouteKeysForPathname('/dashboard/pool/abc')).toEqual(['poolHub']);
    expect(dashboardRouteKeysForPathname('/dashboard/profile/account')).toEqual([
      'profile',
      'account',
    ]);
  });
});
