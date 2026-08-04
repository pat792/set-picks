import React from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './app/App.jsx'
import Ga4RouteListener from './app/Ga4RouteListener.jsx'
import ScrollToTop from './app/ScrollToTop.jsx'
import { AuthProvider } from './features/auth/provider'
import {
  shouldDeferMessagingServiceWorker,
  shouldPrefetchDashboardOnBoot,
  shouldWarmAppCheckOnBoot,
} from './shared/lib/appBootPath'
import { initGa4 } from './shared/lib/ga4'
import {
  ensureAppCheckNow,
  initializeAppCheckDeferred,
} from './shared/lib/firebaseAppCheck'
import { hasPersistedSessionHint } from './shared/lib/persistedSessionHint'
import { prefetchRouteChunk } from './shared/lib/routeChunkPrefetch'
import { initWebVitals } from './shared/lib/webVitals'
import './index.css'

initGa4()
initWebVitals()

// #773 / #803 / #827: dashboard, setup, and public /tour-stats* warm App Check
// on boot; splash/join/invite stay deferred for anonymous visitors (session +
// auth modal warm instead).
const bootPath =
  typeof window !== 'undefined' ? window.location.pathname : ''
if (shouldWarmAppCheckOnBoot(bootPath)) {
  ensureAppCheckNow()
}
// #804: returning sessions land on `/` only to bounce to the dashboard. Start
// that chunk in the same tick as the entry bundle instead of after auth
// resolves, so the redirect is not a serial download.
if (
  shouldPrefetchDashboardOnBoot(bootPath, { hasSession: hasPersistedSessionHint() })
) {
  prefetchRouteChunk('dashboard')
}

/**
 * FCM SW: dynamic-import the messaging module so it stays off the entry static
 * graph (no modulepreload of firebaseMessaging on splash). Immediate register
 * on dashboard/setup; idle-defer elsewhere. `getMessagingClient` still
 * registers on demand for push opt-in.
 */
function scheduleMessagingServiceWorker(pathname) {
  const start = () => {
    void import('./shared/lib/firebaseMessaging').then((m) => {
      void m.registerMessagingServiceWorker()
    })
  }
  if (shouldDeferMessagingServiceWorker(pathname)) {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(start, { timeout: 5000 })
    } else {
      window.setTimeout(start, 2500)
    }
    return
  }
  start()
}

// Shared client for React Query caches (#243 profile/tour standings, #507
// show-scoped standings). Defaults tuned for read-heavy dashboard hooks
// where tab revisits should reuse data within the session.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <AuthProvider>
            <ScrollToTop />
            <Ga4RouteListener />
            <App />
          </AuthProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)

initializeAppCheckDeferred()
scheduleMessagingServiceWorker(bootPath)
