// .claude/roadmap/test/propose.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { proposeCut, applyNextAssessment } = require('../lib/propose');

test('proposeCut returns median priority as cut88 and 100 as cutFuture', () => {
  const tail = [10, 20, 30, 40, 50].map((p, i) => ({ sym: `SYM-${i}`, priority: p }));
  const { cut88, cutFuture } = proposeCut(tail);
  assert.strictEqual(cut88, 30); // median
  assert.strictEqual(cutFuture, 100);
});

test('proposeCut ignores infinite priorities', () => {
  const tail = [{ sym: 'a', priority: 10 }, { sym: 'b', priority: 30 }, { sym: 'c', priority: Infinity }];
  assert.strictEqual(proposeCut(tail).cut88, 20); // median of 10,30
});

const OPTS = { currentRelease: '8.7', nextRelease: '8.8', futureLabel: 'Future', cutFuture: 100 };

test('applyNextAssessment promotes to next release when next Assessment commits it', () => {
  const next = new Map([['SYM-1', { include: '1-Yes', priority: 5 }]]);
  assert.strictEqual(applyNextAssessment('Future', 'SYM-1', next, OPTS), '8.8');
});

test('applyNextAssessment leaves the priority-driven result alone when the SYM has no row in the next Assessment', () => {
  const next = new Map([['SYM-1', { include: '1-Yes', priority: 5 }]]);
  assert.strictEqual(applyNextAssessment('Future', 'SYM-9', next, OPTS), 'Future'); // not present
  assert.strictEqual(applyNextAssessment('Future', 'SYM-1', null, OPTS), 'Future'); // no next assess at all
});

test('applyNextAssessment demotes OUT of the next release when its own Assessment says No/Maybe, using ITS OWN priority for Future vs. Drop', () => {
  const next = new Map([
    ['SYM-2', { include: '3-No', priority: 50 }],   // excluded from 8.8, but priority still <= cutFuture -> Future
    ['SYM-3', { include: '2.3-Maybe', priority: 500 }], // excluded from 8.8, priority worse than cutFuture -> Drop
  ]);
  assert.strictEqual(applyNextAssessment('v8.8 (Q4 2026)', 'SYM-2', next, OPTS), 'Future');
  assert.strictEqual(applyNextAssessment('v8.8 (Q4 2026)', 'SYM-3', next, OPTS), 'DROP');
});

test('applyNextAssessment never reconsiders a feature already committed to the current release', () => {
  const next = new Map([['SYM-1', { include: '3-No', priority: 500 }]]);
  assert.strictEqual(applyNextAssessment('8.7', 'SYM-1', next, OPTS), '8.7'); // stays put despite a damning next-assessment verdict
});
