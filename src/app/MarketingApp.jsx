import React, { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import MarketingHomePage from '../pages/marketing/MarketingHomePage';

// Sibling marketing routes stay off the `/` cold-open graph (#835).
// Home statically imports splash UI only; these load on navigation / deep link.
const HowItWorksPage = lazy(() => import('../pages/marketing/HowItWorksPage'));
const HowScoringWorksPage = lazy(
  () => import('../pages/marketing/HowScoringWorksPage'),
);
const PhishSetlistPredictionGamePage = lazy(
  () => import('../pages/marketing/PhishSetlistPredictionGamePage'),
);

/** Paths that still boot the authenticated SPA document (`app.html`) (#832). */
function isAppDocumentPath(pathname) {
  if (typeof pathname !== 'string' || !pathname) return false;
  const prefixes = [
    '/login',
    '/dashboard',
    '/setup',
    '/tour-stats',
    '/password-reset-complete',
    '/privacy',
    '/terms',
    '/join',
    '/comms-preview',
  ];
  if (prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  return pathname.startsWith('/user/') || pathname.startsWith('/invite/');
}

/**
 * Full navigation into the authenticated SPA document.
 * Used when a marketing-shell Link targets a Firebase-backed route.
 */
function LoadAppDocument() {
  useEffect(() => {
    const { pathname, search, hash } = window.location;
    if (!isAppDocumentPath(pathname)) return;
    window.location.replace(`${pathname}${search}${hash}`);
  }, []);

  if (typeof window !== 'undefined' && !isAppDocumentPath(window.location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-brand-bg text-sm font-medium text-slate-400"
      aria-busy="true"
    >
      Loading…
    </div>
  );
}

function MarketingRouteFallback() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center bg-brand-bg text-sm font-medium text-slate-400"
      aria-busy="true"
    >
      Loading…
    </div>
  );
}

/**
 * Marketing cold-open router (#832). Real product UI, no AuthProvider.
 * Only `/` is eager — other marketing pages are lazy so home cold open
 * does not download/score their chunks (#835 paint fix).
 */
export default function MarketingApp() {
  return (
    <Routes>
      <Route path="/" element={<MarketingHomePage />} />
      <Route
        path="/how-it-works"
        element={
          <Suspense fallback={<MarketingRouteFallback />}>
            <HowItWorksPage />
          </Suspense>
        }
      />
      <Route
        path="/how-scoring-works"
        element={
          <Suspense fallback={<MarketingRouteFallback />}>
            <HowScoringWorksPage />
          </Suspense>
        }
      />
      <Route
        path="/phish-setlist-prediction-game"
        element={
          <Suspense fallback={<MarketingRouteFallback />}>
            <PhishSetlistPredictionGamePage />
          </Suspense>
        }
      />
      {/* App-document surfaces — full load so Firebase/AuthProvider can boot. */}
      <Route path="*" element={<LoadAppDocument />} />
    </Routes>
  );
}
