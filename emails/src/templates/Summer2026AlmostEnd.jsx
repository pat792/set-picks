import { Link, Text } from "@react-email/components";
import { FeatureBlock } from "../components/FeatureBlock.jsx";
import { InviteShareBlock } from "../components/InviteShareBlock.jsx";
import { MarketingLayout } from "../components/MarketingLayout.jsx";
import {
  ctaButtonStyle,
  greetingStyle,
  paragraphStyle,
  sectionHeadingStyle,
  signoffStyle,
} from "../styles/marketingEmailText.js";

const thStyle = {
  padding: "10px 6px",
  borderBottom: "2px solid #1a1a2e",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#64748b",
};

const tdStyle = {
  padding: "10px 6px",
  borderBottom: "1px solid #eeeeee",
  fontSize: "16px",
  color: "#1a1a2e",
};

const bustoutBrandStyle = {
  color: "#ea580c",
  fontWeight: 800,
};

/**
 * Marketing — Summer 2026 almost-end (pre–Dick's).
 *
 * @param {Record<string, unknown>} props
 */
export function Summer2026AlmostEnd({
  greetingName = "friend",
  personalTape = "",
  top5 = [],
  fieldPickingAvg = ".231",
  fieldPlayerCount = 28,
  showInvite = true,
  standingsUrl,
  shareUrl,
  siteUrl = "https://www.setlistpickem.com",
  settingsUrl,
  messageNonce,
  preheader =
    "18 shows in the books · Fenway wrapped · Dick's still ahead · your (almost) tour-end tape inside",
}) {
  const base = String(siteUrl).replace(/\/+$/, "");
  const standings =
    typeof standingsUrl === "string" && standingsUrl.trim()
      ? standingsUrl.trim()
      : `${base}/dashboard/standings`;
  const rows = Array.isArray(top5) ? top5 : [];

  return (
    <MarketingLayout
      siteUrl={siteUrl}
      settingsUrl={settingsUrl}
      preheader={preheader}
      messageNonce={messageNonce}
    >
      <Text style={greetingStyle}>Hey {greetingName},</Text>

      <Text style={paragraphStyle}>
        Well, that&apos;s a wrap. Or is it? The Phab Four earned a well deserved break ahead of the
        official tour-closing Dick&apos;s Run. With so much time on our hands between shows (I&apos;m
        not crying, you&apos;re crying), here&apos;s some stats to chew on.
      </Text>

      <Text style={sectionHeadingStyle}>Tour tape</Text>
      <Text style={paragraphStyle}>
        Eighteen nights. <strong>188</strong> unique songs. <strong>310</strong> total songs played
        from Madison through Fenway.
      </Text>
      <Text style={paragraphStyle}>
        And then there was New York. The five-night MSG run (July 22–29) wasn&apos;t just another
        Garden residency — it was a full-on <strong>&apos;90s time machine</strong>. The band&apos;s{" "}
        <strong>92nd through 96th</strong> appearances at the Garden, each night a setlist drawn
        entirely from one year: <strong>&apos;92 thru &apos;96</strong>. From my seat (and my
        scorecard), some of the best Phish of the last decade — bicycle kicks and beach balls back
        from the dead, deep cuts raining from the rafters, and a picking board that refused to
        behave.
      </Text>
      <Text style={paragraphStyle}>
        That theme explains half the chaos on the tape. MSG alone coughed up these show gaps:{" "}
        <strong>Cold as Ice</strong> (1,468), <strong>Big Ball Jam</strong> (1,170),{" "}
        <strong>The Vibration of Life</strong> (1,027), <strong>Suspicious Minds</strong> (1,021),
        plus the cover pile — <strong>Highway to Hell</strong>, <strong>Purple Rain</strong>,{" "}
        <strong>Johnny B. Goode</strong>, <strong>La Grange</strong> — and a full{" "}
        <strong>Forbin → Mockingbird → Harpua</strong> suite. Across those five nights, the field
        banked <strong>44</strong>{" "}
        <span style={bustoutBrandStyle}>Bustout Boost™</span> hits. Fenway N1 dropped{" "}
        <strong>Melt the Guns</strong> after <strong>2,051</strong> shows — the longest gap between
        performances in Phish history. They absolutely nailed this post-punk/new wave relic.
      </Text>
      <Text style={paragraphStyle}>
        Not every story needed a 1,000-show gap. Merriweather brought <strong>Ass Handed</strong>{" "}
        back after 138; Savannah lit <strong>Fire</strong> (132); and just under the bustout line,
        songs like <strong>The Old Home Place</strong> (28) and <strong>Izabella</strong> (25) kept
        the “almost” lane spicy.
      </Text>
      <Text style={paragraphStyle}>
        The rotation favorites? <strong>Character Zero</strong>, <strong>Free</strong>,{" "}
        <strong>Ghost</strong>, <strong>Hood</strong>, <strong>Possum</strong>,{" "}
        <strong>Antelope</strong>, and <strong>Sand</strong> each showed up <strong>four</strong>{" "}
        times through Fenway — the 1.0 stalwarts that I know and love.
      </Text>

      <Text style={sectionHeadingStyle}>Pre Dick&apos;s Leaderboard</Text>
      <Text style={paragraphStyle}>
        Field picking average across <strong>{fieldPlayerCount}</strong> players:{" "}
        <strong>{fieldPickingAvg}</strong>. The Top 5 all clear it — Rivertranced by the widest
        margin. It just shows that a few well-placed bustouts can <strong>Catapult</strong> a player
        to the top in a hurry.
      </Text>

      {rows.length > 0 ? (
        <table
          role="presentation"
          width="100%"
          cellSpacing="0"
          cellPadding="0"
          style={{ borderCollapse: "collapse", margin: "12px 0 16px" }}
        >
          <thead>
            <tr>
              <th align="left" style={thStyle}>
                Rank
              </th>
              <th align="left" style={thStyle}>
                Handle
              </th>
              <th align="right" style={thStyle}>
                Pts
              </th>
              <th align="right" style={thStyle}>
                Wins
              </th>
              <th align="right" style={thStyle}>
                Nights
              </th>
              <th align="right" style={thStyle}>
                Avg
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.rank}-${row.handle}`}>
                <td style={tdStyle}>{row.rank}</td>
                <td style={{ ...tdStyle, fontWeight: 700 }}>{row.handle}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{row.points}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{row.wins}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{row.nights}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>{row.battingAvg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      <Text style={paragraphStyle}>
        Three more nights at Dick&apos;s. The Top 5 is bunched enough that one hot run — or a couple
        of bustouts — can reshuffle the whole podium. And if you&apos;re sitting just outside looking
        in: you&apos;re closer than you think. Commerce City is where chasers become contenders.
      </Text>

      <Text style={sectionHeadingStyle}>Your (almost) tour-end tape</Text>
      <Text style={paragraphStyle}>{personalTape}</Text>

      {showInvite ? (
        <>
          <Text style={sectionHeadingStyle}>One huge favor</Text>
          <Text style={paragraphStyle}>
            Before Dick&apos;s, can I ask a huge favor? <strong>Invite at least one friend</strong>{" "}
            to join and lock picks for the three-night run. Growing the number of players is my
            measure of success — and you know I love stats.
          </Text>
          <Text style={{ margin: "0 0 24px" }}>
            <Link href={standings} style={ctaButtonStyle}>
              Invite a friend from Standings
            </Link>
          </Text>
        </>
      ) : (
        <Text style={{ margin: "0 0 24px" }}>
          <Link href={standings} style={ctaButtonStyle}>
            Check it out on Standings
          </Link>
        </Text>
      )}

      <Text style={sectionHeadingStyle}>Building between now and then</Text>
      <Text style={paragraphStyle}>
        Between now and Dick&apos;s, I&apos;m staying busy building out new features. If you
        haven&apos;t checked these out, they are worth taking a look:
      </Text>
      <FeatureBlock title="Live setlist">
        Updates as songs land, with bustout badges and last-played / gap insights so you can see how
        rare each hit really was.
      </FeatureBlock>
      <FeatureBlock title="Crowd pulse">
        How the field is picking that night — consensus heat, where your card sits vs the room, and
        which songs the crowd is riding.
      </FeatureBlock>
      <FeatureBlock title="Stats">
        Personal and tour insights (bustouts, gaps, frequency — the same tape above, live in the
        app).
      </FeatureBlock>
      <FeatureBlock title="Profile">
        Milestone badges and avatars so you can personalize how you show up on the board.
      </FeatureBlock>

      <Text style={paragraphStyle}>
        Three nights in Commerce City still to go. Rest up, study the gaps, and don&apos;t sleep on
        the wildcard.
      </Text>
      <Text style={paragraphStyle}>See you at Dick&apos;s.</Text>
      <Text style={signoffStyle}>
        — Pat
        <br />
        from the Setlist Pick &apos;Em desk
      </Text>

      {showInvite ? (
        <InviteShareBlock
          standingsUrl={standings}
          inviteUrl={typeof shareUrl === "string" ? shareUrl : undefined}
          ctaLabel="Open Standings to share →"
        />
      ) : null}
    </MarketingLayout>
  );
}
