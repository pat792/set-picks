/**
 * Minimal markdown → HTML for legal boot shells (#916).
 * Supports the subset used by docs/TERMS_OF_SERVICE.md + docs/PRIVACY_POLICY.md:
 * headings, paragraphs, unordered lists, links, bold, italics.
 * No HTML passthrough (matches react-markdown skipHtml).
 */

/**
 * Strip leading `# Title` and `**Last updated:** …` so layout header isn't duplicated.
 * Mirrors src/features/legal/ui/LegalMarkdownRenderer.jsx stripFrontmatter.
 *
 * @param {string} md
 * @returns {string}
 */
export function stripLegalFrontmatter(md) {
  if (typeof md !== 'string') return '';
  const lines = md.split('\n');
  let start = 0;
  const maxScan = Math.min(lines.length, 25);
  for (let i = 0; i < maxScan; i++) {
    const line = lines[i].trim();
    if (line === '') {
      start = i + 1;
      continue;
    }
    if (line.startsWith('# ')) {
      start = i + 1;
      continue;
    }
    if (line.startsWith('**Last updated')) {
      start = i + 1;
      continue;
    }
    break;
  }
  return lines.slice(start).join('\n');
}

/**
 * @param {string} md
 * @returns {string | null} e.g. "May 8, 2026"
 */
export function extractLegalLastUpdated(md) {
  if (typeof md !== 'string') return null;
  const m = md.match(/\*\*Last updated:\*\*\s*(.+)/i);
  if (!m) return null;
  return m[1].trim() || null;
}

/**
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Inline: links, bold, italics (order: links first, then bold, then italics).
 * @param {string} text
 * @returns {string}
 */
function renderInline(text) {
  let s = escapeHtml(text);
  // [label](url)
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, label, href) => {
      const safeHref =
        typeof href === 'string' && href.trim() ? href.trim() : '#';
      return `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    },
  );
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Single-asterisk italics after bold so ** is not re-matched.
  s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return s;
}

/**
 * @param {string} md body without frontmatter
 * @returns {string} HTML fragment
 */
export function legalMarkdownToHtml(md) {
  const body = typeof md === 'string' ? md.replace(/\r\n/g, '\n').trim() : '';
  if (!body) return '';

  const lines = body.split('\n');
  /** @type {string[]} */
  const out = [];
  /** @type {string[]} */
  let para = [];
  /** @type {string[]} */
  let listItems = [];

  function flushPara() {
    if (!para.length) return;
    const text = para.join(' ').trim();
    para = [];
    if (text) out.push(`<p>${renderInline(text)}</p>`);
  }

  function flushList() {
    if (!listItems.length) return;
    out.push('<ul>');
    for (const item of listItems) {
      out.push(`<li>${renderInline(item)}</li>`);
    }
    out.push('</ul>');
    listItems = [];
  }

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushPara();
      flushList();
      continue;
    }

    const h2 = trimmed.match(/^##\s+(.+)$/);
    if (h2) {
      flushPara();
      flushList();
      out.push(`<h2>${renderInline(h2[1])}</h2>`);
      continue;
    }

    const h3 = trimmed.match(/^###\s+(.+)$/);
    if (h3) {
      flushPara();
      flushList();
      out.push(`<h3>${renderInline(h3[1])}</h3>`);
      continue;
    }

    const li = trimmed.match(/^-\s+(.+)$/);
    if (li) {
      flushPara();
      listItems.push(li[1]);
      continue;
    }

    flushList();
    para.push(trimmed);
  }

  flushPara();
  flushList();
  return out.join('\n');
}
