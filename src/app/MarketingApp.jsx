import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import MarketingHomePage from '../pages/marketing/MarketingHomePage';
import HowItWorksPage from '../pages/marketing/HowItWorksPage';
import HowScoringWorksPage from '../pages/marketing/HowScoringWorksPage';
import PhishSetlistPredictionGamePage from '../pages/marketing/PhishSetlistPredictionGamePage';

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

/**
 * Marketing cold-open router (#832). Real product UI, no AuthProvider.
 */
export default function MarketingApp() {
  return (
    <Routes>
      <Route path="/" element={<MarketingHomePage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/how-scoring-works" element={<HowScoringWorksPage />} />
      <Route
        path="/phish-setlist-prediction-game"
        element={<PhishSetlistPredictionGamePage />}
      />
      {/* App-document surfaces — full load so Firebase/AuthProvider can boot. */}
      <Route path="*" element={<LoadAppDocument />} />
    </Routes>
  );
}
