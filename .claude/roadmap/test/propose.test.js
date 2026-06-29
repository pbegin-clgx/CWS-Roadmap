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

test('applyNextAssessment promotes to next release when next Assessment commits it', () => {
  const next = new Map([['SYM-1', { include: '1-Yes' }], ['SYM-2', { include: '3-No' }]]);
  assert.strictEqual(applyNextAssessment('Future', 'SYM-1', next, { nextRelease: '8.8' }), '8.8');
  assert.strictEqual(applyNextAssessment('Future', 'SYM-2', next, { nextRelease: '8.8' }), 'Future');
  assert.strictEqual(applyNextAssessment('Future', 'SYM-9', next, { nextRelease: '8.8' }), 'Future'); // not present
  assert.strictEqual(applyNextAssessment('Future', 'SYM-1', null, { nextRelease: '8.8' }), 'Future'); // no next assess
});
