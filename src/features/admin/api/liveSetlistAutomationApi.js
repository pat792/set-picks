import { doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../../../shared/lib/firebase';

const FUNCTIONS_REGION = 'us-central1';
const LIVE_AUTOMATION_COLLECTION = 'live_setlist_automation';

function assertShowDate(showDate) {
  const value = String(showDate ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('showDate must be YYYY-MM-DD.');
  }
  return value;
}

export async function fetchLiveSetlistAutomationState(showDate) {
  const value = assertShowDate(showDate);
  const snap = await getDoc(doc(db, LIVE_AUTOMATION_COLLECTION, value));
  if (!snap.exists()) {
    return { enabled: true };
  }
  const data = snap.data() || {};
  return {
    enabled: data.enabled !== false,
    lastResult: typeof data.lastResult === 'string' ? data.lastResult : '',
    lastError: typeof data.lastError === 'string' ? data.lastError : '',
  };
}

export async function setLiveSetlistAutomationState(showDate, enabled) {
  const value = assertShowDate(showDate);
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'setLiveSetlistAutomationState');
  const result = await callable({ showDate: value, enabled: Boolean(enabled) });
  return result.data;
}

export async function pollLiveSetlistNow(showDate) {
  const value = assertShowDate(showDate);
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'pollLiveSetlistNow');
  const result = await callable({ showDate: value });
  return result.data;
}
