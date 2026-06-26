// .claude/roadmap/test/deck-data.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { summaryTable, detailedTable } = require('../lib/deck-data');

test('summaryTable splits header from product rows and drops blank rows', () => {
  const rows = [
    ['Product', 'v8.7 (Q3 2026)', 'v8.8 (Q4 2026)', 'Future (Q4 2026 - Q1 2027)'],
    ['Workspace', '• A\n• B', '• C', ''],
    ['', '', '', ''],
    ['Estimate', '• D', '', '• E'],
  ];
  const t = summaryTable(rows);
  assert.deepStrictEqual(t.header, ['Product', 'v8.7 (Q3 2026)', 'v8.8 (Q4 2026)', 'Future (Q4 2026 - Q1 2027)']);
  assert.strictEqual(t.body.length, 2); // blank row dropped
  assert.deepStrictEqual(t.body[0], ['Workspace', '• A\n• B', '• C', '']);
});

test('detailedTable splits header from feature rows and drops blank rows', () => {
  const rows = [
    ['Product', 'Feature', 'Description'],
    ['Workspace', 'Autosave (SYM-1)', 'Autosaves work.'],
    ['', '', ''],
  ];
  const t = detailedTable(rows);
  assert.deepStrictEqual(t.header, ['Product', 'Feature', 'Description']);
  assert.strictEqual(t.body.length, 1);
  assert.strictEqual(t.body[0][1], 'Autosave (SYM-1)');
});
