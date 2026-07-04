import React from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './app/App.jsx'
import Ga4RouteListener from './app/Ga4RouteListener.jsx'
import ScrollToTop from './app/ScrollToTop.jsx'
import { AuthProvider } from './features/auth'
import { initGa4 } from './shared/lib/ga4'
import { initializeAppCheckDeferred } from './shared/lib/firebaseAppCheck'
import { registerMessagingServiceWorker } from './shared/lib/firebaseMessaging'
import './index.css'

initGa4()

// Shared client for the React Query caches added in #243 (profile season
// stats + tour standings). Defaults are tuned for read-heavy stats hooks
// where back-navigation should reuse data within the session.
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
          <ScrollToTop />
          <Ga4RouteListener />
          <AuthProvider>
            <App />
          </AuthProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)

initializeAppCheckDeferred()

function deferMessagingServiceWorkerRegistration() {
  const register = () => {
    registerMessagingServiceWorker().catch(() => {
      // Non-critical on first paint — push can register later from Notifications.
    })
  }
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(register, { timeout: 4000 })
  } else {
    setTimeout(register, 1500)
  }
}

deferMessagingServiceWorkerRegistration()
