import { showSuccessToast } from '../ui/toast';

const DEFAULT_SHARE_TITLE = "Join My Setlist Pick 'Em Pool!";

/**
 * Try Web Share API with title + text + url (text mirrors title for iMessage pre-fill); on unsupported share or user cancel/error, copy message + URL to clipboard and toast.
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
      await navigator.share({
        title: shareText,
        text: shareText,
        url: trimmedUrl,
      });
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
