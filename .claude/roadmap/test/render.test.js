// .claude/roadmap/test/render.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { sourceRows, backlogRows, renderChangeReport } = require('../lib/render');
const { makeRenamer } = require('../lib/rename');

const records = [{ sym: 'SYM-2561', milestone: 'v8.7 (Q3 2026)', product: 'Workspace', feature: 'Autosave Payment Progress', theme: 'UX', priority: 2, prob: '1-Yes', description: 'Autosaves.' }];
const aha = new Map([['SYM-2561', { name: '92481 - Autosave - Implement', initiative: 'New Payment Tracker', release: 'Release 8.6.50x', status: 'In development', prioritization: 'Liberty' }]]);
const prev = new Map([['SYM-2561', { priority: 17 }]]);

test('sourceRows has correct header and row order (single assessment file -> one bare Prob column)', () => {
  const rows = sourceRows(records);
  assert.deepStrictEqual(rows[0], ['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description']);
  assert.strictEqual(rows[1][4], 'SYM-2561');
  assert.strictEqual(rows[1][6], '1-Yes');
});

test('sourceRows adds one labeled Prob column per assessment file, independent of milestone', () => {
  const recs = [
    { sym: 'SYM-1', milestone: 'v8.7 (Q3 2026)', product: 'Workspace', feature: 'A', theme: 'UX', priority: 5, probs: ['1-Yes', '3-No'], description: 'desc A' },
    { sym: 'SYM-2', milestone: 'v8.8 (Q4 2026)', product: 'Workspace', feature: 'B', theme: 'UX', priority: 10, probs: ['3-No', '1-Yes'], description: 'desc B' },
  ];
  const rows = sourceRows(recs, ['8.7', '8.8']);
  assert.deepStrictEqual(rows[0], ['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob 8.7','Prob 8.8','Description']);
  assert.strictEqual(rows[1][6], '1-Yes'); // SYM-1 Prob 8.7
  assert.strictEqual(rows[1][7], '3-No');  // SYM-1 Prob 8.8
  assert.strictEqual(rows[1][8], 'desc A'); // Description shifted over
  assert.strictEqual(rows[2][6], '3-No'); // SYM-2 Prob 8.7 -- pulled independently even though it's an 8.8 feature
  assert.strictEqual(rows[2][7], '1-Yes'); // SYM-2 Prob 8.8
});

test('sourceRows leaves a Prob column blank when a record has no value for it', () => {
  const recs = [{ sym: 'SYM-9', milestone: 'Future (Q1-Q2 2027)', product: 'Workspace', feature: 'C', theme: '', priority: 90, probs: [], description: 'd' }];
  const rows = sourceRows(recs, ['8.7', '8.8']);
  assert.strictEqual(rows[1][6], '');
  assert.strictEqual(rows[1][7], '');
});

test('backlogRows maps Old/New priority and 12 columns incl. Change', () => {
  const rows = backlogRows(records, aha, prev);
  assert.strictEqual(rows[0].length, 12);
  assert.deepStrictEqual(rows[0], ['Feature reference #','Old Priority','New Priority','Feature name','Initiative name','Release name','Feature status','Effort - man days','Dev Complete Rate','Prioritization','Feature tags','Change']);
  assert.strictEqual(rows[1][1], 17); // Old Priority from prev
  assert.strictEqual(rows[1][2], 2);  // New Priority current
  assert.strictEqual(rows[1][4], 'New Payment Tracker');
  assert.strictEqual(rows[1][11], 'Unchanged'); // no changes passed -> Unchanged
});

test('backlogRows Change column reflects change type and combines tags', () => {
  const changes = { added: [], priorityUp: [], priorityDown: [{ sym: 'SYM-2561' }], reBucketed: [{ sym: 'SYM-2561' }], delivered: [] };
  const rows = backlogRows(records, aha, prev, changes);
  assert.strictEqual(rows[1][11], 'Priority Down, Re-bucketed'); // combined tags
});

test('backlogRows tags a negative-priority record Delivered without removing it from the Backlog row set', () => {
  // Delivered is now purely a label — the record stays a normal Backlog row (and Source stays
  // untouched by this function entirely), it's just tagged, possibly combined with other tags.
  const changes = { added: [], priorityUp: [], priorityDown: [{ sym: 'SYM-2561' }], reBucketed: [], delivered: [{ sym: 'SYM-2561', feature: 'Autosave Payment Progress' }] };
  const rows = backlogRows(records, aha, prev, changes);
  assert.strictEqual(rows.length, 2); // header + the one record, nothing appended
  assert.strictEqual(rows[1][11], 'Delivered, Priority Down');
});

test('backlogRows applies the renamer to the Aha-sourced feature name', () => {
  const recs = [{ sym: 'SYM-3', milestone: 'v8.7 (Q3 2026)', product: 'Estimate for iOS', feature: 'X', theme: '', priority: 1, prob: '1-Yes', description: '' }];
  const ah = new Map([['SYM-3', { name: '87374 - Estimate Mobile - Autosave Photos - Implement' }]]);
  const renamer = makeRenamer([{ from: 'Estimate Mobile', to: 'Estimate for iOS' }]);
  const rows = backlogRows(recs, ah, new Map(), {}, renamer);
  assert.strictEqual(rows[1][3], '87374 - Estimate for iOS - Autosave Photos - Implement');
});

test('backlogRows marks a brand-new feature as New', () => {
  const changes = { added: [{ sym: 'SYM-2561' }], priorityUp: [], priorityDown: [], reBucketed: [], delivered: [] };
  const rows = backlogRows(records, aha, prev, changes);
  assert.strictEqual(rows[1][11], 'New');
});

test('backlogRows fills Effort (idx 7) and Dev Complete Rate (idx 8) from assessMeta', () => {
  const assessMeta = { 'SYM-2561': { effort: 100, devComplete: 0.4 } };
  const rows = backlogRows(records, aha, prev, {}, undefined, assessMeta);
  assert.strictEqual(rows[1][7], 100); // Effort - man days
  assert.strictEqual(rows[1][8], 0.4); // Dev Complete Rate
});

test('renderChangeReport includes UP and DOWN sections', () => {
  const md = renderChangeReport({ delivered: [{ sym: 'SYM-1', feature: 'X' }], added: [], priorityUp: [{ sym: 'SYM-2', feature: 'Y', from: 17, to: 2 }], priorityDown: [], reBucketed: [] });
  assert.match(md, /## Priority Changed UP/);
  assert.match(md, /SYM-2.*Y.*17.*2/);
  assert.match(md, /## Delivered/);
});
