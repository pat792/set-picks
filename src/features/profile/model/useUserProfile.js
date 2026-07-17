import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../auth';
import { formatMonthYear } from '../../../shared';
import {
  fetchUserProfileDocument,
  updateUserProfileWithPickHandles,
} from '../api/profileApi';
import { showSuccessToast } from '../../../shared/ui/toast';
import { DEFAULT_AVATAR_ID, normalizeAvatarId } from './avatarCatalog';

/**
 * Loads the signed-in user's profile, holds edit form state, and persists updates.
 * Seeds from `useAuth().userProfile` when available to avoid a redundant getDoc + spinner (#496).
 */
export function useUserProfile(user) {
  const uid = user?.uid;
  const { userProfile: authProfile, loading: authLoading } = useAuth();

  const [handle, setHandle] = useState('');
  const [favoriteSong, setFavoriteSong] = useState('');
  const [avatarId, setAvatarId] = useState(DEFAULT_AVATAR_ID);
  const [joinDate, setJoinDate] = useState('');
  const [isLoading, setIsLoading] = useState(!!uid);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!uid) {
      setIsLoading(false);
      setHandle('');
      setFavoriteSong('');
      setAvatarId(DEFAULT_AVATAR_ID);
      setJoinDate('');
      return;
    }

    const seedFromProfile = (data) => {
      const accountCreated = data?.createdAt;
      const creationTime =
        accountCreated?.toDate?.() ?? user?.metadata?.creationTime;
      setJoinDate(creationTime ? formatMonthYear(creationTime) : '');
      if (data) {
        setHandle(data.handle || '');
        setFavoriteSong(data.favoriteSong || '');
        setAvatarId(normalizeAvatarId(data.avatarId));
      } else {
        setHandle('');
        setFavoriteSong('');
        setAvatarId(DEFAULT_AVATAR_ID);
      }
    };

    // Warm path: AuthProvider already has the users/{uid} snapshot.
    if (authProfile && authProfile !== null) {
      seedFromProfile(authProfile);
      setIsLoading(false);
      return;
    }

    // Still waiting on the shared auth subscription — keep form calm, no fetch yet.
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const data = await fetchUserProfileDocument(uid);
        if (cancelled) return;
        seedFromProfile(data);
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
  }, [uid, user?.metadata?.creationTime, authProfile, authLoading]);

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
        const nextAvatarId = normalizeAvatarId(avatarId);
        await updateUserProfileWithPickHandles(uid, {
          handle: trimmedHandle,
          favoriteSong,
          avatarId: nextAvatarId,
        });
        setAvatarId(nextAvatarId);
        setMessage({ text: 'Profile updated successfully! 🎸', type: 'success' });
        showSuccessToast('Profile updated! 🎸');
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
    [uid, handle, favoriteSong, avatarId],
  );

  return {
    handle,
    favoriteSong,
    avatarId,
    joinDate,
    isLoading,
    isSaving,
    message,
    setHandle,
    setFavoriteSong,
    setAvatarId,
    saveProfile,
  };
}
