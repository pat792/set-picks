import React from 'react';

export default function SplashHeroSection({ onHowItWorksClick, onPlayNowClick, onAboutClick }) {
  const glassCtaClassName =
    'w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-white/25 bg-slate-950/30 backdrop-blur-xl px-8 py-4 font-black text-white shadow-lg ring-1 ring-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] hover:bg-slate-950/45 transition-colors';

  return (
    <section className="relative z-10 w-full min-h-screen flex items-center justify-center bg-[#0f172a] bg-cover bg-center bg-no-repeat">
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-[2px]"></div>

      {/* REVERTED: Back to the original centering with just mt-[-10vh] */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-[-10vh]">
        
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500 drop-shadow-xl pr-2 md:pr-4 whitespace-nowrap">
          SETLIST PICK 'EM
        </h1>
        
        <div className="mt-6 max-w-3xl mx-auto">
  {/* The Neon Kicker */}
  <p className="text-xl md:text-2xl text-teal-400 font-bold tracking-wide drop-shadow-[0_0_12px_rgba(45,212,191,0.5)] mb-4">
    The ultimate live music prediction game. Phish is just the opener.
  </p>
  
  {/* The Supporting Body */}
  <p className="text-base md:text-lg text-slate-300 font-normal leading-relaxed">
    Stop just calling the opener to your buddy—put your picks on the record. Draft your Phish predictions, lock them in before showtime, and battle for bragging rights against the global community and your own tour crew. Prove who really knows the band's next move.
  </p>
</div>
        
        <div className="mt-10 flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-4 w-full max-w-[280px] sm:max-w-none mx-auto">
          <button
            type="button"
            onClick={onHowItWorksClick}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 font-black text-slate-900 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] hover:shadow-[0_0_60px_-15px_rgba(16,185,129,0.7)] transition-all"
          >
            Game Format
          </button>
          
          <button
            type="button"
            onClick={onPlayNowClick}
            aria-label="Play now: go to sign in or create an account"
            className={glassCtaClassName}
          >
            Make Picks Now
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