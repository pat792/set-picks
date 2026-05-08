import React from 'react';

import LegalPageLayout from './LegalPageLayout';
import LegalMarkdownRenderer from './LegalMarkdownRenderer';
import privacyMd from '../../../../docs/PRIVACY_POLICY.md?raw';

export default function PrivacyPolicyContent() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="May 8, 2026">
      <LegalMarkdownRenderer content={privacyMd} />
    </LegalPageLayout>
  );
}
