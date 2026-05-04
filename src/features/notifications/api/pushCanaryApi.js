import { getFunctions, httpsCallable } from 'firebase/functions';

import { app } from '../../../shared/lib/firebase';

const FUNCTIONS_REGION = 'us-central1';

/**
 * Trigger server-side push canary for the signed-in user.
 */
export async function sendPushCanary({ token } = {}) {
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'sendPushCanary');
  const payload = {};
  if (typeof token === 'string' && token.trim()) {
    payload.token = token.trim();
  }
  const result = await callable(payload);
  const data = result?.data ?? {};
  return {
    ok: data.ok === true,
    messageId: typeof data.messageId === 'string' ? data.messageId : '',
  };
}
