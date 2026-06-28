import React from 'react';

import CommsTemplateBody from './commsTemplates/CommsTemplateBody.jsx';
import { getCommsTemplateEntry } from './commsTemplates/commsTemplateRegistry.jsx';

/**
 * Renders a persisted inbox message by its registry `templateId`.
 *
 * Dispatches to either a structured `build(payload)` template (rendered with
 * {@link CommsTemplateBody}) or a bespoke `Component`. Unknown templates render a
 * safe fallback so a future/forward-deployed template never breaks the inbox.
 *
 * @param {{
 *   templateId: string,
 *   payload: Record<string, unknown>,
 *   onCtaClick?: () => void,
 * }} props
 */
export default function CommsMessageBody({ templateId, payload, onCtaClick }) {
  const entry = getCommsTemplateEntry(templateId);
  const safePayload = payload && typeof payload === 'object' ? payload : {};

  if (entry?.build) {
    return <CommsTemplateBody {...entry.build(safePayload)} onCtaClick={onCtaClick} />;
  }

  if (entry?.Component) {
    const Component = entry.Component;
    const props = entry.toComponentProps ? entry.toComponentProps(safePayload) : safePayload;
    return <Component {...props} />;
  }

  return (
    <p className="text-sm font-bold text-amber-200">
      This message uses an unsupported template ({templateId}). Contact support if it persists.
    </p>
  );
}
