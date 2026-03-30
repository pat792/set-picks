import { useCallback, useEffect, useState } from 'react';

import {
  fetchPickDoc,
  fetchPoolsSnapshotForPick,
  resolveHandleForPicks,
  savePickDoc,
} from '../api/picksApi';
import { getShowStatus } from '../../../shared/utils/timeLogic';

export default function usePicksForm({ user, selectedDate }) {
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingPicks, setIsLoadingPicks] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const showStatus = selectedDate ? getShowStatus(selectedDate) : null;
  const isLocked = showStatus !== 'NEXT';

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user?.uid || !selectedDate) {
        setFormData({});
        setIsLoadingPicks(false);
        return;
      }

      setIsLoadingPicks(true);
      try {
        const picks = await fetchPickDoc(selectedDate, user.uid);
        if (!cancelled) setFormData(picks);
      } catch (err) {
        console.error('Error loading picks:', err);
        if (!cancelled) {
          setFormData({});
          setSaveMessage('Error loading picks. Refresh and try again.');
        }
      } finally {
        if (!cancelled) setIsLoadingPicks(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedDate, user?.uid]);

  const handleInput = useCallback((fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const handleSave = useCallback(
    async (e) => {
      e?.preventDefault?.();

      if (isLocked || isSaving) return;

      if (!user?.uid) {
        setSaveMessage('Error: You must be logged in to save picks.');
        return;
      }

      setIsSaving(true);
      setSaveMessage('');

      try {
        const handle = await resolveHandleForPicks(user.uid, user);

        let pools = [];
        try {
          pools = await fetchPoolsSnapshotForPick(user.uid);
        } catch (poolErr) {
          console.error('Error fetching pools for pick snapshot:', poolErr);
          pools = [];
        }

        await savePickDoc({
          userId: user.uid,
          selectedDate,
          picks: formData,
          handle,
          pools,
        });

        setSaveMessage('Picks locked in successfully! 🎸');
      } catch (error) {
        console.error('Error saving picks:', error);
        setSaveMessage('Error saving picks. Please try again.');
      } finally {
        setIsSaving(false);
        setTimeout(() => setSaveMessage(''), 3000);
      }
    },
    [user, selectedDate, formData, isLocked, isSaving]
  );

  return {
    formData,
    handleInput,
    handleSave,
    isSaving,
    isLoadingPicks,
    isLocked,
    showStatus,
    saveMessage,
  };
}
