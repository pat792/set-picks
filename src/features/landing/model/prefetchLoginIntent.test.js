import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  consumeLoginWarmIntent,
  extractLoginUiAssetHrefs,
  injectLoginIntentPrefetchLink,
  markLoginWarmIntent,
  peekLoginWarmIntent,
  prefetchLoginIntent,
  resetPrefetchLoginIntentForTests,
} from './prefetchLoginIntent.js';

function createMemoryStorage() {
  /** @type {Record<string, string>} */
  const store = {};
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
  };
}

function createFakeDocument() {
  /** @type {Array<{ rel: string, href: string, as?: string, getAttribute: (n: string) => string | null, setAttribute: (n: string, v: string) => void }>} */
  const links = [];
  const head = {
    appendChild(node) {
      links.push(node);
      return node;
    },
  };
  return {
    head,
    links,
    querySelectorAll(selector) {
      if (!selector.includes('data-login-intent-prefetch')) return [];
      return links.filter((l) => l.getAttribute('data-login-intent-prefetch') === 'true');
    },
    createElement(tag) {
      if (tag !== 'link') throw new Error(`unexpected tag ${tag}`);
      /** @type {Record<string, string>} */
      const attrs = {};
      const node = {
        rel: '',
        href: '',
        as: undefined,
        getAttribute(name) {
          if (name === 'href') return node.href;
          return attrs[name] ?? null;
        },
        setAttribute(name, value) {
          attrs[name] = String(value);
        },
      };
      return node;
    },
  };
}

describe('prefetchLoginIntent', () => {
  /** @type {ReturnType<typeof createFakeDocument>} */
  let doc;

  beforeEach(() => {
    resetPrefetchLoginIntentForTests();
    doc = createFakeDocument();
    vi.stubGlobal('sessionStorage', createMemoryStorage());
    vi.stubGlobal('document', doc);
  });

  afterEach(() => {
    resetPrefetchLoginIntentForTests();
    vi.unstubAllGlobals();
  });

  it('marks and consumes warm intent once', () => {
    expect(peekLoginWarmIntent()).toBe(false);
    markLoginWarmIntent();
    expect(peekLoginWarmIntent()).toBe(true);
    expect(consumeLoginWarmIntent()).toBe(true);
    expect(consumeLoginWarmIntent()).toBe(false);
    expect(peekLoginWarmIntent()).toBe(false);
  });

  it('extracts LoginPage modulepreloads and drops firebase assets', () => {
    const html = `
      <link rel="modulepreload" crossorigin href="/assets/LoginPage-abc.js" data-login-boot-preload="true" />
      <link rel="modulepreload" crossorigin href="/assets/firebase-core-xyz.js" data-login-boot-preload="true" />
      <link rel="modulepreload" crossorigin href="/assets/firebase-appcheck-xyz.js" />
      <script type="module" crossorigin src="/assets/app-entry-123.js"></script>
    `;
    expect(extractLoginUiAssetHrefs(html)).toEqual([
      '/assets/LoginPage-abc.js',
      '/assets/app-entry-123.js',
    ]);
  });

  it('injects idempotent prefetch links', () => {
    injectLoginIntentPrefetchLink('/login', 'document');
    injectLoginIntentPrefetchLink('/login', 'document');
    expect(
      doc.links.filter((l) => l.href === '/login' && l.rel === 'prefetch').length,
    ).toBe(1);
  });

  it('prefetches /login document and non-firebase assets without executing modules', async () => {
    const html = `
      <link rel="modulepreload" href="/assets/LoginPage-abc.js" />
      <link rel="modulepreload" href="/assets/firebase-core-xyz.js" />
    `;
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => html,
    }));
    vi.stubGlobal('fetch', fetchMock);

    prefetchLoginIntent();
    prefetchLoginIntent();

    expect(peekLoginWarmIntent()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/login',
      expect.objectContaining({ credentials: 'same-origin' }),
    );

    await vi.waitFor(() => {
      expect(doc.links.some((l) => l.href === '/assets/LoginPage-abc.js')).toBe(
        true,
      );
    });

    expect(doc.links.some((l) => l.href === '/assets/firebase-core-xyz.js')).toBe(
      false,
    );
    expect(doc.links.some((l) => l.href === '/login')).toBe(true);
  });
});
