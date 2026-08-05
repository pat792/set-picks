import { describe, expect, it } from 'vitest';

import {
  GOOGLE_CTA_OPENING,
  GOOGLE_CTA_PREPARING,
  resolveGoogleCtaLabel,
} from './googleCtaLabel.js';

describe('resolveGoogleCtaLabel', () => {
  it('prefers preparing over googleBusy', () => {
    expect(
      resolveGoogleCtaLabel({ preparing: true, googleBusy: true }),
    ).toBe(GOOGLE_CTA_PREPARING);
  });

  it('returns Opening Google… while Google OAuth is in flight', () => {
    expect(resolveGoogleCtaLabel({ googleBusy: true })).toBe(GOOGLE_CTA_OPENING);
  });

  it('returns undefined for the default Continue with Google label', () => {
    expect(resolveGoogleCtaLabel()).toBeUndefined();
    expect(resolveGoogleCtaLabel({ preparing: false, googleBusy: false })).toBe(
      undefined,
    );
  });
});
