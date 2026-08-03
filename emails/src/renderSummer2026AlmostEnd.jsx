import { render } from "@react-email/render";
import { Summer2026AlmostEnd } from "./templates/Summer2026AlmostEnd.jsx";

/**
 * Render Summer 2026 almost-end marketing email to HTML + plain text.
 *
 * @param {Record<string, unknown>} props
 * @returns {Promise<{ html: string, text: string }>}
 */
export async function renderSummer2026AlmostEndEmail(props) {
  const element = <Summer2026AlmostEnd {...props} />;
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return { html, text };
}
