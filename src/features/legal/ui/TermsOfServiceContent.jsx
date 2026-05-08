import React from 'react';

import LegalPageLayout from './LegalPageLayout';
import LegalMarkdownRenderer from './LegalMarkdownRenderer';
import termsMd from '../../../../docs/TERMS_OF_SERVICE.md?raw';

export default function TermsOfServiceContent() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="May 8, 2026">
      <LegalMarkdownRenderer content={termsMd} />
    </LegalPageLayout>
  );
}
