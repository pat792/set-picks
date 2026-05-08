import { useCallback, useState } from 'react';

import { useSignOut } from '../../auth';
import { deleteAccountWithAudit } from '../api/deleteAccountCallable';

/**
 * Orchestrates self-serve account deletion (callable + local sign-out).
 */
export function useDeleteAccount({ onAfterDelete }) {
  const signOut = useSignOut();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const clearError = useCallback(() => setError(''), []);

  const requestDelete = useCallback(
    async ({ acknowledgedPermanentDeletion, confirmationPhrase }) => {
      setError('');
      setIsDeleting(true);
      try {
        await deleteAccountWithAudit({
          acknowledgedPermanentDeletion,
          confirmationPhrase,
        });
        try {
          await signOut();
        } catch {
          // Auth record may already be gone; still navigate away.
        }
        onAfterDelete?.();
      } catch (e) {
        const code =
          e && typeof e === 'object' && 'code' in e
            ? String(/** @type {any} */ (e).code)
            : '';
        const msg = e instanceof Error ? e.message : 'Something went wrong.';
        if (code === 'owns-pools') {
          setError(
            'You still own one or more pools. Open each pool you manage, delete it from admin settings (when allowed), then try again.'
          );
        } else if (code === 'invalid-argument') {
          setError(msg || 'Confirm the checkbox and type the phrase exactly.');
        } else if (code === 'unauthenticated') {
          setError('Sign in again, then retry.');
        } else if (code === 'internal') {
          setError(msg);
        } else {
          setError(msg);
        }
      } finally {
        setIsDeleting(false);
      }
    },
    [onAfterDelete, signOut]
  );

  return {
    isDeleting,
    error,
    clearError,
    requestDelete,
  };
}
