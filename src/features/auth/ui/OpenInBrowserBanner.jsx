import React, { useCallback, useMemo, useState } from 'react';

import {
  isLikelyInAppBrowser,
  preferredExternalBrowserLabel,
} from '../../../shared/lib/inAppBrowser';
import Button from '../../../shared/ui/Button';

/**
 * Instructional banner for email / in-app WebViews (#773 Phase 2b).
 * Browsers cannot force a handoff to Safari/Chrome; we guide the user.
 */
export default function OpenInBrowserBanner({ className = '' }) {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const show = useMemo(() => isLikelyInAppBrowser(), []);
  const browserLabel = useMemo(() => preferredExternalBrowserLabel(), []);

  const handleCopy = useCallback(async () => {
    const href = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select via prompt so user can still copy manually.
      window.prompt('Copy this link and open it in your browser:', href);
    }
  }, []);

  if (!show || dismissed) return null;

  return (
    <div
      className={`border-b border-brand-primary/25 bg-brand-primary/10 px-4 py-3 text-sm text-white ${className}`}
      role="status"
      data-open-in-browser-banner="true"
    >
      <div className="mx-auto flex max-w-xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-semibold leading-snug text-content-secondary">
          Signing in works more reliably in {browserLabel}. Use your browser menu
          → Open in {browserLabel}, or copy the link below.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="text"
            type="button"
            onClick={handleCopy}
            className="rounded-lg bg-brand-primary/20 px-3 py-1.5 text-xs font-bold text-brand-primary ring-1 ring-inset ring-brand-primary/35 hover:bg-brand-primary/30"
          >
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          <Button
            variant="text"
            type="button"
            onClick={() => setDismissed(true)}
            className="px-2 py-1 text-xs font-bold text-slate-400 hover:text-white"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
