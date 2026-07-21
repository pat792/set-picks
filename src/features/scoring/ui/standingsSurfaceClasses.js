/**
 * Standings content-box geometry + type scale — now backed by the shared
 * dashboard card system (`shared/ui/dashboardCardClasses`) so Standings,
 * Tour Stats, and crowd-picks cards stay harmonized. This module keeps the
 * `STANDINGS_*` names as the scoring-local alias.
 *
 * Size levels: L1 = promo/banner (Invite, Sponsor); L2 = summary-row
 * (Your rank, Setlist, Crowd pulse, Winner). See the shared module docs.
 */
export {
  DASHBOARD_CARD_RADIUS as STANDINGS_BOX_RADIUS,
  DASHBOARD_CARD_PAD as STANDINGS_BOX_PAD,
  DASHBOARD_CARD_SHELL as STANDINGS_CARD_SHELL,
  DASHBOARD_CARD_L1_MIN_H as STANDINGS_BOX_L1_MIN_H,
  DASHBOARD_CARD_L2_MIN_H as STANDINGS_BOX_L2_MIN_H,
  DASHBOARD_CARD_MEDIA_TILE as STANDINGS_BOX_MEDIA_TILE,
  DASHBOARD_CARD_EYEBROW_ICON as STANDINGS_BOX_EYEBROW_ICON,
  DASHBOARD_CARD_CHEVRON as STANDINGS_BOX_CHEVRON,
  DASHBOARD_CARD_TITLE as STANDINGS_BOX_TITLE,
  DASHBOARD_CARD_BODY as STANDINGS_BOX_BODY,
  DASHBOARD_CARD_EYEBROW as STANDINGS_BOX_EYEBROW,
} from '../../../shared/ui/dashboardCardClasses';
