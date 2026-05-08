import React from 'react';

import LegalPageLayout from './LegalPageLayout';

export default function TermsOfServiceContent() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="May 8, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of Setlist Pick &apos;Em
        (&quot;the App&quot;), operated by Road2 Media, LLC (&quot;we,&quot; &quot;us,&quot;
        or &quot;our&quot;). By creating an account or using the App you agree to these
        Terms.
      </p>

      <h2>What Setlist Pick &apos;Em is</h2>
      <p>
        Setlist Pick &apos;Em is a free, non-commercial fan project. Players predict
        setlists for live Phish concerts for entertainment purposes only. There are no
        entry fees, no cash prizes, and no wagering of any kind. The only reward is
        bragging rights.
      </p>

      <h2>Accounts</h2>
      <p>
        You must create an account to play. You are responsible for keeping your sign-in
        credentials secure. Each person may maintain one account. If you believe your
        account has been compromised, contact us immediately.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use automated scripts, bots, or tools to submit picks or interact with the App.</li>
        <li>Attempt to manipulate scores, leaderboards, or game outcomes.</li>
        <li>Impersonate another user or misrepresent your identity.</li>
        <li>Interfere with the operation of the App or its infrastructure.</li>
        <li>Use the App for any unlawful purpose.</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        The App&apos;s code, design, and branding are owned by Road2 Media, LLC.
        &quot;Phish&quot; and related marks are trademarks of Mockingbird Foundation and/or
        Phish, Inc. We are not affiliated with, endorsed by, or sponsored by Phish,
        Mockingbird Foundation, LivePhish, or any related entity. Song and setlist data is
        provided by{' '}
        <a
          href="https://phish.net"
          target="_blank"
          rel="noopener noreferrer"
        >
          The Mockingbird Foundation / Phish.Net
        </a>
        .
      </p>
      <p>
        You retain ownership of any content you create within the App (such as your pick
        selections). By using the App you grant us a non-exclusive license to display your
        picks, scores, and public profile information within the App and on leaderboards.
      </p>

      <h2>Disclaimer</h2>
      <p>
        The App is provided &quot;as is&quot; and &quot;as available&quot; without
        warranties of any kind, whether express or implied. We do not guarantee that the
        App will be uninterrupted, error-free, or available at all times. Setlist data is
        sourced from third parties and may contain errors or delays.
      </p>
      <p>
        This is an entertainment product. It is not a gambling service, and no real-world
        value is exchanged through gameplay.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Road2 Media, LLC and its officers,
        employees, and affiliates shall not be liable for any indirect, incidental, special,
        consequential, or punitive damages arising out of or related to your use of the
        App, regardless of the theory of liability.
      </p>

      <h2>Termination</h2>
      <p>
        We may suspend or terminate your account at any time if you violate these Terms or
        for any other reason at our discretion. You may delete your account at any time
        from your Profile page. Upon termination, your right to use the App ceases
        immediately.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of Colorado, United States,
        without regard to conflict-of-law principles. Any disputes arising under these
        Terms shall be resolved in the courts located in Colorado.
      </p>

      <h2>Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. When we make material changes we will
        update the &quot;Last updated&quot; date at the top of this page and, where
        practicable, provide at least 30 days&apos; notice before the changes take effect.
        Continued use of the App after the effective date constitutes acceptance of the
        updated Terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms? Email us at{' '}
        <a href="mailto:support@setlistpickem.com">support@setlistpickem.com</a>.
      </p>
    </LegalPageLayout>
  );
}
