import { ga4Event } from '../../../shared/lib/ga4';

export function trackSubmitPicks({ show_id, tour_date }) {
  ga4Event('submit_picks', {
    show_id: show_id ?? '',
    tour_date: tour_date ?? '',
  });
}

export function trackEditPicks({ show_id, tour_date }) {
  ga4Event('edit_picks', {
    show_id: show_id ?? '',
    tour_date: tour_date ?? '',
  });
}
