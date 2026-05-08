import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../../shared/lib/firebase';

const FUNCTIONS_REGION = 'us-central1';

/**
 * Admin-only callable: Sphere ’26 inaugural recap → user `commsInbox` docs (#120).
 *
 * Server aggregates picks across fixed Sphere Run dates (same math as tour standings).
 *
 * @param {{ dryRun?: boolean }} data  Omit or `true` = no writes; pass `dryRun: false` to deliver.
 * @returns {Promise<Record<string, unknown>>}
 */
export async function deliverSphere2026TourRecapInbox(data = {}) {
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'deliverSphere2026TourRecapInbox');
  const result = await callable(data);
  return result.data;
}
