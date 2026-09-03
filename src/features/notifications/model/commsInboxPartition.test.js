import { describe, expect, it } from 'vitest';

import {
  countCommsInboxUnread,
  isCommsInboxUnread,
  partitionCommsInbox,
} from './commsInboxPartition.js';

describe('commsInboxPartition (#513 / #770)', () => {
  const unopened = { id: 'u', readAt: null, archivedAt: null };
  const read = { id: 'r', readAt: { seconds: 1 }, archivedAt: null };
  const archivedUnread = { id: 'au', readAt: null, archivedAt: { seconds: 2 } };
  const archivedRead = { id: 'ar', readAt: { seconds: 1 }, archivedAt: { seconds: 2 } };

  it('splits Unopened / Read / Archived', () => {
    const parts = partitionCommsInbox([unopened, read, archivedUnread, archivedRead]);
    expect(parts.unopened.map((m) => m.id)).toEqual(['u']);
    expect(parts.read.map((m) => m.id)).toEqual(['r']);
    expect(parts.archived.map((m) => m.id)).toEqual(['au', 'ar']);
  });

  it('excludes archived from unread (bell badge)', () => {
    expect(isCommsInboxUnread(unopened)).toBe(true);
    expect(isCommsInboxUnread(read)).toBe(false);
    expect(isCommsInboxUnread(archivedUnread)).toBe(false);
    expect(countCommsInboxUnread([unopened, read, archivedUnread])).toBe(1);
  });

  it('treats empty input as empty sections', () => {
    expect(partitionCommsInbox([])).toEqual({
      unopened: [],
      read: [],
      archived: [],
    });
    expect(countCommsInboxUnread([])).toBe(0);
  });
});
