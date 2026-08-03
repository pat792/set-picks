/**
 * Shared marketing-email typography (mobile-first).
 *
 * Lessons from Summer 2026 almost-end Gmail QA:
 * - Full-bleed white shell lives in MarketingLayout (no dark frame / card radius).
 * - Never use <h1>–<h6> / Heading — Gmail mobile clips mid-message at headings
 *   and redraws the rest as a nested card with a "…" expander.
 * - Section titles = bold <Text>/<p> via sectionHeadingStyle.
 * - Body ≥ 18px so type stays readable when Gmail doesn't auto-scale.
 * - No <hr> before footer; pass messageNonce per send; preview subjects must be
 *   unique — otherwise Gmail conversation view trims “identical” body blocks.
 */

export const greetingStyle = {
  margin: "0 0 18px",
  fontSize: "18px",
  fontWeight: 700,
  lineHeight: 1.55,
  color: "#1a1a2e",
};

export const paragraphStyle = {
  margin: "0 0 18px",
  fontSize: "18px",
  lineHeight: 1.55,
  color: "#1a1a2e",
};

/** Bold paragraph — do not swap for Heading / <h2>. */
export const sectionHeadingStyle = {
  margin: "28px 0 12px",
  fontSize: "20px",
  fontWeight: 800,
  lineHeight: 1.3,
  color: "#1a1a2e",
};

export const signoffStyle = {
  margin: "24px 0 8px",
  fontSize: "18px",
  lineHeight: 1.55,
  color: "#1a1a2e",
};

export const inlineLinkStyle = {
  display: "block",
  margin: "-8px 0 16px",
  fontSize: "16px",
  color: "#0f766e",
  textDecoration: "underline",
};

export const ctaButtonStyle = {
  display: "inline-block",
  padding: "16px 28px",
  fontSize: "18px",
  fontWeight: 700,
  color: "#0b0b14",
  textDecoration: "none",
  backgroundColor: "#2dd4bf",
  borderRadius: "12px",
};
