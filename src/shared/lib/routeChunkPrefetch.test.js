import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  prefetchRouteChunk,
  registerRouteChunkLoaders,
  registeredRouteChunkKeys,
  resetRouteChunkPrefetch,
} from './routeChunkPrefetch';

beforeEach(() => {
  vi.stubGlobal('window', {});
  resetRouteChunkPrefetch();
});

afterEach(() => {
  resetRouteChunkPrefetch();
  vi.unstubAllGlobals();
});

describe('registerRouteChunkLoaders', () => {
  it('registers loaders by key', () => {
    registerRouteChunkLoaders({
      home: () => Promise.resolve(),
      dashboard: () => Promise.resolve(),
    });
    expect(registeredRouteChunkKeys().sort()).toEqual(['dashboard', 'home']);
  });

  it('ignores non-function entries and non-object input', () => {
    registerRouteChunkLoaders({ home: 'nope' });
    registerRouteChunkLoaders(null);
    expect(registeredRouteChunkKeys()).toEqual([]);
  });
});

describe('prefetchRouteChunk', () => {
  it('runs the registered loader once per key', () => {
    const dashboard = vi.fn(() => Promise.resolve());
    registerRouteChunkLoaders({ dashboard });

    prefetchRouteChunk('dashboard');
    prefetchRouteChunk('dashboard');

    expect(dashboard).toHaveBeenCalledTimes(1);
  });

  it('accepts an array of keys', () => {
    const dashboard = vi.fn(() => Promise.resolve());
    const setup = vi.fn(() => Promise.resolve());
    registerRouteChunkLoaders({ dashboard, setup });

    prefetchRouteChunk(['dashboard', 'setup']);

    expect(dashboard).toHaveBeenCalledTimes(1);
    expect(setup).toHaveBeenCalledTimes(1);
  });

  it('ignores unregistered keys', () => {
    expect(() => prefetchRouteChunk('nope')).not.toThrow();
  });

  it('allows a retry after a failed import', async () => {
    const dashboard = vi
      .fn()
      .mockRejectedValueOnce(new Error('chunk load failed'))
      .mockResolvedValueOnce(undefined);
    registerRouteChunkLoaders({ dashboard });

    prefetchRouteChunk('dashboard');
    await Promise.resolve();
    await Promise.resolve();
    prefetchRouteChunk('dashboard');

    expect(dashboard).toHaveBeenCalledTimes(2);
  });

  it('does nothing outside the browser', () => {
    const dashboard = vi.fn(() => Promise.resolve());
    registerRouteChunkLoaders({ dashboard });
    vi.stubGlobal('window', undefined);

    prefetchRouteChunk('dashboard');

    expect(dashboard).not.toHaveBeenCalled();
  });
});
