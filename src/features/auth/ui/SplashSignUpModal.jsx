import React from 'react';
import { Link } from 'react-router-dom';

import Button from '../../../shared/ui/Button';
import Input from '../../../shared/ui/Input';
import { StatusBanner } from '../../../shared';
import SplashAuthModalShell from './SplashAuthModalShell';
import { useSplashSignUp } from '../model/useSplashSignUp';
import { stashSplashResumeAuthModal } from '../utils/splashAuthResumeStorage';

export default function SplashSignUpModal({ isOpen, onClose }) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    legalAccepted,
    setLegalAccepted,
    busy,
    error,
    closeModal,
    handleGoogle,
    handleEmailSignUp,
  } = useSplashSignUp(isOpen, onClose);

  const consentBlock = (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border-subtle bg-surface-field/80 p-4 text-left text-sm font-semibold leading-snug text-slate-200">
      <input
        type="checkbox"
        checked={legalAccepted}
        onChange={(e) => setLegalAccepted(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-500 bg-surface-panel text-brand-primary focus-visible:ring-2 focus-visible:ring-brand"
        aria-describedby="signup-legal-hint"
      />
      <span id="signup-legal-hint">
        I agree to the{' '}
        <Link
          to="/terms"
          className="text-teal-300 underline decoration-teal-500/60 underline-offset-2 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            stashSplashResumeAuthModal('signup');
          }}
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          to="/privacy"
          className="text-teal-300 underline decoration-teal-500/60 underline-offset-2 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            stashSplashResumeAuthModal('signup');
          }}
        >
          Privacy Policy
        </Link>
        .
      </span>
    </label>
  );

  return (
    <SplashAuthModalShell
      isOpen={isOpen}
      onClose={closeModal}
      title="Create account"
      handleGoogle={handleGoogle}
      busy={busy}
      googleDisabled={busy || !legalAccepted}
      prependContent={consentBlock}
      googleFootnote="You'll set your username/handle on the next page. Your email address is never shared or visible to other users."
      closeOnBackdropClick={false}
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
            disabled={busy || !legalAccepted}
            className="w-full py-3.5 rounded-xl uppercase tracking-widest"
          >
            {busy ? 'Creating…' : 'Create account'}
          </Button>
        </form>
    </SplashAuthModalShell>
  );
}
