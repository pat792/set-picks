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
 *   force?: boolean,
 * }} opts
 * @returns {Promise<{ processedPicks: number, skippedPicks: number, totalPicks: number }>}
 */
/**
 * Undo a mistaken rollup for one show (#320). Server requires `rollup_audit`
 * with a prior successful rollup. See `docs/ROLLUP_RECOVERY_RUNBOOK.md`.
 *
 * @param {{ showDate: string }} opts
 */
export async function revertRollupForShow({ showDate } = {}) {
  const value = String(showDate ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('showDate must be YYYY-MM-DD.');
  }
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'revertRollupForShow');
  const result = await callable({ showDate: value });
  const data = result?.data ?? {};
  return {
    revertedPicks: data.revertedPicks ?? 0,
    noop: data.noop === true,
  };
}

export async function rollupScoresForShow({ showDate, force = false } = {}) {
  const value = String(showDate ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('showDate must be YYYY-MM-DD.');
  }
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'rollupScoresForShow');
  const payload = { showDate: value };
  if (force === true) {
    payload.force = true;
  }
  const result = await callable(payload);
  const data = result?.data ?? {};
  return {
    processedPicks: data.processedPicks ?? 0,
    skippedPicks: data.skippedPicks ?? 0,
    totalPicks: data.totalPicks ?? 0,
  };
}
