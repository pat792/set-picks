import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

import {
  buildEmailWordmarkHeroHtml,
  EMAIL_BRAND_PRIMARY,
} from "../../../comms/emailBranding.cjs";

/**
 * Full-bleed white shell for long marketing emails.
 *
 * Mobile QA lessons (preserve for all marketing templates):
 * - White body + no border-radius — dark framed cards fragment in Gmail.
 * - Teal top rule only for brand (keep).
 * - Pair with emails/src/styles/marketingEmailText.js — body 18px, section
 *   titles as bold <Text>/<p>, never Heading/<h2> (Gmail mid-email clip).
 * - No <hr> before footer — Gmail treats hr + repeated footers as quote trim.
 * - Include messageNonce (unique per send) so Gmail doesn’t collapse “identical”
 *   content when previews/campaigns share a thread.
 */
const styles = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: "#ffffff",
    WebkitTextSizeAdjust: "100%",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  outer: {
    backgroundColor: "#ffffff",
    padding: "0",
    width: "100%",
  },
  card: {
    maxWidth: "600px",
    width: "100%",
    backgroundColor: "#ffffff",
    margin: "0 auto",
    borderTop: `3px solid ${EMAIL_BRAND_PRIMARY}`,
  },
  header: {
    padding: "20px 20px 8px",
    textAlign: "center",
  },
  content: {
    padding: "8px 20px 8px",
    color: "#1a1a2e",
    fontSize: "18px",
    lineHeight: 1.55,
  },
  footer: {
    padding: "24px 20px 20px",
    textAlign: "center",
  },
  footerText: {
    margin: "0 0 8px",
    fontSize: "13px",
    lineHeight: 1.5,
    color: "#888888",
  },
  footerLink: {
    color: "#0f766e",
    textDecoration: "underline",
  },
  /** Visually hidden uniqueness token — defeats Gmail “trimmed content”. */
  nonce: {
    display: "none",
    maxHeight: 0,
    overflow: "hidden",
    opacity: 0,
    fontSize: "1px",
    lineHeight: "1px",
    color: "#ffffff",
  },
};

/**
 * Shared shell for long-form marketing / lifecycle email (#468).
 * Header uses the same non-clickable horizontal wordmark hero as service comms.
 *
 * @param {{
 *   siteUrl?: string,
 *   settingsUrl?: string,
 *   preheader?: string,
 *   messageNonce?: string,
 *   children?: import('react').ReactNode,
 * }} props
 */
export function MarketingLayout({
  siteUrl = "https://www.setlistpickem.com",
  settingsUrl,
  preheader = "",
  messageNonce,
  children,
}) {
  const base = siteUrl.replace(/\/+$/, "");
  const prefsUrl = settingsUrl || `${base}/dashboard/profile/notifications`;
  const wordmarkHeroHtml = buildEmailWordmarkHeroHtml(base);
  const nonce =
    typeof messageNonce === "string" && messageNonce.trim()
      ? messageNonce.trim()
      : `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  return (
    <Html>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="x-apple-disable-message-reformatting" />
      </Head>
      {preheader ? <Preview>{preheader}</Preview> : null}
      <Body style={styles.body}>
        <Section style={styles.outer}>
          <Container style={styles.card}>
            <Section style={styles.header}>
              <div
                dangerouslySetInnerHTML={{ __html: wordmarkHeroHtml }}
              />
            </Section>
            <Section style={styles.content}>{children}</Section>
            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                You&apos;re receiving this because you have a Setlist Pick&apos;em account.
              </Text>
              <Text style={{ ...styles.footerText, margin: 0 }}>
                <Link href={prefsUrl} style={styles.footerLink}>
                  Manage preferences
                </Link>
                {" · "}
                <Link href={prefsUrl} style={styles.footerLink}>
                  Unsubscribe
                </Link>
              </Text>
              <Text style={styles.nonce}>{nonce}</Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}
