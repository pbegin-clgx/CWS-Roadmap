// .claude/roadmap/test/deck-theme.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { loadTheme } = require('../lib/deck-theme');

test('loadTheme reads the committed corporate palette and fonts', () => {
  const t = loadTheme(path.join(__dirname, '..', 'deck-theme.json'));
  assert.strictEqual(t.colors.dk1, '1E1405');
  assert.strictEqual(t.colors.lt1, 'F7EFE2');
  assert.strictEqual(t.colors.accent1, 'FFCD2E');
  assert.strictEqual(t.majorFont, 'TWK Everett');
});

test('loadTheme throws a clear error when a required color is missing', () => {
  const os = require('os'); const fs = require('fs');
  const bad = path.join(os.tmpdir(), `bad-theme-${process.pid}.json`);
  fs.writeFileSync(bad, JSON.stringify({ colors: { dk1: '000000' }, majorFont: 'X', minorFont: 'X' }));
  assert.throws(() => loadTheme(bad), /required color/i);
  fs.unlinkSync(bad);
});
