import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import {
  buildPoolInviteShareTitleFromInviter,
  buildPoolInviteUrl,
  buildSiteInviteShareTitle,
  buildSiteInviteUrl,
  normalizeInviteHandle,
} from './inviteKit';

describe('inviteKit', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { location: { origin: 'https://www.setlistpickem.com' } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes handles', () => {
    expect(normalizeInviteHandle('  @Trey  ')).toBe('Trey');
    expect(normalizeInviteHandle('')).toBe('');
  });

  it('builds site invite URLs without pool codes', () => {
    expect(buildSiteInviteUrl('Mikey')).toBe(
      'https://www.setlistpickem.com/invite/Mikey',
    );
    expect(buildSiteInviteUrl('')).toBe('');
  });

  it('builds pool invite URLs with optional from=', () => {
    expect(buildPoolInviteUrl('YEM42')).toBe(
      'https://www.setlistpickem.com/join/YEM42',
    );
    expect(buildPoolInviteUrl('yem42', 'Mikey')).toBe(
      'https://www.setlistpickem.com/join/YEM42?from=Mikey',
    );
  });

  it('builds personalized share titles', () => {
    expect(buildSiteInviteShareTitle('Mikey')).toBe(
      "Mikey invited you to Setlist Pick'em",
    );
    expect(buildPoolInviteShareTitleFromInviter('Mikey', 'Denver Crew')).toBe(
      'Mikey invited you to join their pool: Denver Crew',
    );
    expect(buildPoolInviteShareTitleFromInviter('Mikey')).toBe(
      'Mikey invited you to join their pool',
    );
  });
});
