# /roadmap-deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A separate `/roadmap-deck` command that reads the Source workbook's `Summary` + `Detailed *` sheets and generates an on-brand PowerPoint (section dividers + Summary matrix + per-milestone Detailed slides) styled with Cotality's corporate palette and font.

**Architecture:** Fresh deck built with `pptxgenjs`; pagination via the library's table `autoPage`. Corporate theme read from a committed `deck-theme.json`. New modules under `.claude/roadmap/`: `lib/deck-theme.js` (load theme), `lib/deck-data.js` (sheet → table data, pure), `lib/deck.js` (build the pptx), a `deck` subcommand in `run.js`, and the `/roadmap-deck` skill. Consumes the existing `readSheet` (xlsx-io) and `detailedSheetName` (render.js).

**Tech Stack:** Node.js, `pptxgenjs` (deck generation), `jszip` (read the generated deck back in tests), `node:test`.

## Global Constraints

- Work on branch `feature/roadmap-deck` (already created; do NOT commit to `main`).
- Runtime is Node.js only. Tests run with `node --test` from `.claude/roadmap`.
- Corporate theme values (6-hex, no `#`): `dk1=1E1405` (Earth), `lt1=F7EFE2` (Cream), `dk2=000000`, `lt2=FFFFFF`, `accent1=FFCD2E` (Sunburst), `accent2=FF6E80`, `accent3=FF8E65`, `accent4=DD37D2`, `accent5=148DEF`, `accent6=339B62`. Font `TWK Everett` (major and minor).
- Slide styling: Cream (`lt1`) slide background; section dividers Earth (`dk1`) background with Cream (`lt1`) title and a Sunburst (`accent1`) accent bar; table header row fill `dk1` with `lt1` text; body text `dk1`; font TWK Everett. 16:9 widescreen (`LAYOUT_WIDE`).
- Output file name: `Product Roadmap Deck <YYYYMMDD>.pptx`.
- Milestone labels and Detailed sheet names are NOT hard-coded: read milestone labels from the `Summary` sheet's header row (columns 2+); derive each Detailed sheet name with `detailedSheetName(label)` from `lib/render.js`.

---

### Task 1: Dependencies + corporate theme config + loader

**Files:**
- Modify: `.claude/roadmap/package.json` (add `pptxgenjs`, `jszip`)
- Create: `.claude/roadmap/deck-theme.json`
- Create: `.claude/roadmap/lib/deck-theme.js`
- Test: `.claude/roadmap/test/deck-theme.test.js`

**Interfaces:**
- Produces: `loadTheme(path) -> { colors: {dk1,lt1,dk2,lt2,accent1..6}, majorFont, minorFont }`. Throws a clear error if the file is missing or a required color key is absent.

- [ ] **Step 1: Add dependencies and install**

Edit `.claude/roadmap/package.json` so `dependencies` includes (keep the existing `xlsx`):
```json
  "dependencies": { "xlsx": "^0.18.5", "pptxgenjs": "^3.12.0", "jszip": "^3.10.1" }
```
Run: `cd .claude/roadmap && npm install`
Expected: exit 0; `node_modules/pptxgenjs` and `node_modules/jszip` exist.

- [ ] **Step 2: Create `deck-theme.json`**

```json
{
  "colors": {
    "dk1": "1E1405", "lt1": "F7EFE2", "dk2": "000000", "lt2": "FFFFFF",
    "accent1": "FFCD2E", "accent2": "FF6E80", "accent3": "FF8E65",
    "accent4": "DD37D2", "accent5": "148DEF", "accent6": "339B62"
  },
  "majorFont": "TWK Everett",
  "minorFont": "TWK Everett"
}
```

- [ ] **Step 3: Write the failing test**

```javascript
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
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd .claude/roadmap && node --test test/deck-theme.test.js`
Expected: FAIL — `Cannot find module '../lib/deck-theme'`.

- [ ] **Step 5: Implement `lib/deck-theme.js`**

```javascript
const fs = require('fs');

const REQUIRED = ['dk1', 'lt1', 'dk2', 'lt2', 'accent1', 'accent2', 'accent3', 'accent4', 'accent5', 'accent6'];

function loadTheme(path) {
  if (!path || !fs.existsSync(path)) throw new Error(`Theme file not found: ${path}`);
  const t = JSON.parse(fs.readFileSync(path, 'utf8'));
  const colors = t.colors || {};
  for (const k of REQUIRED) if (!colors[k]) throw new Error(`Theme is missing required color "${k}" in ${path}`);
  return { colors, majorFont: t.majorFont || 'Arial', minorFont: t.minorFont || 'Arial' };
}

module.exports = { loadTheme };
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd .claude/roadmap && node --test test/deck-theme.test.js`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add .claude/roadmap/package.json .claude/roadmap/package-lock.json .claude/roadmap/deck-theme.json .claude/roadmap/lib/deck-theme.js .claude/roadmap/test/deck-theme.test.js
git commit -m "feat(roadmap-deck): add pptxgenjs/jszip deps + corporate theme config and loader" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Sheet → table data transforms (pure)

