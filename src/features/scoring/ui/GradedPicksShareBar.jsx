import React, { useCallback, useState } from 'react';
import { Copy, Share2 } from 'lucide-react';

import {
  buildGradedPicksShareBodyPlain,
  buildGradedPicksShareFullPlainText,
  GRADED_PICKS_SHARE_RECAP_TITLE,
} from '../model/gradedPicksShareCore';

export default function GradedPicksShareBar({ userPicks, actualSetlist, showLabel }) {
  const [notice, setNotice] = useState(null);

  const clearNoticeSoon = useCallback((msg) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3200);
  }, []);

  const onCopy = useCallback(async () => {
    const plain = buildGradedPicksShareFullPlainText({ userPicks, actualSetlist, showLabel });
    try {
      await navigator.clipboard.writeText(plain);
      clearNoticeSoon('Copied to clipboard');
    } catch {
      clearNoticeSoon('Could not copy — try again');
    }
  }, [actualSetlist, clearNoticeSoon, showLabel, userPicks]);

  const onShare = useCallback(async () => {
    const text = buildGradedPicksShareBodyPlain({ userPicks, actualSetlist, showLabel });

    try {
      if (navigator.share) {
        await navigator.share({ text, title: GRADED_PICKS_SHARE_RECAP_TITLE });
        clearNoticeSoon('Shared');
        return;
      }
      await navigator.clipboard.writeText(text);
      clearNoticeSoon('Share not available — copied instead');
    } catch (e) {
      if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) return;
      console.error(e);
      clearNoticeSoon('Share failed');
    }
  }, [actualSetlist, clearNoticeSoon, showLabel, userPicks]);

  return (
    <div className="mt-4 rounded-xl border border-border-subtle/50 bg-surface-panel/40 px-3 py-3">
      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-content-secondary">
        Share your score
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-muted bg-surface-inset px-3 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-surface-panel-strong hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
          Copy
        </button>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/40 bg-brand-primary/10 px-3 py-2 text-xs font-bold text-brand-primary transition-colors hover:bg-brand-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        >
          <Share2 className="h-3.5 w-3.5" aria-hidden />
          Share…
        </button>
      </div>
      {notice ? (
        <p className="mt-2 text-[11px] font-semibold text-brand-primary" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
