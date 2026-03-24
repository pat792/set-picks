import React from 'react';

const glassCtaClassName =
  'inline-flex items-center justify-center rounded-2xl border border-white/25 bg-slate-950/30 backdrop-blur-xl px-8 py-4 font-black text-white shadow-lg ring-1 ring-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] hover:bg-slate-950/45 transition-colors';

/** Solid primary + glass secondary CTAs */
export default function SplashHeroSection({ onHowItWorksClick, onPlayNowClick, onAboutClick }) {
  return (
    <section className="relative z-10 w-full flex items-center py-10 md:py-12 lg:py-14 md:min-h-[80vh] lg:min-h-[88vh]">
      <div className="w-full max-w-5xl mx-auto px-1">
        <div className="rounded-[2.5rem] border border-white/10 bg-slate-800/40 backdrop-blur-sm p-6 md:p-8 lg:p-10 text-center shadow-2xl">
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            SETLIST PICK &apos;EM
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-slate-300 font-medium">
            Draft your dream setlist. Compete against the global community or your own tour crew.
            Prove who truly knows the band.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center gap-3">
            <button
              type="button"
              onClick={onHowItWorksClick}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 font-black text-slate-900 shadow-lg hover:opacity-95 transition-opacity"
            >
              How it works
            </button>
            <button
              type="button"
              onClick={onPlayNowClick}
              aria-label="Play now: go to sign in or create an account"
              className={glassCtaClassName}
            >
              Play Now
            </button>
            <button
              type="button"
              onClick={onAboutClick}
              aria-label={"About Setlist Pick 'Em"}
              className={glassCtaClassName}
            >
              About
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
