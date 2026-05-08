import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  markCommsInboxMessageRead,
  subscribeCommsInbox,
} from '../api/commsInboxApi.js';

const CommsInboxContext = createContext(null);

/**
 * @typedef {import('../api/commsInboxApi.js').CommsInboxMessage} CommsInboxMessage
 */

/**
 * @param {{ userId: string | undefined, children: React.ReactNode }} props
 */
export function CommsInboxProvider({ userId, children }) {
  const [messages, setMessages] = useState(/** @type {CommsInboxMessage[]} */ ([]));
  const [error, setError] = useState(/** @type {string | null} */ (null));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!userId) {
      setMessages([]);
      setError(null);
      setReady(true);
      return undefined;
    }

    setReady(false);
    setError(null);

    const unsub = subscribeCommsInbox(
      userId,
      (list) => {
        setMessages(list);
        setReady(true);
      },
      (err) => {
        console.error('commsInbox subscribe', err);
        setError(err?.message || 'Could not load messages.');
        setReady(true);
      },
    );

    return () => unsub();
  }, [userId]);

  const unreadCount = useMemo(
    () => messages.filter((m) => m.readAt == null).length,
    [messages],
  );

  const markRead = useCallback(
    async (messageId) => {
      if (!userId) return;
      await markCommsInboxMessageRead(userId, messageId);
    },
    [userId],
  );

  const value = useMemo(
    () => ({
      messages,
      unreadCount,
      error,
      ready,
      markRead,
    }),
    [messages, unreadCount, error, ready, markRead],
  );

  return <CommsInboxContext.Provider value={value}>{children}</CommsInboxContext.Provider>;
}

export function useCommsInbox() {
  const ctx = useContext(CommsInboxContext);
  if (!ctx) {
    throw new Error('useCommsInbox must be used within CommsInboxProvider');
  }
  return ctx;
}
