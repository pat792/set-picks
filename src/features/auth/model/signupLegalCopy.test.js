import { describe, expect, it } from 'vitest';

import {
  SIGNUP_EMAIL_CTA_NEEDS_LEGAL,
  SIGNUP_LEGAL_GATE_HINT,
  SIGNUP_LEGAL_REQUIRED_ERROR,
} from './signupLegalCopy.js';

describe('signupLegalCopy', () => {
  it('keeps gate strings non-empty and user-facing', () => {
    expect(SIGNUP_LEGAL_GATE_HINT.length).toBeGreaterThan(10);
    expect(SIGNUP_LEGAL_REQUIRED_ERROR.toLowerCase()).toMatch(/terms|privacy/);
    expect(SIGNUP_EMAIL_CTA_NEEDS_LEGAL.toLowerCase()).toMatch(/accept|terms/);
  });
});
