import React from 'react';

import ConfirmationModal from '../../../shared/ui/ConfirmationModal/ConfirmationModal';
import Button from '../../../shared/ui/Button';
import EditPoolNameForm from './EditPoolNameForm';

export default function PoolAdminControls({
  canAdmin,
  isArchived,
  editNameOpen,
  onOpenEditName,
  onCloseEditName,
  busy,
  formError,
  poolName,
  onSaveName,
  onArchivePool,
  onDeletePool,
  confirmModalOpen,
  onCloseConfirm,
  confirmModalProps,
}) {
  if (!canAdmin) return null;

  return (
    <section className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
      <h2 className="text-xs font-bold text-amber-200/90 uppercase tracking-widest mb-3">
        Pool admin
      </h2>
      {isArchived ? (
        <p className="text-sm font-medium text-slate-400 mb-3">
          This pool is archived. You can still view history here; it no longer appears in your
          active pool list.
        </p>
      ) : null}

      {editNameOpen ? (
        <EditPoolNameForm
          initialName={poolName}
          busy={busy}
          errorMessage={formError}
          onSave={onSaveName}
          onCancel={() => {
            if (!busy) onCloseEditName();
          }}
        />
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenEditName}
            disabled={busy || isArchived}
          >
            Edit pool name
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onArchivePool}
            disabled={busy || isArchived}
          >
            Archive pool
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onDeletePool}
            disabled={busy || isArchived}
          >
            Delete pool
          </Button>
          {formError ? (
            <p className="w-full text-sm font-bold text-red-400 basis-full">
              {formError}
            </p>
          ) : null}
        </div>
      )}

      {confirmModalOpen && confirmModalProps ? (
        <ConfirmationModal
          open
          title={confirmModalProps.title}
          message={confirmModalProps.message}
          confirmLabel={confirmModalProps.confirmLabel}
          confirmVariant={confirmModalProps.confirmVariant}
          busy={busy}
          onConfirm={confirmModalProps.onConfirm}
          onClose={onCloseConfirm}
        />
      ) : null}
    </section>
  );
}
