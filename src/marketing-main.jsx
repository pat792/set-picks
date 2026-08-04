import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';

import MarketingApp from './app/MarketingApp.jsx';
import ScrollToTop from './app/ScrollToTop.jsx';
import { redirectIfPersistedSessionHint } from './shared/lib/sessionHintRedirect';
import './index.css';

// Returning users: bounce before React work when the inline script missed.
if (redirectIfPersistedSessionHint()) {
  // Document navigation in progress — skip mounting marketing React.
} else {
  // Idle-dynamic-import GA4/web-vitals so they leave the marketing static graph (#832).
  const startAnalytics = () => {
    void import('./shared/lib/ga4').then(({ initGa4 }) => {
      initGa4();
      void import('./shared/lib/webVitals').then(({ initWebVitals }) => {
        initWebVitals();
      });
    });
  };
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(startAnalytics, { timeout: 4000 });
  } else {
    window.setTimeout(startAnalytics, 2000);
  }

  const root = createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <HelmetProvider>
          <ScrollToTop />
          <MarketingApp />
        </HelmetProvider>
      </BrowserRouter>
    </React.StrictMode>,
  );
}
