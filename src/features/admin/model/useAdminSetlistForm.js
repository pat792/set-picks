import { useEffect, useRef, useState } from 'react';
import { FORM_FIELDS } from '../../../shared/data/gameConfig';
import {
  fetchOfficialSetlistByDate,
  saveOfficialSetlistByDate,
} from '../api/officialSetlistsApi';
import { rollupScoresForShow } from '../api/adminRollupApi';
import { refreshLiveScoresForShow } from '../api/liveScoringApi';
import { fetchAndMapExternalSetlist } from './setlistAutomation';

export const ADMIN_SETLIST_FIELDS = FORM_FIELDS.filter((field) => field.id !== 'wild');

function createEmptySlotState() {
  const initialState = {};
  ADMIN_SETLIST_FIELDS.forEach((field) => {
    initialState[field.id] = '';
  });
  return initialState;
}

export function useAdminSetlistForm({ user, selectedDate }) {
  const [setlistData, setSetlistData] = useState(() => createEmptySlotState());
  const [officialSetlist, setOfficialSetlist] = useState([]);
  const [officialSetlistInput, setOfficialSetlistInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingApi, setIsFetchingApi] = useState(false);
  const [apiFetchError, setApiFetchError] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const clearMessageTimeoutRef = useRef(null);

  const isAdmin = user?.email === 'pat@road2media.com';
  const selectedShow = selectedDate ?? '';

  useEffect(() => {
    return () => {
      if (clearMessageTimeoutRef.current) {
        clearTimeout(clearMessageTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setApiFetchError('');
  }, [selectedShow]);

  useEffect(() => {
    const loadSetlist = async () => {
      if (!selectedShow || !isAdmin) return;

      try {
        const response = await fetchOfficialSetlistByDate(selectedShow, ADMIN_SETLIST_FIELDS);
        setSetlistData(response.setlist);
        setOfficialSetlist(response.officialSetlist);
        setOfficialSetlistInput('');
      } catch (error) {
        console.error('Error fetching setlist:', error);
      }
    };

    loadSetlist();
  }, [selectedShow, isAdmin]);

  const handleFetchFromApi = async () => {
    if (!selectedShow || !isAdmin || isSaving) return;
    setApiFetchError('');
    setIsFetchingApi(true);
    try {
      const result = await fetchAndMapExternalSetlist(selectedShow, ADMIN_SETLIST_FIELDS);
      if (!result.ok) {
        setApiFetchError(result.error);
        return;
      }
      setSetlistData(result.setlistData);
      setOfficialSetlist(result.officialSetlist);
      setOfficialSetlistInput('');
    } catch (e) {
      console.error('Fetch setlist from API failed:', e);
      setApiFetchError(e instanceof Error ? e.message : 'Unexpected error while fetching.');
    } finally {
      setIsFetchingApi(false);
    }
  };

  const handleInputChange = (fieldId, value) => {
    setSetlistData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const addOfficialSong = (songName) => {
    const trimmed = String(songName ?? '').trim();
    if (!trimmed) return;
    setOfficialSetlist((prev) => [...prev, trimmed]);
    setOfficialSetlistInput('');
  };

  const removeOfficialSongAt = (index) => {
    setOfficialSetlist((prev) => prev.filter((_, i) => i !== index));
  };

  const saveSetlist = async ({ finalizeRollup = false } = {}) => {
    if (!isAdmin || !selectedShow) return;

    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const { cleanedSlots, cleanedOfficialSetlist } = await saveOfficialSetlistByDate({
        showDate: selectedShow,
        setlistData,
        officialSetlist,
        slotFields: ADMIN_SETLIST_FIELDS,
        updatedBy: user?.email ?? null,
      });

      if (!finalizeRollup) {
        try {
          await refreshLiveScoresForShow(selectedShow);
        } catch (liveScoreError) {
          console.error('Live score refresh failed:', liveScoreError);
          setMessage({
            text: 'Setlist saved, but live score refresh failed. Check console.',
            type: 'error',
          });
          return;
        }
      }

      if (finalizeRollup) {
        try {
          await rollupScoresForShow({
            showDate: selectedShow,
            actualSetlistPayload: {
              ...cleanedSlots,
              officialSetlist: cleanedOfficialSetlist,
            },
          });
        } catch (rollupError) {
          console.error('Rollup failed:', rollupError);
          setMessage({
            text: 'Setlist saved, but profile rollup failed. Check console.',
            type: 'error',
          });
          return;
        }
      }

      setMessage({
        text: finalizeRollup
          ? 'OFFICIAL SETLIST LOCKED — STATS ROLLED UP'
          : 'OFFICIAL SETLIST LOCKED',
        type: 'success',
      });
    } catch (error) {
      console.error('Error saving setlist or running rollup:', error);
      setMessage({
        text: finalizeRollup
          ? 'Setlist saved, but profile rollup failed. Check console.'
          : 'Error saving setlist.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
      if (clearMessageTimeoutRef.current) {
        clearTimeout(clearMessageTimeoutRef.current);
      }
      clearMessageTimeoutRef.current = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 4000);
    }
  };

  const handleSave = async () => saveSetlist({ finalizeRollup: false });
  const handleFinalizeAndRollup = async () => saveSetlist({ finalizeRollup: true });

  return {
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
  };
}
