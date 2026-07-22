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

/** Prediction Lab panel opened (#651). */
export function trackPredictionLabOpen({ show_id, model_version } = {}) {
  ga4Event('prediction_lab_open', {
    show_id: show_id ?? '',
    model_version: model_version ?? '',
  });
}

/** Recommendation row(s) shown for a slot (#651). */
export function trackPredictionLabImpression({
  show_id,
  slot,
  model_version,
  risk_band,
  rank,
} = {}) {
  ga4Event('prediction_lab_impression', {
    show_id: show_id ?? '',
    slot: slot ?? '',
    model_version: model_version ?? '',
    risk_band: risk_band ?? '',
    rank: rank ?? 0,
  });
}

/** User applied a Lab recommendation to a slot (#651). */
export function trackPredictionLabSelect({
  show_id,
  slot,
  model_version,
  risk_band,
  rank,
  song_normalized,
} = {}) {
  ga4Event('prediction_lab_select', {
    show_id: show_id ?? '',
    slot: slot ?? '',
    model_version: model_version ?? '',
    risk_band: risk_band ?? '',
    rank: rank ?? 0,
    song_normalized: song_normalized ?? '',
  });
}
