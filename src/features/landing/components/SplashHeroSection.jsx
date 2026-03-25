import React from 'react';

const glassCtaClassName =
  'w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-white/25 bg-slate-950/30 backdrop-blur-xl px-8 py-4 font-black text-white shadow-lg ring-1 ring-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] hover:bg-slate-950/45 transition-colors';

export default function SplashHeroSection({ onHowItWorksClick, onPlayNowClick, onAboutClick }) {
  return (
    <section 
      className="relative z-10 w-full min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      
    >
      <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-[-10vh]">
        
        <h1 className="font-display text-display-hero-splash md:text-display-hero-splash-lg font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 drop-shadow-xl pr-2 md:pr-4">
          SETLIST PICK &apos;EM
        </h1>
        
        <p className="mt-6 max-w-3xl mx-auto text-base md:text-xl text-slate-200 font-medium leading-relaxed drop-shadow-md">
          Draft your dream setlist. Compete against the global community or your own tour crew.
          Prove who truly knows the band.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-4 w-full max-w-[280px] sm:max-w-none mx-auto">
          <button
            type="button"
            onClick={onHowItWorksClick}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 font-black text-slate-900 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.7)] transition-all"
          >
            How it works
          </button>
          
          <button
            type="button"
            onClick={onPlayNowClick}
            aria-label="Play now: go to sign in or create an account"
            className={glassCtaClassName}
          >
            Start Picking
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
    </section>
  );
}