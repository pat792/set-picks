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
  });

  afterEach(async () => {
    const { resetGoogleRedirectCompletionForTests } = await import(
      './useGoogleRedirectCompletion.js'
    );
    resetGoogleRedirectCompletionForTests();
  });

  it('no-ops when no redirect intent is stashed', async () => {
    const { completePendingGoogleRedirectForTests } = await import(
      './useGoogleRedirectCompletion.js'
    );
    await expect(completePendingGoogleRedirectForTests()).resolves.toEqual({
      type: 'none',
    });
    expect(ensureAuthReady).not.toHaveBeenCalled();
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

    expect(a).toEqual({ type: 'empty' });
    expect(b).toEqual({ type: 'empty' });
    expect(ensureAuthReady).toHaveBeenCalledTimes(1);
    expect(consumeGoogleRedirectResult).toHaveBeenCalledTimes(1);
  });
});
