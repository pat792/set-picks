import { Link, Text } from "@react-email/components";
import { FeatureBlock } from "../components/FeatureBlock.jsx";
import { InviteShareBlock } from "../components/InviteShareBlock.jsx";
import { MarketingLayout } from "../components/MarketingLayout.jsx";
import { resolveEmailInviteShare } from "../lib/inviteKit.js";

const greetingStyle = {
  margin: "0 0 16px",
  fontSize: "16px",
  fontWeight: 700,
  color: "#1a1a2e",
};

const paragraphStyle = {
  margin: "0 0 16px",
  fontSize: "15px",
  lineHeight: 1.6,
  color: "#1a1a2e",
};

const sectionHeadingStyle = {
  margin: "24px 0 12px",
  fontSize: "16px",
  fontWeight: 800,
  color: "#1a1a2e",
};

const signoffStyle = {
  margin: "24px 0 8px",
  fontSize: "15px",
  lineHeight: 1.6,
  color: "#1a1a2e",
};

const inlineLinkStyle = {
  display: "block",
  margin: "-8px 0 16px",
  fontSize: "14px",
  color: "#7c3aed",
  textDecoration: "underline",
};

/**
 * Marketing email #1 — Summer Tour 2026 pre-opener launch (#468).
 *
 * @param {{
 *   greetingName?: string,
 *   inviterHandle?: string,
 *   audienceSegment?: 'sphere_alum' | 'post_sphere_signup' | 'sphere_alum_and_new',
 *   openerLabel?: string,
 *   siteUrl?: string,
 *   settingsUrl?: string,
 *   shareUrl?: string,
 *   inviteUrl?: string,
 *   inviteKind?: 'site' | 'pool',
 *   inviteHeadline?: string,
 *   inviteCode?: string,
 *   poolName?: string,
 * }} props
 */
export function SummerTour2026Launch({
  greetingName = "friend",
  inviterHandle,
  audienceSegment = "sphere_alum",
  openerLabel = "Tuesday, July 7",
  siteUrl = "https://www.setlistpickem.com",
  settingsUrl,
  shareUrl,
  inviteUrl,
  inviteKind,
  inviteHeadline,
  inviteCode,
  poolName,
}) {
  const base = siteUrl.replace(/\/+$/, "");
  const handle =
    typeof inviterHandle === "string" && inviterHandle.trim()
      ? inviterHandle.trim()
      : greetingName !== "friend"
        ? greetingName
        : "";
  const resolvedShare =
    typeof shareUrl === "string" && shareUrl.trim()
      ? {
          invite_kind: inviteKind === "pool" ? "pool" : "site",
          invite_url: shareUrl.trim(),
          invite_headline: inviteHeadline || "",
        }
      : typeof inviteUrl === "string" && inviteUrl.trim()
        ? {
            invite_kind: inviteKind === "pool" ? "pool" : "site",
            invite_url: inviteUrl.trim(),
            invite_headline: inviteHeadline || "",
          }
        : resolveEmailInviteShare({
            baseUrl: base,
            inviterHandle: handle,
            inviteCode,
            poolName,
            campaign: "summer_tour_2026_launch",
            utmContent: "share_friends",
          });
  const installHowToUrl = `${base}/dashboard/profile?utm_source=email&utm_campaign=summer_tour_2026_launch&utm_content=install_howto`;

  const introParagraphs =
    audienceSegment === "post_sphere_signup"
      ? [
          `Summer Tour opens ${openerLabel}. Welcome — glad you're here.`,
          "Pick opener, closer, encore, and a wildcard; points rack up as the setlist lands. A lot's new since you joined — hope your first show is a good one.",
        ]
      : [
          `Summer Tour opens ${openerLabel}. Thanks for playing and testing during Sphere — real-time scoring with friends near and far was a blast.`,
          "Since then I've been busy building. I hope Summer tour feels even better than last time.",
        ];

  return (
    <MarketingLayout
      siteUrl={siteUrl}
      settingsUrl={settingsUrl}
      preheader={`Bring your crew → Summer Tour starts ${openerLabel}.`}
    >
      <Text style={greetingStyle}>Hey {greetingName},</Text>

      {introParagraphs.map((para) => (
        <Text key={para.slice(0, 40)} style={paragraphStyle}>
          {para}
        </Text>
      ))}

      <Text style={sectionHeadingStyle}>What&apos;s new since Sphere:</Text>

      <FeatureBlock title="Home screen + push">
        One-tap launch from your home screen, plus push notifications to keep you updated on show
        nights — works in the browser or as an installed app.
      </FeatureBlock>
      <Link href={installHowToUrl} style={inlineLinkStyle}>
        See how it works in the app →
      </Link>

      <FeatureBlock title="Share your night (Wordle-style)">
        After scores land, copy an emoji grid of your picks, grab a recap image, or share in one tap
        — built for the post-show group thread.
      </FeatureBlock>

      <FeatureBlock title="Rank + standings that tell the story">
        See #rank · points on Picks, flip between tonight&apos;s show, your pools, and past tours, and
        watch opponent picks stay hidden until lock to keep thing interesting.
      </FeatureBlock>

      <FeatureBlock title="Pools that are easy to fill">
        Create or rejoin your crew and share an invite link that previews nicely in iMessage and
        social.
      </FeatureBlock>

      <Text style={paragraphStyle}>
        Also tighter since beta: live scoring speed, public profiles, smoother sign-in, and
        an app-update banner when a new build drops.
      </Text>

      <Text style={signoffStyle}>
        Would love to see you — and your tour friends — on the board all summer.
        <br />
        <br />
        — Pat
      </Text>

      <InviteShareBlock
        inviterHandle={handle || greetingName}
        inviteUrl={resolvedShare?.invite_url}
        inviteKind={resolvedShare?.invite_kind}
        poolName={poolName}
        inviteHeadline={resolvedShare?.invite_headline}
        ctaLabel={
          greetingName !== "friend"
            ? `Share with your friends, ${greetingName} →`
            : undefined
        }
      />
    </MarketingLayout>
  );
}
