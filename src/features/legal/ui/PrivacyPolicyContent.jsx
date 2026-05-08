import React from 'react';

import LegalPageLayout from './LegalPageLayout';

export default function PrivacyPolicyContent() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="May 8, 2026">
      <p>
        Setlist Pick &apos;Em (&quot;the App&quot;) is operated by Road2 Media, LLC
        (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). This policy explains what
        information we collect, why we collect it, and how you can manage it.
      </p>

      <h2>Information we collect</h2>

      <h3>Account information</h3>
      <p>
        When you create an account we store the email address you sign up with (or that
        your Google account provides) and a display handle you choose. If you sign in with
        Google, we receive your name, email, and profile photo URL from Google&apos;s OAuth
        service. We do not receive or store your Google password.
      </p>

      <h3>Gameplay data</h3>
      <p>
        We store the pick selections you make for each show, your pool memberships, and
        the scores calculated from official setlists. This data powers leaderboards,
        standings, and your public profile.
      </p>

      <h3>Device and usage data</h3>
      <ul>
        <li>
          <strong>Analytics:</strong> We use Google Analytics 4 to understand how people
          use the App (page views, feature engagement, general demographics). GA4 may set
          cookies on your browser. You can opt out via your browser settings or a GA
          opt-out extension.
        </li>
        <li>
          <strong>Push notification tokens:</strong> If you enable push notifications, we
          store a device token (provided by Firebase Cloud Messaging) so we can deliver
          alerts you requested — lock reminders, score results, and near-miss nudges. We
          also store a rough device label (e.g. &quot;iPhone&quot; vs &quot;desktop&quot;)
          to keep delivery reliable. Tokens are deleted when you disable push or sign out.
        </li>
        <li>
          <strong>Local storage:</strong> The App uses browser localStorage and
          sessionStorage for session preferences, install prompts, pool invite codes, and
          notification cadence settings. This data stays on your device and is not
          transmitted to us.
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>Authenticate your identity and manage your account.</li>
        <li>Run the game: record picks, calculate scores, populate leaderboards.</li>
        <li>Send push notifications you opted into (lock reminders, results, near-miss alerts).</li>
        <li>Improve the App through aggregated, non-identifying usage analytics.</li>
        <li>Communicate with you about your account if necessary (e.g. password resets).</li>
      </ul>

      <h2>Third-party services</h2>
      <p>We rely on the following third-party services that may receive or process your data:</p>
      <ul>
        <li>
          <strong>Firebase (Google Cloud)</strong> — authentication, database, cloud
          messaging, and hosting infrastructure.
        </li>
        <li>
          <strong>Google Analytics 4</strong> — aggregated usage analytics (page views,
          events). Subject to{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google&apos;s Privacy Policy
          </a>
          .
        </li>
        <li>
          <strong>Vercel</strong> — web application hosting and edge delivery.
        </li>
        <li>
          <strong>Phish.net API</strong> — official setlist data. No personally
          identifiable information is sent to Phish.net.
        </li>
      </ul>

      <h2>Data retention and deletion</h2>
      <p>
        We retain your account and gameplay data for as long as your account is active. You
        can delete your account from your Profile page within the App, which removes your
        authentication record and associated data. If you need a full data export or have
        questions about your data, contact us at the email below.
      </p>

      <h2>Children&apos;s privacy</h2>
      <p>
        The App is not directed at children under 13. We do not knowingly collect personal
        information from children under 13. If you believe a child under 13 has provided us
        with personal information, please contact us and we will delete it.
      </p>

      <h2>Cookies</h2>
      <p>
        The App uses cookies set by Firebase for authentication sessions and by Google
        Analytics for usage measurement. No third-party advertising cookies are used.
      </p>

      <h2>Your rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data by
        contacting us. If you are located in the European Economic Area or a jurisdiction
        with similar data protection laws, you may have additional rights under applicable
        law.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. When we make material changes we will
        update the &quot;Last updated&quot; date at the top of this page. Continued use of
        the App after a change constitutes acceptance of the updated policy.
      </p>

      <h2>Contact</h2>
      <p>
        Questions or requests about your privacy? Email us at{' '}
        <a href="mailto:support@setlistpickem.com">support@setlistpickem.com</a>.
      </p>
    </LegalPageLayout>
  );
}
