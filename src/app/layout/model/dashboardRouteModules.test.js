import { describe, expect, it } from 'vitest';

import {
  DASHBOARD_NAV_PRELOAD_BY_PATH,
  dashboardLazyRouteImport,
  dashboardLazyRouteKeysForPathname,
} from './dashboardRouteModules';

describe('dashboardRouteModules', () => {
  it('defines lazy import factories only for secondary dashboard routes', () => {
    expect(Object.keys(dashboardLazyRouteImport).sort()).toEqual(
      ['account', 'admin', 'notifications', 'poolHub'].sort()
    );
  });

  it('maps admin nav to preload keys', () => {
    expect(DASHBOARD_NAV_PRELOAD_BY_PATH['/dashboard/admin']).toEqual(['admin']);
  });

  it('derives active lazy route keys from pathname', () => {
    expect(dashboardLazyRouteKeysForPathname('/dashboard/pools')).toEqual([]);
    expect(dashboardLazyRouteKeysForPathname('/dashboard/pool/abc123')).toEqual(['poolHub']);
    expect(dashboardLazyRouteKeysForPathname('/dashboard/profile/account')).toEqual(['account']);
  });
});
