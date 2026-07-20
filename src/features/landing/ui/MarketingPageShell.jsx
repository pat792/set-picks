import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import {
  BRAND_SPLASH_HEADER_VINYL_MARK_SRC,
  brandSplashHeaderVinylMarkImgClassNames,
} from '../../../shared/config/branding';
import { MarketingFooterNav, MarketingHeaderNav } from './MarketingSiteNav';

/**
 * Shell for standalone marketing / educational pages.
 * Sticky header: home + primary marketing nav (#663); footer shares the same links.
 */
export default function MarketingPageShell({ children }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-transparent text-white">
      <header className="sticky top-0 z-50 flex h-[5.35rem] items-center border-b border-white/5 bg-brand-bg/80 backdrop-blur-lg sm:h-[5.25rem]">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label="Setlist Pick 'Em — back to home"
            className="flex shrink-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue"
          >
            <img
              src={BRAND_SPLASH_HEADER_VINYL_MARK_SRC}
              alt="Setlist Pick 'Em"
              width={36}
              height={36}
              decoding="async"
              className={brandSplashHeaderVinylMarkImgClassNames}
            />
            <span className="hidden font-display text-base font-bold tracking-tight text-white sm:block">
              Setlist Pick&nbsp;&apos;Em
            </span>
          </Link>

          <MarketingHeaderNav className="hidden md:flex" />

          <Link
            to="/"
            className="inline-flex shrink-0 items-center gap-1 rounded-sm text-sm font-semibold text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>
      </header>
      <main className="w-full flex-1">{children}</main>
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
        <MarketingFooterNav />
      </footer>
    </div>
  );
}
