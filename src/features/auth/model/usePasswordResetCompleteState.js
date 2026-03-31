import { useMemo } from 'react';

export function usePasswordResetCompleteState(searchParams) {
  const doneFromQuery = searchParams.get('done') === 'true';
  const oobCode = searchParams.get('oobCode');

  const doneFromStorage = useMemo(() => {
    if (doneFromQuery || oobCode || typeof window === 'undefined') return false;
    const tsRaw = localStorage.getItem('passwordResetDoneTs');
    const ts = tsRaw ? Number(tsRaw) : 0;
    const withinWindowMs = 5 * 60 * 1000;
    const isRecent = !!ts && Date.now() - ts < withinWindowMs;
    if (isRecent) localStorage.removeItem('passwordResetDoneTs');
    return isRecent;
  }, [doneFromQuery, oobCode]);

  const shouldShowSuccess = doneFromQuery || doneFromStorage || !oobCode;

  return { oobCode, shouldShowSuccess };
}
