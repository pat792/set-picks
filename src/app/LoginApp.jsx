import React, { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import { LoginFormShellFallback } from '../features/auth/login'
import AppBackground from '../shared/ui/AppBackground'

const LoginPage = lazy(() => import('../pages/auth/LoginPage'))

/**
 * Soft-nav safety net for the auth-door document (#892).
 * Terms/Privacy should hard-nav via `<a href>`; if a soft route still lands
 * here, assign so hosting can serve the correct shell (not a stuck Suspense).
 */
function LeaveLoginDocument() {
  const { pathname, search, hash } = useLocation()
  useEffect(() => {
    const target = `${pathname}${search}${hash}`
    // Avoid reload loops on `/login` itself.
    if (pathname === '/login' || pathname.startsWith('/login/')) return
    window.location.assign(target)
  }, [pathname, search, hash])
  return <LoginFormShellFallback />
}

/**
 * Login-only router surface — no dashboard / marketing / invite routes.
 * Suspense fallback keeps real form chrome visible (anti-#881 hang: never
 * replace HTML-first form with a blank spinner).
 */
export default function LoginApp() {
  return (
    <>
      <AppBackground />
      <div className="relative z-[1] min-h-screen">
        <Suspense fallback={<LoginFormShellFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<LeaveLoginDocument />} />
          </Routes>
        </Suspense>
      </div>
    </>
  )
}
