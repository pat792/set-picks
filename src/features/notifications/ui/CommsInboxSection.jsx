import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Inbox } from 'lucide-react';

import { logCommsCtaClick, logCommsDismissed, logCommsOpened } from '../../comms';
import { useCommsInbox } from '../model/commsInboxContext.jsx';
import { partitionCommsInbox } from '../model/commsInboxPartition.js';
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
 * @param {{
 *   heading: string,
 *   headingId: string,
 *   emptyCopy: string,
 *   messages: import('../api/commsInboxApi.js').CommsInboxMessage[],
 *   openId: string | null,
 *   confirmDeleteId: string | null,
 *   onToggle: (id: string, nextOpen: boolean) => void,
 *   onArchive: (id: string) => void,
 *   onDeleteRequest: (id: string) => void,
 *   onDeleteConfirm: (id: string) => void,
 *   onDeleteCancel: () => void,
 *   onCtaClick: (row: import('../api/commsInboxApi.js').CommsInboxMessage, cta: unknown) => void,
 *   showArchive: boolean,
 * }} props
 */
function InboxSectionList({
  heading,
  headingId,
  emptyCopy,
  messages,
  openId,
  confirmDeleteId,
  onToggle,
  onArchive,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onCtaClick,
  showArchive,
}) {
  return (
    <section aria-labelledby={headingId}>
      <h3
        id={headingId}
        className="text-xs font-black uppercase tracking-widest text-content-secondary"
      >
        {heading}
        {messages.length > 0 ? (
          <span className="ml-2 font-bold text-content-secondary/70">{messages.length}</span>
        ) : null}
      </h3>
      {messages.length === 0 ? (
        <p className="mt-2 text-xs font-bold leading-relaxed text-content-secondary">{emptyCopy}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {messages.map((m) => {
            const isOpen = openId === m.id;
            const unread = m.readAt == null && m.archivedAt == null;
            const delivered = formatDeliveredAt(m.createdAt);
            const headerId = `comms-msg-${m.id}-hdr`;
            const panelId = `comms-msg-${m.id}-panel`;
            const confirmingDelete = confirmDeleteId === m.id;

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
                  onClick={() => onToggle(m.id, !isOpen)}
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
                      onCtaClick={(cta) => onCtaClick(m, cta)}
                    />
                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onToggle(m.id, false)}
                        className="rounded-lg border border-border-muted bg-surface-inset px-3 py-1.5 text-xs font-black uppercase tracking-widest text-content-secondary transition-colors hover:border-brand-primary/40 hover:text-white"
                      >
                        Collapse
                      </button>
                      {showArchive ? (
                        <button
                          type="button"
                          onClick={() => onArchive(m.id)}
                          className="rounded-lg border border-border-muted bg-surface-inset px-3 py-1.5 text-xs font-black uppercase tracking-widest text-content-secondary transition-colors hover:border-brand-primary/40 hover:text-white"
                        >
                          Archive
                        </button>
                      ) : null}
                      {confirmingDelete ? (
                        <>
                          <button
                            type="button"
                            onClick={onDeleteCancel}
                            className="rounded-lg border border-border-muted bg-surface-inset px-3 py-1.5 text-xs font-black uppercase tracking-widest text-content-secondary transition-colors hover:border-brand-primary/40 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteConfirm(m.id)}
                            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-red-200 transition-colors hover:border-red-400 hover:bg-red-500/20"
                          >
                            Confirm delete
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onDeleteRequest(m.id)}
                          className="rounded-lg border border-border-muted bg-surface-inset px-3 py-1.5 text-xs font-black uppercase tracking-widest text-content-secondary transition-colors hover:border-red-400/40 hover:text-red-200"
                        >
                          Delete
                        </button>
                      )}
                    </div>
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

/**
 * In-app inbox — Unopened / Read / Archived with archive + delete (#513 Phase 2).
 */
export default function CommsInboxSection() {
  const { messages, unreadCount, error, ready, markRead, archive, deleteMessage } =
    useCommsInbox();
  const [openId, setOpenId] = useState(/** @type {string | null} */ (null));
  const [confirmDeleteId, setConfirmDeleteId] = useState(/** @type {string | null} */ (null));

  const { unopened, read, archived } = useMemo(
    () => partitionCommsInbox(messages),
    [messages],
  );

  useEffect(() => {
    if (!openId) return;
    const stillExists = messages.some((m) => m.id === openId);
    if (!stillExists) {
      setOpenId(null);
      setConfirmDeleteId(null);
    }
  }, [messages, openId]);

  const handleToggle = useCallback(
    async (id, nextOpen) => {
      setOpenId(nextOpen ? id : null);
      if (!nextOpen) setConfirmDeleteId(null);
      if (nextOpen) {
        const row = messages.find((m) => m.id === id);
        if (row) {
          logCommsOpened({
            triggerId: triggerIdForTemplate(row.templateId),
            templateId: row.templateId,
          });
        }
        if (row && row.readAt == null && row.archivedAt == null) {
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

  const handleArchive = useCallback(
    async (id) => {
      const row = messages.find((m) => m.id === id);
      if (row) {
        logCommsDismissed({
          triggerId: triggerIdForTemplate(row.templateId),
          templateId: row.templateId,
        });
      }
      try {
        await archive(id);
      } catch (e) {
        console.error('archive message', e);
      }
      setOpenId((prev) => (prev === id ? null : prev));
      setConfirmDeleteId((prev) => (prev === id ? null : prev));
    },
    [messages, archive],
  );

  const handleDeleteConfirm = useCallback(
    async (id) => {
      try {
        await deleteMessage(id);
      } catch (e) {
        console.error('delete message', e);
      }
      setConfirmDeleteId(null);
      setOpenId((prev) => (prev === id ? null : prev));
    },
    [deleteMessage],
  );

  const handleCtaClick = useCallback((row, cta) => {
    logCommsCtaClick({
      triggerId: triggerIdForTemplate(row.templateId),
      templateId: row.templateId,
      cta: typeof cta?.label === 'string' ? cta.label : undefined,
      destination: typeof cta?.href === 'string' ? cta.href : undefined,
    });
  }, []);

  const emptyInbox = messages.length === 0;

  return (
    <section
      className="mb-10 rounded-3xl border border-border-subtle bg-surface-panel/60 p-5 shadow-inset-glass"
      aria-labelledby="comms-inbox-heading"
    >
      <div className="flex items-start gap-3">
        <span className="min-w-0 flex-1">
          <span
            id="comms-inbox-heading"
            className="font-display text-lg font-bold uppercase tracking-tight text-white"
          >
            Inbox
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
      </div>

      <div className="mt-6">
        {!ready ? (
          <p className="text-sm font-bold text-content-secondary">Loading messages…</p>
        ) : error ? (
          <p className="text-sm font-bold text-amber-300">{error}</p>
        ) : emptyInbox ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-border-subtle bg-surface-panel px-6 py-10 text-center shadow-inset-glass">
            <Inbox className="h-10 w-10 text-content-secondary" aria-hidden />
            <p className="max-w-sm text-sm font-bold leading-relaxed text-content-secondary">
              No messages yet. New scoring updates, nightly recaps, and important announcements
              will appear here as soon as they are available.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <InboxSectionList
              heading="Unopened"
              headingId="comms-inbox-unopened"
              emptyCopy="No unopened messages."
              messages={unopened}
              openId={openId}
              confirmDeleteId={confirmDeleteId}
              onToggle={handleToggle}
              onArchive={handleArchive}
              onDeleteRequest={setConfirmDeleteId}
              onDeleteConfirm={handleDeleteConfirm}
              onDeleteCancel={() => setConfirmDeleteId(null)}
              onCtaClick={handleCtaClick}
              showArchive
            />
            <InboxSectionList
              heading="Read"
              headingId="comms-inbox-read"
              emptyCopy="No read messages."
              messages={read}
              openId={openId}
              confirmDeleteId={confirmDeleteId}
              onToggle={handleToggle}
              onArchive={handleArchive}
              onDeleteRequest={setConfirmDeleteId}
              onDeleteConfirm={handleDeleteConfirm}
              onDeleteCancel={() => setConfirmDeleteId(null)}
              onCtaClick={handleCtaClick}
              showArchive
            />
            <InboxSectionList
              heading="Archived"
              headingId="comms-inbox-archived"
              emptyCopy="No archived messages."
              messages={archived}
              openId={openId}
              confirmDeleteId={confirmDeleteId}
              onToggle={handleToggle}
              onArchive={handleArchive}
              onDeleteRequest={setConfirmDeleteId}
              onDeleteConfirm={handleDeleteConfirm}
              onDeleteCancel={() => setConfirmDeleteId(null)}
              onCtaClick={handleCtaClick}
              showArchive={false}
            />
          </div>
        )}
      </div>
    </section>
  );
}
