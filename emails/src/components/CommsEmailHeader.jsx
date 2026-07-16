import { Text } from "@react-email/components";

/** Accents aligned with in-app tokens (readable on white email cards). */
export const ACCENT_TEAL = "#0d9488";
export const ACCENT_AMBER = "#d97706";
export const ACCENT_GOLD = "#ca8a04";

const eyebrowStyle = (accentColor) => ({
  margin: "0 0 8px",
  fontSize: "11px",
  lineHeight: 1.4,
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: accentColor || ACCENT_TEAL,
});

const titleStyle = {
  margin: "0 0 20px",
  padding: "0 0 16px",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "22px",
  lineHeight: 1.25,
  fontWeight: 800,
  letterSpacing: "-0.02em",
  textTransform: "uppercase",
  color: "#0f172a",
};

/**
 * In-app style header for React Email — eyebrow + emoji icon + title.
 *
 * @param {{
 *   icon?: string,
 *   eyebrow?: string,
 *   title?: string,
 *   accentColor?: string,
 * }} props
 */
export function CommsEmailHeader({
  icon,
  eyebrow,
  title,
  accentColor = ACCENT_TEAL,
}) {
  const eye = typeof eyebrow === "string" ? eyebrow.trim() : "";
  const head = typeof title === "string" ? title.trim() : "";
  if (!eye && !head) return null;

  return (
    <>
      {eye ? (
        <Text style={eyebrowStyle(accentColor)}>
          {eye}
          {icon ? <span style={{ marginLeft: 6 }}>{icon}</span> : null}
        </Text>
      ) : null}
      {head ? <Text style={titleStyle}>{head}</Text> : null}
    </>
  );
}
