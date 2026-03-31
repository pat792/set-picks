// src/utils/timeLogic.js
import { SHOW_DATES } from '../data/showDates';
import { todayYmd } from './dateUtils';

export const getNextShow = () => {
  const today = todayYmd();
  
  // Find the first show that hasn't happened yet
  const nextShow = SHOW_DATES.find(show => show.date >= today);
  
  // Fallback to the last show if tour is over
  return nextShow || SHOW_DATES[SHOW_DATES.length - 1]; 
};

/**
 * NEXT — only date users can enter picks (the upcoming show from today).
 * PAST — calendar date before today (show already happened).
 * FUTURE — any other listed date (e.g. later tour nights): too early until that show becomes "next".
 */
export const getShowStatus = (selectedDate) => {
  const today = todayYmd();
  const nextShow = getNextShow();

  if (selectedDate < today) return 'PAST';
  if (selectedDate === nextShow.date) return 'NEXT';
  return 'FUTURE';
};