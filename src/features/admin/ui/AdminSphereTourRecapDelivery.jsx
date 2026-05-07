import React, { useCallback, useState } from 'react';

import { deliverSphere2026TourRecapInbox } from '../api/sphereTourRecapDeliveryApi';
import ConfirmationModal from '../../../shared/ui/ConfirmationModal/ConfirmationModal';

/**
 * War Room: dry-run / execute Sphere ’26 recap inbox delivery (#120).
 * Requires admin claim; callable reads `picks` for Sphere Run dates server-side.
 */
export default function AdminSphereTourRecapDelivery() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastResult, setLastResult] = useState(/** @type {Record<string, unknown> | null} */ (null));
  const [confirmOpen, setConfirmOpen] = useState(false);

  const runDryRun = useCallback(async () => {
    setError('');
    setBusy(true);
    setLastResult(null);
    try {
      const data = await deliverSphere2026TourRecapInbox({ dryRun: true });
      setLastResult(data && typeof data === 'object' ? data : {});
    } catch (e) {
      setError(e?.message || 'Dry run failed.');
    } finally {
      setBusy(false);
    }
  }, []);

  const runDeliver = useCallback(async () => {
    setError('');
    setBusy(true);
    try {
      const data = await deliverSphere2026TourRecapInbox({ dryRun: false });
      setLastResult(data && typeof data === 'object' ? data : {});
    } catch (e) {
      setError(e?.message || 'Delivery failed.');
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }, []);

  const previewRows = Array.isArray(lastResult?.preview) ? lastResult.preview : [];

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold leading-relaxed text-content-secondary">
        Computes tour totals from graded picks on all nine Sphere inaugural dates (same rules as
        Tour standings), then writes{' '}
        <code className="rounded bg-surface-inset px-1 font-mono text-xs text-white">
          users/&lt;uid&gt;/commsInbox/sphere-2026-inaugural
        </code>{' '}
        for each eligible player. Run <strong>Dry run</strong> first — default callable mode is
        dry-run only; execute requires <code className="font-mono text-xs">dryRun: false</code>.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={runDryRun}
          className="rounded-lg border border-border-muted bg-surface-inset px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-colors hover:border-brand-primary/50 disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Dry run'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setError('');
            setConfirmOpen(true);
          }}
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-amber-100 transition-colors hover:border-amber-400 disabled:opacity-50"
        >
          Deliver to inboxes
        </button>
      </div>
      {error ? <p className="text-sm font-bold text-amber-300">{error}</p> : null}
      {lastResult && typeof lastResult.participantCount === 'number' ? (
        <div className="rounded-xl border border-border-muted/60 bg-surface-inset/40 px-4 py-3 text-sm font-bold text-content-secondary">
          <p className="text-white">
            Participants (eligible):{' '}
            <span className="text-brand-primary">{lastResult.participantCount}</span>
            {typeof lastResult.delivered === 'number' ? (
              <>
                {' '}
                · Rows written:{' '}
                <span className="text-brand-primary">{lastResult.delivered}</span>
              </>
            ) : null}
            {lastResult.dryRun ? (
              <span className="ml-2 text-xs font-black uppercase tracking-wider text-amber-200">
                (dry run — no writes)
              </span>
            ) : null}
          </p>
          {typeof lastResult.message === 'string' && lastResult.message ? (
            <p className="mt-2 text-xs text-amber-200">{lastResult.message}</p>
          ) : null}
          {previewRows.length > 0 ? (
            <ul className="mt-3 max-h-48 list-inside list-disc space-y-1 overflow-y-auto text-xs font-bold">
              {previewRows.slice(0, 15).map((row) => (
                <li key={row.uid}>
                  #{row.rank} {row.handle || row.uid}{' '}
                  <span className="text-content-secondary">
                    pts {row.payload?.points}, wins {row.payload?.wins}, shows{' '}
                    {row.payload?.showsPlayed}
                  </span>
                </li>
              ))}
              {previewRows.length > 15 ? (
                <li className="list-none text-content-secondary">
                  …and {previewRows.length - 15} more
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      ) : null}

      <ConfirmationModal
        open={confirmOpen}
        title="Deliver Sphere ’26 recap to all inboxes?"
        message="This writes (or merges) one Firestore row per eligible player under their commsInbox. Re-running overwrites the same doc id. Run a dry run first to verify counts."
        confirmLabel="Deliver now"
        confirmVariant="danger"
        busy={busy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={runDeliver}
      />
    </div>
  );
}
