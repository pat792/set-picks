import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  consumeLoginHopCta,
  consumeLoginWarmIntent,
  consumeLoginWarmPath,
  consumeLoginWarmSpeculative,
  extractLoginUiAssetHrefs,
  injectLoginIntentPrefetchLink,
  markLoginHopCta,
  markLoginWarmIntent,
  markLoginWarmSpeculative,
  peekLoginWarmIntent,
  peekLoginWarmSpeculative,
  prefetchLoginIntent,
  prefetchLoginSpeculative,
  resetPrefetchLoginIntentForTests,
  scheduleSpeculativeLoginWarm,
  shouldPrefetchLoginAssetHref,
  shouldSkipSpeculativeLoginWarm,
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

const SAMPLE_LOGIN_HTML = `
  <link rel="modulepreload" crossorigin href="/assets/LoginPage-abc.js" data-login-boot-preload="true" />
  <link rel="modulepreload" crossorigin href="/assets/firebase-core-xyz.js" data-login-boot-preload="true" />
  <link rel="modulepreload" crossorigin href="/assets/firebase-appcheck-xyz.js" />
  <script type="module" crossorigin src="/assets/login-entry-123.js"></script>
  <input id="si-email" type="email" />
`;

describe('prefetchLoginIntent', () => {
  /** @type {ReturnType<typeof createFakeDocument>} */
  let doc;

  beforeEach(() => {
    resetPrefetchLoginIntentForTests();
    doc = createFakeDocument();
    vi.stubGlobal('sessionStorage', createMemoryStorage());
    vi.stubGlobal('document', doc);
    vi.stubGlobal('navigator', {});
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

  it('marks and consumes speculative warm once', () => {
    expect(peekLoginWarmSpeculative()).toBe(false);
    markLoginWarmSpeculative();
    expect(peekLoginWarmSpeculative()).toBe(true);
    expect(consumeLoginWarmSpeculative()).toBe(true);
    expect(consumeLoginWarmSpeculative()).toBe(false);
  });

  it('consumeLoginWarmPath prefers intent over speculative', () => {
    markLoginWarmSpeculative();
    markLoginWarmIntent();
    expect(consumeLoginWarmPath()).toBe('intent');
    expect(consumeLoginWarmPath()).toBe('immediate');
  });

  it('consumeLoginWarmPath returns speculative when only idle ran', () => {
    markLoginWarmSpeculative();
    expect(consumeLoginWarmPath()).toBe('speculative');
  });

  it('extracts LoginPage modulepreloads and drops firebase assets by default', () => {
    expect(extractLoginUiAssetHrefs(SAMPLE_LOGIN_HTML)).toEqual([
      '/assets/LoginPage-abc.js',
      '/assets/login-entry-123.js',
    ]);
  });

  it('includes firebase-core only in speculative mode', () => {
    expect(
      extractLoginUiAssetHrefs(SAMPLE_LOGIN_HTML, { includeFirebaseCore: true }),
    ).toEqual([
      '/assets/LoginPage-abc.js',
      '/assets/firebase-core-xyz.js',
      '/assets/login-entry-123.js',
    ]);
    expect(
      shouldPrefetchLoginAssetHref('/assets/firebase-appcheck-xyz.js', {
        includeFirebaseCore: true,
      }),
    ).toBe(false);
    expect(
      shouldPrefetchLoginAssetHref('/assets/firebase-core-xyz.js', {
        includeFirebaseCore: true,
      }),
    ).toBe(true);
  });

  it('injects idempotent prefetch links', () => {
    injectLoginIntentPrefetchLink('/login', 'document');
    injectLoginIntentPrefetchLink('/login', 'document');
    expect(
      doc.links.filter((l) => l.href === '/login' && l.rel === 'prefetch').length,
    ).toBe(1);
  });

  it('prefetches /login document and non-firebase assets without executing modules', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => SAMPLE_LOGIN_HTML,
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

  it('speculative warm includes firebase-core and reuses the login HTML fetch', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => SAMPLE_LOGIN_HTML,
    }));
    vi.stubGlobal('fetch', fetchMock);

    expect(prefetchLoginSpeculative()).toBe(true);
    expect(peekLoginWarmSpeculative()).toBe(true);

    await vi.waitFor(() => {
      expect(doc.links.some((l) => l.href === '/assets/firebase-core-xyz.js')).toBe(
        true,
      );
    });

    expect(doc.links.some((l) => l.href === '/assets/firebase-appcheck-xyz.js')).toBe(
      false,
    );

    // Intent after speculative reuses fetch; still no App Check.
    prefetchLoginIntent();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(peekLoginWarmIntent()).toBe(true);
  });

  it('skips speculative warm when Save-Data is enabled', () => {
    vi.stubGlobal('navigator', { connection: { saveData: true } });
    expect(shouldSkipSpeculativeLoginWarm()).toBe(true);
    expect(prefetchLoginSpeculative()).toBe(false);
    expect(peekLoginWarmSpeculative()).toBe(false);
  });

  it('scheduleSpeculativeLoginWarm is idempotent and runs via idle callback', () => {
    const idleCbs = [];
    const ric = vi.fn((cb) => {
      idleCbs.push(cb);
      return 1;
    });
    const cancelRic = vi.fn();
    vi.stubGlobal('window', {
      requestIdleCallback: ric,
      cancelIdleCallback: cancelRic,
    });
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => SAMPLE_LOGIN_HTML,
    }));
    vi.stubGlobal('fetch', fetchMock);

    const cancelA = scheduleSpeculativeLoginWarm({ timeoutMs: 1000 });
    const cancelB = scheduleSpeculativeLoginWarm({ timeoutMs: 1000 });
    expect(ric).toHaveBeenCalledTimes(1);
    expect(idleCbs).toHaveLength(1);

    idleCbs[0]();
    expect(peekLoginWarmSpeculative()).toBe(true);

    cancelA();
    expect(cancelRic).toHaveBeenCalled();
    cancelB();
  });

  it('marks and consumes hop CTA timestamps', () => {
    const before = Date.now();
    markLoginHopCta({ intent: 'signup' });
    const hop = consumeLoginHopCta();
    expect(hop?.intent).toBe('signup');
    expect(hop?.t).toBeGreaterThanOrEqual(before);
    expect(consumeLoginHopCta()).toBeNull();
  });
});
