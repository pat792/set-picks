import { describe, expect, it } from 'vitest';

import { buildPoolInviteShareTitle } from './shareOrCopyInviteUrl';

describe('buildPoolInviteShareTitle', () => {
  it('includes pool name when provided', () => {
    expect(buildPoolInviteShareTitle('Denver Crew')).toBe(
      "Join my Setlist Pick 'Em pool: Denver Crew",
    );
  });

  it('falls back when name is missing', () => {
    expect(buildPoolInviteShareTitle(null)).toBe("Join my Setlist Pick 'Em pool!");
    expect(buildPoolInviteShareTitle('   ')).toBe("Join my Setlist Pick 'Em pool!");
  });
});
