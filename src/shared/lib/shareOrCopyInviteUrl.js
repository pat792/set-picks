import { showSuccessToast } from '../ui/toast';

const DEFAULT_SHARE_TITLE = "Join My Setlist Pick 'Em Pool!";

/**
 * Try Web Share API with URL only for the native sheet payload.
 * On iOS, passing `title`/`text` with `url` often prevents Messages/Mail from
 * fetching Open Graph for the link (Chrome WKWebView shows a blank preview;
 * Safari share still works). Clipboard fallback still uses title + URL.
 * @param {string} url
 * @param {{ title?: string, copyToastMessage?: string }} [options]
 * @returns {Promise<{ ok: boolean, via?: 'share' | 'copy', reason?: string }>}
 */
export async function shareOrCopyInviteUrl(url, options = {}) {
  const {
    title = DEFAULT_SHARE_TITLE,
    copyToastMessage = 'Link copied!',
  } = options;

  if (!url?.trim()) {
    return { ok: false, reason: 'no-url' };
  }

  const trimmedUrl = url.trim();
  const shareText = title.trim();

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ url: trimmedUrl });
      return { ok: true, via: 'share' };
    } catch (e) {
      if (e?.name === 'AbortError') {
        // User dismissed share sheet — fall through to clipboard + toast
      } else {
        // Other errors — still try clipboard
      }
    }
  }

  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return { ok: false, reason: 'no-clipboard' };
  }

  try {
    const clipboardPayload = `${shareText}\n\n${trimmedUrl}`;
    await navigator.clipboard.writeText(clipboardPayload);
    showSuccessToast(copyToastMessage);
    return { ok: true, via: 'copy' };
  } catch {
    return { ok: false, reason: 'copy-failed' };
  }
}
