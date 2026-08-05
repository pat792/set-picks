import { beforeEach, describe, expect, it, vi } from 'vitest';

const ensureFirebase = vi.fn(async () => ({ auth: {} }));
const requestAuthBoot = vi.fn();
const kickAppCheckWarm = vi.fn();
const prefetchRouteChunk = vi.fn();

vi.mock('../../../shared/lib/ensureFirebase.js', () => ({
  ensureFirebase: (...args) => ensureFirebase(...args),
  requestAuthBoot: (...args) => requestAuthBoot(...args),
  kickAppCheckWarm: (...args) => kickAppCheckWarm(...args),
}));

vi.mock('../../../shared/lib/routeChunkPrefetch.js', () => ({
  prefetchRouteChunk: (...args) => prefetchRouteChunk(...args),
}));

vi.mock('../api/splashAuthApi.js', () => ({}));

describe('warmLoginAuthSurface', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('warms Auth, App Check, and dashboard/setup once', async () => {
    const { warmLoginAuthSurface } = await import('./warmLoginAuthSurface.js');
    warmLoginAuthSurface();
    warmLoginAuthSurface();
    await Promise.resolve();
    await Promise.resolve();

    expect(ensureFirebase).toHaveBeenCalledTimes(1);
    expect(kickAppCheckWarm).toHaveBeenCalledTimes(1);
    expect(prefetchRouteChunk).toHaveBeenCalledWith(['dashboard', 'setup']);
    expect(requestAuthBoot).toHaveBeenCalledTimes(1);
  });
});
