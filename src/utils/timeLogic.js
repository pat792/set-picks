// src/utils/timeLogic.js
import { SHOW_DATES } from '../data/showDates';

export const getNextShow = () => {
  const today = new Date().toISOString().split('T')[0]; // Gets "YYYY-MM-DD"
  
  // Find the first show that hasn't happened yet
  const nextShow = SHOW_DATES.find(show => show.date >= today);
  
  // Fallback to the last show if tour is over
  return nextShow || SHOW_DATES[SHOW_DATES.length - 1]; 
};

export const getShowStatus = (selectedDate) => {
  const today = new Date().toISOString().split('T')[0];
  const nextShow = getNextShow();

  if (selectedDate < today) return 'PAST';
  if (selectedDate === nextShow.date) return 'NEXT';
  return 'FUTURE';
};