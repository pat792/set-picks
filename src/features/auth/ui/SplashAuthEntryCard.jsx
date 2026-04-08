import React from 'react';
import Button from '../../../shared/ui/Button';

export default function SplashAuthEntryCard({ onOpenSignUp, onOpenSignIn, headingRef = null }) {
  return (
    <div className="z-10 w-full max-w-lg">
      <div className="rounded-[2rem] border border-border-subtle bg-surface-panel-strong p-8 text-center shadow-inset-glass ring-1 ring-border-glass/20 backdrop-blur-md">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mb-1 rounded-md font-display text-display-sm font-bold text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          Get started
        </h2>
        <p className="text-sm text-slate-400 font-bold mb-6">New here or coming back? Choose an option.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            type="button"
            onClick={onOpenSignUp}
            className="flex-1 px-4 py-4 shadow-glow-brand hover:opacity-95"
          >
            Create account
          </Button>
          <Button
            variant="glass"
            type="button"
            onClick={onOpenSignIn}
            className="flex-1 border-white/20 bg-white/5 px-4 py-4 shadow-inset-glass hover:bg-white/10"
          >
            Sign in
          </Button>
        </div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-6">
          Free to play • Built for fans • Just bragging rights
        </p>
      </div>
    </div>
  );
}
