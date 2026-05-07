import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';
import { whenFirebaseReady } from '../../../shared/lib/firebaseAppCheck';

/** @typedef {import('firebase/firestore').Timestamp} FirestoreTimestamp */

/**
 * Per-user editorial / recap messages (in-app inbox). Written by Admin SDK /
 * Cloud Functions; clients read and may set `readAt` only.
 *
 * Doc shape:
 * - `templateId` — registry key (e.g. `sphere-2026-inaugural`)
 * - `payload` — variables for the template renderer (numbers coerced in UI)
 * - `createdAt` — server write time
 * - `readAt` — optional; set when the user acknowledges the message
 */
export const COMMS_INBOX_COLLECTION_ID = 'commsInbox';

/**
 * @typedef {object} CommsInboxPayloadSphere2026
 * @property {number} rank
 * @property {number} points
 * @property {number} wins
 * @property {number} showsPlayed
 * @property {number} [participantCount]
 */

/**
 * @typedef {object} CommsInboxMessage
 * @property {string} id
 * @property {string} templateId
 * @property {Record<string, unknown>} payload
 * @property {FirestoreTimestamp | null | undefined} createdAt
 * @property {FirestoreTimestamp | null | undefined} readAt
 */

/**
 * @param {string} uid
 * @param {(messages: CommsInboxMessage[]) => void} onNext
 * @param {(err: Error) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeCommsInbox(uid, onNext, onError) {
  let innerUnsub = () => {};
  let cancelled = false;

  whenFirebaseReady().then(() => {
    if (cancelled) return;
    const q = query(
      collection(db, 'users', uid, COMMS_INBOX_COLLECTION_ID),
      orderBy('createdAt', 'desc'),
    );
    innerUnsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            templateId: typeof data.templateId === 'string' ? data.templateId : '',
            payload: data.payload && typeof data.payload === 'object' ? data.payload : {},
            createdAt: data.createdAt,
            readAt: data.readAt,
          };
        });
        onNext(list);
      },
      (err) => {
        if (onError) {
          onError(err instanceof Error ? err : new Error(String(err)));
        }
      },
    );
  });

  return () => {
    cancelled = true;
    innerUnsub();
  };
}

/**
 * @param {string} uid
 * @param {string} messageId
 */
export async function markCommsInboxMessageRead(uid, messageId) {
  await whenFirebaseReady();
  await updateDoc(doc(db, 'users', uid, COMMS_INBOX_COLLECTION_ID, messageId), {
    readAt: serverTimestamp(),
  });
}
