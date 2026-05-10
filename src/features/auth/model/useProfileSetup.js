import { useCallback, useState } from 'react';

import { fetchPublicProfileByHandle } from '../../profile';
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
          setIsSaving(false);
          return;
        }

        await createInitialUserProfile(user.uid, {
          handle: trimmed,
          favoriteSong,
          email: user.email,
        });
        // No explicit navigation: `useAuth` now subscribes to `users/{uid}`
        // via `onSnapshot`, so the moment Firestore acks the local write
        // the snapshot delivers a profile with `handle`, `SetupRoute`'s
        // decision flips to `redirect-dashboard`, and the route system
        // takes care of the rest. Keeping `isSaving` true after the
        // successful write means the form stays disabled until the route
        // change unmounts this component, preventing a double-submit
        // window.
      } catch (err) {
        console.error(err);
        setError('Failed to create profile. Try again.');
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
