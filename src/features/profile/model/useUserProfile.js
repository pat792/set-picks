import { useCallback, useEffect, useState } from 'react';

import { formatMonthYear } from '../../../shared';
import {
  fetchUserProfileDocument,
  updateUserProfileWithPickHandles,
} from '../api/profileApi';

/**
 * Loads the signed-in user's profile, holds edit form state, and persists updates.
 */
export function useUserProfile(user) {
  const uid = user?.uid;

  const [handle, setHandle] = useState('');
  const [favoriteSong, setFavoriteSong] = useState('');
  const [joinDate, setJoinDate] = useState('');
  const [isLoading, setIsLoading] = useState(!!uid);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!uid) {
      setIsLoading(false);
      setHandle('');
      setFavoriteSong('');
      setJoinDate('');
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const data = await fetchUserProfileDocument(uid);
        if (cancelled) return;

        const accountCreated = data?.createdAt;
        const creationTime =
          accountCreated?.toDate?.() ?? user?.metadata?.creationTime;
        setJoinDate(creationTime ? formatMonthYear(creationTime) : '');

        if (data) {
          setHandle(data.handle || '');
          setFavoriteSong(data.favoriteSong || '');
        } else {
          setHandle('');
          setFavoriteSong('');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        if (!cancelled) {
          const fallback = user?.metadata?.creationTime;
          setJoinDate(fallback ? formatMonthYear(fallback) : '');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, user?.metadata?.creationTime]);

  const saveProfile = useCallback(
    async (e) => {
      if (e?.preventDefault) e.preventDefault();
      if (!uid) return false;

      const trimmedHandle = handle.trim();
      if (!trimmedHandle) {
        setMessage({ text: 'Handle is required.', type: 'error' });
        return false;
      }

      setIsSaving(true);
      setMessage({ text: '', type: '' });

      try {
        await updateUserProfileWithPickHandles(uid, {
          handle: trimmedHandle,
          favoriteSong,
        });
        setMessage({ text: 'Profile updated successfully! 🎸', type: 'success' });
        return true;
      } catch (error) {
        console.error('Error updating profile:', error);
        setMessage({ text: 'Error saving profile. Try again.', type: 'error' });
        return false;
      } finally {
        setIsSaving(false);
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    },
    [uid, handle, favoriteSong]
  );

  return {
    handle,
    favoriteSong,
    joinDate,
    isLoading,
    isSaving,
    message,
    setHandle,
    setFavoriteSong,
    saveProfile,
  };
}
