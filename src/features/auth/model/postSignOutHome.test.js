import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  POST_SIGNOUT_HOME_KEY,
  consumePostSignOutHome,
  markPostSignOutHome,
} from './postSignOutHome';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

beforeEach(() => {
  vi.stubGlobal('sessionStorage', createMemoryStorage());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('postSignOutHome', () => {
  it('consume is false until marked', () => {
    expect(consumePostSignOutHome()).toBe(false);
  });

  it('mark then consume once', () => {
    markPostSignOutHome();
    expect(sessionStorage.getItem(POST_SIGNOUT_HOME_KEY)).toBe('1');
    expect(consumePostSignOutHome()).toBe(true);
    expect(consumePostSignOutHome()).toBe(false);
    expect(sessionStorage.getItem(POST_SIGNOUT_HOME_KEY)).toBe(null);
  });
});
