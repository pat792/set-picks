import React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import {
  InviteVipLanding,
  normalizeInviteHandle,
  useInviteLanding,
} from '../../features/invite';
import { usePoolInviteCodeStorage } from '../../features/pool-invite';

export default function PoolInvitePage() {
  usePoolInviteCodeStorage();
  const [searchParams] = useSearchParams();
  const fromHandle = normalizeInviteHandle(searchParams.get('from'));
  const landing = useInviteLanding({
    inviteKind: 'pool',
    handle: fromHandle,
  });

  if (landing.redirectTo) {
    return <Navigate to={landing.redirectTo} replace />;
  }

  return <InviteVipLanding {...landing} />;
}
