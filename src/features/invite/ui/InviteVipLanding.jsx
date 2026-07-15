import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

import { MarketingPageShell, SplashAuthModals } from '../../landing';
import { SEO_CONFIG } from '../../../shared/config/seo';
import Button from '../../../shared/ui/Button';

/**
 * Full-page VIP invite landing — distinct from splash modal overlay.
 */
export default function InviteVipLanding({
  inviteKind,
  resolveState,
  headline,
  subcopy,
  poolInvitePending,
  authModal,
  closeModal,
  openSignUpModal,
  openSignInModal,
}) {
  const { pathname, search } = useLocation();
  const pageTitle = `${headline} | Setlist Pick'Em`;
  const canonicalUrl = `${SEO_CONFIG.siteUrl}${pathname}${search}`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={subcopy} />
        <meta property="og:title" content={headline} />
        <meta property="og:description" content={subcopy} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SEO_CONFIG.siteName} />
        <meta property="og:image" content={SEO_CONFIG.ogImageUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={headline} />
        <meta name="twitter:description" content={subcopy} />
        <meta name="twitter:image" content={SEO_CONFIG.ogImageUrl} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>
      <MarketingPageShell>
        <section className="mx-auto flex min-h-[calc(100vh-5.35rem)] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
          {resolveState === 'loading' ? (
            <div
              className="mb-6 h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent"
              aria-hidden
            />
          ) : null}
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
            {inviteKind === 'pool' ? 'Pool invite' : "You're invited"}
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
            {headline}
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
            {subcopy}
          </p>
          <div className="mt-10 flex w-full max-w-md flex-col items-stretch gap-4">
            <Button
              variant="primary"
              type="button"
              onClick={openSignUpModal}
              className="w-full py-3.5 text-base uppercase tracking-widest"
            >
              Create account
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={openSignInModal}
              className="w-full py-3.5 text-base uppercase tracking-widest"
            >
              Sign in
            </Button>
          </div>
        </section>
      </MarketingPageShell>
      <SplashAuthModals
        authModal={authModal}
        closeModal={closeModal}
        onSwitchToSignIn={openSignInModal}
        onSwitchToSignUp={openSignUpModal}
        poolInvitePending={poolInvitePending}
      />
    </>
  );
}
