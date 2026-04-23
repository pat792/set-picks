import React from 'react';

import Button from '../../../shared/ui/Button';
import Input from '../../../shared/ui/Input';
import { StatusBanner } from '../../../shared';
import SplashAuthModalShell from './SplashAuthModalShell';
import { useSplashSignUp } from '../model/useSplashSignUp';

export default function SplashSignUpModal({ isOpen, onClose }) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    busy,
    error,
    closeModal,
    handleGoogle,
    handleEmailSignUp,
  } = useSplashSignUp(isOpen, onClose);

  return (
    <SplashAuthModalShell
      isOpen={isOpen}
      onClose={closeModal}
      title="Create account"
      handleGoogle={handleGoogle}
      busy={busy}
      googleFootnote="You'll set your handle on the next page. Your personal info will never be shared with users."
    >
        <form onSubmit={handleEmailSignUp} className="space-y-4 text-left">
          <div>
            <label htmlFor="su-email" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Email
            </label>
            <Input
              id="su-email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 font-medium text-white"
            />
          </div>
          <div>
            <label htmlFor="su-pass" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Password
            </label>
            <Input
              id="su-pass"
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 font-medium text-white"
            />
          </div>
          <div>
            <label htmlFor="su-confirm" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Confirm password
            </label>
            <Input
              id="su-confirm"
              type="password"
              name="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 font-medium text-white"
            />
          </div>
          {error ? <StatusBanner type="error" message={error} /> : null}
          <Button
            variant="secondary"
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-xl uppercase tracking-widest"
          >
            {busy ? 'Creating…' : 'Create account'}
          </Button>
        </form>
    </SplashAuthModalShell>
  );
}
