import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  consumeGoogleRedirectIntent,
  peekGoogleRedirectIntent,
  stashGoogleRedirectIntent,
} from './googleRedirectIntent.js';

const store = new Map();

beforeEach(() => {
  store.clear();
  vi.stubGlobal('sessionStorage', {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => {
      store.set(k, String(v));
    },
    removeItem: (k) => {
      store.delete(k);
    },
    clear: () => store.clear(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('googleRedirectIntent', () => {
  it('stashes and consumes signin/signup once', () => {
    stashGoogleRedirectIntent('signin');
    expect(peekGoogleRedirectIntent()).toBe('signin');
    expect(consumeGoogleRedirectIntent()).toBe('signin');
    expect(consumeGoogleRedirectIntent()).toBe(null);
  });

  it('ignores invalid intents', () => {
    stashGoogleRedirectIntent('nope');
    expect(consumeGoogleRedirectIntent()).toBe(null);
  });
});
