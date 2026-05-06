import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth';
import { FORM_FIELDS } from '../../../shared/data/gameConfig.js';
import { sanitizeOfficialSongList } from '../../../shared/utils/officialSetlistSanitize.js';
import { getShowStatus } from '../../../shared/utils/timeLogic.js';
import {
  fetchOfficialSetlistByDate,
  saveOfficialSetlistByDate,
} from '../api/officialSetlistsApi';
import { rollupScoresForShow } from '../api/adminRollupApi';
import { refreshLiveScoresForShow } from '../api/liveScoringApi';
import {
  fetchLiveSetlistAutomationState,
  pollLiveSetlistNow,
  setLiveSetlistAutomationState,
} from '../api/liveSetlistAutomationApi';
import { fetchAndMapExternalSetlist, fetchBustoutsFromPhishnet } from './setlistAutomation';

export const ADMIN_SETLIST_FIELDS = FORM_FIELDS.filter((field) => field.id !== 'wild');

/** True if draft state would yield at least one “played” song for scoring (slots + ordered list + encores). */
function adminDraftHasPlayedSong(setlistData, officialSetlist, encoreSongs) {
  for (const field of ADMIN_SETLIST_FIELDS) {
    const v = setlistData[field.id];
    if (v != null && String(v).trim() !== '') return true;
  }
  if (
    Array.isArray(officialSetlist) &&
    officialSetlist.some((s) => String(s ?? '').trim() !== '')
  ) {
    return true;
  }
  if (
    Array.isArray(encoreSongs) &&
    encoreSongs.some((s) => String(s ?? '').trim() !== '')
  ) {
    return true;
  }
  return false;
}

function createEmptySlotState() {
  const initialState = {};
  ADMIN_SETLIST_FIELDS.forEach((field) => {
    initialState[field.id] = '';
  });
  return initialState;
}

