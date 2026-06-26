const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os');
const path = require('path');
const fs = require('fs');
const { readSheet, writeSheets } = require('../lib/xlsx-io');

test('writeSheets then readSheet round-trips rows', () => {
  const tmp = path.join(os.tmpdir(), `xlsx-io-${process.pid}.xlsx`);
  writeSheets(tmp, { Data: [['A', 'B'], ['1', '2'], ['', 'x']] });
  const rows = readSheet(tmp, 'Data');
  assert.deepStrictEqual(rows[0], ['A', 'B']);
  assert.strictEqual(rows[1][0], '1');
  assert.strictEqual(rows[2][0], ''); // blank preserved
  fs.unlinkSync(tmp);
});
