import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { storePoolInviteCodeFromParam } from './usePoolInviteCodeStorage';

/**
 * @deprecated Prefer {@link usePoolInviteCodeStorage} on `/join/:code` VIP landings (#580).
 * Legacy helper: stores code then redirects home (splash modal funnel).
 */
export function usePoolInviteInterceptor() {
  const { code: rawCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    storePoolInviteCodeFromParam(rawCode);
    navigate('/', { replace: true });
  }, [rawCode, navigate]);
}
