import { Link, Text } from "@react-email/components";
import {
  buildPoolInviteShareTitleFromInviter,
  buildSiteInviteShareTitle,
  normalizeInviteHandle,
} from "../lib/inviteKit.js";

const headlineStyle = {
  margin: "24px 0 8px",
  fontSize: "15px",
  fontWeight: 700,
  color: "#1a1a2e",
};

const linkStyle = {
  display: "inline-block",
  marginTop: "8px",
  marginBottom: "8px",
  padding: "12px 24px",
  backgroundColor: "#7c3aed",
  color: "#ffffff",
  textDecoration: "none",
  borderRadius: "8px",
  fontWeight: 700,
  fontSize: "14px",
};

const urlStyle = {
  display: "block",
  margin: "0 0 16px",
  fontSize: "13px",
  lineHeight: 1.5,
  color: "#64748b",
  wordBreak: "break-all",
};

/**
 * Shareable invite block — site or pool variant (#583).
 *
 * @param {{
 *   inviterHandle?: string,
 *   inviteUrl?: string,
 *   inviteKind?: 'site' | 'pool',
 *   poolName?: string,
 *   inviteHeadline?: string,
 *   ctaLabel?: string,
 * }} props
 */
export function InviteShareBlock({
  inviterHandle,
  inviteUrl,
  inviteKind = "site",
  poolName,
  inviteHeadline,
  ctaLabel,
}) {
  const url = typeof inviteUrl === "string" ? inviteUrl.trim() : "";
  if (!url) return null;

  const handle = normalizeInviteHandle(inviterHandle);
  const kind = inviteKind === "pool" ? "pool" : "site";
  const headline =
    typeof inviteHeadline === "string" && inviteHeadline.trim()
      ? inviteHeadline.trim()
      : kind === "pool"
        ? buildPoolInviteShareTitleFromInviter(handle, poolName)
        : buildSiteInviteShareTitle(handle);
  const buttonLabel =
    typeof ctaLabel === "string" && ctaLabel.trim()
      ? ctaLabel.trim()
      : handle
        ? `Share with your friends, ${handle} →`
        : "Share with your friends →";

  return (
    <>
      <Text style={headlineStyle}>{headline}</Text>
      <Link href={url} style={linkStyle}>
        {buttonLabel}
      </Link>
      <Text style={urlStyle}>{url}</Text>
    </>
  );
}
