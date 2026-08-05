import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';

import { loginPath } from './appAuthPaths';
import { resolveMarketingAuthLeaveMessage } from './marketingAuthLeaveCopy';
import {
  markLoginHopCta,
  prefetchLoginIntent,
} from './prefetchLoginIntent';

/**
 * Hard-nav to app `/login` with leave chrome + intent prefetch (#872 / #860).
 * Use on marketing home button CTAs (Jump on Tour, Make picks now, …).
 */
export default function useMarketingAuthLeave() {
  const [leaving, setLeaving] = useState(false);
  const [leaveMessage, setLeaveMessage] = useState(
    resolveMarketingAuthLeaveMessage({ signup: false }),
  );

  const onAuthCtaIntent = useCallback(() => {
    prefetchLoginIntent();
  }, []);

  const leaveToLogin = useCallback(
    ({ signup = false } = {}) => {
      if (leaving) return;
      const href = loginPath({ signup });
      const message = resolveMarketingAuthLeaveMessage({ signup });
      // Start cache warm before/during leave paint (#860).
      prefetchLoginIntent();
      markLoginHopCta({ intent: signup ? 'signup' : 'signin' });
      // Commit overlay to the DOM before starting the document navigation.
      flushSync(() => {
        setLeaveMessage(message);
        setLeaving(true);
      });
      // Yield so Safari can paint the overlay, then hard-nav (skip MarketingApp hop).
      requestAnimationFrame(() => {
        window.location.assign(href);
      });
    },
    [leaving],
  );

  return {
    leaving,
    leaveMessage,
    onAuthCtaIntent,
    openSignUp: useCallback(() => leaveToLogin({ signup: true }), [leaveToLogin]),
    openSignIn: useCallback(() => leaveToLogin({ signup: false }), [leaveToLogin]),
  };
}
