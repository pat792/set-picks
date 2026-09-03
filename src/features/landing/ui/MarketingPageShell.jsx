import React from 'react';
import { ChevronLeft } from 'lucide-react';

import {
  BRAND_SPLASH_HEADER_VINYL_MARK_SRC,
  brandSplashHeaderVinylMarkImgClassNames,
} from '../../../shared/config/branding';
import {
  MARKETING_HEADER_HEIGHT,
  MARKETING_PAGE_GUTTER_X,
} from '../../../shared/ui/marketingEditorialChrome';
import {
  MarketingFooterNav,
  MarketingHeaderNav,
  MarketingMobileMenu,
} from './MarketingSiteNav';

/**
 * Shell for standalone marketing / educational pages.
 * Sticky header: home + primary marketing nav (#663 / #706); footer is legal chrome (#948).
 *
 * Home uses a real `<a href="/">` (not React Router `<Link>`) so returning from
 * app-document surfaces (`/login`, invite VIP) always reloads the marketing
 * entry (`index.html`) instead of soft-navigating to app-shell splash.
 * Public `/tour-stats*` is marketing (#853) — soft Links are fine there.
 */
export default function MarketingPageShell({ children }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-transparent text-white">
      <header className={`sticky top-0 z-50 flex items-center border-b border-white/5 bg-brand-bg/80 backdrop-blur-lg ${MARKETING_HEADER_HEIGHT}`}>
        <div className={`relative mx-auto flex w-full max-w-5xl items-center justify-between gap-3 sm:gap-4 ${MARKETING_PAGE_GUTTER_X}`}>
          <a
            href="/"
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
          </a>

          {/* Desktop: nav near center (slight right bias); Home stays right. */}
          <MarketingHeaderNav className="pointer-events-auto absolute left-[52%] top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex" />

          {/* Mobile: logo already goes home — hamburger alone on the far right (#706). */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <a
              href="/"
              className="hidden items-center gap-1 rounded-sm text-sm font-semibold text-slate-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent-blue sm:inline-flex"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              <span>Home</span>
            </a>
            <MarketingMobileMenu />
          </div>
        </div>
      </header>
      <main className="w-full flex-1">{children}</main>

      <div className={`relative z-10 pb-4 pt-10 ${MARKETING_PAGE_GUTTER_X}`}>
        <MarketingFooterNav variant="primary" />
      </div>

      <footer className={`relative z-10 border-t border-slate-800/60 bg-transparent py-6 text-center text-xs font-medium leading-relaxed text-slate-500 ${MARKETING_PAGE_GUTTER_X}`}>
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
        <MarketingFooterNav variant="legal" className="mt-3" />
      </footer>
    </div>
  );
}
