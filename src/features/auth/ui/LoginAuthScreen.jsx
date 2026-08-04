import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import Button from '../../../shared/ui/Button';
import Input from '../../../shared/ui/Input';
import { StatusBanner } from '../../../shared';
import OpenInBrowserBanner from './OpenInBrowserBanner';
import SplashAuthPanel from './SplashAuthPanel';
import { useSplashSignIn } from '../model/useSplashSignIn';
import { useSplashSignUp } from '../model/useSplashSignUp';
import { stashSplashResumeAuthModal } from '../utils/splashAuthResumeStorage';

/**
 * Full-page `/login` auth UI (#834) — same hooks as splash modals, no dialog.
 */
export default function LoginAuthScreen({
  mode,
  onSwitchToSignIn,
  onSwitchToSignUp,
  onClose,
  poolInvitePending = false,
  seedError = '',
}) {
  const isSignup = mode === 'signup';

  // Chrome (sticky header + marketing nav + footer) comes from MarketingPageShell
  // composed in LoginPage — same top-level surface as /how-it-works, etc. (#834).
  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col items-center px-4 py-10 text-white sm:px-6 lg:px-8">
      <OpenInBrowserBanner />
      <p className="mb-6 text-center text-sm font-medium text-slate-400">
        {isSignup ? 'Create your free account' : 'Sign in to make picks'}
      </p>
      {isSignup ? (
        <LoginSignUpPanel
          onClose={onClose}
          onSwitchToSignIn={onSwitchToSignIn}
          poolInvitePending={poolInvitePending}
          seedError={seedError}
        />
      ) : (
        <LoginSignInPanel
          onClose={onClose}
          onSwitchToSignUp={onSwitchToSignUp}
          poolInvitePending={poolInvitePending}
          seedError={seedError}
        />
      )}
    </div>
  );
}

function LoginSignInPanel({
  onClose,
  onSwitchToSignUp,
  poolInvitePending,
  seedError,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    email,
    setEmail,
    password,
    setPassword,
    busy,
    error,
    resetLinkNotice,
    handleGoogle,
    handleEmailSignIn,
    handleSendPasswordResetEmail,
    inAppBrowser,
  } = useSplashSignIn(true, onClose, { seedError });

  const prependContent =
    poolInvitePending || error ? (
      <div className="space-y-3">
        {poolInvitePending ? (
          <StatusBanner
            type="info"
            message="You're joining a pool — sign in to continue."
            className="text-left"
          />
        ) : null}
        {error ? (
          <StatusBanner type="error" message={error} className="text-left" />
        ) : null}
      </div>
    ) : null;

  return (
    <SplashAuthPanel
      title="Sign in"
      handleGoogle={handleGoogle}
      busy={busy}
      prependContent={prependContent}
      googleFootnote={
        inAppBrowser
          ? 'Continues with a full-page Google sign-in (more reliable in this browser).'
          : undefined
      }
    >
      <form onSubmit={handleEmailSignIn} className="space-y-4 text-left">
        <div>
          <label
            htmlFor="si-email"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
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
          <label
            htmlFor="si-pass"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
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
              {showPassword ? 'Hide' : 'Show'}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="link"
            type="button"
            onClick={handleSendPasswordResetEmail}
            disabled={busy}
            className="w-fit px-0 py-0 text-left text-sm text-amber-400/90 decoration-amber-400/90 hover:text-amber-300 hover:decoration-amber-300 disabled:opacity-50"
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
        <Button
          variant="secondary"
          type="submit"
          disabled={busy}
          className="w-full rounded-xl py-3.5 uppercase tracking-widest"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      {typeof onSwitchToSignUp === 'function' ? (
        <p className="mt-6 text-center text-sm font-semibold text-slate-400">
          New here?{' '}
          <Button
            variant="link"
            type="button"
            onClick={onSwitchToSignUp}
            disabled={busy}
            className="inline px-0 py-0 text-sm text-teal-300 decoration-teal-500/60 hover:text-white"
          >
            Create account
          </Button>
        </p>
      ) : null}
    </SplashAuthPanel>
  );
}

function LoginSignUpPanel({
  onClose,
  onSwitchToSignIn,
  poolInvitePending,
  seedError,
}) {
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
    handleGoogle,
    handleEmailSignUp,
    inAppBrowser,
  } = useSplashSignUp(true, onClose, { seedError });

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
    <SplashAuthPanel
      title="Create account"
      handleGoogle={handleGoogle}
      busy={busy}
      googleDisabled={busy || !legalAccepted}
      prependContent={prependContent}
      googleFootnote={
        inAppBrowser
          ? "Continues with a full-page Google sign-in. You'll set your username/handle next. Your email is never shared with other users."
          : "You'll set your username/handle on the next page. Your email address is never shared or visible to other users."
      }
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
          <label
            htmlFor="su-confirm"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
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
          className="w-full rounded-xl py-3.5 uppercase tracking-widest"
        >
          {busy ? 'Creating…' : 'Create account'}
        </Button>
      </form>
      {typeof onSwitchToSignIn === 'function' ? (
        <p className="mt-6 text-center text-sm font-semibold text-slate-400">
          Already have an account?{' '}
          <Button
            variant="link"
            type="button"
            onClick={onSwitchToSignIn}
            disabled={busy}
            className="inline px-0 py-0 text-sm text-teal-300 decoration-teal-500/60 hover:text-white"
          >
            Sign in
          </Button>
        </p>
      ) : null}
    </SplashAuthPanel>
  );
}
