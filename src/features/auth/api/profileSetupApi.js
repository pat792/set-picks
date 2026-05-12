import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

import { db } from '../../../shared/lib/firebase';

/**
 * First-time onboarding write to `users/{uid}`.
 *
 * `createdAt` precedence: existing-doc value > `authCreationTime` (from
 * Firebase Auth `User.metadata.creationTime`, an ISO string) > server
 * timestamp at write time. This makes the function safe for both the
 * canonical first-time setup AND orphan-user repair, where the Auth
 * account predates the Firestore doc by hours (the May 2026 consent-only
 * orphan bug case). Before this change, an orphan completing setup got
 * `createdAt = serverTimestamp()` at repair time, clobbering their real
 * signup date on "Playing since" displays.
 *
 * `totalPoints` is preserved when the existing doc already has a numeric
 * value — handles the (rare) race where `rollupScoresForShow` writes
 * aggregates before the user completes setup.
 *
 * @param {string} uid
 * @param {{
 *   handle: string,
 *   favoriteSong?: string,
 *   email?: string | null,
 *   authCreationTime?: string | null,
 * }} params
 */
export async function createInitialUserProfile(uid, params) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  const existing = snap.exists() ? snap.data() : null;

  const payload = buildInitialUserProfilePayload(existing, params, {
    serverTimestamp,
    timestampFromDate: (d) => Timestamp.fromDate(d),
  });

  await setDoc(userRef, payload, { merge: true });
}

/**
 * Pure payload builder for `createInitialUserProfile`. Extracted so the
 * orphan-repair branches (CONSENT_ONLY, missing `createdAt`, partially
 * rolled-up `totalPoints`) can be unit-tested without a Firestore mock.
 *
 * @param {Record<string, unknown> | null} existing  Result of `getDoc(...).data()` or null
 * @param {{
 *   handle: string,
 *   favoriteSong?: string,
 *   email?: string | null,
 *   authCreationTime?: string | null,
 * }} params
 * @param {{
 *   serverTimestamp: () => unknown,
 *   timestampFromDate: (d: Date) => unknown,
 * }} factories  Injected to keep this fn pure for tests.
 * @returns {Record<string, unknown>}
 */
export function buildInitialUserProfilePayload(existing, params, factories) {
  const { handle, favoriteSong, email, authCreationTime } = params;
  const { serverTimestamp: serverTs, timestampFromDate } = factories;

  const payload = {
    handle: handle.trim(),
    email: email ?? null,
    favoriteSong: (favoriteSong || '').trim() || 'Unknown',
  };

  if (!existing || existing.createdAt == null) {
    const parsed = parseAuthCreationTime(authCreationTime);
    payload.createdAt = parsed ? timestampFromDate(parsed) : serverTs();
  }

  if (!existing || typeof existing.totalPoints !== 'number') {
    payload.totalPoints = 0;
  }

  return payload;
}

function parseAuthCreationTime(value) {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}
