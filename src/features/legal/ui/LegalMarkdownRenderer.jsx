import React from 'react';
import Markdown from 'react-markdown';

/**
 * Renders a raw markdown string as React elements. Strips the leading H1 and
 * "Last updated" line since LegalPageLayout already renders those from props.
 *
 * @param {{ content: string }} props
 */
export default function LegalMarkdownRenderer({ content }) {
  const body = stripFrontmatter(content);

  return (
    <Markdown
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {body}
    </Markdown>
  );
}

/**
 * Remove the leading `# Title` line and the `**Last updated:** ...` line
 * so the layout's own header + date aren't duplicated.
 */
function stripFrontmatter(md) {
  const lines = md.split('\n');
  let start = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === '') { start = i + 1; continue; }
    if (line.startsWith('# ')) { start = i + 1; continue; }
    if (line.startsWith('**Last updated')) { start = i + 1; continue; }
    break;
  }
  return lines.slice(start).join('\n');
}
