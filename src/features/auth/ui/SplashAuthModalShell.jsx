import React from 'react';

import Button from '../../../shared/ui/Button';

export default function SplashAuthModalShell({ isOpen, onClose, title, handleGoogle, busy, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900 p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
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
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs font-bold text-slate-500 uppercase">or email</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {children}
      </div>
    </div>
  );
}
