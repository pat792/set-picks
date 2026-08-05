import React, { useState } from 'react';
import { flushSync } from 'react-dom';

import { loginPath } from '../model/appAuthPaths';
import MarketingAuthLeaveOverlay from './MarketingAuthLeaveOverlay';

/**
 * Hard link into the authenticated SPA document (#872).
 *
 * Prefer this over React Router `<Link to="/login">` on the marketing entry —
 * soft-nav hits MarketingApp `LoadAppDocument` (“Loading…”) then `location.replace`,
 * which is the dead-static → spinner → form sequence.
 */
export default function AppDocumentAuthLink({
  signup = false,
  href,
  className = '',
  children,
  leaveMessage,
  ...rest
}) {
  const [leaving, setLeaving] = useState(false);
  const resolvedHref = href || loginPath({ signup });

  return (
    <>
      {leaving ? (
        <MarketingAuthLeaveOverlay message={leaveMessage} />
      ) : null}
      <a
        href={resolvedHref}
        className={className}
        aria-busy={leaving || undefined}
        onClick={(e) => {
          // New-tab / modified clicks: let the browser handle without leave overlay.
          if (
            e.defaultPrevented ||
            e.button !== 0 ||
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey ||
            e.altKey
          ) {
            return;
          }
          // Paint leave chrome; allow default hard navigation (do not preventDefault).
          flushSync(() => {
            setLeaving(true);
          });
        }}
        {...rest}
      >
        {children}
      </a>
    </>
  );
}
