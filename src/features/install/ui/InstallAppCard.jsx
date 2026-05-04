import React from 'react';
import { Download, Share2 } from 'lucide-react';

import { useInstallPrompt } from '../model/useInstallPrompt';

export default function InstallAppCard() {
  const {
    canPrompt,
    isInstalled,
    showIosGuide,
    promptInstall,
    dismissIos,
    openIosGuide,
    closeIosGuide,
    shouldShowIosFlow,
  } = useInstallPrompt();

  if (isInstalled) return null;

  return (
    <section className="mt-8 rounded-3xl border border-border-subtle bg-surface-panel p-6 shadow-inset-glass">
      <h3 className="text-sm font-black uppercase tracking-widest text-content-secondary">
        Install app
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-content-secondary">
        Get faster launch and a cleaner full-screen dashboard by adding Setlist Pick &apos;Em to your
        home screen.
      </p>

      {canPrompt ? (
        <button
          type="button"
          onClick={promptInstall}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-primary/45 bg-brand-primary/10 py-3.5 text-sm font-black uppercase tracking-widest text-brand-primary transition-colors hover:border-brand-primary hover:bg-brand-primary/20"
        >
          <Download className="h-4 w-4 shrink-0" aria-hidden />
          Add to Home Screen
        </button>
      ) : null}

      {shouldShowIosFlow ? (
        <>
          <button
            type="button"
            onClick={showIosGuide ? closeIosGuide : openIosGuide}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border-subtle bg-surface-field py-3.5 text-sm font-black uppercase tracking-widest text-white transition-colors hover:border-brand-primary/50 hover:bg-surface-panel"
          >
            <Share2 className="h-4 w-4 shrink-0" aria-hidden />
            {showIosGuide ? 'Hide iPhone install steps' : 'Show iPhone install steps'}
          </button>

          {showIosGuide ? (
            <ol className="mt-4 space-y-2 rounded-2xl border border-border-muted bg-surface-inset p-4 text-sm text-content-secondary">
              <li>
                1. Tap the <span className="font-bold text-white">Share</span> button in Safari.
              </li>
              <li>
                2. Scroll and tap <span className="font-bold text-white">Add to Home Screen</span>.
              </li>
              <li>
                3. Confirm the title, then tap <span className="font-bold text-white">Add</span>.
              </li>
            </ol>
          ) : null}

          <button
            type="button"
            onClick={dismissIos}
            className="mt-3 text-xs font-black uppercase tracking-widest text-content-secondary underline decoration-border-muted underline-offset-4 transition-colors hover:text-white"
          >
            Don&apos;t show this again
          </button>
        </>
      ) : null}

      {!canPrompt && !shouldShowIosFlow ? (
        <p className="mt-4 rounded-2xl border border-border-muted bg-surface-inset p-4 text-sm leading-relaxed text-content-secondary">
          Install is not available in this browser yet. To test this flow now, open the app in iPhone
          Safari for guided steps. Chromium native install prompt support arrives with the service worker
          foundation.
        </p>
      ) : null}
    </section>
  );
}
