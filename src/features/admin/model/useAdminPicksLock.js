import { useCallback, useEffect, useState } from 'react';
import { getShowStatus } from '../../../shared/utils/timeLogic';
import { subscribeShowLockState } from '../../picks';
import { lockPicksForShowNow } from '../api/picksLockAdminApi';

/**
 * War Room state for admin one-click picks lock (#522).
 */
export function useAdminPicksLock({ selectedDate, showDates = [], userEmail = null }) {
  const [adminLockActive, setAdminLockActive] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');

  const showStatus =
    selectedDate && Array.isArray(showDates) && showDates.length > 0
      ? getShowStatus(selectedDate, showDates)
      : null;

  const picksAlreadyLocked =
    showStatus !== 'NEXT' || adminLockActive;

  useEffect(() => {
    setStatusText('');
    setErrorText('');
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate || showStatus !== 'NEXT') {
      setAdminLockActive(false);
      return undefined;
    }

    const unsubscribe = subscribeShowLockState(selectedDate, ({ isLocked }) => {
      setAdminLockActive(isLocked);
    });
    return unsubscribe;
  }, [selectedDate, showStatus]);

  const handleLockNow = useCallback(async () => {
    if (!selectedDate || picksAlreadyLocked || isLocking) return;
    setIsLocking(true);
    setErrorText('');
    setStatusText('');
    try {
      const result = await lockPicksForShowNow({ showDate: selectedDate });
      setStatusText(
        result.alreadyLocked
          ? `Picks were already locked for ${selectedDate}.`
          : `Picks locked for ${selectedDate}${userEmail ? ` by ${userEmail}` : ''}.`
      );
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Lock failed.';
      setErrorText(message);
    } finally {
      setIsLocking(false);
    }
  }, [selectedDate, picksAlreadyLocked, isLocking, userEmail]);

  return {
    showStatus,
    picksAlreadyLocked,
    adminLockActive,
    isLocking,
    statusText,
    errorText,
    handleLockNow,
  };
}
