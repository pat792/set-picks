import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shared/lib/firebase.js', () => ({
  app: {},
  auth: { currentUser: { uid: 'u1' } },
  db: {},
}));
vi.mock('../../../shared/lib/firebase', () => ({
  app: {},
  auth: { currentUser: { uid: 'u1' } },
  db: {},
}));

const signOutUser = vi.fn(async () => {});
const deleteAuthUserIfPresent = vi.fn(async () => ({ deleted: true }));
const recordTermsPrivacyConsent = vi.fn(async () => {});

vi.mock('../api/authApi', () => ({
  signOutUser: (...args) => signOutUser(...args),
}));
vi.mock('../api/splashAuthApi', () => ({
  deleteAuthUserIfPresent: (...args) => deleteAuthUserIfPresent(...args),
}));
vi.mock('../api/legalConsentApi', () => ({
  recordTermsPrivacyConsent: (...args) => recordTermsPrivacyConsent(...args),
}));

const trackAuthError = vi.fn();
const trackAuthLogin = vi.fn();
const trackAuthSignUp = vi.fn();

vi.mock('./authAnalytics', () => ({
  trackAuthError: (...args) => trackAuthError(...args),
  trackAuthLogin: (...args) => trackAuthLogin(...args),
  trackAuthSignUp: (...args) => trackAuthSignUp(...args),
  trackAuthRollback: vi.fn(),
  trackAuthRollbackFailed: vi.fn(),
}));

import { completeGoogleSplashAuth } from './completeGoogleSplashAuth.js';

describe('completeGoogleSplashAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks new Google users on sign-in modal and rolls back', async () => {
    const out = await completeGoogleSplashAuth({
      intent: 'signin',
      isNewUser: true,
      flow: 'redirect',
    });
    expect(out.kind).toBe('error');
    expect(deleteAuthUserIfPresent).toHaveBeenCalled();
    expect(signOutUser).toHaveBeenCalled();
    expect(trackAuthError).toHaveBeenCalledWith(
      expect.objectContaining({
        error_code: 'signin_modal_new_user_blocked',
        auth_flow: 'redirect',
      }),
    );
  });

  it('allows returning Google users on sign-in', async () => {
    const out = await completeGoogleSplashAuth({
      intent: 'signin',
      isNewUser: false,
      flow: 'popup',
    });
    expect(out).toEqual({ kind: 'success' });
    expect(trackAuthLogin).toHaveBeenCalledWith(
      'google',
      expect.objectContaining({ surface: 'sign_in', auth_flow: 'popup' }),
    );
  });

  it('records consent for new Google sign-up', async () => {
    const out = await completeGoogleSplashAuth({
      intent: 'signup',
      isNewUser: true,
      flow: 'redirect',
    });
    expect(out).toEqual({ kind: 'success' });
    expect(recordTermsPrivacyConsent).toHaveBeenCalledWith('u1');
    expect(trackAuthSignUp).toHaveBeenCalled();
  });
});