**Files:**
- Create: `.claude/roadmap/lib/deck-data.js`
- Test: `.claude/roadmap/test/deck-data.test.js`

**Interfaces:**
- Consumes: raw sheet rows (`string[][]`, header-row-first) as returned by `readSheet`.
- Produces:
  - `summaryTable(rows) -> { header: string[], body: string[][] }` — header is `rows[0]`; body is the data rows that have a non-empty Product (col 0).
  - `detailedTable(rows) -> { header: string[], body: string[][] }` — header is `rows[0]` (`['Product','Feature','Description']`); body is data rows with a non-empty Product.

- [ ] **Step 1: Write the failing test**

```javascript
// .claude/roadmap/test/deck-data.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { summaryTable, detailedTable } = require('../lib/deck-data');

test('summaryTable splits header from product rows and drops blank rows', () => {
  const rows = [
    ['Product', 'v8.7 (Q3 2026)', 'v8.8 (Q4 2026)', 'Future (Q4 2026 - Q1 2027)'],
    ['Workspace', '• A\n• B', '• C', ''],
    ['', '', '', ''],
    ['Estimate', '• D', '', '• E'],
  ];
  const t = summaryTable(rows);
  assert.deepStrictEqual(t.header, ['Product', 'v8.7 (Q3 2026)', 'v8.8 (Q4 2026)', 'Future (Q4 2026 - Q1 2027)']);
  assert.strictEqual(t.body.length, 2); // blank row dropped
  assert.deepStrictEqual(t.body[0], ['Workspace', '• A\n• B', '• C', '']);
});

test('detailedTable splits header from feature rows and drops blank rows', () => {
  const rows = [
    ['Product', 'Feature', 'Description'],
    ['Workspace', 'Autosave (SYM-1)', 'Autosaves work.'],
    ['', '', ''],
  ];
  const t = detailedTable(rows);
  assert.deepStrictEqual(t.header, ['Product', 'Feature', 'Description']);
  assert.strictEqual(t.body.length, 1);
  assert.strictEqual(t.body[0][1], 'Autosave (SYM-1)');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/roadmap && node --test test/deck-data.test.js`
Expected: FAIL — `Cannot find module '../lib/deck-data'`.

- [ ] **Step 3: Implement `lib/deck-data.js`**

```javascript
function table(rows) {
  const all = rows || [];
  const header = all[0] || [];
  const body = all.slice(1).filter((r) => String(r[0] || '').trim() !== '');
  return { header, body };
}

const summaryTable = (rows) => table(rows);
const detailedTable = (rows) => table(rows);

module.exports = { summaryTable, detailedTable };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd .claude/roadmap && node --test test/deck-data.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add .claude/roadmap/lib/deck-data.js .claude/roadmap/test/deck-data.test.js
git commit -m "feat(roadmap-deck): add pure sheet->table transforms" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Deck builder (`buildDeck` + `deckFromWorkbook`)

**Files:**
- Create: `.claude/roadmap/lib/deck.js`
- Test: `.claude/roadmap/test/deck.test.js`

**Interfaces:**
- Consumes: `loadTheme` (Task 1), `summaryTable`/`detailedTable` (Task 2), `readSheet` (`lib/xlsx-io`), `detailedSheetName` (`lib/render`).
- Produces:
  - `buildDeck({ summary, detailedByMilestone }, theme, outPath) -> Promise<string>` — `summary` is a `{header, body}`; `detailedByMilestone` is `[{ milestone: string, table: {header, body} }]`. Writes the pptx to `outPath`, resolves to `outPath`.
  - `deckFromWorkbook(sourcePath, theme, outPath) -> Promise<string>` — reads `Summary` + each `Detailed <release>` sheet from the workbook, transforms, and calls `buildDeck`.

- [ ] **Step 1: Write the failing test**

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/roadmap && node --test test/deck.test.js`
Expected: FAIL — `Cannot find module '../lib/deck'`.

- [ ] **Step 3: Implement `lib/deck.js`**

