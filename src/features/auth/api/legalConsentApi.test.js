import { describe, expect, it } from 'vitest';

import {
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION,
} from '../../../shared/constants/legalDocVersions';
import { needsLegalReconsent } from './legalConsentApi';

describe('needsLegalReconsent', () => {
  it('returns false when profile is missing or incomplete', () => {
    expect(needsLegalReconsent(null)).toBe(false);
    expect(needsLegalReconsent({})).toBe(false);
    expect(needsLegalReconsent({ handle: '  ' })).toBe(false);
  });

  it('returns true for legacy users with no versioned consent', () => {
    expect(needsLegalReconsent({ handle: 'pat' })).toBe(true);
    expect(
      needsLegalReconsent({
        handle: 'pat',
        termsPrivacyAcceptedAt: { seconds: 1, nanoseconds: 0 },
      })
    ).toBe(true);
  });

  it('returns true when stored versions are outdated', () => {
    expect(
      needsLegalReconsent({
        handle: 'pat',
        legalConsent: {
          termsVersion: '2020-01-01',
          privacyVersion: LEGAL_PRIVACY_VERSION,
        },
      })
    ).toBe(true);
    expect(
      needsLegalReconsent({
        handle: 'pat',
        legalConsent: {
          termsVersion: LEGAL_TERMS_VERSION,
          privacyVersion: '2020-01-01',
        },
      })
    ).toBe(true);
  });

  it('returns false when versions match current published docs', () => {
    expect(
      needsLegalReconsent({
        handle: 'pat',
        legalConsent: {
          termsVersion: LEGAL_TERMS_VERSION,
          privacyVersion: LEGAL_PRIVACY_VERSION,
        },
      })
    ).toBe(false);
  });
});
