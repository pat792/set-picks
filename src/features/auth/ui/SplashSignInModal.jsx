import React, { useState } from 'react';

import Button from '../../../shared/ui/Button';
import Input from '../../../shared/ui/Input';
import { StatusBanner } from '../../../shared';
import SplashAuthModalShell from './SplashAuthModalShell';
import { useSplashSignIn } from '../model/useSplashSignIn';

export default function SplashSignInModal({ isOpen, onClose }) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    email,
    setEmail,
    password,
    setPassword,
    busy,
    error,
    resetLinkNotice,
    closeModal,
    handleGoogle,
    handleEmailSignIn,
    handleSendPasswordResetEmail,
  } = useSplashSignIn(isOpen, onClose);

  return (
    <SplashAuthModalShell
      isOpen={isOpen}
      onClose={closeModal}
      title="Sign in"
      handleGoogle={handleGoogle}
      busy={busy}
    >
        <form onSubmit={handleEmailSignIn} className="space-y-4 text-left">
          <div>
            <label htmlFor="si-email" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Email
            </label>
            <Input
              id="si-email"
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 font-medium text-white"
            />
          </div>
          <div>
            <label htmlFor="si-pass" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <div className="relative mt-1">
              <Input
                id="si-pass"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pr-12 font-medium text-white"
              />
              <Button
                variant="text"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-white/10 px-1.5 py-1 text-slate-300 hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3 3L21 21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10.58 10.58C10.21 10.95 10 11.45 10 12C10 13.1 10.9 14 12 14C12.55 14 13.05 13.79 13.42 13.42"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.88 5.08C10.57 4.77 11.29 4.51 12 4.33C16.09 5.38 19.33 8.5 21 12C20.4 13.3 19.55 14.47 18.5 15.45"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6.14 6.14C4.3 7.48 2.93 9.35 2 12C3.67 15.5 6.91 18.62 11 19.67C11.73 19.49 12.47 19.22 13.16 18.91"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M2 12C4 7 8 4 12 4C16 4 20 7 22 12C20 17 16 20 12 20C8 20 4 17 2 12Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="link"
              type="button"
              onClick={handleSendPasswordResetEmail}
              disabled={busy}
              className="w-fit px-0 py-0 text-left text-sm text-amber-400/90 hover:text-amber-300 decoration-amber-400/90 hover:decoration-amber-300 disabled:opacity-50"
            >
              Forgot password? Send reset link to your email
            </Button>
            {resetLinkNotice.text ? (
              <StatusBanner
                type={resetLinkNotice.type === 'error' ? 'error' : 'success'}
                message={resetLinkNotice.text}
              />
            ) : null}
          </div>
          {error ? <StatusBanner type="error" message={error} /> : null}
          <Button
            variant="primary"
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-xl uppercase tracking-widest"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
    </SplashAuthModalShell>
  );
}
