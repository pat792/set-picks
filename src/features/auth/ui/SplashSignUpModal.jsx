import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../../../shared/ui/Button';
import Input from '../../../shared/ui/Input';
import { StatusBanner } from '../../../shared';
import { AUTH_EMAIL_CTA } from './authCtaClasses';
import PasswordRevealToggle, {
  shouldShowPasswordReveal,
} from './PasswordRevealToggle';
import SplashAuthModalShell from './SplashAuthModalShell';
import { useSplashSignUp } from '../model/useSplashSignUp';
import { stashSplashResumeAuthModal } from '../utils/splashAuthResumeStorage';

export default function SplashSignUpModal({
  isOpen,
  onClose,
  onSwitchToSignIn,
  poolInvitePending = false,
  seedError = '',
}) {
  const [showPassword, setShowPassword] = useState(false);
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
    preferGoogleRedirect,
  } = useSplashSignUp(isOpen, onClose, { seedError });

  const revealVisible = shouldShowPasswordReveal(
    email,
    password,
    confirmPassword,
  );

  const consentBlock = (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border-subtle/60 bg-surface-inset/60 p-3.5 text-left text-sm font-semibold leading-snug text-slate-200">
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

  const prependContent = (
    <div className="space-y-4">
      {poolInvitePending ? (
        <StatusBanner
          type="info"
          message="You're joining a pool — create an account to continue."
          className="text-left"
        />
      ) : null}
      {consentBlock}
    </div>
  );

  return (
    <SplashAuthModalShell
      isOpen={isOpen}
      onClose={closeModal}
      title="Create account"
      handleGoogle={handleGoogle}
      busy={busy}
      googleDisabled={busy || !legalAccepted}
      prependContent={prependContent}
      googleFootnote={
        preferGoogleRedirect
          ? "Continues with a full-page Google sign-in. You'll set your username/handle next. Your email is never shared with other users."
          : "You'll set your username/handle on the next page. Your email address is never shared or visible to other users."
      }
      closeOnBackdropClick={false}
    >
      <form onSubmit={handleEmailSignUp} className="space-y-4 text-left">
        <div>
          <label
            htmlFor="su-email"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
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
          <label
            htmlFor="su-pass"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Password
          </label>
          <div className="relative mt-1">
            <Input
              id="su-pass"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={`w-full font-medium text-white ${revealVisible ? 'pr-10' : ''}`}
            />
            <PasswordRevealToggle
              visible={revealVisible}
              showPassword={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="su-confirm"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Confirm password
          </label>
          <div className="relative mt-1">
            <Input
              id="su-confirm"
              type={showPassword ? 'text' : 'password'}
              name="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={`w-full font-medium text-white ${revealVisible ? 'pr-10' : ''}`}
            />
            <PasswordRevealToggle
              visible={revealVisible}
              showPassword={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />
          </div>
        </div>
        {error ? <StatusBanner type="error" message={error} /> : null}
        <button
          type="submit"
          disabled={busy || !legalAccepted}
          className={AUTH_EMAIL_CTA}
        >
          {busy ? 'Creating…' : 'Continue with email'}
        </button>
      </form>
      {typeof onSwitchToSignIn === 'function' ? (
        <p className="mt-6 text-center text-sm font-semibold text-slate-400">
          Already have an account?{' '}
          <Button
            variant="link"
            size="none"
            type="button"
            onClick={onSwitchToSignIn}
            disabled={busy}
            className="inline px-0 py-0 text-sm text-teal-300 decoration-teal-500/60 hover:text-white"
          >
            Sign in
          </Button>
        </p>
      ) : null}
    </SplashAuthModalShell>
  );
}
