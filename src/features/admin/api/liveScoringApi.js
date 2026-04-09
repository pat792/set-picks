import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../../shared/lib/firebase';

const FUNCTIONS_REGION = 'us-central1';

export async function refreshLiveScoresForShow(showDate) {
  const value = String(showDate ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('showDate must be YYYY-MM-DD.');
  }
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'refreshLiveScoresForShow');
  const result = await callable({ showDate: value });
  return result.data;
}
