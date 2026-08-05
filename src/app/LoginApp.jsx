import React, { Suspense, lazy, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'

import AppBackground from '../shared/ui/AppBackground'
import RouteSuspenseFallback from '../shared/ui/RouteSuspenseFallback'

const LoginPage = lazy(() => import('../pages/auth/LoginPage'))

/**
 * Soft-nav safety net for the thin login document (#881).
 * Terms/Privacy/marketing Links change the URL inside this entry; reload so
 * hosting can serve the correct shell (spa-boot / marketing / dashboard).
 */
function LeaveLoginDocument() {
  useEffect(() => {
    window.location.reload()
  }, [])
  return <RouteSuspenseFallback />
}

/**
 * Login-only router surface — no dashboard / marketing / invite routes.
 */
export default function LoginApp() {
  return (
    <>
      <AppBackground />
      <div className="relative z-[1] min-h-screen">
        <Suspense fallback={<RouteSuspenseFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<LeaveLoginDocument />} />
          </Routes>
        </Suspense>
      </div>
    </>
  )
}
