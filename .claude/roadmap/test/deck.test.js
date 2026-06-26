// .claude/roadmap/test/deck.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os'); const path = require('path'); const fs = require('fs');
const JSZip = require('jszip');
const { writeSheets } = require('../lib/xlsx-io');
const { loadTheme } = require('../lib/deck-theme');
const { deckFromWorkbook } = require('../lib/deck');

const tmp = (n, ext) => path.join(os.tmpdir(), `${n}-${process.pid}-${Math.floor(performance.now())}.${ext}`);

async function slideText(pptxPath) {
  const zip = await JSZip.loadAsync(fs.readFileSync(pptxPath));
  const names = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  let all = '';
  for (const n of names) all += await zip.file(n).async('string');
  return { count: names.length, xml: all };
}

test('deckFromWorkbook builds a themed deck with section, summary, and detailed content', async () => {
  const src = tmp('source', 'xlsx'); const out = tmp('deck', 'pptx');
  writeSheets(src, {
    Summary: [
      ['Product', 'v8.7 (Q3 2026)', 'v8.8 (Q4 2026)', 'Future (Q4 2026 - Q1 2027)'],
      ['Workspace', '• Autosave', '', ''],
    ],
    'Detailed 8.7': [
      ['Product', 'Feature', 'Description'],
      ['Workspace', 'Autosave (SYM-1)', 'Autosaves work.'],
    ],
    'Detailed 8.8': [['Product', 'Feature', 'Description']],
    'Detailed Future': [['Product', 'Feature', 'Description']],
  });
  const theme = loadTheme(path.join(__dirname, '..', 'deck-theme.json'));
  const result = await deckFromWorkbook(src, theme, out);
  assert.strictEqual(result, out);
  assert.ok(fs.existsSync(out) && fs.statSync(out).size > 1000, 'a non-trivial pptx was written');
  const { count, xml } = await slideText(out);
  assert.ok(count >= 3, `expected several slides, got ${count}`);
  assert.match(xml, /Release Plan/);     // section divider
  assert.match(xml, /Workspace/);        // summary + detailed product
  assert.match(xml, /SYM-1/);            // detailed feature code
  fs.unlinkSync(src); fs.unlinkSync(out);
});
