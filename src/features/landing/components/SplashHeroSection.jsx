import React from 'react';

export default function SplashHeroSection({ onHowItWorksClick, onPlayNowClick, onAboutClick }) {
  const glassCtaClassName =
    'w-full sm:w-auto inline-flex items-center justify-center rounded-2xl border border-white/25 bg-slate-950/30 backdrop-blur-xl px-8 py-4 font-black text-white shadow-lg ring-1 ring-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] hover:bg-slate-950/45 transition-colors';

  return (
    // Added pt-16 sm:pt-20 to safely clear the fixed header on all screen sizes
    <section className="relative w-full min-h-screen flex items-center justify-center bg-[#0f172a] overflow-hidden pt-16 sm:pt-20">
      
      {/* MAIN CONTENT (Removed negative margin hack) */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Responsive Wrap: Stacks on mobile, stays single line on desktop */}
        <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold italic text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-blue-500 drop-shadow-xl pr-2 md:pr-4 whitespace-normal lg:whitespace-nowrap">
          SETLIST PICK &apos;EM
        </h1>
        
        <p className="mt-6 max-w-3xl mx-auto text-base md:text-xl text-slate-200 font-medium leading-relaxed drop-shadow-md">
          The ultimate live music prediction game. Phish is just the opener.
          <br />
          <br />
          Stop just calling the opener to your buddy—put your picks on the record. Draft your Phish predictions, lock them in before showtime, and battle for bragging rights against the global community and your own tour crew. Prove who really knows the band's next move.
        </p>
        
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