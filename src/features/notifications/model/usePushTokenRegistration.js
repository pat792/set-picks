import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../auth';
import {
  refreshFcmDeviceToken,
  revokeFcmDeviceToken,
  subscribeForegroundFcmMessages,
} from '../../../shared/lib/firebaseMessaging';
import { deleteFcmTokenForUser, upsertFcmTokenForUser } from '../api/fcmTokenApi';
import { sendPushCanary } from '../api/pushCanaryApi';

function browserPermissionState() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export function usePushTokenRegistration() {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [permission, setPermission] = useState(browserPermissionState);
  const [lastMessageTitle, setLastMessageTitle] = useState('');
  const [currentFcmToken, setCurrentFcmToken] = useState('');
  const [canaryStatus, setCanaryStatus] = useState('idle');
  const [canaryMessageId, setCanaryMessageId] = useState('');

  useEffect(() => {
    let unsubscribe = () => {};
    subscribeForegroundFcmMessages((payload) => {
      setLastMessageTitle(payload?.notification?.title || 'Message received');
    })
      .then((off) => {
        unsubscribe = off;
      })
      .catch(() => {
        // No-op: unsupported browsers intentionally no-op this subscription.
      });

    return () => unsubscribe();
  }, []);

  const enablePush = useCallback(async () => {
    if (!user?.uid) {
      setStatus('error');
      setErrorMessage('Sign in before enabling push notifications.');
      return;
    }

    if (typeof Notification === 'undefined') {
      setStatus('error');
      setErrorMessage('This browser does not support web notifications.');
      setPermission('unsupported');
      return;
    }

    setStatus('working');
    setErrorMessage('');

    const permissionResult = await Notification.requestPermission();
    setPermission(permissionResult);
    if (permissionResult !== 'granted') {
      setStatus('denied');
      return;
    }

    try {
      const token = await refreshFcmDeviceToken();
      if (!token) {
        setStatus('unsupported');
        setErrorMessage('Web push is not supported in this browser context.');
        return;
      }

      await upsertFcmTokenForUser({
        userId: user.uid,
        token,
        permission: permissionResult,
      });
      setCurrentFcmToken(token);
      setStatus('enabled');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to enable push.');
    }
  }, [user?.uid]);

  const triggerPushCanary = useCallback(async () => {
    if (!user?.uid) {
      setCanaryStatus('error');
      setErrorMessage('Sign in before sending a test push.');
      return;
    }
    setCanaryStatus('working');
    setErrorMessage('');
    try {
      const res = await sendPushCanary({ token: currentFcmToken });
      if (!res.ok) {
        throw new Error('Canary push did not report success.');
      }
      setCanaryMessageId(res.messageId);
      setCanaryStatus('sent');
    } catch (error) {
      setCanaryStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send test push.');
    }
  }, [user?.uid, currentFcmToken]);

  const disablePush = useCallback(async () => {
    if (!user?.uid) {
      setStatus('error');
      setErrorMessage('Sign in before changing push notifications.');
      return;
    }
    setStatus('working');
    setErrorMessage('');
    try {
      await revokeFcmDeviceToken();
      await deleteFcmTokenForUser({ userId: user.uid, token: currentFcmToken });
      setCurrentFcmToken('');
      setCanaryStatus('idle');
      setCanaryMessageId('');
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to disable push.');
    }
  }, [currentFcmToken, user?.uid]);

  return useMemo(
    () => ({
      canaryMessageId,
      canaryStatus,
      disablePush,
      enablePush,
      errorMessage,
      lastMessageTitle,
      permission,
      status,
      triggerPushCanary,
    }),
    [
      canaryMessageId,
      canaryStatus,
      disablePush,
      enablePush,
      errorMessage,
      lastMessageTitle,
      permission,
      status,
      triggerPushCanary,
    ]
  );
}