export function useAdminSetlistForm({ user, selectedDate, showDates = [] }) {
  const [setlistData, setSetlistData] = useState(() => createEmptySlotState());
  const [officialSetlist, setOfficialSetlist] = useState([]);
  const [officialSetlistInput, setOfficialSetlistInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingApi, setIsFetchingApi] = useState(false);
  const [apiFetchError, setApiFetchError] = useState('');
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [isAutomationLoading, setIsAutomationLoading] = useState(false);
  const [isAutomationToggling, setIsAutomationToggling] = useState(false);
  const [isAutomationPolling, setIsAutomationPolling] = useState(false);
  const [automationStatus, setAutomationStatus] = useState('');
  const [automationError, setAutomationError] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  /** Mirrors `official_setlists.encoreSongs` for multi-encore scoring + save. */
  const [encoreSongs, setEncoreSongs] = useState([]);
  /**
   * Mirrors `official_setlists.bustouts` (#214). Derived from Phish.net row
   * `gap` metadata when the admin ingests from the API; left as `null` when
   * the admin is editing by hand so the save flow can fetch it on demand
   * (rather than writing an empty array over a good snapshot).
   */
  const [bustouts, setBustouts] = useState(/** @type {string[] | null} */ (null));
  const [hasAutoFinalized, setHasAutoFinalized] = useState(false);
  const [finalizeForceModalOpen, setFinalizeForceModalOpen] = useState(false);
  const clearMessageTimeoutRef = useRef(null);

  const { isAdmin: sessionIsAdmin } = useAuth();
  const isAdmin = sessionIsAdmin;
  const selectedShow = selectedDate ?? '';

  const finalizeAllowedWithoutForce = useMemo(() => {
    if (hasAutoFinalized) return true;
    if (!selectedShow) return false;
    if (!Array.isArray(showDates) || showDates.length === 0) return false;
    return getShowStatus(selectedShow, showDates) === 'PAST';
  }, [hasAutoFinalized, selectedShow, showDates]);

  const finalizeTimingTooltip = useMemo(() => {
    if (finalizeAllowedWithoutForce) return '';
    if (!selectedShow) return '';
    if (!Array.isArray(showDates) || showDates.length === 0) {
      return 'Calendar not loaded or this date is missing from show_calendar. Use “Finalize early” only if you mean to override server timing gates.';
    }
    const st = getShowStatus(selectedShow, showDates);
    if (st === 'LIVE') {
      return 'Show is LIVE. Wait until the calendar date is PAST in the venue timezone (or rely on post-encore auto-finalize), or use Finalize early with confirmation.';
    }
    if (st === 'NEXT') {
      return 'Show is still NEXT on the tour calendar. Finalize only after it becomes PAST, unless you use Finalize early with confirmation.';
    }
    return 'Show date is FUTURE. Too early for rollup unless you use Finalize early with confirmation.';
  }, [finalizeAllowedWithoutForce, selectedShow, showDates]);

  useEffect(() => {
    return () => {
      if (clearMessageTimeoutRef.current) {
        clearTimeout(clearMessageTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setApiFetchError('');
    setAutomationStatus('');
    setAutomationError('');
  }, [selectedShow]);

  useEffect(() => {
    const loadSetlist = async () => {
      if (!selectedShow || !isAdmin) return;

      try {
        const response = await fetchOfficialSetlistByDate(selectedShow, ADMIN_SETLIST_FIELDS);
        setSetlistData(response.setlist);
        setOfficialSetlist(response.officialSetlist);
        setEncoreSongs(sanitizeOfficialSongList(response.encoreSongs ?? []));
        // Seed from the existing doc when present; `null` means "unknown,
        // let save fetch it" on a brand-new show.
        setBustouts(
          Array.isArray(response.bustouts) && response.bustouts.length >= 0 && response.exists
            ? response.bustouts
            : null,
        );
        setOfficialSetlistInput('');
      } catch (error) {
        console.error('Error fetching setlist:', error);
      }
    };

    loadSetlist();
  }, [selectedShow, isAdmin]);

  useEffect(() => {
    const loadAutomationState = async () => {
      if (!selectedShow || !isAdmin) return;
      setIsAutomationLoading(true);
      try {
        const state = await fetchLiveSetlistAutomationState(selectedShow);
        setAutomationEnabled(state.enabled !== false);
        setHasAutoFinalized(state.hasAutoFinalized === true);
      } catch (error) {
        console.error('Error loading automation state:', error);
      } finally {
        setIsAutomationLoading(false);
      }
    };
    loadAutomationState();
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
      setEncoreSongs(sanitizeOfficialSongList(result.encoreSongs ?? []));
      // Phish.in ingest returns an empty `bustouts` array because Phish.in
      // has no gap metadata. Leave state as `null` in that case so the save
      // flow falls through to the Phish.net fetch-at-save path.
      setBustouts(Array.isArray(result.bustouts) && result.bustouts.length > 0 ? result.bustouts : null);
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
    if (fieldId === 'enc') {
      const t = String(value ?? '').trim();
      setEncoreSongs(t ? [t] : []);
    }
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

  const saveSetlist = async ({ finalizeRollup = false, force = false } = {}) => {
    if (!isAdmin || !selectedShow) return;

    if (
      finalizeRollup &&
      !adminDraftHasPlayedSong(setlistData, officialSetlist, encoreSongs)
    ) {
      setMessage({
        text: 'Cannot finalize: no songs in the official setlist (slots, ordered list, or encore). Add at least one song, or use Save only.',
        type: 'error',
      });
      if (clearMessageTimeoutRef.current) {
        clearTimeout(clearMessageTimeoutRef.current);
      }
      clearMessageTimeoutRef.current = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 6000);
      return;
    }

    setIsSaving(true);
    setMessage({ text: '', type: '' });
    /**
     * Warning text appended to the final success toast when fetch-at-save
     * couldn't derive bustouts. We still save (so scoring works for exact /
     * in-setlist / wildcard), just without the bustout boost.
     */
    let bustoutsWarning = '';

    try {
      // Fetch-at-save fallback (#214). Options:
      // - state `bustouts` is an array (admin ingested from Phish.net or
      //   reopened an existing doc): use it verbatim.
      // - state `bustouts` is null (hand-typed, or Phish.in ingest): fire a
      //   one-shot Phish.net fetch so the snapshot is definitional. On
      //   soft-failure, save with an empty array and warn — scoring stays
      //   deterministic; admin can re-save later to backfill.
      let bustoutsToSave;
      if (Array.isArray(bustouts)) {
        bustoutsToSave = bustouts;
      } else {
        const res = await fetchBustoutsFromPhishnet(selectedShow, ADMIN_SETLIST_FIELDS);
        if (res.ok) {
          bustoutsToSave = res.bustouts;
          setBustouts(res.bustouts);
        } else {
          bustoutsToSave = [];
          bustoutsWarning = ` Bustouts could not be derived from Phish.net (${res.error}); save again once Phish.net posts the setlist to earn bustout boosts.`;
        }
      }

      const {
        cleanedSlots,
        cleanedOfficialSetlist,
        encoreSongs: savedEncoreSongs,
        bustouts: savedBustouts,
      } = await saveOfficialSetlistByDate({
          showDate: selectedShow,
          setlistData,
          officialSetlist,
          slotFields: ADMIN_SETLIST_FIELDS,
          updatedBy: user?.email ?? null,
          encoreSongs,
          bustouts: bustoutsToSave,
        });
      setEncoreSongs(savedEncoreSongs);
      setBustouts(savedBustouts);

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
            force: Boolean(force),
            actualSetlistPayload: {
              ...cleanedSlots,
              officialSetlist: cleanedOfficialSetlist,
              encoreSongs: savedEncoreSongs,
              bustouts: savedBustouts,
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
        text:
          (finalizeRollup
            ? 'OFFICIAL SETLIST LOCKED — STATS ROLLED UP'
            : 'OFFICIAL SETLIST LOCKED') + bustoutsWarning,
        type: bustoutsWarning ? 'warning' : 'success',
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
  const handleFinalizeAndRollup = async () => {
    if (!finalizeAllowedWithoutForce) return;
    await saveSetlist({ finalizeRollup: true, force: false });
  };

  const handleOpenFinalizeEarlyModal = () => {
    if (!isAdmin || !selectedShow || isSaving) return;
    setFinalizeForceModalOpen(true);
  };

  const handleCloseFinalizeForceModal = () => {
    setFinalizeForceModalOpen(false);
  };

  const handleConfirmForceFinalizeAndRollup = async () => {
    setFinalizeForceModalOpen(false);
    await saveSetlist({ finalizeRollup: true, force: true });
  };

  const handleToggleAutomation = async () => {
    if (!selectedShow || !isAdmin || isAutomationLoading || isAutomationPolling) return;
    setAutomationError('');
    setAutomationStatus('');
    setIsAutomationToggling(true);
    const nextEnabled = !automationEnabled;
    try {
      await setLiveSetlistAutomationState(selectedShow, nextEnabled);
      setAutomationEnabled(nextEnabled);
      setAutomationStatus(
        nextEnabled
          ? `Automation resumed for ${selectedShow}.`
          : `Automation paused for ${selectedShow}.`
      );
    } catch (error) {
      console.error('Error toggling automation:', error);
      setAutomationError(error instanceof Error ? error.message : 'Failed to update automation state.');
    } finally {
      setIsAutomationToggling(false);
    }
  };

  const handlePollAutomationNow = async () => {
    if (!selectedShow || !isAdmin || isAutomationLoading || isAutomationToggling) return;
    setAutomationError('');
    setAutomationStatus('');
    setIsAutomationPolling(true);
    try {
      const result = await pollLiveSetlistNow(selectedShow);
      const row = Array.isArray(result?.results) ? result.results[0] : null;
      if (row?.changed) {
        const picksUpdated = typeof row.updatedPicks === 'number' ? row.updatedPicks : 0;
        setAutomationStatus(
          `Manual poll wrote updated setlist and refreshed ${picksUpdated} pick scores for ${selectedShow}.`
        );
      } else {
        setAutomationStatus(`Manual poll completed: no setlist change for ${selectedShow}.`);
      }
    } catch (error) {
      console.error('Error running manual automation poll:', error);
      setAutomationError(error instanceof Error ? error.message : 'Manual poll failed.');
    } finally {
      setIsAutomationPolling(false);
    }
  };

  return {
    isAdmin,
    selectedShow,
    setlistData,
    officialSetlist,
    officialSetlistInput,
    isSaving,
    isFetchingApi,
    apiFetchError,
    automationEnabled,
    isAutomationLoading,
    isAutomationToggling,
    isAutomationPolling,
    automationStatus,
    automationError,
    message,
    setOfficialSetlistInput,
    handleInputChange,
    addOfficialSong,
    removeOfficialSongAt,
    handleFetchFromApi,
    handleSave,
    handleFinalizeAndRollup,
    finalizeAllowedWithoutForce,
    finalizeTimingTooltip,
    finalizeForceModalOpen,
    handleOpenFinalizeEarlyModal,
    handleCloseFinalizeForceModal,
    handleConfirmForceFinalizeAndRollup,
    handleToggleAutomation,
    handlePollAutomationNow,
  };
}
