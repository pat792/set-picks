import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';

import { loginPath } from './appAuthPaths';

/**
 * Hard-nav to app `/login` with a paint of leave chrome first (#872).
 * Use on marketing home button CTAs (Jump on Tour, Make picks now, …).
 */
export default function useMarketingAuthLeave() {
  const [leaving, setLeaving] = useState(false);

  const leaveToLogin = useCallback(
    ({ signup = false } = {}) => {
      if (leaving) return;
      const href = loginPath({ signup });
      // Commit overlay to the DOM before starting the document navigation.
      flushSync(() => {
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
    openSignUp: useCallback(() => leaveToLogin({ signup: true }), [leaveToLogin]),
    openSignIn: useCallback(() => leaveToLogin({ signup: false }), [leaveToLogin]),
  };
}
