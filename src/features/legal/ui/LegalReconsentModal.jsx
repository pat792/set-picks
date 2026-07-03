import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';

import Button from '../../../shared/ui/Button';

/**
 * Blocking Terms + Privacy acceptance gate for legacy / outdated consent (#396).
 * No dismiss — user must check the box and accept.
 */
export default function LegalReconsentModal({
  open,
  accepted,
  onAcceptedChange,
  onAccept,
  busy = false,
  error = '',
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-reconsent-title"
        aria-describedby="legal-reconsent-desc"
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-border-subtle bg-surface-panel-strong p-5 shadow-inset-glass ring-1 ring-border-glass/25 sm:rounded-2xl sm:p-6"
      >
        <h2 id="legal-reconsent-title" className="text-lg font-bold text-white">
          Please review our Terms & Privacy Policy
        </h2>
        <p
          id="legal-reconsent-desc"
          className="mt-3 text-sm font-medium leading-relaxed text-slate-400"
        >
          We need your confirmation that you have read and agree to our current Terms of
          Service and Privacy Policy before you continue using Setlist Pick&apos;Em.
        </p>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-border-subtle bg-surface-field/80 p-4 text-left text-sm font-semibold leading-snug text-slate-200">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => onAcceptedChange(e.target.checked)}
            disabled={busy}
            className="mt-1 h-4 w-4 shrink-0 rounded border-slate-500 bg-surface-panel text-brand-primary focus-visible:ring-2 focus-visible:ring-brand"
            aria-describedby="legal-reconsent-hint"
          />
          <span id="legal-reconsent-hint">
            I agree to the{' '}
            <Link
              to="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-300 underline decoration-teal-500/60 underline-offset-2 hover:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-300 underline decoration-teal-500/60 underline-offset-2 hover:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        {error ? (
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-6">
          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={onAccept}
            disabled={busy || !accepted}
          >
            {busy ? 'Saving…' : 'Accept and continue'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
