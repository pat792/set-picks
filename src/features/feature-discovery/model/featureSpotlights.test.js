import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import {
  FEATURE_SPOTLIGHTS,
  getFeatureSpotlight,
  isSpotlightActive,
  isSpotlightInWindow,
  localYmd,
  readSpotlightSeen,
  spotlightStorageKey,
  writeSpotlightSeen,
} from './featureSpotlights.js';

function installMemoryLocalStorage() {
  /** @type {Map<string, string>} */
  const store = new Map();
  const memory = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(String(key), String(value));
    },
    removeItem: (key) => {
      store.delete(String(key));
    },
    clear: () => {
      store.clear();
    },
  };
  globalThis.localStorage = memory;
  globalThis.window = { localStorage: memory };
}

describe('featureSpotlights', () => {
  const uid = 'user-abc';

  beforeEach(() => {
    installMemoryLocalStorage();
  });

  afterEach(() => {
    delete globalThis.localStorage;
    delete globalThis.window;
  });

  it('includes the three summer discovery features', () => {
    expect(FEATURE_SPOTLIGHTS.map((s) => s.id).sort()).toEqual([
      'live-setlist',
      'profile-identity',
      'tour-stats',
    ]);
  });

  it('isSpotlightInWindow is inclusive on since/until', () => {
    const spot = getFeatureSpotlight('tour-stats');
    expect(isSpotlightInWindow(spot, '2026-06-01')).toBe(true);
    expect(isSpotlightInWindow(spot, '2026-08-31')).toBe(true);
    expect(isSpotlightInWindow(spot, '2026-05-31')).toBe(false);
    expect(isSpotlightInWindow(spot, '2026-09-01')).toBe(false);
  });

  it('localYmd formats local calendar date', () => {
    expect(localYmd(new Date(2026, 6, 17))).toBe('2026-07-17');
  });

  it('isSpotlightActive requires uid, window, and unseen', () => {
    expect(
      isSpotlightActive('tour-stats', { uid: null, todayYmd: '2026-07-17' }),
    ).toBe(false);
    expect(
      isSpotlightActive('tour-stats', { uid, todayYmd: '2026-07-17' }),
    ).toBe(true);

    writeSpotlightSeen(uid, 'tour-stats');
    expect(readSpotlightSeen(uid, 'tour-stats')).toBe(true);
    expect(
      isSpotlightActive('tour-stats', { uid, todayYmd: '2026-07-17' }),
    ).toBe(false);
    expect(localStorage.getItem(spotlightStorageKey(uid, 'tour-stats'))).toBe(
      '1',
    );
  });

  it('expires after until even if unseen', () => {
    expect(
      isSpotlightActive('live-setlist', { uid, todayYmd: '2026-09-15' }),
    ).toBe(false);
  });
});
