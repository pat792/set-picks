import React, { useCallback, useState } from 'react';
import { Copy, Download, Share2 } from 'lucide-react';

import {
  buildGradedPicksShareBodyPlain,
  buildGradedPicksShareClipboardHtml,
  buildGradedPicksShareFullPlainText,
  buildGradedPicksShareSlots,
  GRADED_PICKS_SHARE_RECAP_TITLE,
  renderGradedPicksSharePngBlob,
} from '../model/gradedPicksShareCore';
import { calculateTotalScore } from '../../../shared/utils/scoring';

function ymdForFilename(showLabel) {
  const m = String(showLabel).match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : 'show';
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('readAsDataURL failed'));
    r.readAsDataURL(blob);
  });
}

export default function GradedPicksShareBar({ userPicks, actualSetlist, showLabel }) {
  const [notice, setNotice] = useState(null);

  const clearNoticeSoon = useCallback((msg) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3200);
  }, []);

  const onCopy = useCallback(async () => {
    const slots = buildGradedPicksShareSlots(userPicks, actualSetlist);
    const totalPoints = calculateTotalScore(userPicks, actualSetlist);
    const plain = buildGradedPicksShareFullPlainText({ userPicks, actualSetlist, showLabel });

    try {
      const pngBlob = await renderGradedPicksSharePngBlob(slots, { showLabel, totalPoints });
      const imageDataUrl = await blobToDataUrl(pngBlob);
      const html = buildGradedPicksShareClipboardHtml({
        imageDataUrl,
        showLabel,
        totalPoints,
      });

      if (navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([plain], { type: 'text/plain' }),
          }),
        ]);
        clearNoticeSoon('Copied recap (image + link in rich apps)');
        return;
      }
      await navigator.clipboard.writeText(plain);
      clearNoticeSoon('Copied recap');
    } catch (e) {
      console.warn('Copy recap failed, falling back to plain text.', e);
      try {
        await navigator.clipboard.writeText(plain);
        clearNoticeSoon('Copied recap');
      } catch {
        clearNoticeSoon('Could not copy — try again');
      }
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
    const text = buildGradedPicksShareBodyPlain({ userPicks, actualSetlist, showLabel });
    const slots = buildGradedPicksShareSlots(userPicks, actualSetlist);
    const totalPoints = calculateTotalScore(userPicks, actualSetlist);

    try {
      const blob = await renderGradedPicksSharePngBlob(slots, { showLabel, totalPoints });
      const file = new File([blob], `setlist-pickem-graded-${ymdForFilename(showLabel)}.png`, {
        type: 'image/png',
      });

      const shareData = { text, title: GRADED_PICKS_SHARE_RECAP_TITLE };
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
      await navigator.clipboard.writeText(
        [GRADED_PICKS_SHARE_RECAP_TITLE, '', text].join('\n'),
      );
      clearNoticeSoon('Share not available — copied recap instead');
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
          Copy recap
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
