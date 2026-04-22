import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../../shared/lib/firebase';

const FUNCTIONS_REGION = 'us-central1';

/**
 * Admin "Finalize and rollup" for a show.
 *
 * Thin wrapper over the `rollupScoresForShow` HTTPS callable (`functions/index.js`,
 * issue #139 PR A). The server reads the just-saved `official_setlists/{showDate}`
 * document with Admin SDK, recomputes every matching pick's score using the same
 * path as live grading (`gradePicksOnSetlistWrite`), sets `isGraded: true` (plus
 * `gradedAt` on first grade), and increments user totals — all in batched writes.
 *
 * Moving this server-side is a prerequisite for tightening `picks` / `users`
 * Firestore rules in PR B (least-privilege without breaking Finalize).
 *
 * `actualSetlistPayload` is accepted for backward-compat with existing callers
 * (`useAdminSetlistForm.js`) but is ignored server-side — the callable reads the
 * authoritative payload from Firestore to avoid TOCTOU between save + rollup.
 *
 * @param {{
 *   showDate: string,
 *   actualSetlistPayload?: unknown,
 * }} opts
 * @returns {Promise<{ processedPicks: number, skippedPicks: number, totalPicks: number }>}
 */
export async function rollupScoresForShow({ showDate } = {}) {
  const value = String(showDate ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('showDate must be YYYY-MM-DD.');
  }
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'rollupScoresForShow');
  const result = await callable({ showDate: value });
  const data = result?.data ?? {};
  return {
    processedPicks: data.processedPicks ?? 0,
    skippedPicks: data.skippedPicks ?? 0,
    totalPicks: data.totalPicks ?? 0,
  };
}
