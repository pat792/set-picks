/**
 * When an Unopened inbox row should be marked read (#mark-read-on-close).
 *
 * Opening keeps the message in Unopened so the body stays visible. The first
 * close — Collapse, accordion leave, section collapse, or switching to another
 * message — is when `readAt` is set and the row moves to Read.
 */

/**
 * @typedef {import('../api/commsInboxApi.js').CommsInboxMessage} CommsInboxMessage
 */

/**
 * @param {CommsInboxMessage | null | undefined} message
 * @returns {boolean}
 */
export function isCommsInboxMarkableAsRead(message) {
  return message != null && message.readAt == null && message.archivedAt == null;
}

/**
 * Message ids to mark read when the open panel identity changes.
 *
 * @param {{
 *   prevOpenId: string | null,
 *   nextOpenId: string | null,
 *   messages: CommsInboxMessage[],
 * }} args
 * @returns {string[]}
 */
export function idsToMarkReadOnInboxToggle({ prevOpenId, nextOpenId, messages }) {
  if (!prevOpenId || prevOpenId === nextOpenId) return [];
  const row = (messages ?? []).find((m) => m.id === prevOpenId);
  if (!isCommsInboxMarkableAsRead(row)) return [];
  return [prevOpenId];
}
