import React from 'react';
import Card from '../../../shared/ui/Card';
import PageTitle from '../../../shared/ui/PageTitle';
import { AlertTriangle } from 'lucide-react';
import { useAdminSetlistForm } from '../model/useAdminSetlistForm';
import AdminSetlistSlotInputs from './AdminSetlistSlotInputs';
import AdminOfficialSetlistBuilder from './AdminOfficialSetlistBuilder';
import AdminFinalizeAndSave from './AdminFinalizeAndSave';

export default function AdminForm({ user, selectedDate }) {
  const {
    isAdmin,
    selectedShow,
    setlistData,
    officialSetlist,
    officialSetlistInput,
    isSaving,
    message,
    setOfficialSetlistInput,
    handleInputChange,
    addOfficialSong,
    removeOfficialSongAt,
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
      <PageTitle as="h2" variant="page" className="mb-6 hidden md:block">
        Official setlist
      </PageTitle>

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
      </Card>
    </div>
  );
}
