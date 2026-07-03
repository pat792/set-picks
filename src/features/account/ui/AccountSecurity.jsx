import React from 'react';

import { dashboardPageTitleGradientClasses } from '../../../shared/config/dashboardHeadingTypography';
import { useAccountSecurity } from '../model/useAccountSecurity';
import AccountSecurityForm from './AccountSecurityForm';

/**
 * Email/password credential management for accounts that use the password provider.
 * Google-only accounts see a short explanation (no form).
 *
 * @param {{ user: import('firebase/auth').User | null | undefined, showHeading?: boolean }} props
 */
export default function AccountSecurity({ user, showHeading = true }) {
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
      <div className="rounded-3xl border border-border-subtle bg-surface-panel p-6 shadow-inset-glass">
        <h3 className="text-sm font-black uppercase tracking-widest text-content-secondary">
          Sign-in method
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-content-secondary">
          You signed in with Google — manage email and password in your Google account settings.
        </p>
      </div>
    );
  }

  return (
    <div>
      {showHeading ? (
        <div className="mb-6 text-left">
          <h2
            className={`hidden md:block font-display text-display-page md:text-display-page-lg font-bold ${dashboardPageTitleGradientClasses}`}
          >
            Sign-in &amp; password
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            You sign in as{' '}
            <span className="font-bold text-brand-primary">{user.email}</span>. Enter your{' '}
            <strong className="text-slate-300">current password</strong> below to change your email
            and/or password.
          </p>
        </div>
      ) : (
        <p className="mb-4 text-sm leading-relaxed text-content-secondary">
          You sign in as{' '}
          <span className="font-bold text-brand-primary">{user.email}</span>. Enter your current
          password to change email and/or password.
        </p>
      )}

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
