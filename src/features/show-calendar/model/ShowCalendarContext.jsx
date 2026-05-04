import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  FALLBACK_SHOW_DATES,
  FALLBACK_SHOW_DATES_BY_TOUR,
} from '../../../shared/data/showDates';
import { subscribeShowCalendarSnapshot } from '../api/subscribeShowCalendarSnapshot';
import { normalizeShowCalendarDoc } from './normalizeShowCalendarDoc';

/** @typedef {'firestore' | 'fallback'} ShowCalendarSource */

const ShowCalendarContext = createContext(
  /** @type {{ showDatesByTour: { tour: string, shows: { date: string, venue: string, timeZone: string }[] }[], showDates: { date: string, venue: string, timeZone: string }[], source: ShowCalendarSource, loading: boolean, subscriptionError: Error | null, syncError: string | null } | null} */ (
    null
  )
);

export function ShowCalendarProvider({ children }) {
  const [rawDoc, setRawDoc] = useState(
    /** @type {import('firebase/firestore').DocumentData | null} */ (null)
  );
  const [rawSeen, setRawSeen] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(
    /** @type {Error | null} */ (null)
  );

  useEffect(() => {
    return subscribeShowCalendarSnapshot(
      (data) => {
        setRawDoc(data);
        setRawSeen(true);
        setSubscriptionError(null);
      },
      (err) => {
        setSubscriptionError(err);
        setRawSeen(true);
      }
    );
  }, []);

  const value = useMemo(() => {
    const normalized = normalizeShowCalendarDoc(rawDoc);
    if (normalized) {
      return {
        showDatesByTour: normalized.showDatesByTour,
        showDates: normalized.showDates,
        source: /** @type {const} */ ('firestore'),
        loading: !rawSeen,
        subscriptionError,
        syncError: normalized.syncError,
      };
    }
    return {
      showDatesByTour: FALLBACK_SHOW_DATES_BY_TOUR,
      showDates: FALLBACK_SHOW_DATES,
      source: /** @type {const} */ ('fallback'),
      loading: !rawSeen,
      subscriptionError,
      syncError: null,
    };
  }, [rawDoc, rawSeen, subscriptionError]);

  return (
    <ShowCalendarContext.Provider value={value}>
      {children}
    </ShowCalendarContext.Provider>
  );
}

export function useShowCalendar() {
  const ctx = useContext(ShowCalendarContext);
  if (!ctx) {
    throw new Error('useShowCalendar must be used within ShowCalendarProvider');
  }
  return ctx;
}

export { ShowCalendarContext };
