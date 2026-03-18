import { FORM_FIELDS } from '../data/gameConfig';

export const calculateSlotScore = (fieldId, guessedSong, actualSetlist) => {
  if (!actualSetlist || !guessedSong) return 0;

  const guess = guessedSong.toLowerCase();
  const actualExact = actualSetlist[fieldId]?.toLowerCase();

  // 1 Point for Exact Slot
  if (actualExact === guess) return 1;

  // 0.5 Points if played anywhere else in the show
  const allPlayed = Object.values(actualSetlist).map(s => s?.toLowerCase());
  if (allPlayed.includes(guess)) return 0.5;

  return 0;
};

export const calculateTotalScore = (userPicks, actualSetlist) => {
  if (!actualSetlist || !userPicks) return 0;
  
  let total = 0;
  FORM_FIELDS.forEach(field => {
    total += calculateSlotScore(field.id, userPicks[field.id], actualSetlist);
  });
  
  return total;
};