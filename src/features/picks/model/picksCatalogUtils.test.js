import { describe, expect, it } from 'vitest';

import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import { validatePicksForSave } from './picksCatalogUtils';

const catalog = [{ name: 'Fee' }, { name: 'Tweezer' }, { name: 'Ghost' }];

describe('validatePicksForSave', () => {
  it('accepts empty picks', () => {
    expect(validatePicksForSave({}, catalog)).toEqual({ ok: true });
  });

  it('rejects non-catalog titles', () => {
    const form = Object.fromEntries(FORM_FIELDS.map((f) => [f.id, '']));
    form.s1o = 'Not A Real Phish Song Xyz';
    expect(validatePicksForSave(form, catalog).ok).toBe(false);
  });

  it('rejects duplicate songs (case-insensitive)', () => {
    const form = Object.fromEntries(FORM_FIELDS.map((f) => [f.id, '']));
    form.s1o = 'Fee';
    form.s1c = 'fee';
    expect(validatePicksForSave(form, catalog).ok).toBe(false);
  });

  it('accepts distinct catalog songs', () => {
    const form = Object.fromEntries(FORM_FIELDS.map((f) => [f.id, '']));
    form.s1o = 'Fee';
    form.s1c = 'Tweezer';
    form.s2o = 'Ghost';
    expect(validatePicksForSave(form, catalog)).toEqual({ ok: true });
  });
});
