import React from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './app/App.jsx'
import Ga4RouteListener from './app/Ga4RouteListener.jsx'
import { initGa4 } from './shared/lib/ga4'
import { initializeAppCheckDeferred } from './shared/lib/firebaseAppCheck'
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
          <Ga4RouteListener />
          <App />
        </HelmetProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)

initializeAppCheckDeferred()
