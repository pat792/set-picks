import React from 'react';

export default function SplashHowItWorksSection({ sectionRef, headingRef, onCreateAccountClick }) {
  return (
    <section
      ref={sectionRef}
      className="relative z-10 w-full flex items-center py-10 md:py-12 lg:py-14 md:min-h-[80vh] lg:min-h-[88vh]"
    >
      <div className="w-full max-w-5xl mx-auto px-1">
        <div className="rounded-[2.5rem] border border-white/10 bg-slate-800/50 p-6 md:p-8 lg:p-10 shadow-2xl backdrop-blur-sm">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-display-lg md:text-display-lg-lg font-bold text-white mb-6 text-center outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-md"
          >
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black shrink-0">
                1
              </div>
              <h3 className="font-bold text-lg mt-4">Lock It In</h3>
              <p className="text-slate-400 text-sm mt-2">
                Predict openers, closers, and wildcards before the lights go down.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-black shrink-0">
                2
              </div>
              <h3 className="font-bold text-lg mt-4">Watch It Unfold</h3>
              <p className="text-slate-400 text-sm mt-2">
                Setlist and scores will be updated in real-time. Final official scoring will be
                confirmed at show&apos;s end.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-black shrink-0">
                3
              </div>
              <h3 className="font-bold text-lg mt-4">Claim the Crown</h3>
              <p className="text-slate-400 text-sm mt-2">
                Play in the global pool or join private pools with your crew.
              </p>
            </div>
          </div>
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onCreateAccountClick}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 font-black text-slate-900 shadow-lg hover:opacity-95 transition-opacity"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
