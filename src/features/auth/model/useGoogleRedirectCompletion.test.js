import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ensureAuthReady = vi.fn(async () => ({ auth: { name: 'auth' } }));
const consumeGoogleRedirectResult = vi.fn(async () => null);
const completeGoogleSplashAuth = vi.fn();
const peekGoogleRedirectIntent = vi.fn(() => null);
const consumeGoogleRedirectIntent = vi.fn(() => null);

vi.mock('../../../shared/lib/ensureFirebase.js', () => ({
  ensureAuthReady: (...args) => ensureAuthReady(...args),
}));

vi.mock('../api/splashAuthApi.js', () => ({
  consumeGoogleRedirectResult: (...args) =>
    consumeGoogleRedirectResult(...args),
}));

vi.mock('./completeGoogleSplashAuth.js', () => ({
  completeGoogleSplashAuth: (...args) => completeGoogleSplashAuth(...args),
}));

vi.mock('../utils/googleRedirectIntent.js', () => ({
  peekGoogleRedirectIntent: (...args) => peekGoogleRedirectIntent(...args),
  consumeGoogleRedirectIntent: (...args) =>
    consumeGoogleRedirectIntent(...args),
}));

vi.mock('../utils/splashGoogleModalInflight.js', () => ({
  setSplashGoogleModalInflight: vi.fn(),
  clearSplashGoogleModalInflight: vi.fn(),
}));

vi.mock('./authAnalytics.js', () => ({
  trackAuthError: vi.fn(),
}));

describe('completePendingGoogleRedirect', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    peekGoogleRedirectIntent.mockReturnValue(null);
    consumeGoogleRedirectResult.mockResolvedValue(null);
    consumeGoogleRedirectIntent.mockReturnValue(null);
  });

  afterEach(async () => {
    const { resetGoogleRedirectCompletionForTests } = await import(
      './useGoogleRedirectCompletion.js'
    );
    resetGoogleRedirectCompletionForTests();
  });

  it('still calls getRedirectResult when no intent is stashed (#893)', async () => {
    const { completePendingGoogleRedirectForTests } = await import(
      './useGoogleRedirectCompletion.js'
    );
    await expect(completePendingGoogleRedirectForTests()).resolves.toEqual({
      type: 'empty',
      hadIntent: false,
      intent: null,
    });
    expect(ensureAuthReady).toHaveBeenCalledTimes(1);
    expect(consumeGoogleRedirectResult).toHaveBeenCalledTimes(1);
    expect(consumeGoogleRedirectIntent).not.toHaveBeenCalled();
  });

  it('completes redirect when intent was dropped but credential exists', async () => {
    peekGoogleRedirectIntent.mockReturnValue(null);
    consumeGoogleRedirectResult.mockResolvedValue({ isNewUser: false });
    completeGoogleSplashAuth.mockResolvedValue({ kind: 'success' });

    const { completePendingGoogleRedirectForTests } = await import(
      './useGoogleRedirectCompletion.js'
    );

    await expect(completePendingGoogleRedirectForTests()).resolves.toEqual({
      type: 'done',
      intent: 'signin',
      outcome: { kind: 'success' },
      hadIntent: true,
    });
    expect(completeGoogleSplashAuth).toHaveBeenCalledWith({
      intent: 'signin',
      isNewUser: false,
      flow: 'redirect',
    });
  });

  it('shares one in-flight getRedirectResult across concurrent callers', async () => {
    peekGoogleRedirectIntent.mockReturnValue('signup');
    consumeGoogleRedirectIntent.mockReturnValue('signup');

    const { completePendingGoogleRedirectForTests } = await import(
      './useGoogleRedirectCompletion.js'
    );

    const [a, b] = await Promise.all([
      completePendingGoogleRedirectForTests(),
      completePendingGoogleRedirectForTests(),
    ]);

    expect(a).toEqual({ type: 'empty', hadIntent: true, intent: 'signup' });
    expect(b).toEqual({ type: 'empty', hadIntent: true, intent: 'signup' });
    expect(ensureAuthReady).toHaveBeenCalledTimes(1);
    expect(consumeGoogleRedirectResult).toHaveBeenCalledTimes(1);
  });
});
