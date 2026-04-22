import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../../shared/lib/firebase';

const FUNCTIONS_REGION = 'us-central1';

/**
 * Grant or revoke the `admin: true` custom claim on a Firebase Auth user.
 *
 * Thin wrapper over the `setAdminClaim` HTTPS callable (`functions/index.js`,
 * issue #139 PR A). Server-side authz:
 *  - super-admins (UID in `SUPER_ADMIN_UIDS` env var or legacy admin email)
 *    can grant or revoke for any target, including bootstrapping themselves,
 *  - existing admins (`admin: true` claim already set) can delegate or revoke.
 *
 * `targetUid` defaults to the caller on the server, which is the primary
 * bootstrap flow used by `AdminClaimBootstrap` in the admin page.
 *
 * @param {{ admin: boolean, targetUid?: string }} opts
 * @returns {Promise<{ ok: boolean, targetUid: string, admin: boolean }>}
 */
export async function setAdminClaim({ admin, targetUid } = {}) {
  if (typeof admin !== 'boolean') {
    throw new Error('admin must be a boolean (true to grant, false to revoke).');
  }
  const functions = getFunctions(app, FUNCTIONS_REGION);
  const callable = httpsCallable(functions, 'setAdminClaim');
  const payload = { admin };
  if (typeof targetUid === 'string' && targetUid.trim()) {
    payload.targetUid = targetUid.trim();
  }
  const result = await callable(payload);
  const data = result?.data ?? {};
  return {
    ok: data.ok === true,
    targetUid: typeof data.targetUid === 'string' ? data.targetUid : '',
    admin: data.admin === true,
  };
}