```javascript
const PptxGenJS = require('pptxgenjs');
const { readSheet } = require('./xlsx-io');
const { detailedSheetName } = require('./render');
const { summaryTable, detailedTable } = require('./deck-data');

const GRID = 'D9D2C5';

function headerCells(header, theme) {
  return header.map((h) => ({ text: String(h), options: { bold: true, color: theme.colors.lt1, fill: { color: theme.colors.dk1 }, fontFace: theme.majorFont } }));
}

function addDivider(pptx, theme, title) {
  const s = pptx.addSlide();
  s.background = { color: theme.colors.dk1 };
  s.addText(String(title), { x: 0.6, y: 2.7, w: 12.1, h: 1.3, fontSize: 40, bold: true, color: theme.colors.lt1, fontFace: theme.majorFont });
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 4.1, w: 2.2, h: 0.14, fill: { color: theme.colors.accent1 } });
}

function addTableSlide(pptx, theme, title, table, colW) {
  const s = pptx.addSlide({ masterName: 'BRAND' });
  s.addText(String(title), { x: 0.4, y: 0.3, w: 12.5, h: 0.6, fontSize: 22, bold: true, color: theme.colors.dk1, fontFace: theme.majorFont });
  const rows = [headerCells(table.header, theme), ...table.body.map((r) => r.map((c) => String(c)))];
  s.addTable(rows, {
    x: 0.4, y: 1.05, w: 12.5, colW,
    autoPage: true, autoPageRepeatHeader: true, newSlideStartY: 0.6,
    border: { type: 'solid', pt: 0.5, color: GRID },
    fontFace: theme.minorFont, fontSize: 11, color: theme.colors.dk1, valign: 'top',
  });
}

function buildDeck({ summary, detailedByMilestone }, theme, outPath) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.defineSlideMaster({
    title: 'BRAND',
    background: { color: theme.colors.lt1 },
    objects: [{ text: { text: '© 2026 Cotality', options: { x: 0.4, y: 7.0, w: 5, h: 0.3, fontSize: 8, color: theme.colors.dk1, fontFace: theme.minorFont } } }],
    slideNumber: { x: 12.4, y: 7.0, w: 0.6, h: 0.3, color: theme.colors.dk1, fontSize: 8, fontFace: theme.minorFont },
  });

  addDivider(pptx, theme, 'Release Plan & Roadmap');
  addTableSlide(pptx, theme, 'Release Plan & Roadmap', summary, [2.4, 3.37, 3.37, 3.36]);

  for (const { milestone, table } of detailedByMilestone) {
    addDivider(pptx, theme, milestone);
    if (table.body.length === 0) {
      const s = pptx.addSlide({ masterName: 'BRAND' });
      s.addText(`${milestone} — no items`, { x: 0.4, y: 0.4, w: 12.5, h: 0.6, fontSize: 22, bold: true, color: theme.colors.dk1, fontFace: theme.majorFont });
    } else {
      addTableSlide(pptx, theme, `${milestone} — Detailed`, table, [1.9, 4.3, 6.3]);
    }
  }
  return pptx.writeFile({ fileName: outPath }).then(() => outPath);
}

function deckFromWorkbook(sourcePath, theme, outPath) {
  const summaryRows = readSheet(sourcePath, 'Summary');
  const milestones = (summaryRows[0] || []).slice(1).filter((m) => String(m).trim() !== '');
  const summary = summaryTable(summaryRows);
  const detailedByMilestone = milestones.map((m) => ({ milestone: m, table: detailedTable(readSheet(sourcePath, detailedSheetName(m))) }));
  return buildDeck({ summary, detailedByMilestone }, theme, outPath);
}

module.exports = { buildDeck, deckFromWorkbook };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd .claude/roadmap && node --test test/deck.test.js`
Expected: PASS (1 test). A pptx is written and its slide XML contains "Release Plan", "Workspace", "SYM-1".

- [ ] **Step 5: Commit**

