import { useCallback, useEffect, useState } from 'react';
import { getShowStatus } from '../../../shared/utils/timeLogic';
import { subscribeShowLockState } from '../../picks';
import { lockPicksForShowNow } from '../api/picksLockAdminApi';

function formatPicksLockError(error) {
  const code =
    error && typeof error === 'object' && typeof error.code === 'string'
      ? error.code
      : '';
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'Lock failed.';

  if (code === 'functions/permission-denied') {
    return 'Only an admin can lock picks. Grant yourself the admin claim on /admin first.';
  }
  if (code === 'functions/unauthenticated') {
    return 'Sign in required.';
  }
  if (code === 'functions/internal' || code === 'functions/unavailable') {
    return `${message} If this persists, deploy the callable: firebase deploy --only functions:lockPicksForShowNow`;
  }
  return message;
}

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
      setErrorText(formatPicksLockError(error));
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
