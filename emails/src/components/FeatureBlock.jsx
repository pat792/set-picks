import { Text } from "@react-email/components";

const titleStyle = {
  margin: "0 0 4px",
  fontSize: "15px",
  fontWeight: 700,
  color: "#1a1a2e",
  lineHeight: 1.4,
};

const bodyStyle = {
  margin: "0 0 16px",
  fontSize: "15px",
  color: "#333355",
  lineHeight: 1.55,
};

export function FeatureBlock({ title, children }) {
  return (
    <>
      <Text style={titleStyle}>{title}</Text>
      <Text style={bodyStyle}>{children}</Text>
    </>
  );
}
