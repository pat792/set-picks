import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  extractLegalLastUpdated,
  legalMarkdownToHtml,
  stripLegalFrontmatter,
} from './legalMarkdownToHtml.mjs';

describe('legalMarkdownToHtml', () => {
  it('strips title + last-updated frontmatter', () => {
    const md = `# Terms of Service

**Last updated:** May 8, 2026

Hello world.
`;
    assert.equal(stripLegalFrontmatter(md).trim(), 'Hello world.');
    assert.equal(extractLegalLastUpdated(md), 'May 8, 2026');
  });

  it('renders headings, lists, links, and bold', () => {
    const html = legalMarkdownToHtml(`## Accounts
You must create an account.

### Nested
- **Bold** item
- See [Phish.Net](https://phish.net).
`);
    assert.match(html, /<h2>Accounts<\/h2>/);
    assert.match(html, /<h3>Nested<\/h3>/);
    assert.match(html, /<strong>Bold<\/strong>/);
    assert.match(html, /href="https:\/\/phish\.net"/);
    assert.match(html, /rel="noopener noreferrer"/);
  });
});
