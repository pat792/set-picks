import { beforeEach, describe, expect, it, vi } from 'vitest';

const ensureFirebase = vi.fn(async () => ({ auth: { name: 'auth' } }));
const requestAuthBoot = vi.fn();
const kickAppCheckWarm = vi.fn();
const prefetchRouteChunk = vi.fn();
const reportLoginAuthSurfaceReady = vi.fn();
const warmGoogleProvider = vi.fn();
const signInWithGoogle = vi.fn();
const startGoogleSignInRedirect = vi.fn();
const completeGoogleSplashAuth = vi.fn();

vi.mock('../../../shared/lib/ensureFirebase.js', () => ({
  ensureFirebase: (...args) => ensureFirebase(...args),
  requestAuthBoot: (...args) => requestAuthBoot(...args),
  kickAppCheckWarm: (...args) => kickAppCheckWarm(...args),
}));

vi.mock('../../../shared/lib/routeChunkPrefetch.js', () => ({
  prefetchRouteChunk: (...args) => prefetchRouteChunk(...args),
}));

vi.mock('../api/splashAuthApi.js', () => ({
  warmGoogleProvider: (...args) => warmGoogleProvider(...args),
  signInWithGoogle: (...args) => signInWithGoogle(...args),
  startGoogleSignInRedirect: (...args) => startGoogleSignInRedirect(...args),
}));

vi.mock('./completeGoogleSplashAuth.js', () => ({
  completeGoogleSplashAuth: (...args) => completeGoogleSplashAuth(...args),
}));

vi.mock('./authLoginTiming.js', () => ({
  reportLoginAuthSurfaceReady: (...args) => reportLoginAuthSurfaceReady(...args),
}));

describe('warmLoginAuthSurface', () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    const { resetLoginAuthSurfaceForTests } = await import('./warmLoginAuthSurface.js');
    resetLoginAuthSurfaceForTests();
  });

  it('warms Auth, App Check, click modules, provider, and dashboard/setup once', async () => {
    const {
      warmLoginAuthSurface,
      isLoginAuthSurfaceReady,
      getLoginAuthSurface,
    } = await import('./warmLoginAuthSurface.js');

    expect(isLoginAuthSurfaceReady()).toBe(false);
    await warmLoginAuthSurface({ warmPath: 'immediate' });
    await warmLoginAuthSurface({ warmPath: 'intent' });

    expect(ensureFirebase).toHaveBeenCalledTimes(1);
    expect(kickAppCheckWarm).toHaveBeenCalledTimes(1);
    expect(prefetchRouteChunk).toHaveBeenCalledWith(['dashboard', 'setup']);
    expect(requestAuthBoot).toHaveBeenCalledTimes(1);
    expect(warmGoogleProvider).toHaveBeenCalledTimes(1);
    expect(reportLoginAuthSurfaceReady).toHaveBeenCalledTimes(1);
    expect(reportLoginAuthSurfaceReady).toHaveBeenCalledWith({
      warmPath: 'immediate',
    });
    expect(isLoginAuthSurfaceReady()).toBe(true);
    const surface = getLoginAuthSurface();
    expect(surface?.auth).toEqual({ name: 'auth' });
    expect(typeof surface?.signInWithGoogle).toBe('function');
    expect(typeof surface?.startGoogleSignInRedirect).toBe('function');
    expect(typeof surface?.completeGoogleSplashAuth).toBe('function');
  });

  it('notifies subscribers when ready', async () => {
    const {
      warmLoginAuthSurface,
      subscribeLoginAuthSurfaceReady,
    } = await import('./warmLoginAuthSurface.js');
    const cb = vi.fn();
    const unsub = subscribeLoginAuthSurfaceReady(cb);
    expect(cb).not.toHaveBeenCalled();
    await warmLoginAuthSurface({ warmPath: 'immediate' });
    expect(cb).toHaveBeenCalledWith(true);
    unsub();
  });

  it('enables ready without surface when warm fails (fallback click path)', async () => {
    ensureFirebase.mockRejectedValueOnce(new Error('boom'));
    const {
      warmLoginAuthSurface,
      isLoginAuthSurfaceReady,
      getLoginAuthSurface,
    } = await import('./warmLoginAuthSurface.js');
    await warmLoginAuthSurface({ warmPath: 'immediate' });
    expect(isLoginAuthSurfaceReady()).toBe(true);
    expect(getLoginAuthSurface()).toBeNull();
  });
});
