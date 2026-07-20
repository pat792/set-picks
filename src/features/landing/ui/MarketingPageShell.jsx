import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import {
  BRAND_SPLASH_HEADER_VINYL_MARK_SRC,
  brandSplashHeaderVinylMarkImgClassNames,
} from '../../../shared/config/branding';

/**
 * Minimal shell for standalone marketing / educational pages
 * (`/how-it-works`, `/how-scoring-works`, `/tour-stats`). Provides a sticky header with home
 * link and a simple footer — no auth logic, no scroll machinery.
 */
export default function MarketingPageShell({ children }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-transparent text-white">
      <header className="sticky top-0 z-50 flex h-[5.35rem] items-center border-b border-white/5 bg-brand-bg/80 backdrop-blur-lg sm:h-[5.25rem]">
        <div className="flex w-full max-w-5xl mx-auto items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label="Setlist Pick \'Em — back to home"
            className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue rounded-md"
          >
            <img
              src={BRAND_SPLASH_HEADER_VINYL_MARK_SRC}
              alt="Setlist Pick \'Em"
              width={36}
              height={36}
              decoding="async"
              className={brandSplashHeaderVinylMarkImgClassNames}
            />
            <span className="hidden sm:block font-display font-bold text-white text-base tracking-tight">
              Setlist Pick&nbsp;&apos;Em
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue rounded-sm"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Back to Home
          </Link>
        </div>
      </header>
      <main className="flex-1 w-full">{children}</main>
      <footer className="relative z-10 border-t border-slate-800/60 bg-transparent px-4 py-6 text-center text-xs font-medium leading-relaxed text-slate-500 sm:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} Road2 Media, LLC. All rights reserved.</p>
        <p className="mt-1">
          Song and setlist data provided by{' '}
          <a
            href="https://phish.net"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 underline decoration-slate-600 underline-offset-2 transition-colors hover:text-slate-200 hover:decoration-slate-400"
          >
            The Mockingbird Foundation / Phish.Net
          </a>
          .
        </p>
        <p className="mt-2 space-x-3">
          <Link to="/how-it-works" className="text-slate-400 underline decoration-slate-600 underline-offset-2 transition-colors hover:text-slate-200 hover:decoration-slate-400">How It Works</Link>
          <Link to="/how-scoring-works" className="text-slate-400 underline decoration-slate-600 underline-offset-2 transition-colors hover:text-slate-200 hover:decoration-slate-400">How Scoring Works</Link>
          <Link to="/tour-stats" className="text-slate-400 underline decoration-slate-600 underline-offset-2 transition-colors hover:text-slate-200 hover:decoration-slate-400">Tour Stats</Link>
          <Link to="/privacy" className="text-slate-400 underline decoration-slate-600 underline-offset-2 transition-colors hover:text-slate-200 hover:decoration-slate-400">Privacy Policy</Link>
          <Link to="/terms" className="text-slate-400 underline decoration-slate-600 underline-offset-2 transition-colors hover:text-slate-200 hover:decoration-slate-400">Terms of Service</Link>
        </p>
      </footer>
    </div>
  );
}
