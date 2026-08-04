import React from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'

import MarketingApp from './app/MarketingApp.jsx'
import { PERSISTED_SESSION_HINT_STORAGE_KEY } from './shared/lib/persistedSessionHint'
import { initGa4 } from './shared/lib/ga4'
import { initWebVitals } from './shared/lib/webVitals'
import './index.css'

/**
 * Marketing cold-open entry (#832) — loaded from `index.html`.
 * Real splash/marketing React UI — no AuthProvider / firebase on this graph.
 * Authenticated SPA boots from `app.html` → `main.jsx`.
 */

initGa4()
initWebVitals()

try {
  if (
    typeof window !== 'undefined' &&
    window.localStorage?.getItem(PERSISTED_SESSION_HINT_STORAGE_KEY) === '1'
  ) {
    window.location.replace('/dashboard')
  } else if (typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search)
    if (q.get('login') === 'true') {
      const signup = q.get('signup') === '1'
      window.location.replace(signup ? '/login?mode=signup' : '/login')
    }
  }
} catch {
  // Private mode / blocked storage — continue to marketing UI.
}

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <HelmetProvider>
        <MarketingApp />
      </HelmetProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
