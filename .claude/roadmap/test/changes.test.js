// .claude/roadmap/test/changes.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { detectChanges } = require('../lib/changes');

const prev = new Map([
  ['SYM-1', { milestone: '8.7', feature: 'Shipped thing', priority: 5 }],
  ['SYM-2', { milestone: '8.7', feature: 'Moved up', priority: 17 }],
  ['SYM-3', { milestone: 'Future', feature: 'Slid down', priority: 30 }],
  ['SYM-4', { milestone: '8.7', feature: 'Re-bucketed', priority: 9 }],
]);
const current = [
  { sym: 'SYM-2', milestone: '8.7', feature: 'Moved up', priority: 2 },
  { sym: 'SYM-3', milestone: 'Future', feature: 'Slid down', priority: 45 },
  { sym: 'SYM-4', milestone: '8.8', feature: 'Re-bucketed', priority: 9 },
  { sym: 'SYM-5', milestone: '8.8', feature: 'Brand new', priority: 60 },
];
const assessmentSyms = new Set(['SYM-2', 'SYM-3', 'SYM-4', 'SYM-5']); // SYM-1 absent => delivered

test('detectChanges classifies delivered/added/up/down/rebucketed', () => {
  const ch = detectChanges(prev, current, assessmentSyms);
  assert.deepStrictEqual(ch.delivered, [{ sym: 'SYM-1', feature: 'Shipped thing' }]);
  assert.deepStrictEqual(ch.added, [{ sym: 'SYM-5', milestone: '8.8', feature: 'Brand new' }]);
  assert.deepStrictEqual(ch.priorityUp, [{ sym: 'SYM-2', feature: 'Moved up', from: 17, to: 2 }]);
  assert.deepStrictEqual(ch.priorityDown, [{ sym: 'SYM-3', feature: 'Slid down', from: 30, to: 45 }]);
  assert.deepStrictEqual(ch.reBucketed, [{ sym: 'SYM-4', feature: 'Re-bucketed', from: '8.7', to: '8.8' }]);
});
