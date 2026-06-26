const { test } = require('node:test');
const assert = require('node:assert');
const { summaryRows, detailedRows, detailedSheetName } = require('../lib/render');

const MS = ['v8.7 (Q3 2026)', 'v8.8 (Q4 2026)', 'Future (Q4 2026 - Q1 2027)'];
const records = [
  { sym: 'SYM-1', milestone: 'v8.7 (Q3 2026)', product: 'Workspace', feature: 'Autosave', description: 'Autosaves work.' },
  { sym: 'SYM-2', milestone: 'v8.7 (Q3 2026)', product: 'Workspace', feature: 'Coverage filter', description: 'Filter by coverage.' },
  { sym: 'SYM-3', milestone: 'v8.8 (Q4 2026)', product: 'Estimate', feature: 'Waste settings', description: 'Estimate-level waste.' },
  { sym: 'SYM-2296, SYM-2297, SYM-2298', milestone: 'Future (Q4 2026 - Q1 2027)', product: 'Reporting', feature: 'Contents reporting', description: 'Contents fields.' },
];

test('summaryRows builds a Product x milestone matrix with bulleted cells in canonical product order', () => {
  const rows = summaryRows(records, MS);
  assert.deepStrictEqual(rows[0], ['Product', ...MS]);
  // Workspace before Estimate before Reporting (canonical order)
  assert.deepStrictEqual(rows.map((r) => r[0]), ['Product', 'Workspace', 'Estimate', 'Reporting']);
  // Workspace v8.7 cell has both features as a newline-separated bullet list
  const wsRow = rows.find((r) => r[0] === 'Workspace');
  assert.strictEqual(wsRow[1], '• Autosave\n• Coverage filter');
  assert.strictEqual(wsRow[2], ''); // Workspace has nothing in v8.8
});

test('detailedRows filters to one milestone and appends the SYM code (incl. multi-code)', () => {
  const q3 = detailedRows(records, 'v8.7 (Q3 2026)');
  assert.deepStrictEqual(q3[0], ['Product', 'Feature', 'Description']);
  assert.strictEqual(q3.length, 3); // header + 2 Workspace rows
  assert.strictEqual(q3[1][1], 'Autosave (SYM-1)');
  const fut = detailedRows(records, 'Future (Q4 2026 - Q1 2027)');
  assert.strictEqual(fut[1][1], 'Contents reporting (SYM-2296, SYM-2297, SYM-2298)'); // multi-code appended
});

test('detailedSheetName derives a safe, short tab name', () => {
  assert.strictEqual(detailedSheetName('v8.7 (Q3 2026)'), 'Detailed 8.7');
  assert.strictEqual(detailedSheetName('v8.8 (Q4 2026)'), 'Detailed 8.8');
  assert.strictEqual(detailedSheetName('Future (Q4 2026 - Q1 2027)'), 'Detailed Future');
});
