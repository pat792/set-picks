import { describe, expect, it } from 'vitest';

import {
  idsToMarkReadOnInboxToggle,
  isCommsInboxMarkableAsRead,
} from './commsInboxMarkRead.js';

describe('commsInboxMarkRead (mark on close)', () => {
  const unopened = { id: 'a', readAt: null, archivedAt: null };
  const read = { id: 'b', readAt: { seconds: 1 }, archivedAt: null };
  const archived = { id: 'c', readAt: null, archivedAt: { seconds: 2 } };
  const messages = [unopened, read, archived];

  it('isCommsInboxMarkableAsRead only for unopened rows', () => {
    expect(isCommsInboxMarkableAsRead(unopened)).toBe(true);
    expect(isCommsInboxMarkableAsRead(read)).toBe(false);
    expect(isCommsInboxMarkableAsRead(archived)).toBe(false);
    expect(isCommsInboxMarkableAsRead(null)).toBe(false);
  });

  it('does not mark read when opening from a closed panel', () => {
    expect(
      idsToMarkReadOnInboxToggle({
        prevOpenId: null,
        nextOpenId: 'a',
        messages,
      }),
    ).toEqual([]);
  });

  it('marks the unopened row when collapsing it', () => {
    expect(
      idsToMarkReadOnInboxToggle({
        prevOpenId: 'a',
        nextOpenId: null,
        messages,
      }),
    ).toEqual(['a']);
  });

  it('marks the previous unopened row when switching to another message', () => {
    expect(
      idsToMarkReadOnInboxToggle({
        prevOpenId: 'a',
        nextOpenId: 'b',
        messages,
      }),
    ).toEqual(['a']);
  });

  it('does not mark already-read or archived rows on close', () => {
    expect(
      idsToMarkReadOnInboxToggle({
        prevOpenId: 'b',
        nextOpenId: null,
        messages,
      }),
    ).toEqual([]);
    expect(
      idsToMarkReadOnInboxToggle({
        prevOpenId: 'c',
        nextOpenId: null,
        messages,
      }),
    ).toEqual([]);
  });

  it('is a no-op when open id is unchanged', () => {
    expect(
      idsToMarkReadOnInboxToggle({
        prevOpenId: 'a',
        nextOpenId: 'a',
        messages,
      }),
    ).toEqual([]);
  });
});
