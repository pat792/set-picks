import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const registryPath = path.join(root, 'docs/seo/query-registry.json');

const REQUIRED_FIELDS = ['id', 'query', 'intent', 'targetPath', 'priority', 'notes'];
const INTENTS = new Set(['stats', 'game', 'brand', 'geo']);
const PRIORITIES = new Set(['P0', 'P1', 'P2']);
const REQUIRED_IDS = ['C1', 'C6', 'C7', 'S1', 'S3'];
const FAN_STRINGS = [
  'bustouts summer tour 2026',
  'bustout list this tour',
  'tour setlist stats',
  'unique songs played this tour',
];

describe('SEO query registry (#931)', () => {
  const raw = readFileSync(registryPath, 'utf8');
  const registry = JSON.parse(raw);
  const queries = registry.queries;

  it('parses and exposes a queries array', () => {
    assert.equal(typeof registry.schemaVersion, 'number');
    assert.ok(Array.isArray(queries));
    assert.ok(queries.length >= 14, 'seed B1–B3, C1–C7, S1–S4 plus fan strings');
  });

  it('rows have required fields, enums, and unique ids', () => {
    const ids = new Set();
    for (const row of queries) {
      for (const field of REQUIRED_FIELDS) {
        assert.equal(typeof row[field], 'string', `${row.id || '?'} missing ${field}`);
        assert.ok(row[field].length > 0, `${row.id} empty ${field}`);
      }
      assert.ok(INTENTS.has(row.intent), `${row.id} bad intent ${row.intent}`);
      assert.ok(PRIORITIES.has(row.priority), `${row.id} bad priority ${row.priority}`);
      assert.ok(row.targetPath.startsWith('/'), `${row.id} targetPath must be a path`);
      assert.notEqual(row.targetPath, '/phish-picks', `${row.id} must not target gated /phish-picks`);
      assert.equal(ids.has(row.id), false, `duplicate id ${row.id}`);
      ids.add(row.id);
    }
  });

  it('includes required ids C1, C6, C7, S1, S3', () => {
    const ids = new Set(queries.map((row) => row.id));
    for (const id of REQUIRED_IDS) {
      assert.ok(ids.has(id), `missing required id ${id}`);
    }
    assert.equal(queries.find((row) => row.id === 'C6')?.query, 'phish setlist prediction');
    assert.equal(queries.find((row) => row.id === 'C7')?.query, 'phish picks');
  });

  it('covers #931 fan strings and S1–S3', () => {
    const byId = Object.fromEntries(queries.map((row) => [row.id, row]));
    const querySet = new Set(queries.map((row) => row.query));
    for (const q of FAN_STRINGS) {
      assert.ok(querySet.has(q), `missing fan string: ${q}`);
    }
    assert.equal(byId.S1?.intent, 'stats');
    assert.equal(byId.S2?.intent, 'stats');
    assert.equal(byId.S3?.intent, 'stats');
    assert.equal(byId.S1?.targetPath, '/tour-stats');
    assert.equal(byId.S3?.targetPath, '/tour-stats/2026-summer-tour');
  });
});
