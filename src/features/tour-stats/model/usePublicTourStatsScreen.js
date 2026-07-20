import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  fetchPublicTourStatsDoc,
  fetchPublicTourStatsIndex,
} from '../api/fetchPublicTourStats';

/**
 * Public tour-stats screen (#665) — aggregate docs only; no self overlay.
 * Default tour = `_index.defaultTourSlug` (current / most recent), not a
 * hardcoded Sphere or Summer preference.
 */
export function usePublicTourStatsScreen() {
  const { tourSlug: routeSlug } = useParams();
  const navigate = useNavigate();
  const [indexLoading, setIndexLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tours, setTours] = useState([]);
  const [defaultTourSlug, setDefaultTourSlug] = useState('');
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState(null);

  const trimmedRoute = (routeSlug || '').trim();
  // Wait for index before picking a default so we don't flash the wrong tour.
  const activeSlug =
    trimmedRoute || (indexLoading ? '' : defaultTourSlug);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIndexLoading(true);
      try {
        const idx = await fetchPublicTourStatsIndex();
        if (cancelled) return;
        const list = Array.isArray(idx.tours) ? idx.tours : [];
        setTours(list);
        const fromIndex =
          (typeof idx.defaultTourSlug === 'string' && idx.defaultTourSlug.trim()) ||
          list[0]?.tourSlug ||
          '';
        setDefaultTourSlug(fromIndex);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setIndexLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!activeSlug) {
      setStatsLoading(indexLoading);
      if (!indexLoading) setDoc(null);
      return undefined;
    }
    (async () => {
      setStatsLoading(true);
      setError(null);
      try {
        const data = await fetchPublicTourStatsDoc(activeSlug);
        if (cancelled) return;
        setDoc(data);
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setDoc(null);
        }
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeSlug, indexLoading]);

  const stats = useMemo(() => {
    if (!doc) {
      return {
        tourShowCount: 0,
        showsWithSetlist: 0,
        uniqueSongs: 0,
        totalSongPlays: 0,
        topSongs: [],
        bustouts: [],
        gapHighlights: [],
      };
    }
    return {
      tourShowCount: Number(doc.tourShowCount) || 0,
      showsWithSetlist: Number(doc.showsWithSetlist) || 0,
      uniqueSongs: Number(doc.uniqueSongs) || 0,
      totalSongPlays: Number(doc.totalSongPlays) || 0,
      topSongs: Array.isArray(doc.topSongs) ? doc.topSongs : [],
      bustouts: Array.isArray(doc.bustouts) ? doc.bustouts : [],
      gapHighlights: Array.isArray(doc.gapHighlights) ? doc.gapHighlights : [],
    };
  }, [doc]);

  const tourName =
    (doc && typeof doc.tourLabel === 'string' && doc.tourLabel) ||
    tours.find((t) => t.tourSlug === activeSlug)?.tourLabel ||
    activeSlug;

  const selectTour = (slug) => {
    const next = String(slug ?? '').trim();
    if (!next) return;
    if (next === defaultTourSlug) {
      navigate('/tour-stats', { replace: false });
    } else {
      navigate(`/tour-stats/${encodeURIComponent(next)}`, { replace: false });
    }
  };

  return {
    activeSlug,
    routeHasSlug: Boolean(trimmedRoute),
    defaultTourSlug,
    tours,
    tourName,
    hasTour: Boolean(doc),
    indexLoading,
    statsLoading,
    error,
    stats,
    selectTour,
  };
}
