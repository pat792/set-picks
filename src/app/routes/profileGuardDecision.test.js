import { describe, expect, it } from 'vitest';

import {
  decideDashboardRoute,
  decideSetupRoute,
} from './profileGuardDecision';

const user = { uid: 'u-1' };

describe('decideSetupRoute', () => {
  it('shows loading while auth resolves', () => {
    expect(decideSetupRoute({ loading: true, user: null, userProfile: null }))
      .toEqual({ kind: 'loading' });
  });

  it('redirects unsigned-in visitors to the splash', () => {
    expect(decideSetupRoute({ loading: false, user: null, userProfile: null }))
      .toEqual({ kind: 'redirect-home' });
  });

  it('renders setup when no users doc exists yet', () => {
    expect(decideSetupRoute({ loading: false, user, userProfile: null }))
      .toEqual({ kind: 'render-setup' });
  });

  it('renders setup for a consent-only doc (regression: PR #399)', () => {
    // This is the exact bug shape from May 2026: doc exists with
    // `termsPrivacyAcceptedAt` written by `recordTermsPrivacyConsent`, but
    // `handle` is missing because `createInitialUserProfile` never ran.
    // Pre-PR #399 the guard treated this as "profile complete" and
    // redirected to dashboard, skipping onboarding entirely.
    const consentOnlyProfile = {
      termsPrivacyAcceptedAt: { seconds: 1715000000, nanoseconds: 0 },
    };
    expect(
      decideSetupRoute({ loading: false, user, userProfile: consentOnlyProfile })
    ).toEqual({ kind: 'render-setup' });
  });

  it('redirects completed profiles to the dashboard', () => {
    expect(
      decideSetupRoute({
        loading: false,
        user,
        userProfile: { handle: 'pat', termsPrivacyAcceptedAt: {} },
      })
    ).toEqual({ kind: 'redirect-dashboard' });
  });

  it('treats empty-string handle as not-yet-set (defensive)', () => {
    expect(
      decideSetupRoute({ loading: false, user, userProfile: { handle: '' } })
    ).toEqual({ kind: 'render-setup' });
  });
});

describe('decideDashboardRoute', () => {
  it('shows loading while auth resolves', () => {
    expect(decideDashboardRoute({ loading: true, user: null, userProfile: null }))
      .toEqual({ kind: 'loading' });
  });

  it('guest→sign-in profile-pending window never chooses setup (#727)', () => {
    // AuthProvider must set loading:true after setUser until the first profile
    // snapshot. Without that, loading:false + user + profile:null dumps
    // returning users onto Almost There.
    expect(
      decideDashboardRoute({ loading: true, user, userProfile: null }),
    ).toEqual({ kind: 'loading' });
    expect(
      decideSetupRoute({ loading: true, user, userProfile: null }),
    ).toEqual({ kind: 'loading' });
  });

  it('redirects unsigned-in visitors to the splash', () => {
    expect(decideDashboardRoute({ loading: false, user: null, userProfile: null }))
      .toEqual({ kind: 'redirect-home' });
  });

  it('redirects to setup with no telemetry when no doc exists', () => {
    expect(decideDashboardRoute({ loading: false, user, userProfile: null }))
      .toEqual({ kind: 'redirect-setup', telemetry: null });
  });

  it('redirects to setup AND flags partial_profile for consent-only docs', () => {
    // The anomaly signal. If this ever fires in GA4, the consent-only
    // regression is back. Wire `auth_partial_profile` to a custom alert.
    expect(
      decideDashboardRoute({
        loading: false,
        user,
        userProfile: {
          termsPrivacyAcceptedAt: { seconds: 1715000000, nanoseconds: 0 },
        },
      })
    ).toEqual({ kind: 'redirect-setup', telemetry: 'partial_profile' });
  });

  it('renders dashboard for completed profiles', () => {
    expect(
      decideDashboardRoute({
        loading: false,
        user,
        userProfile: { handle: 'pat' },
      })
    ).toEqual({ kind: 'render-dashboard' });
  });

  it('flags partial_profile when only a non-handle field is present', () => {
    // Belt-and-braces: any future field that lands before `handle` (e.g.,
    // a marketing-prefs row written from outside the setup flow) would
    // also fire the anomaly signal. That's intentional — it forces us to
    // notice unexpected partial states.
    expect(
      decideDashboardRoute({
        loading: false,
        user,
        userProfile: { totalPoints: 0 },
      })
    ).toEqual({ kind: 'redirect-setup', telemetry: 'partial_profile' });
  });
});
