import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DASHBOARD_LAST_PATH_STORAGE_KEY,
  DASHBOARD_POOLS_HREF,
  getDashboardEntryHref,
} from './dashboardLastPath';
import { POOL_INVITE_STORAGE_KEY } from '../config/poolInvite';

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

  it('overrides remembered tab when a pending pool invite is stored (#728)', () => {
    localStorage.setItem(
      DASHBOARD_LAST_PATH_STORAGE_KEY,
      JSON.stringify({ pathname: '/dashboard/standings', search: '' }),
    );
    localStorage.setItem(POOL_INVITE_STORAGE_KEY, 'A7X9K');
    expect(getDashboardEntryHref()).toBe(DASHBOARD_POOLS_HREF);
  });
});
