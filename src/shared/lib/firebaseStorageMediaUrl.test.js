import { describe, expect, it } from 'vitest';

import { firebaseStorageBucket } from './firebase';
import { firebaseStorageMediaUrl } from './firebaseStorageMediaUrl';

describe('firebaseStorageMediaUrl', () => {
  it('builds an alt=media URL for the configured bucket', () => {
    const url = firebaseStorageMediaUrl('pick-recommendations.json');
    expect(url).toBe(
      `https://firebasestorage.googleapis.com/v0/b/${firebaseStorageBucket}/o/pick-recommendations.json?alt=media`,
    );
  });

  it('encodes path segments', () => {
    const url = firebaseStorageMediaUrl('folder/song catalog.json');
    expect(url).toContain('folder%2Fsong%20catalog.json');
  });

  it('returns null for an empty path', () => {
    expect(firebaseStorageMediaUrl('')).toBeNull();
    expect(firebaseStorageMediaUrl('   ')).toBeNull();
  });
});
