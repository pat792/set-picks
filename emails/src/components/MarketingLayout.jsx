import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const styles = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: "#0b0b14",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  outer: {
    backgroundColor: "#0b0b14",
    padding: "32px 16px",
  },
  card: {
    maxWidth: "520px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    overflow: "hidden",
    margin: "0 auto",
  },
  header: {
    padding: "32px 32px 8px",
    textAlign: "center",
  },
  brand: {
    marginTop: "12px",
    fontSize: "18px",
    fontWeight: 800,
    color: "#1a1a2e",
  },
  content: {
    padding: "8px 32px 24px",
    color: "#1a1a2e",
    fontSize: "15px",
    lineHeight: 1.6,
  },
  footer: {
    padding: "24px 32px",
    borderTop: "1px solid #eeeeee",
    textAlign: "center",
  },
  footerText: {
    margin: "0 0 8px",
    fontSize: "12px",
    color: "#888888",
  },
  footerLink: {
    color: "#7c3aed",
    textDecoration: "underline",
  },
};

/**
 * Shared shell for long-form marketing / lifecycle email (#468).
 */
export function MarketingLayout({
  siteUrl = "https://www.setlistpickem.com",
  settingsUrl,
  preheader = "",
  children,
}) {
  const base = siteUrl.replace(/\/+$/, "");
  const logoUrl = `${base}/favicon/web-app-manifest-512x512.png`;
  const prefsUrl = settingsUrl || `${base}/dashboard/notifications`;

  return (
    <Html>
      <Head />
      {preheader ? <Preview>{preheader}</Preview> : null}
      <Body style={styles.body}>
        <Section style={styles.outer}>
          <Container style={styles.card}>
            <Section style={styles.header}>
              <Img
                src={logoUrl}
                width="48"
                height="48"
                alt="Setlist Pick'em"
                style={{ borderRadius: "12px", display: "inline-block" }}
              />
              <Text style={styles.brand}>Setlist Pick&apos;em</Text>
            </Section>
            <Section style={styles.content}>{children}</Section>
            <Hr style={{ borderColor: "#eeeeee", margin: 0 }} />
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
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}
