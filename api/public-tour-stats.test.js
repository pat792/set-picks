import { describe, expect, it } from 'vitest';

/**
 * Slug normalization mirrors api/public-tour-stats.js (kept local so the
 * serverless default export does not need to load firebase-admin in unit tests).
 */
function normalizeSlug(raw) {
  const slug = String(raw ?? '').trim();
  if (!slug) return '_index';
  if (slug === '_index') return '_index';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) return null;
  if (slug.startsWith('_') && slug !== '_index') return null;
  return slug;
}

describe('public-tour-stats slug normalize', () => {
  it('defaults empty to _index', () => {
    expect(normalizeSlug('')).toBe('_index');
    expect(normalizeSlug(undefined)).toBe('_index');
  });

  it('accepts kebab tour slugs', () => {
    expect(normalizeSlug('2026-sphere')).toBe('2026-sphere');
    expect(normalizeSlug('summer-tour-2026')).toBe('summer-tour-2026');
  });

  it('rejects traversal and odd shapes', () => {
    expect(normalizeSlug('../x')).toBe(null);
    expect(normalizeSlug('_secret')).toBe(null);
    expect(normalizeSlug('a/b')).toBe(null);
  });
});
