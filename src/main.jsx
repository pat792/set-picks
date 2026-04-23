import React from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import App from './app/App.jsx'
import Ga4RouteListener from './app/Ga4RouteListener.jsx'
import { initGa4 } from './shared/lib/ga4'
import { initializeAppCheckDeferred } from './shared/lib/firebaseAppCheck'
import './index.css'

initGa4()

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <HelmetProvider>
        <Ga4RouteListener />
        <App />
      </HelmetProvider>
    </BrowserRouter>
  </React.StrictMode>
)

initializeAppCheckDeferred()