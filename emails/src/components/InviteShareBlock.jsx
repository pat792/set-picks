import { Link, Text } from "@react-email/components";

const introStyle = {
  margin: "24px 0 8px",
  fontSize: "15px",
  fontWeight: 400,
  lineHeight: 1.5,
  color: "#1a1a2e",
};

const forwardStyle = {
  margin: "0 0 8px",
  fontSize: "14px",
  fontWeight: 400,
  lineHeight: 1.5,
  color: "#64748b",
};

/** Soft text link — secondary blue, not a solid primary button. */
const softLinkStyle = {
  display: "inline-block",
  marginTop: "4px",
  marginBottom: "8px",
  color: "#2563eb",
  textDecoration: "underline",
  fontWeight: 700,
  fontSize: "15px",
};

const INVITE_NUDGE_INTRO =
  "Want to share with friends? Log in and tap Share on Standings — your invite link is ready there.";

const INVITE_NUDGE_FORWARD = "Or forward this email to a friend.";

/**
 * Soft invite nudge — points to in-app Share; optional Standings link.
 * No mailto / OS-share pretenses (#583 / #572).
 *
 * @param {{
 *   standingsUrl?: string,
 *   inviteUrl?: string,
 *   ctaLabel?: string,
 *   inviterHandle?: string,
 *   inviteKind?: string,
 *   poolName?: string,
 * }} props
 */
export function InviteShareBlock({
  standingsUrl,
  inviteUrl,
  ctaLabel,
}) {
  const standings =
    typeof standingsUrl === "string" && standingsUrl.trim()
      ? standingsUrl.trim()
      : typeof inviteUrl === "string" && inviteUrl.includes("/dashboard/standings")
        ? inviteUrl.trim()
        : "";
  const buttonLabel =
    typeof ctaLabel === "string" && ctaLabel.trim()
      ? ctaLabel.trim()
      : "Open Standings to share →";

  return (
    <>
      <Text style={introStyle}>{INVITE_NUDGE_INTRO}</Text>
      <Text style={forwardStyle}>{INVITE_NUDGE_FORWARD}</Text>
      {standings ? (
        <Link href={standings} style={softLinkStyle}>
          {buttonLabel}
        </Link>
      ) : null}
    </>
  );
}
