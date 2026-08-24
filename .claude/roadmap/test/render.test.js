// .claude/roadmap/test/render.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { sourceRows, backlogRows, renderChangeReport } = require('../lib/render');
const { makeRenamer } = require('../lib/rename');

const records = [{ sym: 'SYM-2561', milestone: 'v8.7 (Q3 2026)', product: 'Workspace', feature: 'Autosave Payment Progress', theme: 'UX', priority: 2, prob: '1-Yes', description: 'Autosaves.' }];
const aha = new Map([['SYM-2561', { name: '92481 - Autosave - Implement', initiative: 'New Payment Tracker', release: 'Release 8.6.50x', status: 'In development', prioritization: 'Liberty' }]]);
const prev = new Map([['SYM-2561', { priority: 17 }]]);

test('sourceRows has correct header and row order', () => {
  const rows = sourceRows(records);
  assert.deepStrictEqual(rows[0], ['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description']);
  assert.strictEqual(rows[1][4], 'SYM-2561');
  assert.strictEqual(rows[1][6], '1-Yes');
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
