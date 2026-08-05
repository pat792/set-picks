import React, { useState } from 'react';
import { flushSync } from 'react-dom';

import { loginPath } from '../model/appAuthPaths';
import { resolveMarketingAuthLeaveMessage } from '../model/marketingAuthLeaveCopy';
import { prefetchLoginIntent } from '../model/prefetchLoginIntent';
import MarketingAuthLeaveOverlay from './MarketingAuthLeaveOverlay';

/**
 * Hard link into the authenticated SPA document (#872 / #860).
 *
 * Prefer this over React Router `<Link to="/login">` on the marketing entry —
 * soft-nav hits MarketingApp `LoadAppDocument` (“Loading…”) then `location.replace`,
 * which is the dead-static → spinner → form sequence.
 *
 * Pointer/focus intent prefetches login UI assets without booting Firebase.
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
  const resolvedLeaveMessage =
    leaveMessage || resolveMarketingAuthLeaveMessage({ signup });

  return (
    <>
      {leaving ? (
        <MarketingAuthLeaveOverlay message={resolvedLeaveMessage} />
      ) : null}
      <a
        href={resolvedHref}
        className={className}
        aria-busy={leaving || undefined}
        {...rest}
        onPointerEnter={(e) => {
          rest.onPointerEnter?.(e);
          prefetchLoginIntent();
        }}
        onFocus={(e) => {
          rest.onFocus?.(e);
          prefetchLoginIntent();
        }}
        onPointerDown={(e) => {
          rest.onPointerDown?.(e);
          prefetchLoginIntent();
        }}
        onClick={(e) => {
          rest.onClick?.(e);
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
          prefetchLoginIntent();
          // Paint leave chrome; allow default hard navigation (do not preventDefault).
          flushSync(() => {
            setLeaving(true);
          });
        }}
      >
        {children}
      </a>
    </>
  );
}
