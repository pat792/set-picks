import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PERSISTED_SESSION_HINT_STORAGE_KEY,
  clearPersistedSessionHint,
  hasPersistedSessionHint,
  markPersistedSession,
} from './persistedSessionHint';

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
  };
  vi.stubGlobal('window', { localStorage });
  return localStorage;
}

describe('persistedSessionHint', () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  it('is absent until a session is marked', () => {
    expect(hasPersistedSessionHint()).toBe(false);
    markPersistedSession();
    expect(hasPersistedSessionHint()).toBe(true);
  });

  it('clears on sign-out', () => {
    markPersistedSession();
    clearPersistedSessionHint();
    expect(hasPersistedSessionHint()).toBe(false);
  });

  it('ignores foreign values under the key', () => {
    window.localStorage.setItem(PERSISTED_SESSION_HINT_STORAGE_KEY, 'maybe');
    expect(hasPersistedSessionHint()).toBe(false);
  });

  it('is inert without storage', () => {
    vi.stubGlobal('window', undefined);
    expect(() => markPersistedSession()).not.toThrow();
    expect(hasPersistedSessionHint()).toBe(false);
  });
});
