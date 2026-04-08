import React from 'react';
import { Link } from 'react-router-dom';

import { useAccountSecurity } from '../model/useAccountSecurity';
import AccountSecurityForm from './AccountSecurityForm';

export default function AccountSecurity({ user }) {
  const {
    hasEmailPasswordProvider,
    passwordResetSending,
    passwordResetNotice,
    currentPassword,
    setCurrentPassword,
    newEmail,
    setNewEmail,
    confirmNewEmail,
    setConfirmNewEmail,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    accountBusy,
    accountMessage,
    handlePasswordResetEmail,
    handleAccountSecuritySubmit,
  } = useAccountSecurity(user);

  if (!hasEmailPasswordProvider || !user?.email) {
    return (
      <div className="max-w-xl mx-auto pb-6 md:pb-12">
        <Link
          to="/dashboard/profile"
          className="mb-6 inline-block text-sm font-bold text-brand-primary hover:underline"
        >
          ← Back to Profile
        </Link>
        <div className="rounded-3xl border border-border-subtle bg-surface-panel p-8 text-center shadow-inset-glass">
          <p className="text-slate-400 font-bold">
            Email and password sign-in is only for accounts that use it. You signed in with Google —
            manage your account in your Google settings.
          </p>
          <Link
            to="/dashboard/profile"
            className="mt-6 inline-flex rounded-xl bg-brand-primary px-6 py-3 font-black text-brand-bg-deep shadow-glow-brand hover:bg-brand-primary-strong"
          >
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-6 md:pb-12">
      <Link
        to="/dashboard/profile"
        className="mb-4 inline-block text-sm font-bold text-brand-primary hover:underline"
      >
        ← Back to Profile
      </Link>

      <div className="mb-6 text-left">
        <h2 className="hidden md:block font-display text-display-page md:text-display-page-lg font-bold text-white">
          Sign-in &amp; password
        </h2>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          You sign in as{' '}
          <span className="font-bold text-brand-primary">{user.email}</span>. Enter your{' '}
          <strong className="text-slate-300">current password</strong> below to change your email
          and/or password.
        </p>
      </div>

      <AccountSecurityForm
        currentEmail={user.email}
        currentPassword={currentPassword}
        onCurrentPasswordChange={setCurrentPassword}
        newEmail={newEmail}
        onNewEmailChange={setNewEmail}
        confirmNewEmail={confirmNewEmail}
        onConfirmNewEmailChange={setConfirmNewEmail}
        newPassword={newPassword}
        onNewPasswordChange={setNewPassword}
        confirmNewPassword={confirmNewPassword}
        onConfirmNewPasswordChange={setConfirmNewPassword}
        accountBusy={accountBusy}
        accountMessage={accountMessage}
        onSubmit={handleAccountSecuritySubmit}
        passwordResetSending={passwordResetSending}
        passwordResetNotice={passwordResetNotice}
        onPasswordResetEmail={handlePasswordResetEmail}
      />
    </div>
  );
}
