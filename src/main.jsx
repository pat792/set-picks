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
registerMessagingServiceWorker()
