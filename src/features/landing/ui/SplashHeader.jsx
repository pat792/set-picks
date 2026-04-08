import React from 'react';
import Button from "../../../shared/ui/Button";

export default function SplashHeader({
  onPlayNowClick,
  onSignInClick,
}) {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex h-[4.25rem] items-center border-b border-white/5 bg-brand-bg/80 backdrop-blur-lg transition-all duration-300 sm:h-20">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="font-display font-bold italic text-[clamp(1.05rem,4.6vw,1.5rem)] sm:text-2xl splash-gradient-text outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm hover:opacity-80 transition-opacity pr-1 min-w-0 whitespace-nowrap leading-none inline-block"
        >
          SETLIST PICK &apos;EM
        </button>

        <div className="flex items-center gap-0.25 sm:gap-4 min-w-0">
          <Button
            variant="text"
            size="none"
            onClick={onSignInClick}
            className="text-sm sm:text-sm whitespace-nowrap"
          >
            Sign In
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onPlayNowClick}
            className="py-2.5"
          >
            Jump on Tour
          </Button>
        </div>
      </div>
    </header>
  );
}
