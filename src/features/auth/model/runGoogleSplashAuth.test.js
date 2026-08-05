import { beforeEach, describe, expect, it, vi } from 'vitest';

const ensureAuthReady = vi.fn();
const getLoginAuthSurface = vi.fn();
const stashGoogleRedirectIntent = vi.fn();
const markGoogleOauthStart = vi.fn();
const trackGoogleClickToOauthTiming = vi.fn();
const trackGoogleCredentialToNavTiming = vi.fn();

vi.mock('../../../shared/lib/ensureFirebase', () => ({
  ensureAuthReady: (...args) => ensureAuthReady(...args),
}));

vi.mock('./warmLoginAuthSurface', () => ({
  getLoginAuthSurface: (...args) => getLoginAuthSurface(...args),
}));

vi.mock('../utils/googleRedirectIntent', () => ({
  stashGoogleRedirectIntent: (...args) => stashGoogleRedirectIntent(...args),
}));

vi.mock('./authLoginTiming', () => ({
  markGoogleOauthStart: (...args) => markGoogleOauthStart(...args),
  trackGoogleClickToOauthTiming: (...args) =>
    trackGoogleClickToOauthTiming(...args),
  trackGoogleCredentialToNavTiming: (...args) =>
    trackGoogleCredentialToNavTiming(...args),
}));

describe('runGoogleSplashAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses redirect when preferRedirect is true', async () => {
    const startGoogleSignInRedirect = vi.fn().mockResolvedValue(undefined);
    getLoginAuthSurface.mockReturnValue({
      auth: { name: 'auth' },
      signInWithGoogle: vi.fn(),
      startGoogleSignInRedirect,
      completeGoogleSplashAuth: vi.fn(),
    });

    const { runGoogleSplashAuth } = await import('./runGoogleSplashAuth.js');
    const result = await runGoogleSplashAuth({
      intent: 'signin',
      preferRedirect: true,
    });

    expect(result).toEqual({ kind: 'redirecting', authFlow: 'redirect' });
    expect(stashGoogleRedirectIntent).toHaveBeenCalledWith('signin');
    expect(startGoogleSignInRedirect).toHaveBeenCalledWith({ name: 'auth' });
    expect(trackGoogleClickToOauthTiming).toHaveBeenCalledWith({
      authFlow: 'redirect',
      outcome: 'success',
    });
  });

  it('uses popup on desktop happy path', async () => {
    const signInWithGoogle = vi.fn().mockResolvedValue({ isNewUser: false });
    const completeGoogleSplashAuth = vi
      .fn()
      .mockResolvedValue({ kind: 'success' });
    getLoginAuthSurface.mockReturnValue({
      auth: { name: 'auth' },
      signInWithGoogle,
      startGoogleSignInRedirect: vi.fn(),
      completeGoogleSplashAuth,
    });

    const { runGoogleSplashAuth } = await import('./runGoogleSplashAuth.js');
    const result = await runGoogleSplashAuth({
      intent: 'signup',
      preferRedirect: false,
    });

    expect(result).toEqual({ kind: 'done', authFlow: 'popup' });
    expect(signInWithGoogle).toHaveBeenCalled();
    expect(completeGoogleSplashAuth).toHaveBeenCalledWith({
      intent: 'signup',
      isNewUser: false,
      flow: 'popup',
    });
    expect(trackGoogleCredentialToNavTiming).toHaveBeenCalledWith({
      authFlow: 'popup',
    });
  });

  it('falls back to redirect on auth/popup-blocked', async () => {
    const popupErr = Object.assign(new Error('blocked'), {
      code: 'auth/popup-blocked',
    });
    const signInWithGoogle = vi.fn().mockRejectedValue(popupErr);
    const startGoogleSignInRedirect = vi.fn().mockResolvedValue(undefined);
    getLoginAuthSurface.mockReturnValue({
      auth: { name: 'auth' },
      signInWithGoogle,
      startGoogleSignInRedirect,
      completeGoogleSplashAuth: vi.fn(),
    });

    const { runGoogleSplashAuth } = await import('./runGoogleSplashAuth.js');
    const result = await runGoogleSplashAuth({
      intent: 'signin',
      preferRedirect: false,
    });

    expect(result).toEqual({ kind: 'redirecting', authFlow: 'redirect' });
    expect(stashGoogleRedirectIntent).toHaveBeenCalledWith('signin');
    expect(startGoogleSignInRedirect).toHaveBeenCalled();
  });
});
