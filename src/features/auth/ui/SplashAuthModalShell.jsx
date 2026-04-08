import React from 'react';

import Button from '../../../shared/ui/Button';

export default function SplashAuthModalShell({ isOpen, onClose, title, handleGoogle, busy, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-bg-deep/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-border-subtle bg-surface-panel-strong p-8 shadow-inset-glass ring-1 ring-border-glass/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h3 className="font-display text-display-md md:text-display-md-lg font-bold text-white">{title}</h3>
          <Button
            variant="text"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl leading-none px-2 py-0"
            aria-label="Close"
          >
            ×
          </Button>
        </div>

        <Button
          variant="text"
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="w-full bg-white text-slate-900 py-3.5 rounded-xl gap-3 hover:bg-slate-100 transition-colors mb-6"
        >
          <img src="https://www.google.com/favicon.ico" alt="" className="w-5 h-5" />
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-border-muted" />
          <span className="text-xs font-bold uppercase text-slate-500">or email</span>
          <div className="h-px flex-1 bg-border-muted" />
        </div>

        {children}
      </div>
    </div>
  );
}
