import { describe, expect, it } from 'vitest';

import {
  MARKETING_LEAVE_SIGN_IN,
  MARKETING_LEAVE_SIGN_UP,
  resolveMarketingAuthLeaveMessage,
} from './marketingAuthLeaveCopy.js';

describe('resolveMarketingAuthLeaveMessage', () => {
  it('uses sign-up copy for create-account CTAs', () => {
    expect(resolveMarketingAuthLeaveMessage({ signup: true })).toBe(
      MARKETING_LEAVE_SIGN_UP,
    );
  });

  it('uses sign-in copy for Sign In / default', () => {
    expect(resolveMarketingAuthLeaveMessage({ signup: false })).toBe(
      MARKETING_LEAVE_SIGN_IN,
    );
    expect(resolveMarketingAuthLeaveMessage()).toBe(MARKETING_LEAVE_SIGN_IN);
  });
});
