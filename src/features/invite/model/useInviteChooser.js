import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../../auth';
import {
  buildPoolInviteUrl,
  buildSiteInviteUrl,
  normalizeInviteHandle,
  shareInvite,
} from './shareInvite';

/**
 * Standings / dashboard invite chooser — always surfaces site vs pool choice;
 * never auto-shares a pool invite.
 *
 * @param {{
 *   pools?: Array<{ id: string, name?: string, inviteCode?: string }>,
 * }} [options]
 */
export function useInviteChooser({ pools = [] } = {}) {
  const { userProfile } = useAuth();
  const inviterHandle = normalizeInviteHandle(userProfile?.handle);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('choose');
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [sharing, setSharing] = useState(false);

  const inviteablePools = useMemo(
    () =>
      (Array.isArray(pools) ? pools : []).filter((pool) =>
        String(pool?.inviteCode ?? '').trim(),
      ),
    [pools],
  );

  const selectedPool = useMemo(
    () => inviteablePools.find((pool) => pool.id === selectedPoolId) ?? null,
    [inviteablePools, selectedPoolId],
  );

  const resetSheet = useCallback(() => {
    setStep('choose');
    setSelectedPoolId('');
    setSharing(false);
  }, []);

  const openChooser = useCallback(() => {
    resetSheet();
    setOpen(true);
  }, [resetSheet]);

  const closeChooser = useCallback(() => {
    setOpen(false);
    resetSheet();
  }, [resetSheet]);

  useEffect(() => {
    if (!open) return;
    if (selectedPoolId && !inviteablePools.some((pool) => pool.id === selectedPoolId)) {
      setSelectedPoolId('');
    }
  }, [open, inviteablePools, selectedPoolId]);

  const shareSiteInvite = useCallback(async () => {
    if (!inviterHandle || sharing) return;
    const url = buildSiteInviteUrl(inviterHandle);
    if (!url) return;

    setSharing(true);
    try {
      await shareInvite({
        invite_kind: 'site',
        url,
        inviterHandle,
      });
      closeChooser();
    } finally {
      setSharing(false);
    }
  }, [inviterHandle, sharing, closeChooser]);

  const sharePoolInvite = useCallback(async () => {
    if (!selectedPool || sharing) return;
    const inviteCode = String(selectedPool.inviteCode ?? '').trim();
    if (!inviteCode) return;

    const url = buildPoolInviteUrl(inviteCode, inviterHandle);
    if (!url) return;

    setSharing(true);
    try {
      await shareInvite({
        invite_kind: 'pool',
        url,
        poolName: selectedPool.name,
        inviterHandle,
        pool_id: selectedPool.id,
      });
      closeChooser();
    } finally {
      setSharing(false);
    }
  }, [selectedPool, inviterHandle, sharing, closeChooser]);

  const goToPoolStep = useCallback(() => {
    setStep('pool');
    setSelectedPoolId('');
  }, []);

  const backToChoose = useCallback(() => {
    setStep('choose');
    setSelectedPoolId('');
  }, []);

  return {
    open,
    step,
    inviterHandle,
    inviteablePools,
    selectedPoolId,
    setSelectedPoolId,
    selectedPool,
    sharing,
    openChooser,
    closeChooser,
    shareSiteInvite,
    sharePoolInvite,
    goToPoolStep,
    backToChoose,
  };
}
