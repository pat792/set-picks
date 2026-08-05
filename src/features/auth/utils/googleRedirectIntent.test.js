import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  consumeGoogleRedirectIntent,
  peekGoogleRedirectIntent,
  stashGoogleRedirectIntent,
} from './googleRedirectIntent.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => {
      store.set(k, String(v));
    },
    removeItem: (k) => {
      store.delete(k);
    },
    clear: () => store.clear(),
  };
}

beforeEach(() => {
  vi.stubGlobal('sessionStorage', createMemoryStorage());
  vi.stubGlobal('localStorage', createMemoryStorage());
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

  it('falls back to localStorage when sessionStorage is empty (#893)', () => {
    stashGoogleRedirectIntent('signup');
    sessionStorage.removeItem('setpicks_google_redirect_intent_v1');
    expect(peekGoogleRedirectIntent()).toBe('signup');
    expect(consumeGoogleRedirectIntent()).toBe('signup');
    expect(localStorage.getItem('setpicks_google_redirect_intent_v1')).toBe(
      null,
    );
  });

  it('ignores invalid intents', () => {
    stashGoogleRedirectIntent('nope');
    expect(consumeGoogleRedirectIntent()).toBe(null);
  });
});
