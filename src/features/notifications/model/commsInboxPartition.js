/**
 * Inbox sectioning + unread badge rules (#513 Phase 2 / #770).
 *
 * Unopened: `readAt` missing and not archived
 * Read: `readAt` set and not archived
 * Archived: `archivedAt` set
 * Unread bell: unopened only (archived never counts)
 */

/**
 * @typedef {import('../api/commsInboxApi.js').CommsInboxMessage} CommsInboxMessage
 */

/**
 * @param {CommsInboxMessage | null | undefined} message
 * @returns {boolean}
 */
export function isCommsInboxArchived(message) {
  return message?.archivedAt != null;
}

/**
 * @param {CommsInboxMessage | null | undefined} message
 * @returns {boolean}
 */
export function isCommsInboxUnread(message) {
  return message != null && message.readAt == null && !isCommsInboxArchived(message);
}

/**
 * @param {CommsInboxMessage[]} messages
 * @returns {{ unopened: CommsInboxMessage[], read: CommsInboxMessage[], archived: CommsInboxMessage[] }}
 */
export function partitionCommsInbox(messages) {
  const unopened = [];
  const read = [];
  const archived = [];
  for (const message of messages ?? []) {
    if (isCommsInboxArchived(message)) {
      archived.push(message);
    } else if (message.readAt == null) {
      unopened.push(message);
    } else {
      read.push(message);
    }
  }
  return { unopened, read, archived };
}

/**
 * @param {CommsInboxMessage[]} messages
 * @returns {number}
 */
export function countCommsInboxUnread(messages) {
  return (messages ?? []).filter(isCommsInboxUnread).length;
}
