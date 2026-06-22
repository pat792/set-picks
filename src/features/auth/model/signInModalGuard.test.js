import { describe, expect, it } from 'vitest';

import { decideSignInModalGoogleAction } from './signInModalGuard';

describe('decideSignInModalGoogleAction', () => {
  it('allows login for returning users', () => {
    expect(decideSignInModalGoogleAction(false)).toEqual({ kind: 'allow-login' });
  });

  it('blocks new users (compliance hole closed by PR-3)', () => {
    // Sign-in modal does not present the Terms/Privacy clickwrap.
    // Allowing a brand-new Google account through would create a Firebase
    // Auth user with no `termsPrivacyAcceptedAt` and (pre-PR #399) drop
    // them directly on /dashboard — the same hole that masked the
    // May 2026 orphan-doc bug for two days.
    const action = decideSignInModalGoogleAction(true);
    expect(action.kind).toBe('block-new-user');
    expect(action.telemetryErrorCode).toBe('signin_modal_new_user_blocked');
    expect(action.errorMessage).toMatch(/Create account/i);
    expect(action.errorMessage).toMatch(/Terms/i);
  });

  it('treats undefined as "allow login" (defensive — signInWithGoogle should always return a boolean)', () => {
    expect(decideSignInModalGoogleAction(undefined)).toEqual({ kind: 'allow-login' });
  });

  it('does not silently block on truthy-but-not-true values', () => {
    // signInWithGoogle returns `Boolean(extra?.isNewUser)` so the only
    // truthy-true case is `true`. Anything else means we shouldn't be
    // making a destructive decision against the caller.
    expect(decideSignInModalGoogleAction(1)).toEqual({ kind: 'allow-login' });
    expect(decideSignInModalGoogleAction('true')).toEqual({ kind: 'allow-login' });
  });
});
