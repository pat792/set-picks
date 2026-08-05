import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import LoginApp from './app/LoginApp.jsx'
import { AuthProvider } from './features/auth/provider'
import {
  shouldDeferFirebaseBoot,
} from './shared/lib/ensureFirebase'
import { hasPersistedSessionHint } from './shared/lib/persistedSessionHint'
import { peekGoogleRedirectIntent } from './features/auth/utils/googleRedirectIntent'
import { registerRouteChunkLoaders } from './shared/lib/routeChunkPrefetch'
import './index.css'

/**
 * Thin login Vite entry (#881 / T2.5 Phase B).
 * Mounts `/login` + AuthProvider only — not the dashboard SPA graph (`main.jsx`).
 * Post-auth and off-login links hard-navigate to app/marketing documents.
 */

const bootPath =
  typeof window !== 'undefined' ? window.location.pathname : ''
const deferFirebaseBoot = shouldDeferFirebaseBoot(bootPath, {
  hasSession: hasPersistedSessionHint(),
  hasRedirectIntent: Boolean(peekGoogleRedirectIntent()),
})

// Session / redirect return: kick App Check (dynamic — keep app-check off entry
// modulepreload). Anon form still defers Firebase execute.
if (!deferFirebaseBoot) {
  void import('./shared/lib/firebaseAppCheck').then((m) => {
    if (hasPersistedSessionHint()) m.ensureAppCheckNow()
    else m.initializeAppCheckDeferred()
  })
}

// Post-auth snappiness: warmLoginAuthSurface prefetches by key (#805). Register
// loaders here so dashboard/setup bytes can land in HTTP cache without mounting
// those routes on this document.
registerRouteChunkLoaders({
  setup: () => import('./app/routes/SetupRoute'),
  dashboard: () => import('./app/routes/DashboardRoute'),
})

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <LoginApp />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

// Analytics after first paint — keep GA/web-vitals off the login critical graph.
const scheduleIdle =
  typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function'
    ? (fn) => window.requestIdleCallback(fn, { timeout: 2500 })
    : (fn) => setTimeout(fn, 1)
scheduleIdle(() => {
  void Promise.all([
    import('./shared/lib/ga4'),
    import('./shared/lib/webVitals'),
  ]).then(([{ initGa4 }, { initWebVitals }]) => {
    initGa4()
    initWebVitals()
  })
})
