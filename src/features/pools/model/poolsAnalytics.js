import { ga4Event } from '../../../shared/lib/ga4';

export function trackViewLeaderboardPoolHub({ pool_id }) {
  ga4Event('view_leaderboard', {
    context: 'pool_hub',
    pool_id: pool_id ?? '',
  });
}

export function trackSharePicksInviteCode({ pool_id }) {
  ga4Event('share_picks', {
    method: 'invite_code',
    pool_id: pool_id ?? '',
  });
}
