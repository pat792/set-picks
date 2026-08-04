import React from 'react';

import Button from '../../../shared/ui/Button';

/**
 * Shared auth credentials chrome (#834) — Google CTA, divider, and form slot.
 * Modal shell wraps this in a dialog; `/login` uses it as a page panel.
 */
export default function SplashAuthPanel({
  title,
  onClose,
  showClose = false,
  handleGoogle,
  busy,
  googleDisabled,
  prependContent,
  googleFootnote,
  children,
}) {
  const isGoogleDisabled =
    typeof googleDisabled === 'boolean' ? googleDisabled : busy;

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-border-subtle bg-surface-panel-strong p-8 shadow-inset-glass ring-1 ring-border-glass/20">
      <div className="mb-6 flex items-start justify-between">
        <h1 className="font-display text-display-md font-bold text-white md:text-display-md-lg">
          {title}
        </h1>
        {showClose && typeof onClose === 'function' ? (
          <Button
            variant="text"
            type="button"
            onClick={onClose}
            className="px-2 py-0 text-2xl leading-none text-slate-400 hover:text-white"
            aria-label="Close"
          >
            ×
          </Button>
        ) : null}
      </div>

      {prependContent ? <div className="mb-6">{prependContent}</div> : null}

      <Button
        variant="text"
        type="button"
        onClick={handleGoogle}
        disabled={isGoogleDisabled}
        className="w-full gap-3 rounded-xl bg-white py-3.5 text-slate-900 shadow-[0_8px_24px_-12px_rgba(255,255,255,0.35)] ring-1 ring-white/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-[0_12px_28px_-12px_rgba(255,255,255,0.45)]"
      >
        <img src="https://www.google.com/favicon.ico" alt="" className="h-5 w-5" />
        Continue with Google
      </Button>

      {googleFootnote ? (
        <p className="mt-3 text-center text-xs font-semibold leading-relaxed text-slate-300">
          {googleFootnote}
        </p>
      ) : null}

      <div className="mb-6 mt-8 flex items-center gap-3">
        <div className="h-px flex-1 bg-border-muted" />
        <span className="text-xs font-bold uppercase text-slate-500">or</span>
        <div className="h-px flex-1 bg-border-muted" />
      </div>

      {children}
    </div>
  );
}
