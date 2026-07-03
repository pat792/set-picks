import { render } from "@react-email/render";
import { SummerTour2026Launch } from "./templates/SummerTour2026Launch.jsx";

/**
 * Render Summer Tour 2026 launch marketing email to HTML + plain text.
 *
 * @param {Record<string, unknown>} props
 * @returns {Promise<{ html: string, text: string }>}
 */
export async function renderSummerTour2026LaunchEmail(props) {
  const element = <SummerTour2026Launch {...props} />;
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return { html, text };
}
