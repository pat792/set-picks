import React, { useCallback, useState } from 'react';
import { Copy, Download, Share2 } from 'lucide-react';

import {
  buildGradedPicksShareSlots,
  buildGradedPicksShareText,
  renderGradedPicksSharePngBlob,
} from '../model/gradedPicksShareCore';
import { calculateTotalScore } from '../../../shared/utils/scoring';

function ymdForFilename(showLabel) {
  const m = String(showLabel).match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : 'show';
}

export default function GradedPicksShareBar({ userPicks, actualSetlist, showLabel }) {
  const [notice, setNotice] = useState(null);

  const clearNoticeSoon = useCallback((msg) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3200);
  }, []);

  const onCopy = useCallback(async () => {
    const text = buildGradedPicksShareText({ userPicks, actualSetlist, showLabel });
    try {
      await navigator.clipboard.writeText(text);
      clearNoticeSoon('Copied grid to clipboard');
    } catch {
      clearNoticeSoon('Could not copy — try again');
    }
  }, [actualSetlist, clearNoticeSoon, showLabel, userPicks]);

  const onDownloadPng = useCallback(async () => {
    const slots = buildGradedPicksShareSlots(userPicks, actualSetlist);
    const totalPoints = calculateTotalScore(userPicks, actualSetlist);
    try {
      const blob = await renderGradedPicksSharePngBlob(slots, { showLabel, totalPoints });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `setlist-pickem-graded-${ymdForFilename(showLabel)}.png`;
      a.click();
      URL.revokeObjectURL(url);
      clearNoticeSoon('PNG downloaded');
    } catch (e) {
      console.error(e);
      clearNoticeSoon('PNG export failed');
    }
  }, [actualSetlist, clearNoticeSoon, showLabel, userPicks]);

  const onShare = useCallback(async () => {
    const text = buildGradedPicksShareText({ userPicks, actualSetlist, showLabel });
    const slots = buildGradedPicksShareSlots(userPicks, actualSetlist);
    const totalPoints = calculateTotalScore(userPicks, actualSetlist);

    try {
      const blob = await renderGradedPicksSharePngBlob(slots, { showLabel, totalPoints });
      const file = new File([blob], `setlist-pickem-graded-${ymdForFilename(showLabel)}.png`, {
        type: 'image/png',
      });

      const shareData = { text, title: 'My graded picks' };
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ ...shareData, files: [file] });
        clearNoticeSoon('Shared');
        return;
      }
      if (navigator.share) {
        await navigator.share(shareData);
        clearNoticeSoon('Shared');
        return;
      }
      await navigator.clipboard.writeText(text);
      clearNoticeSoon('Share not available — copied text instead');
    } catch (e) {
      if (e && (e.name === 'AbortError' || e.name === 'NotAllowedError')) return;
      console.error(e);
      clearNoticeSoon('Share failed');
    }
  }, [actualSetlist, clearNoticeSoon, showLabel, userPicks]);

  return (
    <div className="mt-4 rounded-xl border border-border-subtle/50 bg-surface-panel/40 px-3 py-3">
      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-content-secondary">
        Share graded card
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-muted bg-surface-inset px-3 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-surface-panel-strong hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
          Copy text grid
        </button>
        <button
          type="button"
          onClick={onDownloadPng}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-muted bg-surface-inset px-3 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-surface-panel-strong hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          Download PNG
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
