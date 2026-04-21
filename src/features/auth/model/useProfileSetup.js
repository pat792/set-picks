import { useCallback, useState } from 'react';

import { fetchPublicProfileByHandle } from '../../profile';
import { getDashboardEntryHref } from '../../../shared/lib/dashboardLastPath';
import { resolveIsAdmin } from '../api/authApi';
import { createInitialUserProfile } from '../api/profileSetupApi';

export function useProfileSetup(user) {
  const [handle, setHandle] = useState('');
  const [favoriteSong, setFavoriteSong] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const saveProfile = useCallback(
    async (e) => {
      e.preventDefault();
      const trimmed = handle.trim();
      if (!trimmed || !user?.uid) return;

      setIsSaving(true);
      setError('');

      try {
        const existing = await fetchPublicProfileByHandle(trimmed);
        if (existing && existing.uid !== user.uid) {
          setError('That handle is already taken. Pick another.');
          return;
        }

        await createInitialUserProfile(user.uid, {
          handle: trimmed,
          favoriteSong,
          email: user.email,
        });

        // Force a reload so `useAuth` re-reads the Firestore users doc.
        // Otherwise `/dashboard/*` can redirect back to `/setup` because `userProfile`
        // is not live-updated after the write.
        const isAdminUser = await resolveIsAdmin(user);
        window.location.href = getDashboardEntryHref({ isAdminUser });
      } catch (err) {
        console.error(err);
        setError('Failed to create profile. Try again.');
      } finally {
        // If navigation is redirected back to `/setup` (e.g., userProfile gatekeeper),
        // we still need the form to unlock.
        setIsSaving(false);
      }
    },
    [user?.uid, user?.email, handle, favoriteSong]
  );

  return {
    handle,
    setHandle,
    favoriteSong,
    setFavoriteSong,
    isSaving,
    error,
    saveProfile,
  };
}