```bash
git add .claude/roadmap/lib/deck.js .claude/roadmap/test/deck.test.js
git commit -m "feat(roadmap-deck): build themed pptx (dividers + Summary + Detailed) via pptxgenjs" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: `deck` subcommand + `/roadmap-deck` command

**Files:**
- Modify: `.claude/roadmap/run.js` (add `deck` subcommand + requires)
- Create: `.claude/commands/roadmap-deck.md`

**Interfaces:**
- Consumes: `loadTheme` (Task 1), `deckFromWorkbook` (Task 3).
- CLI: `node run.js deck --source <xlsx> --outdir <dir> --date <YYYYMMDD> [--theme <json>]` → writes `Product Roadmap Deck <date>.pptx`, prints the path.

- [ ] **Step 1: Add requires and the `deck` branch to `run.js`**

At the top of `run.js`, with the other `require` lines, add:
```javascript
const { loadTheme } = require('./lib/deck-theme');
const { deckFromWorkbook } = require('./lib/deck');
```

In `main()`, add a new branch BEFORE the final `else` that prints usage:
```javascript
  } else if (cmd === 'deck') {
    const themePath = a.theme || path.join(__dirname, 'deck-theme.json');
    const theme = loadTheme(themePath);
    const out = path.join(a.outdir, `Product Roadmap Deck ${a.date}.pptx`);
    deckFromWorkbook(a.source, theme, out)
      .then((p) => console.log(`deck: wrote\n ${p}`))
      .catch((e) => { console.error(`deck failed: ${e.message}`); process.exit(1); });
```
(Existing `analyze`/`finalize` branches and the `usage` else stay unchanged. `path` is already required at the top of run.js.)

- [ ] **Step 2: Verify the subcommand runs end-to-end against a built workbook**

Run (from `.claude/roadmap`, using the Source workbook produced by `/roadmap-build`):
```
node run.js deck --source "../../Roadmap/Product Roadmap Source 20260626.xlsx" --outdir "../../Roadmap" --date 20260626
```
Expected: prints `deck: wrote ...Product Roadmap Deck 20260626.pptx`; the file opens in PowerPoint with a Release-Plan divider, the Summary matrix, and Detailed slides for 8.7 / 8.8 / Future, all in the Cream/Earth/Sunburst theme. (If it prints `deck failed: ... EBUSY`, the output file is open in PowerPoint — close it and re-run.)

- [ ] **Step 3: Create `.claude/commands/roadmap-deck.md`**

````markdown
---
name: roadmap-deck
description: /roadmap-deck — Generate the on-brand Roadmap PowerPoint (Summary + Detailed slides) from a Product Roadmap Source workbook
---

# /roadmap-deck

Generates a PowerPoint with the **Release Plan & Roadmap** matrix slide(s) and the per-milestone **Detailed** slides, styled with Cotality's corporate theme (`deck-theme.json`). The narrative slides (title, agenda, themes) stay in your manual master — drop these generated slides in.

## Inputs (confirm with the user)
- A `Product Roadmap Source <date>.xlsx` produced by `/roadmap-build` (it must contain the `Summary` and `Detailed *` sheets — Phase 2).
- Output date `YYYYMMDD` (defaults to the Source file's date).

## Steps
1. Confirm the Source workbook path and the output date.
2. Run (from `.claude/roadmap`):
   ```
   node run.js deck --source "<source xlsx>" --outdir "<repo>/Roadmap" --date "<YYYYMMDD>"
   ```
3. Report the output path and remind the user the deck contains section dividers + Summary + Detailed slides to drop into the master deck.

## Notes
- Colors/fonts come from `.claude/roadmap/deck-theme.json` (Cream `F7EFE2`, Earth `1E1405`, Sunburst `FFCD2E`, TWK Everett). Edit that file if marketing updates the brand.
- The Source workbook MUST have the `Summary`/`Detailed` sheets; if missing, regenerate it with the current `/roadmap-build`.
- If `deck failed: ... EBUSY`, the output pptx is open in PowerPoint — close it and re-run.
- TWK Everett renders on machines where the font is installed; elsewhere PowerPoint substitutes but the font name is preserved.
````

- [ ] **Step 4: Run the full suite and commit**

Run: `cd .claude/roadmap && node --test`
Expected: all tests PASS.
```bash
git add .claude/roadmap/run.js .claude/commands/roadmap-deck.md
git commit -m "feat(roadmap-deck): add deck subcommand and /roadmap-deck command" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- §3 inputs/outputs (Source sheets in, dated pptx out, `--source/--outdir/--date/--theme`) → Tasks 3, 4. ✔
- §4 pptxgenjs + autoPage → Task 3 (`autoPage: true, autoPageRepeatHeader: true`). ✔
- §5 theme config + loader → Task 1 (`deck-theme.json`, `loadTheme`). ✔
- §6 components (deck-theme.js, deck-data.js, deck.js, run.js deck, command) → Tasks 1–4, one module each. ✔
- §7 styling (Cream bg, Earth dividers/headers, Sunburst bar, TWK Everett, 16:9) → Task 3 + Global Constraints. ✔
- §8 data flow (read Summary header for milestones → detailedSheetName → buildDeck) → Task 3 `deckFromWorkbook`. ✔
- §9 testing (deck-data pure tests, theme load test, buildDeck smoke via jszip) → Tasks 1, 2, 3. ✔
- §10 edge cases: missing sheets (readSheet throws a named error), empty milestone ("no items" slide in Task 3), EBUSY/locked (caught in Task 4 deck branch + noted in command). ✔
- §11 deps (pptxgenjs, jszip) → Task 1. ✔

**Placeholder scan:** none — every code step has complete code.

**Type consistency:** `loadTheme -> {colors, majorFont, minorFont}` consistent across Tasks 1/3/4; `summaryTable`/`detailedTable -> {header, body}` consistent Tasks 2/3; `buildDeck({summary, detailedByMilestone}, theme, outPath)` and `deckFromWorkbook(sourcePath, theme, outPath)` consistent Tasks 3/4; `detailedSheetName` reused from render.js (exported there). Theme colors used as 6-hex strings (no `#`) as pptxgenjs expects.
