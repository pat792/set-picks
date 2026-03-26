import React from 'react';

export default function SplashHeader({
  onHowItWorksClick,
  onAboutClick,
  onPlayNowClick,
  onSignInClick,
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-lg border-b border-white/5 h-16 sm:h-20 flex items-center transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Left: Brand / Logo */}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-display font-bold italic text-lg sm:text-xl text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm hover:opacity-80 transition-opacity pr-2"
        >
          SETLIST PICK &apos;EM
        </button>

        {/* Middle: Desktop Navigation (Hidden on mobile) */}
        <nav className="hidden md:flex items-center gap-8">
          <button 
            type="button" 
            onClick={onHowItWorksClick} 
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
          >
            How it works
          </button>
          <button 
            type="button" 
            onClick={onAboutClick} 
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
          >
            About
          </button>
        </nav>

        {/* Right: CTA Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onSignInClick}
            className="text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={onPlayNowClick}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-slate-900 shadow-md hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all duration-300"
          >
            Jump on Tour
          </button>
        </div>

      </div>
    </header>
  );
}