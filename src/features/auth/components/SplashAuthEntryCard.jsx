import React from 'react';

export default function SplashAuthEntryCard({ onOpenSignUp, onOpenSignIn, headingRef = null }) {
  return (
    <div className="z-10 w-full max-w-lg">
      <div className="rounded-[2rem] border border-white/10 bg-slate-800/60 backdrop-blur-md p-8 shadow-2xl text-center">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-display-sm font-bold text-slate-200 mb-1 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md"
        >
          Get started
        </h2>
        <p className="text-sm text-slate-400 font-bold mb-6">New here or coming back? Choose an option.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onOpenSignUp}
            className="flex-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-4 px-4 font-black text-slate-900 shadow-lg hover:opacity-95 transition-opacity"
          >
            Create account
          </button>
          <button
            type="button"
            onClick={onOpenSignIn}
            className="flex-1 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md py-4 px-4 font-black text-white shadow-lg hover:bg-white/10 transition-colors"
          >
            Sign in
          </button>
        </div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-6">
          Free to play • Built for fans • Just bragging rights
        </p>
      </div>
    </div>
  );
}
