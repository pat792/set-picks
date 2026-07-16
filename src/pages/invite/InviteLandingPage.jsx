import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

import {
  InviteVipLanding,
  normalizeInviteHandle,
  useInviteLanding,
} from '../../features/invite';

export default function InviteLandingPage() {
  const { handle: rawHandle } = useParams();
  const landing = useInviteLanding({
    inviteKind: 'site',
    handle: normalizeInviteHandle(rawHandle),
  });

  if (landing.redirectTo) {
    return <Navigate to={landing.redirectTo} replace />;
  }

  return <InviteVipLanding {...landing} />;
}
