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

/** Picks form ready for input after cold email / deep-link land (#535). */
export function trackPicksPageInteractive({ show_id, comms_trigger_id } = {}) {
  const params = { show_id: show_id ?? '' };
  if (comms_trigger_id) params.comms_trigger_id = comms_trigger_id;
  ga4Event('picks_page_interactive', params);
}
