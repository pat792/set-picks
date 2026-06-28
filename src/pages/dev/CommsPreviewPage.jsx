import React from 'react';
import { Navigate } from 'react-router-dom';

import { CommsTemplatePreview } from '../../features/notifications';

/**
 * Dev-only comms template gallery. Guarded so it never renders in production
 * builds — `import.meta.env.DEV` is statically `false` in prod, so the preview
 * code is tree-shaken out and the route just redirects home.
 */
export default function CommsPreviewPage() {
  if (!import.meta.env.DEV) {
    return <Navigate to="/" replace />;
  }
  return <CommsTemplatePreview />;
}
