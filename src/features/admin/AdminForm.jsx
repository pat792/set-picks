import React, { useState, useEffect } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
  collection,
  query,
  where,
  getDocs,
  increment,
} from 'firebase/firestore';
import { db } from '../../shared/lib/firebase';
import { calculateTotalScore } from '../../shared/utils/scoring';
import { FORM_FIELDS } from '../../shared/data/gameConfig'; // <-- THE SINGLE SOURCE OF TRUTH
import SongAutocomplete from '../../shared/ui/SongAutocomplete';
import Button from '../../shared/ui/Button';
import Card from '../../shared/ui/Card';
import Input from '../../shared/ui/Input';
import PageTitle from '../../shared/ui/PageTitle';
import { AlertTriangle, X } from 'lucide-react';

// Admin does not set Wildcard (`wild`); it is derived from officialSetlist. Picks UI still uses full FORM_FIELDS.
const ADMIN_SETLIST_FIELDS = FORM_FIELDS.filter((field) => field.id !== 'wild');

export default function AdminForm({ user, selectedDate }) {
  // Slot keys only (no wildcard)
  const [setlistData, setSetlistData] = useState(() => {
    const initialState = {};
    ADMIN_SETLIST_FIELDS.forEach((field) => {
      initialState[field.id] = '';
    });
    return initialState;
  });
  
  const [officialSetlist, setOfficialSetlist] = useState([]);
  const [officialSetlistInput, setOfficialSetlistInput] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Security Check
  const isAdmin = user?.email === 'pat@road2media.com';

  // 1. Load the existing official setlist if already saved
  useEffect(() => {
    const fetchOfficialSetlist = async () => {
      if (!selectedDate || !isAdmin) return;
      
      try {
        // CHANGED: Pointing to the new collection
        const docRef = doc(db, 'official_setlists', selectedDate);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const merged = data.setlist || {};
          const nextSlots = {};
          ADMIN_SETLIST_FIELDS.forEach((f) => {
            const v = merged[f.id];
            nextSlots[f.id] = typeof v === 'string' ? v : '';
          });
          setSetlistData(nextSlots);
          const raw = data.officialSetlist;
          setOfficialSetlist(
            Array.isArray(raw)
              ? raw.map((s) => String(s ?? '').trim()).filter(Boolean)
              : []
          );
        } else {
          // Reset to blank if no data for this date
          const resetState = {};
          ADMIN_SETLIST_FIELDS.forEach((f) => {
            resetState[f.id] = '';
          });
          setSetlistData(resetState);
          setOfficialSetlist([]);
        }
        setOfficialSetlistInput('');
      } catch (error) {
        console.error("Error fetching setlist:", error);
      }
    };

    fetchOfficialSetlist();
  }, [selectedDate, isAdmin]);

  // 2. Handle dynamic input changes
  const handleInputChange = (fieldId, value) => {
    setSetlistData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // 3. Save to Firestore
  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      const cleanedData = {};
      ADMIN_SETLIST_FIELDS.forEach((field) => {
        const v = setlistData[field.id];
        cleanedData[field.id] = typeof v === 'string' ? v.trim() : v ?? '';
      });

      const cleanedOfficialSetlist = officialSetlist
        .map((s) => String(s ?? '').trim())
        .filter(Boolean);

      const actualSetlistPayload = {
        ...cleanedData,
        officialSetlist: cleanedOfficialSetlist,
      };

      // CHANGED: Pointing to the new collection
      const docRef = doc(db, 'official_setlists', selectedDate);

      // CHANGED: Writing the exact Issue #66 Schema
      await setDoc(docRef, {
        showDate: selectedDate,
        status: "COMPLETED", // Triggers the future Cloud Function
        isScored: false,     // Tells the Cloud Function this needs grading
        updatedAt: new Date().toISOString(),
        updatedBy: user.email,
        setlist: cleanedData, // Our perfectly flat object of songs
        officialSetlist: cleanedOfficialSetlist,
      });

      if (isFinalized) {
        try {
          const picksQuery = query(
            collection(db, 'picks'),
            where('showDate', '==', selectedDate)
          );
          const picksSnap = await getDocs(picksQuery);

          let batch = writeBatch(db);
          let opCount = 0;

          for (const pickDoc of picksSnap.docs) {
            if (opCount + 2 > 500) {
              await batch.commit();
              batch = writeBatch(db);
              opCount = 0;
            }

            const pickData = pickDoc.data();
            if (!pickData.userId) continue;

            const userPicks = pickData.picks || pickData;
            const newScore = calculateTotalScore(userPicks, actualSetlistPayload);
            const oldScore = pickData.score || 0;
            const scoreDiff = newScore - oldScore;
            const isFirstGrade = !pickData.isGraded;

            batch.update(pickDoc.ref, { score: newScore, isGraded: true });
            batch.update(doc(db, 'users', pickData.userId), {
              totalPoints: increment(scoreDiff),
              showsPlayed: increment(isFirstGrade ? 1 : 0),
            });
            opCount += 2;
          }

          if (opCount > 0) {
            await batch.commit();
          }
          console.log('Rollup complete!');
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
        text: isFinalized
          ? 'OFFICIAL SETLIST LOCKED — STATS ROLLED UP 🔒'
          : 'OFFICIAL SETLIST LOCKED 🔒',
        type: 'success',
      });
    } catch (error) {
      console.error("Error saving setlist:", error);
      setMessage({ text: 'Error saving setlist.', type: 'error' });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto mt-20 flex flex-col items-center gap-3 text-red-500 font-bold">
        <AlertTriangle className="h-10 w-10 shrink-0" aria-hidden />
        UNAUTHORIZED ACCESS
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-4 pb-12">
      <PageTitle as="h2" variant="page" className="mb-6 hidden md:block">
        Official setlist
      </PageTitle>

      <Card variant="danger" padding="sm" className="mb-6">
        <p className="text-xs text-red-300/80 font-bold uppercase tracking-wider flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
          <span>
            Locking the official setlist for {selectedDate}. This will trigger scoring.
          </span>
        </p>
      </Card>

      <Card as="form" variant="default" padding="md" onSubmit={handleSave} className="space-y-6">
        {/* Slot picks only — Wildcard is derived from officialSetlist */}
        {ADMIN_SETLIST_FIELDS.map((field) => (
          <div key={field.id} className="flex flex-col">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
              Official {field.label}
            </label>
            
            {/* THIS IS THE FIX: Using the predictive text component instead of <input> */}
            <SongAutocomplete
              value={setlistData[field.id] || ''}
              onChange={(val) => handleInputChange(field.id, val)}
              placeholder={`e.g., ${field.placeholder || 'Song Name'}`}
            />
            
          </div>
        ))}

        <div className="pt-2 border-t border-slate-700/60 space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1 block">
            Build Official Setlist (In Order)
          </label>
          <p className="text-[11px] text-slate-500 font-bold leading-relaxed ml-1">
            Choose each song from suggestions; it is appended in order. Use × to remove a mistake.
          </p>
          <SongAutocomplete
            value={officialSetlistInput}
            onChange={setOfficialSetlistInput}
            onSongSelected={(songName) => {
              const t = String(songName ?? '').trim();
              if (!t) return;
              setOfficialSetlist((prev) => [...prev, t]);
              setOfficialSetlistInput('');
            }}
            placeholder="Type and select a song to add…"
          />
          {officialSetlist.length > 0 && (
            <ol className="mt-4 space-y-2 list-none pl-0">
              {officialSetlist.map((song, index) => (
                <li
                  key={`${index}-${song}`}
                  className="flex items-center gap-2 text-sm font-bold text-slate-200"
                >
                  <span className="flex-1 min-w-0 flex flex-wrap items-center gap-2 rounded-xl border border-slate-600/80 bg-slate-900/60 px-3 py-2">
                    <span className="text-slate-500 tabular-nums shrink-0">{index + 1}.</span>
                    <span className="break-words">{song}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setOfficialSetlist((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 text-slate-400 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
                    aria-label={`Remove ${song}`}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        <Card variant="nested" padding="sm" className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <Input
              type="checkbox"
              checked={isFinalized}
              onChange={(e) => setIsFinalized(e.target.checked)}
              className="mt-1 text-red-500 focus:ring-red-500/40"
            />
            <span>
              <span className="block text-sm font-bold text-slate-200">
                Finalize Show &amp; Rollup Stats
              </span>
              <span className="mt-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500 leading-relaxed">
                Check this when the show is over to permanently push points to user profiles.
              </span>
            </span>
          </label>
        </Card>

        {/* Save Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            type="submit"
            disabled={isSaving}
            className="w-full bg-red-500 hover:bg-red-400 text-white text-lg py-4 rounded-xl uppercase tracking-widest shadow-lg hover:shadow-red-500/20"
          >
            {isSaving ? 'UPDATING DB...' : 'LOCK OFFICIAL SETLIST'}
          </Button>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div className={`text-center font-bold text-sm mt-4 uppercase tracking-widest ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
            {message.text}
          </div>
        )}
      </Card>
    </div>
  );
}