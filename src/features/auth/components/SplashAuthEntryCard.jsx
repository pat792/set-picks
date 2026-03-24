import React from 'react';

export default function SplashAuthEntryCard({ onOpenSignUp, onOpenSignIn }) {
  return (
    <div className="z-10 w-full max-w-lg mt-10 md:mt-14">
      <div className="rounded-[2rem] border border-white/10 bg-slate-800/60 backdrop-blur-md p-8 shadow-2xl text-center">
        <h2 className="text-lg font-black text-slate-200 mb-1">Get started</h2>
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
            className="flex-1 rounded-2xl border-2 border-slate-500 bg-slate-900/50 py-4 px-4 font-black text-white hover:bg-slate-800/80 transition-colors"
          >
            Sign in
          </button>
        </div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-6">
          Free to play • No spam • Just bragging rights
        </p>
      </div>
    </div>
  );
}
