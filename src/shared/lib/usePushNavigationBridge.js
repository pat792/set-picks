import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  PUSH_NAVIGATE_MESSAGE_TYPE,
  sanitizePushNavigationPath,
} from './pushNavigationPath';

/**
 * Soft-navigate when the FCM service worker asks an existing tab to move
 * (#773 Phase 3). Replaces `client.navigate()` full reloads for open tabs.
 */
export function usePushNavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return undefined;
    }

    function onMessage(event) {
      const data = event?.data;
      if (!data || data.type !== PUSH_NAVIGATE_MESSAGE_TYPE) return;
      const path = sanitizePushNavigationPath(data.path);
      if (!path) return;
      navigate(path);
    }

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', onMessage);
    };
  }, [navigate]);
}
