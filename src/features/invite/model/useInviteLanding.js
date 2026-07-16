import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  isSplashGoogleModalInflight,
  useAuth,
} from '../../auth';
import { normalizeInviteHandle } from '../../../shared/lib/inviteKit';
import { getDashboardEntryHref } from '../../../shared/lib/dashboardLastPath';
import { resolveInviterProfile } from '../api/resolveInviterProfile';
import {
  getInviteLandingHeadline,
  getInviteLandingSubcopy,
} from './inviteLandingCopy';

/**
 * @param {{ inviteKind: 'site' | 'pool', handle?: string | null }} options
 */
export function useInviteLanding({ inviteKind, handle: rawHandle }) {
  const handle = normalizeInviteHandle(rawHandle);
  const { user, isAdmin: isAdminUser } = useAuth();
  const [authModal, setAuthModal] = useState(null);
  const [inviter, setInviter] = useState(null);
  const [resolveState, setResolveState] = useState(handle ? 'loading' : 'idle');

  const closeModal = useCallback(() => setAuthModal(null), []);
  const openSignUpModal = useCallback(() => setAuthModal('signup'), []);
  const openSignInModal = useCallback(() => setAuthModal('signin'), []);

  useEffect(() => {
    if (!handle) {
      setInviter(null);
      setResolveState('idle');
      return undefined;
    }

    let cancelled = false;
    setResolveState('loading');

    resolveInviterProfile(handle).then((profile) => {
      if (cancelled) return;
      setInviter(profile);
      setResolveState('done');
    });

    return () => {
      cancelled = true;
    };
  }, [handle]);

  const resolvedHandle = inviter?.handle?.trim() || null;
  const headline = useMemo(
    () => getInviteLandingHeadline({ inviteKind, resolvedHandle }),
    [inviteKind, resolvedHandle],
  );
  const subcopy = useMemo(
    () => getInviteLandingSubcopy({ inviteKind }),
    [inviteKind],
  );

  const poolInvitePending = inviteKind === 'pool';
  const redirectTo =
    user && !isSplashGoogleModalInflight()
      ? getDashboardEntryHref({ isAdminUser })
      : null;

  return {
    inviteKind,
    handle,
    resolveState,
    headline,
    subcopy,
    poolInvitePending,
    authModal,
    closeModal,
    openSignUpModal,
    openSignInModal,
    redirectTo,
  };
}
