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
      <div className="max-w-xl mx-auto mt-4 pb-12">
        <Link
          to="/dashboard/profile"
          className="inline-block text-sm font-bold text-emerald-400 hover:underline mb-6"
        >
          ← Back to profile
        </Link>
        <div className="rounded-3xl border border-slate-700/50 bg-slate-800/50 p-8 text-center">
          <p className="text-slate-400 font-bold">
            Sign-in email and password are only for accounts that use email &amp; password. Yours is
            Google-only — manage your Google account with Google.
          </p>
          <Link
            to="/dashboard/profile"
            className="mt-6 inline-flex rounded-xl bg-emerald-500 px-6 py-3 font-black text-slate-900"
          >
            Back to profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-4 pb-12">
      <Link
        to="/dashboard/profile"
        className="inline-block text-sm font-bold text-emerald-400 hover:underline mb-4"
      >
        ← Back to profile
      </Link>

      <div className="mb-6 text-left">
        <h2 className="hidden md:block font-display text-display-page md:text-display-page-lg font-bold text-white">
          Change sign-in email &amp; password
        </h2>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          Your <strong className="text-slate-300">user ID</strong> for login is your email (
          <span className="font-bold text-emerald-400/90">{user.email}</span>). Enter your{' '}
          <strong className="text-slate-300">current password</strong> to set a new email and/or a new
          password.
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
