import { getFunctions, httpsCallable } from 'firebase/functions';

import { app } from '../../../shared/lib/firebase';

const FUNCTIONS_REGION = 'us-central1';

/**
 * Trigger server-side push canary for the signed-in user.
 */
export async function sendPushCanary() {
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'sendPushCanary');
  const result = await callable({});
  const data = result?.data ?? {};
  return {
    ok: data.ok === true,
    messageId: typeof data.messageId === 'string' ? data.messageId : '',
  };
}
