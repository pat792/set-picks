import React from 'react';
import { Navigate } from 'react-router-dom';

import { Phase1CardShellPreview } from '../../features/scoring';

/**
 * Dev-only gallery for the Phase 1 card shell (#1088). Production builds
 * redirect home; `import.meta.env.DEV` is statically false there.
 */
export default function CardShellPreviewPage() {
  if (!import.meta.env.DEV) {
    return <Navigate to="/" replace />;
  }
  return <Phase1CardShellPreview />;
}
