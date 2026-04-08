import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import {
  PasswordResetForm,
  usePasswordReset,
  usePasswordResetCompleteState,
} from '../../features/auth';

/**
 * Landing page after Firebase password reset (continueUrl).
 * Public route — user may not be signed in yet.
 */
export default function PasswordResetComplete() {
  const [searchParams] = useSearchParams();
  const { oobCode, shouldShowSuccess } = usePasswordResetCompleteState(searchParams);

  const {
    resetEmail,
    isVerifyingCode,
    newPassword,
    setNewPassword,
    isSubmitting,
    error,
    isReady,
    handleSubmit,
  } = usePasswordReset(oobCode);

  if (shouldShowSuccess) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-brand-bg p-6 text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-brand-primary/15 blur-[100px]" />
        <div className="relative z-10 max-w-md w-full text-center space-y-6">
          <h1 className="font-display text-display-xl md:text-display-xl-lg font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Password updated
          </h1>
          <p className="text-slate-300 font-medium leading-relaxed">
            You&apos;re all set. Head back to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500">
              Setlist Pick &apos;Em
            </span>{' '}
            and sign in with your email and new password.
          </p>
          <Link
            to="/?login=true"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-primary px-8 py-4 font-black text-brand-bg-deep shadow-glow-brand transition-opacity hover:bg-brand-primary-strong hover:opacity-95 sm:w-auto"
          >
            Go to sign in
          </Link>
          <p className="text-xs text-slate-500 font-semibold">
            Opens the home page — use <span className="text-slate-400">Sign in</span> and your email / password.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-brand-bg p-6 text-white">
      <div className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-brand-primary/15 blur-[100px]" />
      <div className="relative z-10 max-w-md w-full text-center space-y-6">
        <h1 className="font-display text-display-xl md:text-display-xl-lg font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Reset your password
        </h1>

        <p className="text-slate-300 font-medium leading-relaxed">
          Enter a new password for your account, then sign in.
        </p>

        <PasswordResetForm
          resetEmail={resetEmail}
          onPasswordChange={setNewPassword}
          newPassword={newPassword}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error}
          isVerifyingCode={isVerifyingCode}
          isReady={isReady}
        />

        <p className="text-xs text-slate-500 font-semibold">
          If this link expired, request a new reset email from the sign in screen.
        </p>
      </div>
    </div>
  );
}
