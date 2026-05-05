import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../auth';
import {
  getFcmRuntimeDebugInfo,
  refreshFcmDeviceTokenWithDebug,
  revokeFcmDeviceToken,
  subscribeForegroundFcmMessages,
} from '../../../shared/lib/firebaseMessaging';
import { deleteFcmTokenForUser, upsertFcmTokenForUser } from '../api/fcmTokenApi';
import { sendPushCanary } from '../api/pushCanaryApi';

function browserPermissionState() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

function normalizeError(error) {
  const code =
    error && typeof error === 'object' && typeof error.code === 'string' ? error.code : 'unknown';
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const details =
    error && typeof error === 'object' && 'details' in error && error.details != null
      ? error.details
      : null;
  const detailsText = details ? JSON.stringify(details) : '';
  return { code, message, detailsText };
}

export function usePushTokenRegistration() {
  const { user } = useAuth();
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [permission, setPermission] = useState(browserPermissionState);
  const [lastMessageTitle, setLastMessageTitle] = useState('');
  const [currentFcmToken, setCurrentFcmToken] = useState('');
  const [hasFreshRotationInSession, setHasFreshRotationInSession] = useState(false);
  const [canaryStatus, setCanaryStatus] = useState('idle');
  const [canaryMessageId, setCanaryMessageId] = useState('');
  const [debugState, setDebugState] = useState({ phase: 'idle', code: '', message: '' });
  const [runtimeDebug] = useState(() => getFcmRuntimeDebugInfo());

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
      setDebugState({ phase: 'auth_missing', code: 'no-user', message: 'Missing auth uid in app session.' });
      return;
    }

    if (typeof Notification === 'undefined') {
      setStatus('error');
      setErrorMessage('This browser does not support web notifications.');
      setPermission('unsupported');
      setDebugState({
        phase: 'notification_unsupported',
        code: 'notification-unsupported',
        message: 'Notification API unavailable.',
      });
      return;
    }

    setStatus('working');
    setErrorMessage('');
    setHasFreshRotationInSession(false);
    setDebugState({ phase: 'requesting_permission', code: '', message: '' });

    const permissionResult = await Notification.requestPermission();
    setPermission(permissionResult);
    if (permissionResult !== 'granted') {
      setStatus('denied');
      setDebugState({
        phase: 'permission_denied',
        code: 'permission-denied',
        message: `Permission result: ${permissionResult}`,
      });
      return;
    }

    try {
      setDebugState({ phase: 'token_refreshing', code: '', message: '' });
      const { token, deletedExistingToken } = await refreshFcmDeviceTokenWithDebug();
      if (!token) {
        setStatus('unsupported');
        setErrorMessage('Web push is not supported in this browser context.');
        setDebugState({
          phase: 'token_missing',
          code: 'token-null',
          message: 'FCM getToken returned empty after successful deleteToken.',
        });
        return;
      }

      const tokenTail = token.slice(-16);
      setDebugState({
        phase: 'token_minted',
        code: '',
        message: `Token minted (...${tokenTail}) after deleteToken=${deletedExistingToken ? 'ok' : 'no-op'}.`,
      });
      const tokenId = await upsertFcmTokenForUser({
        userId: user.uid,
        token,
        permission: permissionResult,
      });
      setCurrentFcmToken(token);
      setHasFreshRotationInSession(true);
      setStatus('enabled');
      setDebugState({
        phase: 'upsert_ok',
        code: '',
        message: `Token upsert succeeded for token ...${tokenTail} (doc ${tokenId.slice(-12)}).`,
      });
    } catch (error) {
      const parsed = normalizeError(error);
      setStatus('error');
      setHasFreshRotationInSession(false);
      setErrorMessage(parsed.message || 'Failed to enable push.');
      setDebugState({
        phase: 'enable_failed',
        code: parsed.code,
        message: parsed.detailsText ? `${parsed.message} | ${parsed.detailsText}` : parsed.message,
      });
    }
  }, [user?.uid]);

  const triggerPushCanary = useCallback(async () => {
    if (!user?.uid) {
      setCanaryStatus('error');
      setErrorMessage('Sign in before sending a test push.');
      setDebugState({ phase: 'canary_auth_missing', code: 'no-user', message: 'Missing auth uid in app session.' });
      return;
    }
    if (!currentFcmToken) {
      setCanaryStatus('error');
      setErrorMessage('No in-session FCM token. Tap Enable first to mint a fresh token.');
      setDebugState({
        phase: 'canary_missing_token',
        code: 'missing-token',
        message: 'currentFcmToken is empty in client state.',
      });
      return;
    }
    if (!hasFreshRotationInSession) {
      setCanaryStatus('error');
      setErrorMessage('Canary blocked: token was not freshly rotated in this browser session.');
      setDebugState({
        phase: 'canary_rotation_required',
        code: 'stale-session-token',
        message: 'Enable push again to force deleteToken + getToken before canary.',
      });
      return;
    }
    setCanaryStatus('working');
    setErrorMessage('');
    setDebugState({
      phase: 'canary_sending',
      code: '',
      message: `Sending canary for token ...${currentFcmToken.slice(-16)}.`,
    });
    try {
      const res = await sendPushCanary({ token: currentFcmToken });
      if (!res.ok) {
        throw new Error('Canary push did not report success.');
      }
      setCanaryMessageId(res.messageId);
      setCanaryStatus('sent');
      setDebugState({ phase: 'canary_sent', code: '', message: `Message id: ${res.messageId}` });
    } catch (error) {
      const parsed = normalizeError(error);
      setCanaryStatus('error');
      setErrorMessage(parsed.message || 'Failed to send test push.');
      setDebugState({
        phase: 'canary_failed',
        code: parsed.code,
        message: parsed.detailsText ? `${parsed.message} | ${parsed.detailsText}` : parsed.message,
      });
    }
  }, [user?.uid, currentFcmToken, hasFreshRotationInSession]);

  const disablePush = useCallback(async () => {
    if (!user?.uid) {
      setStatus('error');
      setErrorMessage('Sign in before changing push notifications.');
      setDebugState({ phase: 'disable_auth_missing', code: 'no-user', message: 'Missing auth uid in app session.' });
      return;
    }
    setStatus('working');
    setErrorMessage('');
    setDebugState({ phase: 'disable_working', code: '', message: '' });
    try {
      await revokeFcmDeviceToken();
      await deleteFcmTokenForUser({ userId: user.uid, token: currentFcmToken });
      setCurrentFcmToken('');
      setHasFreshRotationInSession(false);
      setCanaryStatus('idle');
      setCanaryMessageId('');
      setStatus('idle');
      setDebugState({ phase: 'disable_ok', code: '', message: 'Push disabled and token removed.' });
    } catch (error) {
      const parsed = normalizeError(error);
      setStatus('error');
      setErrorMessage(parsed.message || 'Failed to disable push.');
      setDebugState({
        phase: 'disable_failed',
        code: parsed.code,
        message: parsed.detailsText ? `${parsed.message} | ${parsed.detailsText}` : parsed.message,
      });
    }
  }, [currentFcmToken, user?.uid]);

  return useMemo(
    () => ({
      canaryMessageId,
      canaryStatus,
      disablePush,
      enablePush,
      errorMessage,
      debugState,
      lastMessageTitle,
      permission,
      runtimeDebug,
      status,
      triggerPushCanary,
    }),
    [
      canaryMessageId,
      canaryStatus,
      disablePush,
      enablePush,
      errorMessage,
      debugState,
      lastMessageTitle,
      permission,
      runtimeDebug,
      status,
      triggerPushCanary,
    ]
  );
}
