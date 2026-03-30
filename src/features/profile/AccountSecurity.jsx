import React from 'react';
import { Link } from 'react-router-dom';
import { useAccountSecurity } from '../auth/useAccountSecurity';
import Button from '../../shared/ui/Button';

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

      <div className="space-y-6 rounded-3xl border border-slate-700/50 bg-slate-800/50 p-6">
        <form onSubmit={handleAccountSecuritySubmit} className="space-y-4">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Current password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors w-full"
              placeholder="Required to confirm it’s you"
            />
          </div>

          <div className="border-t border-slate-700/50 pt-4 space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              New sign-in email <span className="normal-case font-medium">(optional)</span>
            </p>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">
                New email
              </label>
              <input
                type="email"
                autoComplete="off"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={`Leave blank to keep ${user.email}`}
                className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">
                Confirm new email
              </label>
              <input
                type="email"
                autoComplete="off"
                value={confirmNewEmail}
                onChange={(e) => setConfirmNewEmail(e.target.value)}
                className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors w-full"
              />
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-4 space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              New password <span className="normal-case font-medium">(optional)</span>
            </p>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">
                New password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors w-full"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">
                Confirm new password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="bg-slate-900 border-2 border-slate-700 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 transition-colors w-full"
              />
            </div>
          </div>

          {accountMessage.text && (
            <p
              className={`text-center text-sm font-bold ${
                accountMessage.type === 'error' ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {accountMessage.text}
            </p>
          )}

          <Button
            variant="primary"
            type="submit"
            disabled={accountBusy}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 py-3.5 text-sm uppercase tracking-widest text-slate-900"
          >
            {accountBusy ? 'Saving…' : 'Save sign-in changes'}
          </Button>
        </form>

        <div className="border-t border-slate-700/50 pt-6 space-y-3">
          <p className="text-sm text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Forgot your current password?</strong> We&apos;ll email
            a reset link to <span className="font-bold text-slate-300">{user.email}</span> — no
            current password needed.
          </p>
          <Button
            variant="text"
            type="button"
            onClick={handlePasswordResetEmail}
            disabled={passwordResetSending}
            className="w-full rounded-xl border-2 border-slate-600 bg-slate-900/80 py-3.5 text-sm uppercase tracking-widest text-white hover:border-amber-500/50 hover:bg-slate-800"
          >
            {passwordResetSending ? 'Sending…' : 'Send password reset email'}
          </Button>
          {passwordResetNotice.text && (
            <p
              className={`text-center text-sm font-bold ${
                passwordResetNotice.type === 'error' ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {passwordResetNotice.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
