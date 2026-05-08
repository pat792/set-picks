import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useDeleteAccount } from '../model/useDeleteAccount';
import { DELETE_ACCOUNT_CONFIRMATION_PHRASE } from '../api/deleteAccountCallable';
import Button from '../../../shared/ui/Button';

/**
 * Last-resort account deletion: collapsed by default; checkbox + exact phrase + confirm.
 */
export default function DeleteAccountSection() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [ack, setAck] = useState(false);
  const [phrase, setPhrase] = useState('');

  const { isDeleting, error, clearError, requestDelete } = useDeleteAccount({
    onAfterDelete: () => navigate('/'),
  });

  const phraseOk = phrase.trim() === DELETE_ACCOUNT_CONFIRMATION_PHRASE;
  const canSubmit = ack && phraseOk && !isDeleting;

  return (
    <div className="mt-10 rounded-3xl border border-red-500/25 bg-red-950/20 p-6 shadow-inset-glass">
      <h3 className="text-sm font-black uppercase tracking-widest text-red-300/90">
        Delete account
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-content-secondary">
        This permanently removes your sign-in, profile, picks, and pool memberships, as described in
        the{' '}
        <Link
          to="/terms"
          className="font-semibold text-red-200 underline decoration-red-400/50 underline-offset-2 hover:text-white"
        >
          Terms of Service
        </Link>
        . You cannot undo this. If you own any pools, delete them from each pool&apos;s settings
        first.
      </p>

      {!expanded ? (
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            clearError();
          }}
          className="mt-4 w-full rounded-xl border-2 border-red-500/40 bg-transparent py-3.5 text-sm font-black uppercase tracking-widest text-red-300 transition-colors hover:border-red-400 hover:bg-red-500/10 hover:text-white"
        >
          I need to delete my account
        </button>
      ) : (
        <div className="mt-4 space-y-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug text-content-secondary">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 rounded border-red-500/50 bg-surface-field text-red-500 focus-visible:ring-2 focus-visible:ring-red-400"
              checked={ack}
              onChange={(e) => {
                setAck(e.target.checked);
                clearError();
              }}
            />
            <span>
              I understand this is permanent and I still want to delete my account and related
              data.
            </span>
          </label>

          <div>
            <label
              htmlFor="delete-account-phrase"
              className="text-xs font-bold uppercase tracking-widest text-content-secondary"
            >
              Type{' '}
              <span className="font-mono text-red-200">{DELETE_ACCOUNT_CONFIRMATION_PHRASE}</span>{' '}
              to confirm
            </label>
            <input
              id="delete-account-phrase"
              type="text"
              autoComplete="off"
              value={phrase}
              onChange={(e) => {
                setPhrase(e.target.value);
                clearError();
              }}
              className="mt-2 w-full rounded-xl border-2 border-border-subtle bg-surface-field px-4 py-3 text-sm text-white placeholder:text-content-secondary/60 focus:border-red-400/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
              placeholder={DELETE_ACCOUNT_CONFIRMATION_PHRASE}
              disabled={isDeleting}
            />
          </div>

          {error ? (
            <p className="text-sm font-medium text-red-300" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="glass"
              size="sm"
              className="w-full border-border-subtle sm:w-auto"
              disabled={isDeleting}
              onClick={() => {
                setExpanded(false);
                setAck(false);
                setPhrase('');
                clearError();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              className="w-full sm:w-auto"
              disabled={!canSubmit}
              onClick={() => requestDelete({ acknowledgedPermanentDeletion: ack, confirmationPhrase: phrase })}
            >
              {isDeleting ? 'Deleting…' : 'Delete my account forever'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
