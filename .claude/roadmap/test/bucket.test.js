const { test } = require('node:test');
const assert = require('node:assert');
const { classify, isInternal } = require('../lib/bucket');

const OPTS = { currentRelease: '8.7', nextRelease: '8.8', futureLabel: 'Future', cut88: 72, cutFuture: 110 };
const c = (a) => classify(a, OPTS);

test('1-Yes / 2.1 / 2.2 go to current release', () => {
  assert.strictEqual(c({ include: '1-Yes', releaseInAha: 'Release 8.7', priority: 5 }), '8.7');
  assert.strictEqual(c({ include: '2.1-Maybe', releaseInAha: 'Release 8.7', priority: 88 }), '8.7');
  assert.strictEqual(c({ include: '2.2-Maybe', releaseInAha: 'Design Backlog', priority: 44 }), '8.7');
});

test('2.3 / 2.4 go to next release only within the roadmap window (<= cutFuture)', () => {
  assert.strictEqual(c({ include: '2.3-Maybe', releaseInAha: 'Product Backlog', priority: 50 }), '8.8');
  assert.strictEqual(c({ include: '2.4-Maybe', releaseInAha: 'Design Backlog', priority: 110 }), '8.8'); // at the line
  assert.strictEqual(c({ include: '2.4-Maybe', releaseInAha: 'Design Backlog', priority: 123 }), 'Future'); // worse than line
  assert.strictEqual(c({ include: '2.3-Maybe', releaseInAha: 'Product Backlog', priority: 150 }), 'Future');
});

test('3-No reaches the next release ONLY via an explicit Aha next-release tag (no priority promotion)', () => {
  assert.strictEqual(c({ include: '3-No', releaseInAha: 'Release 8.8', priority: 999 }), '8.8'); // explicit next tag wins
  assert.strictEqual(c({ include: '3-No', releaseInAha: 'Release 8.9', priority: 5 }), 'Future'); // beyond next
  assert.strictEqual(c({ include: '3-No', releaseInAha: 'Product Backlog', priority: 40 }), 'Future'); // high priority but no tag -> Future (was 8.8 under old cut88)
  assert.strictEqual(c({ include: '3-No', releaseInAha: 'Product Backlog', priority: 90 }), 'Future'); // <= cutFuture
  assert.strictEqual(c({ include: '3-No', releaseInAha: 'Product Backlog', priority: 130 }), 'DROP'); // beyond window
});

test('nextRelease works as full quarter label', () => {
  const c2 = (a) => classify(a, { ...OPTS, nextRelease: 'v8.8 (Q4 2026)' });
  assert.strictEqual(c2({ include: '3-No', releaseInAha: 'Release 8.8', priority: 999 }), 'v8.8 (Q4 2026)');
});

test('release beyond next goes to future', () => {
  assert.strictEqual(c({ include: '3-No', releaseInAha: 'Release 9.0', priority: 5 }), 'Future');
});

test('isInternal flags tech-debt/internal summaries', () => {
  assert.ok(isInternal('93034 - Incorporate new 8.7 translations for all markets - Implement'));
  assert.ok(isInternal('Migrate UX to use Symbility-net-lib library - Implement'));
  assert.ok(!isInternal('Autosave Payment Progress - Implement'));
});
