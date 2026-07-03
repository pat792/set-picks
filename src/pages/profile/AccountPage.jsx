import React from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';

import { useSignOut } from '../../features/auth';
import { AccountSecurity, DeleteAccountSection } from '../../features/account';
import { dashboardPageTitleGradientClasses } from '../../shared/config/dashboardHeadingTypography';
import Button from '../../shared/ui/Button';

/**
 * Profile cluster — account surface (sign-in method, logout, delete, legal).
 */
export default function AccountPage({ user: userProp }) {
  const outlet = useOutletContext();
  const user = userProp ?? outlet?.user;
  const navigate = useNavigate();
  const signOut = useSignOut();

  const providerIds =
    user?.providerData?.map((p) => p.providerId).filter(Boolean) ?? [];
  const providerLabel = providerIds.includes('password')
    ? 'Email & password'
    : providerIds.includes('google.com')
      ? 'Google'
      : providerIds[0] || 'Unknown';

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out: ', error);
    }
  };

  return (
    <div>
      <div className="mb-6 text-left">
        <h2
          className={`hidden md:block font-display text-display-page md:text-display-page-lg font-bold ${dashboardPageTitleGradientClasses}`}
        >
          Account
        </h2>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-content-secondary">
          Sign-in · {providerLabel}
        </p>
      </div>

      <div className="mb-8">
        <AccountSecurity user={user} showHeading={false} />
      </div>

      <div className="border-t border-border-muted pt-6">
        <Button
          variant="text"
          onClick={handleLogout}
          type="button"
          className="w-full bg-transparent hover:bg-red-500/10 border-2 border-red-500/30 hover:border-red-500 text-red-400 text-sm py-4 rounded-xl uppercase tracking-widest"
        >
          Log Out
        </Button>
      </div>

      <DeleteAccountSection />

      {user?.uid ? (
        <footer className="mt-10 border-t border-border-muted/40 pb-2 pt-6 text-center text-[11px] font-medium text-content-secondary/70">
          <span className="space-x-2">
            <Link
              to="/privacy"
              className="underline decoration-border-muted underline-offset-2 transition-colors hover:text-white"
            >
              Privacy
            </Link>
            <span aria-hidden>&middot;</span>
            <Link
              to="/terms"
              className="underline decoration-border-muted underline-offset-2 transition-colors hover:text-white"
            >
              Terms
            </Link>
          </span>
        </footer>
      ) : null}
    </div>
  );
}
