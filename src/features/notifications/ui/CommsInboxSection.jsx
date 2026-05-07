import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Inbox } from 'lucide-react';

import { useCommsInbox } from '../model/commsInboxContext.jsx';
import CommsRecapMessageBody from './CommsRecapMessageBody.jsx';

function formatDeliveredAt(createdAt) {
  if (!createdAt?.toDate) return '';
  try {
    return createdAt.toDate().toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '';
  }
}

/**
 * In-app inbox for editorial messages (tour recaps, etc.). Preference toggles live below.
 */
export default function CommsInboxSection() {
  const { messages, unreadCount, error, ready, markRead } = useCommsInbox();
  const [openId, setOpenId] = useState(/** @type {string | null} */ (null));

  useEffect(() => {
    if (!openId) return;
    const stillExists = messages.some((m) => m.id === openId);
    if (!stillExists) setOpenId(null);
  }, [messages, openId]);

  const handleToggle = useCallback(
    async (id, nextOpen) => {
      setOpenId(nextOpen ? id : null);
      if (nextOpen) {
        const row = messages.find((m) => m.id === id);
        if (row && row.readAt == null) {
          try {
            await markRead(id);
          } catch (e) {
            console.error('markRead', e);
          }
        }
      }
    },
    [messages, markRead],
  );

  return (
    <section className="mb-10" aria-labelledby="comms-inbox-heading">
      <div className="mb-4 text-left">
        <h3
          id="comms-inbox-heading"
          className="font-display text-lg font-bold uppercase tracking-tight text-white"
        >
          Messages
        </h3>
        <p className="mt-2 text-sm font-bold leading-relaxed text-content-secondary">
          Tour recaps and announcements land here first — variable copy matches your stats when we
          deliver to your inbox.
          {unreadCount > 0 ? (
            <span className="ml-1 font-black text-brand-primary">
              ({unreadCount} unread)
            </span>
          ) : null}
        </p>
      </div>

      {!ready ? (
        <p className="text-sm font-bold text-content-secondary">Loading messages…</p>
      ) : error ? (
        <p className="text-sm font-bold text-amber-300">{error}</p>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-border-subtle bg-surface-panel/60 px-6 py-10 text-center shadow-inset-glass">
          <Inbox className="h-10 w-10 text-content-secondary" aria-hidden />
          <p className="max-w-sm text-sm font-bold leading-relaxed text-content-secondary">
            No messages yet. When we publish a recap or announcement for your account, it will show up
            here — check back after tour wrap-ups or watch for the notifications bell.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => {
            const isOpen = openId === m.id;
            const unread = m.readAt == null;
            const delivered = formatDeliveredAt(m.createdAt);
            const headerId = `comms-msg-${m.id}-hdr`;
            const panelId = `comms-msg-${m.id}-panel`;

            return (
              <li
                key={m.id}
                className="overflow-hidden rounded-3xl border border-border-subtle bg-surface-panel shadow-inset-glass"
              >
                <button
                  type="button"
                  id={headerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => handleToggle(m.id, !isOpen)}
                  className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-panel"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black uppercase tracking-widest text-content-secondary">
                        Message
                      </span>
                      {unread ? (
                        <span className="rounded-full bg-brand-primary/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-primary">
                          New
                        </span>
                      ) : null}
                    </span>
                    <span className="text-xs font-bold text-content-secondary">
                      Template: {m.templateId || '—'}
                      {delivered ? ` · ${delivered}` : ''}
                    </span>
                  </span>
                  <ChevronDown
                    className={`mt-0.5 h-5 w-5 shrink-0 text-content-secondary transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden
                  />
                </button>
                {isOpen ? (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={headerId}
                    className="border-t border-border-muted/80 px-5 pb-6 pt-4"
                  >
                    <CommsRecapMessageBody templateId={m.templateId} payload={m.payload} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
