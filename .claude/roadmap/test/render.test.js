// .claude/roadmap/test/render.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { sourceRows, backlogRows, renderChangeReport } = require('../lib/render');

const records = [{ sym: 'SYM-2561', milestone: 'v8.7 (Q3 2026)', product: 'Workspace', feature: 'Autosave Payment Progress', theme: 'UX', priority: 2, prob: '1-Yes', description: 'Autosaves.' }];
const aha = new Map([['SYM-2561', { name: '92481 - Autosave - Implement', initiative: 'New Payment Tracker', release: 'Release 8.6.50x', status: 'In development', prioritization: 'Liberty' }]]);
const prev = new Map([['SYM-2561', { priority: 17 }]]);

test('sourceRows has correct header and row order', () => {
  const rows = sourceRows(records);
  assert.deepStrictEqual(rows[0], ['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description']);
  assert.strictEqual(rows[1][4], 'SYM-2561');
  assert.strictEqual(rows[1][6], '1-Yes');
});

test('backlogRows maps Old/New priority and 11 columns', () => {
  const rows = backlogRows(records, aha, prev);
  assert.strictEqual(rows[0].length, 11);
  assert.deepStrictEqual(rows[0], ['Feature reference #','Old Priority','New Priority','Feature name','Initiative name','Release name','Feature status','Effort - man days','Dev Complete Rate','Prioritization','Feature tags']);
  assert.strictEqual(rows[1][1], 17); // Old Priority from prev
  assert.strictEqual(rows[1][2], 2);  // New Priority current
  assert.strictEqual(rows[1][4], 'New Payment Tracker');
});

test('renderChangeReport includes UP and DOWN sections', () => {
  const md = renderChangeReport({ delivered: [{ sym: 'SYM-1', feature: 'X' }], added: [], priorityUp: [{ sym: 'SYM-2', feature: 'Y', from: 17, to: 2 }], priorityDown: [], reBucketed: [] });
  assert.match(md, /## Priority Changed UP/);
  assert.match(md, /SYM-2.*Y.*17.*2/);
  assert.match(md, /## Delivered/);
});
