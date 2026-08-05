/**
 * Narrow public surface for avg helpers (#853).
 * Keeps consumers off the full profile barrel (Auth-backed hooks / UI).
 */

export {
  formatAvgCorrectPicksPerShow,
  PROFILE_SLOTS_PER_SHOW,
} from './model/profileAverages';
