import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Inbox } from 'lucide-react';

import { logCommsCtaClick, logCommsDismissed, logCommsOpened } from '../../comms';
import { useCommsInbox } from '../model/commsInboxContext.jsx';
import CommsMessageBody from './CommsMessageBody.jsx';
import { triggerIdForTemplate } from './commsTemplates/commsTemplateRegistry.jsx';

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
  const [isSectionOpen, setIsSectionOpen] = useState(true);

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
        if (row) {
          logCommsOpened({
            triggerId: triggerIdForTemplate(row.templateId),
            templateId: row.templateId,
          });
        }
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

  const handleDismiss = useCallback(
    async (id) => {
      const row = messages.find((m) => m.id === id);
      if (row) {
        logCommsDismissed({
          triggerId: triggerIdForTemplate(row.templateId),
          templateId: row.templateId,
        });
      }
      if (row && row.readAt == null) {
        try {
          await markRead(id);
        } catch (e) {
          console.error('dismiss message', e);
        }
      }
      setOpenId((prev) => (prev === id ? null : prev));
    },
    [messages, markRead],
  );

  const handleCtaClick = useCallback((row, cta) => {
    logCommsCtaClick({
      triggerId: triggerIdForTemplate(row.templateId),
      templateId: row.templateId,
      cta: typeof cta?.label === 'string' ? cta.label : undefined,
      destination: typeof cta?.href === 'string' ? cta.href : undefined,
    });
  }, []);

  return (
    <section
      className="mb-10 rounded-3xl border border-border-subtle bg-surface-panel/60 p-5 shadow-inset-glass"
      aria-labelledby="comms-inbox-heading"
    >
      <button
        type="button"
        onClick={() => setIsSectionOpen((prev) => !prev)}
        aria-expanded={isSectionOpen}
        aria-controls="comms-inbox-panel"
        className="flex w-full items-start gap-3 text-left transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
      >
        <span className="min-w-0 flex-1">
          <span
            id="comms-inbox-heading"
            className="font-display text-lg font-bold uppercase tracking-tight text-white"
          >
            Messages
          </span>
          <span className="mt-2 block text-sm font-bold leading-relaxed text-content-secondary">
            Actionable updates land here first, including score changes, nightly recaps, and key
            announcements for your picks.
            {unreadCount > 0 ? (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-brand-primary/40 bg-brand-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-brand-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" aria-hidden />
                New message waiting
              </span>
            ) : null}
          </span>
        </span>
        <ChevronDown
          className={`mt-0.5 h-5 w-5 shrink-0 text-content-secondary transition-transform duration-200 ${
            isSectionOpen ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {isSectionOpen ? (
        <div id="comms-inbox-panel" className="mt-4">
          {!ready ? (
            <p className="text-sm font-bold text-content-secondary">Loading messages…</p>
          ) : error ? (
            <p className="text-sm font-bold text-amber-300">{error}</p>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-border-subtle bg-surface-panel px-6 py-10 text-center shadow-inset-glass">
              <Inbox className="h-10 w-10 text-content-secondary" aria-hidden />
              <p className="max-w-sm text-sm font-bold leading-relaxed text-content-secondary">
                No messages yet. New scoring updates, nightly recaps, and important announcements
                will appear here as soon as they are available.
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
                        <span className="text-xs font-medium text-content-secondary">
                          {delivered ? `Delivered ${delivered}` : 'Delivered recently'}
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
                        <CommsMessageBody
                          templateId={m.templateId}
                          payload={m.payload}
                          onCtaClick={(cta) => handleCtaClick(m, cta)}
                        />
                        <div className="mt-4 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggle(m.id, false)}
                            className="rounded-lg border border-border-muted bg-surface-inset px-3 py-1.5 text-xs font-black uppercase tracking-widest text-content-secondary transition-colors hover:border-brand-primary/40 hover:text-white"
                          >
                            Collapse
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismiss(m.id)}
                            className="rounded-lg border border-border-muted bg-surface-inset px-3 py-1.5 text-xs font-black uppercase tracking-widest text-content-secondary transition-colors hover:border-brand-primary/40 hover:text-white"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
