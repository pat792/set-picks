import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  decodeFirestoreRestDocument,
  decodeFirestoreRestValue,
} from './firestoreRestDecode.mjs';

describe('firestoreRestDecode (#928)', () => {
  it('decodes scalar + array map values', () => {
    assert.equal(decodeFirestoreRestValue({ stringValue: 'hi' }), 'hi');
    assert.equal(decodeFirestoreRestValue({ integerValue: '42' }), 42);
    const arr = decodeFirestoreRestValue({
      arrayValue: {
        values: [
          {
            mapValue: {
              fields: {
                title: { stringValue: 'Melt the Guns' },
                gap: { integerValue: '142' },
              },
            },
          },
        ],
      },
    });
    assert.deepEqual(arr, [{ title: 'Melt the Guns', gap: 142 }]);
  });

  it('decodes a document fields object', () => {
    const doc = decodeFirestoreRestDocument({
      fields: {
        tourLabel: { stringValue: '2026 Summer Tour' },
        uniqueSongs: { integerValue: '188' },
      },
    });
    assert.deepEqual(doc, {
      tourLabel: '2026 Summer Tour',
      uniqueSongs: 188,
    });
    assert.equal(decodeFirestoreRestDocument({ error: { code: 404 } }), null);
  });
});
