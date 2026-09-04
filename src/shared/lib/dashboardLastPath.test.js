import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POOLS_CLUSTER_PATHS } from '../config/dashboardRoutes';
import { POOL_INVITE_STORAGE_KEY } from '../config/poolInvite';
import {
  DASHBOARD_LAST_PATH_STORAGE_KEY,
  DASHBOARD_POOLS_JOIN_HREF,
  getDashboardEntryHref,
} from './dashboardLastPath';

function installMemoryLocalStorage() {
  const store = new Map();
  const localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(String(key), String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
  vi.stubGlobal('window', { localStorage });
  return localStorage;
}

describe('getDashboardEntryHref', () => {
  /** @type {ReturnType<typeof installMemoryLocalStorage>} */
  let localStorage;

  beforeEach(() => {
    localStorage = installMemoryLocalStorage();
  });

  it('returns /dashboard when nothing is stored', () => {
    expect(getDashboardEntryHref()).toBe('/dashboard');
  });

  it('restores a remembered eligible tab', () => {
    localStorage.setItem(
      DASHBOARD_LAST_PATH_STORAGE_KEY,
      JSON.stringify({ pathname: '/dashboard/standings', search: '' }),
    );
    expect(getDashboardEntryHref()).toBe('/dashboard/standings');
  });

  it('restores Picks Lab and Scorecard cluster paths (#766)', () => {
    localStorage.setItem(
      DASHBOARD_LAST_PATH_STORAGE_KEY,
      JSON.stringify({ pathname: '/dashboard/picks/lab', search: '' }),
    );
    expect(getDashboardEntryHref()).toBe('/dashboard/picks/lab');
    localStorage.setItem(
      DASHBOARD_LAST_PATH_STORAGE_KEY,
      JSON.stringify({ pathname: '/dashboard/picks/scorecard', search: '' }),
    );
    expect(getDashboardEntryHref()).toBe('/dashboard/picks/scorecard');
  });

  it('overrides remembered tab when a pending pool invite is stored (#728 / #768)', () => {
    localStorage.setItem(
      DASHBOARD_LAST_PATH_STORAGE_KEY,
      JSON.stringify({ pathname: '/dashboard/standings', search: '' }),
    );
    localStorage.setItem(POOL_INVITE_STORAGE_KEY, 'A7X9K');
    expect(getDashboardEntryHref()).toBe(DASHBOARD_POOLS_JOIN_HREF);
    expect(getDashboardEntryHref()).toBe(POOLS_CLUSTER_PATHS.join);
  });

  it('restores Stats cluster destinations (#769)', () => {
    localStorage.setItem(
      DASHBOARD_LAST_PATH_STORAGE_KEY,
      JSON.stringify({ pathname: '/dashboard/stats/global', search: '?tour=Summer+2026' }),
    );
    expect(getDashboardEntryHref()).toBe('/dashboard/stats/global?tour=Summer+2026');

    localStorage.setItem(
      DASHBOARD_LAST_PATH_STORAGE_KEY,
      JSON.stringify({ pathname: '/dashboard/stats/personal', search: '' }),
    );
    expect(getDashboardEntryHref()).toBe('/dashboard/stats/personal');
  });

  it('restores Pools tertiary destinations (#768)', () => {
    localStorage.setItem(
      DASHBOARD_LAST_PATH_STORAGE_KEY,
      JSON.stringify({ pathname: '/dashboard/pools/create', search: '' }),
    );
    expect(getDashboardEntryHref()).toBe('/dashboard/pools/create');

    localStorage.setItem(
      DASHBOARD_LAST_PATH_STORAGE_KEY,
      JSON.stringify({ pathname: '/dashboard/pools/join', search: '' }),
    );
    expect(getDashboardEntryHref()).toBe('/dashboard/pools/join');
  });
});
