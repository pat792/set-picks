import React, { useState } from 'react';
import Card from '../../../shared/ui/Card';
import { AlertTriangle } from 'lucide-react';
import { useAdminSetlistForm } from '../model/useAdminSetlistForm';
import AdminSetlistSlotInputs from './AdminSetlistSlotInputs';
import AdminSetlistFetchButton from './AdminSetlistFetchButton';
import AdminSongCatalogRefresh from './AdminSongCatalogRefresh';
import AdminActionToggle from './AdminActionToggle';
import AdminOfficialSetlistBuilder from './AdminOfficialSetlistBuilder';
import AdminFinalizeAndSave from './AdminFinalizeAndSave';

export default function AdminForm({ user, selectedDate }) {
  const [setlistActionsOpen, setSetlistActionsOpen] = useState(true);
  const [songCatalogActionsOpen, setSongCatalogActionsOpen] = useState(false);
  const {
    isAdmin,
    selectedShow,
    setlistData,
    officialSetlist,
    officialSetlistInput,
    isSaving,
    isFetchingApi,
    apiFetchError,
    message,
    setOfficialSetlistInput,
    handleInputChange,
    addOfficialSong,
    removeOfficialSongAt,
    handleFetchFromApi,
    handleSave,
    handleFinalizeAndRollup,
  } = useAdminSetlistForm({ user, selectedDate });

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-20 flex flex-col items-center gap-3 text-red-500 font-bold">
        <AlertTriangle className="h-10 w-10 shrink-0" aria-hidden />
        UNAUTHORIZED ACCESS
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-6 md:pb-12">
      <Card variant="danger" padding="sm" className="mb-6">
        <p className="text-xs text-red-300/80 font-bold uppercase tracking-wider flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
          <span>
            Locking the official setlist for {selectedShow}. This will trigger scoring.
          </span>
        </p>
      </Card>

      <Card
        as="section"
        variant="default"
        padding="md"
        className="space-y-6"
      >
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-content-secondary ml-1">
            Admin actions
          </h2>
          <div className="space-y-3">
            <AdminActionToggle
              id="admin-setlist-fetch"
              title="Setlist"
              description="Pull slot picks and ordered setlist from the configured API for this show date."
              open={setlistActionsOpen}
              onOpenChange={setSetlistActionsOpen}
            >
              <AdminSetlistFetchButton
                embedded
                onFetch={handleFetchFromApi}
                disabled={isSaving}
                isFetching={isFetchingApi}
                errorText={apiFetchError}
              />
            </AdminActionToggle>
            <AdminActionToggle
              id="admin-song-catalog"
              title="Song catalog"
              description="Upload Phish.net master list to Cloud Storage (public JSON); clients fetch with a 3-day cache."
              open={songCatalogActionsOpen}
              onOpenChange={setSongCatalogActionsOpen}
            >
              <AdminSongCatalogRefresh embedded disabled={isSaving} />
            </AdminActionToggle>
          </div>
        </div>

        <div className="border-t border-border-muted pt-6 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-content-secondary ml-1">
            Official setlist
          </h2>
          <AdminSetlistSlotInputs
            formState={setlistData}
            handleInputChange={handleInputChange}
          />

          <AdminOfficialSetlistBuilder
            officialSetlistInput={officialSetlistInput}
            setOfficialSetlistInput={setOfficialSetlistInput}
            officialSetlist={officialSetlist}
            addOfficialSong={addOfficialSong}
            removeOfficialSongAt={removeOfficialSongAt}
            isSaving={isSaving}
          />

          <AdminFinalizeAndSave
            isSaving={isSaving}
            onSave={handleSave}
            onFinalize={handleFinalizeAndRollup}
            message={message}
          />
        </div>
      </Card>
    </div>
  );
}
