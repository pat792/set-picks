import { describe, expect, it } from 'vitest';

import { shouldShowPasswordReveal } from './PasswordRevealToggle.jsx';

describe('shouldShowPasswordReveal', () => {
  it('is false when all values are empty', () => {
    expect(shouldShowPasswordReveal('', '', '   ')).toBe(false);
  });

  it('is true when email or password has content', () => {
    expect(shouldShowPasswordReveal('a@b.com', '')).toBe(true);
    expect(shouldShowPasswordReveal('', 'secret')).toBe(true);
    expect(shouldShowPasswordReveal('', '', 'confirm')).toBe(true);
  });
});
