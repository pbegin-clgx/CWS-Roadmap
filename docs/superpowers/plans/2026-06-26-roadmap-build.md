# /roadmap-build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/roadmap-build` command that ingests the cycle's Aha export, Release Assessment(s), and previous Source workbook, then produces a review-ready Product Roadmap Source workbook, Claims Product Backlog, and Change Report.

**Architecture:** A set of small single-purpose Node modules under `.claude/roadmap/lib/` (parse → classify → diff → render), wired by an orchestrator `run.js` exposing two subcommands: `analyze` (emits `analysis.json` + a cut-line proposal) and `finalize` (takes the analyst's confirmed cut-lines + Claude-authored descriptions, writes the three output files). A skill prompt at `.claude/commands/roadmap-build.md` runs `analyze`, drives the human review queue, authors new-feature descriptions, then runs `finalize`.

**Tech Stack:** Node.js (v22, already installed), `xlsx` (SheetJS) for workbook I/O, `node:test` + `node:assert` for tests (run with `node --test`).

## Global Constraints

- All work happens on a feature branch `feature/roadmap-build` (the repo default branch is `main`; do not commit to `main`).
- Runtime is **Node.js only** — Python is not available on this machine.
- Bucketing rule (from spec §4), priority semantics: **lower priority number = higher priority**.
- Source workbook `Source` sheet columns, in order: `Milestone`, `Product`, `Feature`, `Strategic Theme`, `Feature Code`, `priority`, `Prob`, `Description`.
- Backlog columns, in order, reproduced exactly: `Feature reference #`, `Old Priority`, `New Priority`, `Feature name`, `Initiative name`, `Release name`, `Feature status`, `Effort - man days`, `Dev Complete Rate`, `Prioritization`, `Feature tags`.
- Output file names are date-only: `<name> <YYYYMMDD>.xlsx`.
- Internal-item drop pattern (regex, case-insensitive): `translation|Apply API changes\/fixes|Migrate UX|Angular Update|ClaimWrapper|Intune|MixPanel|Mixpanel`.
- Validated cut-line fallback for the 8.7 backtest: `cut88=72`, `cutFuture=110`.
- Do not commit real roadmap data as fixtures. Unit tests build tiny in-memory workbooks; the regression test reads `Roadmap/backtest/` files only if present and is skipped otherwise.

---

### Task 1: Project scaffold & workbook read helper

**Files:**
- Create: `.claude/roadmap/package.json`
- Create: `.claude/roadmap/lib/xlsx-io.js`
- Test: `.claude/roadmap/test/xlsx-io.test.js`

**Interfaces:**
- Produces: `readSheet(path, sheetName) -> string[][]` (rows as arrays, blank cells as `''`); `writeSheets(path, {sheetName: rows[][]})`.

- [ ] **Step 1: Create the branch**

Run: `git checkout -b feature/roadmap-build`
Expected: `Switched to a new branch 'feature/roadmap-build'`

- [ ] **Step 2: Create `package.json`**

```json
{
  "name": "roadmap-build",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "scripts": { "test": "node --test" },
  "dependencies": { "xlsx": "^0.18.5" }
}
```

- [ ] **Step 3: Install xlsx**

Run: `cd .claude/roadmap && npm install`
Expected: `node_modules/xlsx` exists, exit 0.

- [ ] **Step 4: Write the failing test**

```javascript
// .claude/roadmap/test/xlsx-io.test.js
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
```

- [ ] **Step 5: Run test to verify it fails**

Run: `cd .claude/roadmap && node --test test/xlsx-io.test.js`
Expected: FAIL — `Cannot find module '../lib/xlsx-io'`.

- [ ] **Step 6: Implement `lib/xlsx-io.js`**

```javascript
const XLSX = require('xlsx');

function readSheet(filePath, sheetName) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" not found in ${filePath}. Sheets: ${wb.SheetNames.join(', ')}`);
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
}

function writeSheets(filePath, sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
  }
  XLSX.writeFile(wb, filePath);
}

module.exports = { readSheet, writeSheets };
```

- [ ] **Step 7: Run test to verify it passes**

Run: `cd .claude/roadmap && node --test test/xlsx-io.test.js`
Expected: PASS (1 test).

- [ ] **Step 8: Commit**

```bash
git add .claude/roadmap/package.json .claude/roadmap/package-lock.json .claude/roadmap/lib/xlsx-io.js .claude/roadmap/test/xlsx-io.test.js
git commit -m "feat(roadmap): scaffold roadmap-build with xlsx read/write helper"
```

---

### Task 2: Input parsers

**Files:**
- Create: `.claude/roadmap/lib/parse.js`
- Test: `.claude/roadmap/test/parse.test.js`

**Interfaces:**
- Consumes: `readSheet` from `lib/xlsx-io`.
- Produces:
  - `parseAssessment(path, sheetName='Release Assessment') -> Map<sym, {include, releaseInAha, priority, summary, effort}>` (priority is a number, or `Infinity` when blank/`-`).
  - `parseAha(path, sheetName='Report') -> Map<sym, {name, priority, status, release, initiative, prioritization}>`.
  - `parsePrevSource(path, sheetName='Source') -> Map<sym, {milestone, product, feature, theme, priority, prob, description}>`.
  - `cleanName(summary) -> string` (strips leading `NNNNN[A] - ` and trailing ` - Implement`).

- [ ] **Step 1: Write the failing test**

```javascript
// .claude/roadmap/test/parse.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os'); const path = require('path'); const fs = require('fs');
const { writeSheets } = require('../lib/xlsx-io');
const { parseAssessment, parseAha, parsePrevSource, cleanName } = require('../lib/parse');

function tmp(name) { return path.join(os.tmpdir(), `${name}-${process.pid}.xlsx`); }

test('cleanName strips ticket prefix and Implement suffix', () => {
  assert.strictEqual(cleanName('86353 - Change Tax Rate Lookup to Vertex Inc - Implement'), 'Change Tax Rate Lookup to Vertex Inc');
  assert.strictEqual(cleanName('70265A - Icons Redesign - Implement'), 'Icons Redesign');
});

test('parseAssessment maps SYM rows and normalizes blank priority to Infinity', () => {
  const f = tmp('assess');
  writeSheets(f, { 'Release Assessment': [
    ['Aha','FB','Summary','Release in Aha','Priority Category','Product Priority','Project Code','Branch','Status','Include in release?','Dev Comments','Craig','Effort Estimate'],
    ['SYM-2561','','92481 - Autosave - Implement','Release 8.6.50x','','2','','','Green','1-Yes','','',100],
    ['SYM-2497','','x - Implement','Product Backlog','','-','','','','3-No','','',''],
    ['not-a-sym','','','','','','','','','','','',''],
  ]});
  const m = parseAssessment(f);
  assert.strictEqual(m.size, 2);
  assert.strictEqual(m.get('SYM-2561').include, '1-Yes');
  assert.strictEqual(m.get('SYM-2561').priority, 2);
  assert.strictEqual(m.get('SYM-2497').priority, Infinity);
  fs.unlinkSync(f);
});

test('parsePrevSource keys by Feature Code with carry-forward fields', () => {
  const f = tmp('prev');
  writeSheets(f, { 'Source': [
    ['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description'],
    ['v8.7 (Q3 2026)','Workspace','Autosave Payment Progress','UX','SYM-2561',17,'1-Yes','Autosaves work.'],
  ]});
  const m = parsePrevSource(f);
  assert.strictEqual(m.get('SYM-2561').product, 'Workspace');
  assert.strictEqual(m.get('SYM-2561').priority, 17);
  assert.strictEqual(m.get('SYM-2561').description, 'Autosaves work.');
  fs.unlinkSync(f);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/roadmap && node --test test/parse.test.js`
Expected: FAIL — `Cannot find module '../lib/parse'`.

- [ ] **Step 3: Implement `lib/parse.js`**

```javascript
const { readSheet } = require('./xlsx-io');

const isSym = (s) => /^SYM-\d/.test(String(s).trim());
const num = (v) => (v === '' || v === '-' || v == null) ? Infinity : parseFloat(v);
const clean1 = (s) => String(s).replace(/\r?\n/g, ' ').trim();
const cleanName = (s) => clean1(s).replace(/^\s*\d+[A-Z]?\s*-\s*/, '').replace(/\s*-\s*Implement\s*$/i, '').trim();

function parseAssessment(path, sheetName = 'Release Assessment') {
  const rows = readSheet(path, sheetName);
  const m = new Map();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; const sym = String(r[0]).trim();
    if (!isSym(sym)) continue;
    m.set(sym, { include: clean1(r[9]), releaseInAha: clean1(r[3]), priority: num(r[5]), summary: clean1(r[2]), effort: r[12] });
  }
  return m;
}

function parseAha(path, sheetName = 'Report') {
  const rows = readSheet(path, sheetName);
  const m = new Map();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; const sym = String(r[0]).trim();
    if (!isSym(sym)) continue;
    m.set(sym, { name: clean1(r[2]), priority: r[3], status: r[4], release: clean1(r[5]), prioritization: r[8], initiative: clean1(r[11]) });
  }
  return m;
}

function parsePrevSource(path, sheetName = 'Source') {
  const rows = readSheet(path, sheetName);
  const m = new Map();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; const sym = String(r[4]).trim();
    if (!sym) continue;
    m.set(sym, { milestone: clean1(r[0]), product: clean1(r[1]), feature: clean1(r[2]), theme: clean1(r[3]),
                 priority: r[5], prob: clean1(r[6]), description: String(r[7]).trim() });
  }
  return m;
}

module.exports = { parseAssessment, parseAha, parsePrevSource, cleanName };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd .claude/roadmap && node --test test/parse.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add .claude/roadmap/lib/parse.js .claude/roadmap/test/parse.test.js
git commit -m "feat(roadmap): add Aha/Assessment/prev-Source parsers"
```

---

### Task 3: Bucketing rule (`classify`)

**Files:**
- Create: `.claude/roadmap/lib/bucket.js`
- Test: `.claude/roadmap/test/bucket.test.js`

**Interfaces:**
- Produces: `classify(a, opts) -> string` where `a = {include, releaseInAha, priority}` and `opts = {currentRelease, nextRelease, futureLabel, cut88, cutFuture}`. Returns one of `currentRelease | nextRelease | futureLabel | 'DROP'`.
- Produces: `INTERNAL` (the shared regex) and `isInternal(summary) -> boolean`.

- [ ] **Step 1: Write the failing test**

```javascript
// .claude/roadmap/test/bucket.test.js
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

test('2.3 / 2.4 go to next release at any priority', () => {
  assert.strictEqual(c({ include: '2.3-Maybe', releaseInAha: 'Product Backlog', priority: 150 }), '8.8');
  assert.strictEqual(c({ include: '2.4-Maybe', releaseInAha: 'Design Backlog', priority: 123 }), '8.8');
});

test('3-No uses Aha release overrides then priority cut-lines', () => {
  assert.strictEqual(c({ include: '3-No', releaseInAha: 'Release 8.8', priority: 999 }), '8.8'); // explicit next
  assert.strictEqual(c({ include: '3-No', releaseInAha: 'Release 8.9', priority: 5 }), 'Future'); // beyond next
  assert.strictEqual(c({ include: '3-No', releaseInAha: 'Product Backlog', priority: 40 }), '8.8'); // <= cut88
  assert.strictEqual(c({ include: '3-No', releaseInAha: 'Product Backlog', priority: 90 }), 'Future'); // <= cutFuture
  assert.strictEqual(c({ include: '3-No', releaseInAha: 'Product Backlog', priority: 130 }), 'DROP'); // beyond
});

test('isInternal flags tech-debt/internal summaries', () => {
  assert.ok(isInternal('93034 - Incorporate new 8.7 translations for all markets - Implement'));
  assert.ok(isInternal('Migrate UX to use Symbility-net-lib library - Implement'));
  assert.ok(!isInternal('Autosave Payment Progress - Implement'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/roadmap && node --test test/bucket.test.js`
Expected: FAIL — `Cannot find module '../lib/bucket'`.

- [ ] **Step 3: Implement `lib/bucket.js`**

```javascript
const INTERNAL = /translation|Apply API changes\/fixes|Migrate UX|Angular Update|ClaimWrapper|Intune|MixPanel|Mixpanel/i;
const isInternal = (summary) => INTERNAL.test(String(summary));

function classify(a, opts) {
  const { currentRelease, nextRelease, futureLabel, cut88, cutFuture } = opts;
  const inc = String(a.include);
  const rel = String(a.releaseInAha);
  const prio = (a.priority == null || a.priority === '' || a.priority === '-') ? Infinity : parseFloat(a.priority);
  if (/^1-Yes/.test(inc) || /^2\.1/.test(inc) || /^2\.2/.test(inc)) return currentRelease;
  if (/^2\.3/.test(inc) || /^2\.4/.test(inc)) return nextRelease;
  // 3-No (and any other non-current status)
  const nextNum = (String(nextRelease).match(/8\.\d+/) || [])[0];
  if (nextNum && new RegExp(`Release ${nextNum.replace('.', '\\.')}`).test(rel)) return nextRelease;
  if (/Release 8\.9|Release 9/.test(rel)) return futureLabel;
  if (prio <= cut88) return nextRelease;
  if (prio <= cutFuture) return futureLabel;
  return 'DROP';
}

module.exports = { classify, isInternal, INTERNAL };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd .claude/roadmap && node --test test/bucket.test.js`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add .claude/roadmap/lib/bucket.js .claude/roadmap/test/bucket.test.js
git commit -m "feat(roadmap): add release bucketing rule with priority cut-lines"
```

---

### Task 4: Cut-line proposal & next-Assessment override

**Files:**
- Create: `.claude/roadmap/lib/propose.js`
- Test: `.claude/roadmap/test/propose.test.js`

**Interfaces:**
- Produces: `proposeCut(tail) -> {cut88, cutFuture}` where `tail` is an array of `{sym, priority}` for finite-priority `3-No`/`2.x` leftovers. `cut88` is the priority value at the top-half boundary (median of finite priorities, rounded); `cutFuture` defaults to `110`.
- Produces: `applyNextAssessment(milestone, sym, nextAssess, {nextRelease}) -> string` — if `nextAssess` has `sym` with include in {1-Yes,2.1,2.2}, returns `nextRelease`; else returns `milestone` unchanged.

- [ ] **Step 1: Write the failing test**

```javascript
// .claude/roadmap/test/propose.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { proposeCut, applyNextAssessment } = require('../lib/propose');

test('proposeCut returns median priority as cut88 and 110 as cutFuture', () => {
  const tail = [10, 20, 30, 40, 50].map((p, i) => ({ sym: `SYM-${i}`, priority: p }));
  const { cut88, cutFuture } = proposeCut(tail);
  assert.strictEqual(cut88, 30); // median
  assert.strictEqual(cutFuture, 110);
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/roadmap && node --test test/propose.test.js`
Expected: FAIL — `Cannot find module '../lib/propose'`.

- [ ] **Step 3: Implement `lib/propose.js`**

```javascript
function proposeCut(tail) {
  const ps = tail.map((t) => t.priority).filter((p) => Number.isFinite(p)).sort((a, b) => a - b);
  let cut88 = 72;
  if (ps.length) {
    const mid = Math.floor((ps.length - 1) / 2);
    cut88 = ps.length % 2 ? ps[mid] : Math.round((ps[mid] + ps[mid + 1]) / 2);
  }
  return { cut88, cutFuture: 110 };
}

function applyNextAssessment(milestone, sym, nextAssess, { nextRelease }) {
  if (!nextAssess || !nextAssess.has(sym)) return milestone;
  const inc = String(nextAssess.get(sym).include);
  if (/^1-Yes/.test(inc) || /^2\.1/.test(inc) || /^2\.2/.test(inc)) return nextRelease;
  return milestone;
}

module.exports = { proposeCut, applyNextAssessment };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd .claude/roadmap && node --test test/propose.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add .claude/roadmap/lib/propose.js .claude/roadmap/test/propose.test.js
git commit -m "feat(roadmap): add cut-line proposal and next-Assessment override"
```

---

### Task 5: Change detection with UP/DOWN direction

**Files:**
- Create: `.claude/roadmap/lib/changes.js`
- Test: `.claude/roadmap/test/changes.test.js`

**Interfaces:**
- Consumes: `prev` Map from `parsePrevSource`, and `current` array of `{sym, milestone, feature, priority}` (resolved, shown features only).
- Produces: `detectChanges(prev, current, assessmentSyms) -> {delivered, added, priorityUp, priorityDown, reBucketed}`.
  - `delivered`: `[{sym, feature}]` — in `prev`, absent from `assessmentSyms` (a Set of all SYMs seen in any Assessment).
  - `added`: `[{sym, milestone, feature}]` — in `current`, not in `prev`.
  - `priorityUp`/`priorityDown`: `[{sym, feature, from, to}]` — finite prev & current priority differ; UP when `to < from`, DOWN when `to > from`.
  - `reBucketed`: `[{sym, feature, from, to}]` — milestone differs between prev and current.

- [ ] **Step 1: Write the failing test**

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/roadmap && node --test test/changes.test.js`
Expected: FAIL — `Cannot find module '../lib/changes'`.

- [ ] **Step 3: Implement `lib/changes.js`**

```javascript
const fin = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };

function detectChanges(prev, current, assessmentSyms) {
  const delivered = [];
  for (const [sym, p] of prev) if (!assessmentSyms.has(sym)) delivered.push({ sym, feature: p.feature });

  const added = [];
  for (const c of current) if (!prev.has(c.sym)) added.push({ sym: c.sym, milestone: c.milestone, feature: c.feature });

  const priorityUp = [], priorityDown = [], reBucketed = [];
  for (const c of current) {
    const p = prev.get(c.sym);
    if (!p) continue;
    const from = fin(p.priority), to = fin(c.priority);
    if (from != null && to != null && from !== to) {
      (to < from ? priorityUp : priorityDown).push({ sym: c.sym, feature: c.feature, from, to });
    }
    if (p.milestone && c.milestone && p.milestone !== c.milestone) {
      reBucketed.push({ sym: c.sym, feature: c.feature, from: p.milestone, to: c.milestone });
    }
  }
  return { delivered, added, priorityUp, priorityDown, reBucketed };
}

module.exports = { detectChanges };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd .claude/roadmap && node --test test/changes.test.js`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add .claude/roadmap/lib/changes.js .claude/roadmap/test/changes.test.js
git commit -m "feat(roadmap): add change detection with UP/DOWN priority direction"
```

---

### Task 6: Output renderers (Source, Backlog, Change Report)

**Files:**
- Create: `.claude/roadmap/lib/render.js`
- Test: `.claude/roadmap/test/render.test.js`

**Interfaces:**
- Consumes: `writeSheets` from `lib/xlsx-io`; resolved `records` array of `{sym, milestone, product, feature, theme, priority, prob, description}`; `aha` Map from `parseAha`; `prev` Map; `changes` object from `detectChanges`.
- Produces:
  - `sourceRows(records) -> any[][]` (header + one row per record, column order per Global Constraints).
  - `backlogRows(records, aha, prev) -> any[][]` (the 11 columns; `Old Priority` = prev priority, `New Priority` = current).
  - `renderChangeReport(changes) -> string` (Markdown with sections: Delivered, New, Priority Changed UP, Priority Changed DOWN, Re-bucketed).
  - `writeOutputs(dir, dateStr, {records, aha, prev, changes}) -> {srcPath, blPath, repPath}` — writes the three files using the date-only naming convention.

- [ ] **Step 1: Write the failing test**

```javascript
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/roadmap && node --test test/render.test.js`
Expected: FAIL — `Cannot find module '../lib/render'`.

- [ ] **Step 3: Implement `lib/render.js`**

```javascript
const { writeSheets } = require('./xlsx-io');

const SOURCE_HEADER = ['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description'];
const BACKLOG_HEADER = ['Feature reference #','Old Priority','New Priority','Feature name','Initiative name','Release name','Feature status','Effort - man days','Dev Complete Rate','Prioritization','Feature tags'];

function sourceRows(records) {
  const rows = [SOURCE_HEADER.slice()];
  for (const r of records) rows.push([r.milestone, r.product, r.feature, r.theme, r.sym, r.priority, r.prob, r.description]);
  return rows;
}

function backlogRows(records, aha, prev) {
  const rows = [BACKLOG_HEADER.slice()];
  for (const r of records) {
    const a = aha.get(r.sym) || {};
    const p = prev.get(r.sym) || {};
    rows.push([r.sym, (p.priority ?? ''), r.priority, a.name || r.feature, a.initiative || '', a.release || '', a.status || '', '', '', a.prioritization || '', '']);
  }
  return rows;
}

function section(title, lines) { return lines.length ? `## ${title}\n${lines.join('\n')}\n\n` : ''; }

function renderChangeReport(ch) {
  let md = '# Roadmap Change Report\n\n';
  md += section('Delivered', ch.delivered.map((d) => `- ${d.sym} — ${d.feature}`));
  md += section('New', ch.added.map((d) => `- ${d.sym} (${d.milestone}) — ${d.feature}`));
  md += section('Priority Changed UP', ch.priorityUp.map((d) => `- ${d.sym} — ${d.feature}: ${d.from} → ${d.to}`));
  md += section('Priority Changed DOWN', ch.priorityDown.map((d) => `- ${d.sym} — ${d.feature}: ${d.from} → ${d.to}`));
  md += section('Re-bucketed', ch.reBucketed.map((d) => `- ${d.sym} — ${d.feature}: ${d.from} → ${d.to}`));
  return md;
}

function writeOutputs(dir, dateStr, { records, aha, prev, changes }) {
  const fs = require('fs'); const path = require('path');
  const srcPath = path.join(dir, `Product Roadmap Source ${dateStr}.xlsx`);
  const blPath = path.join(dir, `Claims Product Backlog ${dateStr}.xlsx`);
  const repPath = path.join(dir, `Roadmap Change Report ${dateStr}.md`);
  writeSheets(srcPath, { Source: sourceRows(records) });
  writeSheets(blPath, { Backlog: backlogRows(records, aha, prev) });
  fs.writeFileSync(repPath, renderChangeReport(changes));
  return { srcPath, blPath, repPath };
}

module.exports = { sourceRows, backlogRows, renderChangeReport, writeOutputs };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd .claude/roadmap && node --test test/render.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add .claude/roadmap/lib/render.js .claude/roadmap/test/render.test.js
git commit -m "feat(roadmap): add Source/Backlog/Change-Report renderers"
```

---

### Task 7: Orchestrator (`analyze` + `finalize`) and regression test

**Files:**
- Create: `.claude/roadmap/run.js`
- Test: `.claude/roadmap/test/regression.test.js`

**Interfaces:**
- Consumes: every `lib/*` module above.
- CLI:
  - `node run.js analyze --aha <p> --assess <p>[,<p>] --prev <p> --current <label> --next <label> --future <label> [--cut88 <n>] [--cutFuture <n>] [--out analysis.json]`
    → writes `analysis.json` = `{ opts, proposedCut, buckets:{milestone:[record]}, newFeatures:[{sym,feature,milestone}], judgment:[{sym,feature,reason}], changes }`. Each `record` = `{sym, milestone, product, feature, theme, priority, prob, description}`; carried features keep prev product/theme/description, new features get empty strings.
  - `node run.js finalize --analysis analysis.json --overrides overrides.json --aha <p> --prev <p> --outdir <dir> --date <YYYYMMDD>`
    → `overrides.json` = `{ descriptions:{sym:{product,theme,description}}, milestoneOverrides:{sym:milestone} }`. Merges overrides, sorts, writes the three outputs.
- Produces (function form, exported for the test): `analyze(paths, opts) -> analysisObject`.

**Judgment flag rule:** a record is added to `judgment` when (a) its `releaseInAha` names a specific `Release 8.x` that disagrees with the rule's bucket, or (b) it is newly added with priority within ±5 of `cut88`.

- [ ] **Step 1: Write the failing regression test**

```javascript
// .claude/roadmap/test/regression.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const path = require('path');
const { analyze } = require('../run');
const { parsePrevSource } = require('../lib/parse');

const RM = path.resolve(__dirname, '../../../Roadmap');
const ASSESS = path.join(RM, '2026-06-22 Release 8.7 Assessment v1.0.xlsx');
const AHA = path.join(RM, 'aha_list_features_260623115843.xlsx');
const PREV = path.join(RM, 'backtest/old_baseline/Product Roadmap Source 20260525.xlsx');
const REAL = path.join(RM, 'Product Roadmap Source 20260623.xlsx');
const present = [ASSESS, AHA, PREV, REAL].every(fs.existsSync);

test('backtest reproduces >=90% milestone agreement and 100% current-release recall',
  { skip: present ? false : 'backtest files not present' }, () => {
  const a = analyze({ aha: AHA, assess: [ASSESS], prev: PREV },
    { currentRelease: 'v8.7 (Q3 2026)', nextRelease: 'v8.8 (Q4 2026)', futureLabel: 'Future (Q4 2026 - Q1 2027)', cut88: 72, cutFuture: 110 });
  const mine = new Map();
  for (const [ms, recs] of Object.entries(a.buckets)) for (const r of recs) mine.set(r.sym, ms);
  const norm = (m) => /8\.7/.test(m) ? '8.7' : /8\.8/.test(m) ? '8.8' : 'Future';
  const realSrc = parsePrevSource(REAL);
  let shared = 0, same = 0, real87 = 0, got87 = 0;
  for (const [sym, p] of realSrc) {
    if (!/^SYM-\d/.test(sym)) continue;
    const rN = norm(p.milestone);
    if (rN === '8.7') { real87++; if (mine.has(sym) && norm(mine.get(sym)) === '8.7') got87++; }
    if (mine.has(sym)) { shared++; if (norm(mine.get(sym)) === rN) same++; }
  }
  const agreement = same / shared;
  const recall87 = got87 / real87;
  assert.ok(agreement >= 0.90, `milestone agreement ${(agreement*100).toFixed(0)}% < 90%`);
  assert.strictEqual(recall87, 1, `current-release recall ${(recall87*100).toFixed(0)}% != 100%`);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd .claude/roadmap && node --test test/regression.test.js`
Expected: FAIL — `Cannot find module '../run'`.

- [ ] **Step 3: Implement `run.js`**

```javascript
const fs = require('fs');
const { parseAssessment, parseAha, parsePrevSource, cleanName } = require('./lib/parse');
const { classify, isInternal } = require('./lib/bucket');
const { proposeCut, applyNextAssessment } = require('./lib/propose');
const { detectChanges } = require('./lib/changes');
const { writeOutputs } = require('./lib/render');

function analyze(paths, opts) {
  const assessPaths = paths.assess;
  const primary = parseAssessment(assessPaths[0]);
  const nextAssess = assessPaths[1] ? parseAssessment(assessPaths[1]) : null;
  const prev = parsePrevSource(paths.prev);

  const buckets = {}; const newFeatures = []; const judgment = []; const current = [];
  const assessmentSyms = new Set([...primary.keys(), ...(nextAssess ? nextAssess.keys() : [])]);
  const nextNum = (String(opts.nextRelease).match(/8\.\d+/) || [])[0];

  for (const [sym, a] of primary) {
    if (isInternal(a.summary)) continue;
    let ms = classify(a, opts);
    if (ms === 'DROP') continue;
    ms = applyNextAssessment(ms, sym, nextAssess, opts);
    const c = prev.get(sym);
    const prio = a.priority === Infinity ? '' : a.priority;
    const rec = { sym, milestone: ms, product: c ? c.product : '', feature: c ? c.feature : cleanName(a.summary),
      theme: c ? c.theme : '', priority: prio, prob: a.include, description: c ? c.description : '' };
    (buckets[ms] = buckets[ms] || []).push(rec);
    current.push({ sym, milestone: ms, feature: rec.feature, priority: prio });
    if (!c) newFeatures.push({ sym, feature: rec.feature, milestone: ms });
    const rel = String(a.releaseInAha);
    const namesOtherRelease = /Release 8\.\d/.test(rel) && (!nextNum || !rel.includes(nextNum));
    const relConflict = namesOtherRelease && ms === opts.futureLabel;
    const nearCut = !c && Number.isFinite(a.priority) && Math.abs(a.priority - opts.cut88) <= 5;
    if (relConflict || nearCut) judgment.push({ sym, feature: rec.feature, reason: relConflict ? `Aha says ${rel} but rule placed ${ms}` : 'new feature near cut-line' });
  }
  const tail = [...primary.entries()]
    .filter(([s, a]) => !isInternal(a.summary) && !/^1-Yes|^2\.1|^2\.2/.test(String(a.include)))
    .map(([s, a]) => ({ sym: s, priority: a.priority }));
  const proposedCut = proposeCut(tail);
  const changes = detectChanges(prev, current, assessmentSyms);
  return { opts, proposedCut, buckets, newFeatures, judgment, changes };
}

function parseArgs(argv) { const o = {}; for (let i = 0; i < argv.length; i += 2) o[argv[i].replace(/^--/, '')] = argv[i + 1]; return o; }

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const a = parseArgs(rest);
  if (cmd === 'analyze') {
    const opts = { currentRelease: a.current, nextRelease: a.next, futureLabel: a.future, cut88: parseFloat(a.cut88 || '72'), cutFuture: parseFloat(a.cutFuture || '110') };
    const res = analyze({ aha: a.aha, assess: String(a.assess).split(','), prev: a.prev }, opts);
    fs.writeFileSync(a.out || 'analysis.json', JSON.stringify(res, null, 2));
    console.log(`analyze: wrote ${a.out || 'analysis.json'} (proposedCut ${JSON.stringify(res.proposedCut)})`);
  } else if (cmd === 'finalize') {
    const analysis = JSON.parse(fs.readFileSync(a.analysis, 'utf8'));
    const ov = a.overrides ? JSON.parse(fs.readFileSync(a.overrides, 'utf8')) : {};
    const aha = parseAha(a.aha); const prev = parsePrevSource(a.prev);
    const records = [];
    for (const recs of Object.values(analysis.buckets)) for (const r of recs) {
      const d = (ov.descriptions || {})[r.sym];
      if (d) { r.product = d.product ?? r.product; r.theme = d.theme ?? r.theme; r.description = d.description ?? r.description; }
      if ((ov.milestoneOverrides || {})[r.sym]) r.milestone = ov.milestoneOverrides[r.sym];
      records.push(r);
    }
    const order = { [analysis.opts.currentRelease]: 0, [analysis.opts.nextRelease]: 1, [analysis.opts.futureLabel]: 2 };
    records.sort((x, y) => (order[x.milestone] - order[y.milestone]) || ((parseFloat(x.priority) || 9999) - (parseFloat(y.priority) || 9999)));
    const out = writeOutputs(a.outdir, a.date, { records, aha, prev, changes: analysis.changes });
    console.log(`finalize: wrote\n ${out.srcPath}\n ${out.blPath}\n ${out.repPath}`);
  } else { console.error('usage: run.js analyze|finalize ...'); process.exit(1); }
}

if (require.main === module) main();
module.exports = { analyze };
```

- [ ] **Step 4: Run regression test to verify it passes**

Run: `cd .claude/roadmap && node --test test/regression.test.js`
Expected: PASS (agreement ≥ 90%, current-release recall = 100%), or `skipped` if backtest files absent.

- [ ] **Step 5: Run the full suite**

Run: `cd .claude/roadmap && node --test`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add .claude/roadmap/run.js .claude/roadmap/test/regression.test.js
git commit -m "feat(roadmap): add analyze/finalize orchestrator with backtest regression"
```

---

### Task 8: The `/roadmap-build` skill command

**Files:**
- Create: `.claude/commands/roadmap-build.md`

**Interfaces:**
- Consumes: `run.js analyze` and `run.js finalize`.
- Produces: the interactive command behavior. No unit tests — this is the skill prompt; validated by the manual dry-run in Step 3.

- [ ] **Step 1: Write the command file**

````markdown
---
name: roadmap-build
description: /roadmap-build — Build the Product Roadmap Source, Backlog, and Change Report from the cycle's Aha export and Release Assessment(s)
---

# /roadmap-build

Builds a review-ready **Product Roadmap Source** workbook, **Claims Product Backlog**, and **Change Report** from raw inputs. Keeps the user's judgment in the loop for cut-lines, borderline placements, and new-feature descriptions.

## Inputs (confirm with the user before running)
- Aha feature export (xlsx) in `Roadmap/`.
- One or more Release Assessment files (xlsx) — the current release first, an optional next-release one second.
- The previous `Product Roadmap Source` workbook (carry-forward base).
- Release labels: current (e.g. `v8.7 (Q3 2026)`), next (e.g. `v8.8 (Q4 2026)`), future (e.g. `Future (Q4 2026 - Q1 2027)`).

## Steps

1. **Confirm inputs and labels** with the user (file names + the three release labels + today's date `YYYYMMDD`).

2. **Run analyze** (from `.claude/roadmap`):
   ```
   node run.js analyze --aha "<aha>" --assess "<assess1>[,<assess2>]" --prev "<prev>" \
     --current "<label>" --next "<label>" --future "<label>" --out analysis.json
   ```
   Read `analysis.json`.

3. **Present the review queue** (do NOT write outputs yet):
   - **Cut-line:** show `proposedCut` and the sorted `3-No`/`2.x` tail around it; ask the user to confirm or adjust `cut88`/`cutFuture`. If changed, re-run `analyze` with `--cut88/--cutFuture` so re-bucketing reflects the new lines.
   - **Judgment items:** list `analysis.judgment` with the reason; ask the user's call for each (keep / move to a named milestone / drop).
   - **New descriptions:** for each entry in `analysis.newFeatures`, draft a short Description **in the house style from `product-team-claude/CLAUDE.md`** (personas/terminology/example requirements) plus a proposed Product and Strategic Theme from the known sets. Present for approval/edit.

4. **Assemble `overrides.json`** in `.claude/roadmap/`:
   ```json
   { "descriptions": { "SYM-xxxx": {"product": "...", "theme": "...", "description": "..."} },
     "milestoneOverrides": { "SYM-yyyy": "<milestone label>" } }
   ```

5. **Run finalize:**
   ```
   node run.js finalize --analysis analysis.json --overrides overrides.json \
     --aha "<aha>" --prev "<prev>" --outdir "<repo>/Roadmap" --date "<YYYYMMDD>"
   ```

6. **Report** the three output paths and a one-paragraph summary: counts per milestone, # carried vs # newly described, # delivered, # priority UP/DOWN, # flagged for review.

## Notes
- Lower priority number = higher priority.
- Never write outputs before the user approves the review queue.
- Internal/tech-debt items and features below the Future cut-line are dropped silently from the roadmap and are NOT surfaced as a "removed" list (by design).
````

- [ ] **Step 2: Verify the command file exists**

Run: `ls .claude/commands/roadmap-build.md`
Expected: file exists. (It appears as `/roadmap-build` in the skill list on next session.)

- [ ] **Step 3: Manual dry-run against the backtest**

From `.claude/roadmap`, run `analyze` with current `v8.7 (Q3 2026)`, next `v8.8 (Q4 2026)`, future `Future (Q4 2026 - Q1 2027)`, the backtest inputs, `--out /tmp/analysis.json`. Confirm `buckets`, `newFeatures`, and `proposedCut` are populated. Then run `finalize` with `--overrides` pointing at a `{}` file into a scratch `--outdir`, and confirm the three files are produced and open.
Expected: three files written; Source ≈ 87–106 rows; Backlog has the 11 columns; Change Report shows UP/DOWN sections.

- [ ] **Step 4: Commit**

```bash
git add .claude/commands/roadmap-build.md
git commit -m "feat(roadmap): add /roadmap-build interactive command"
```

---

## Self-Review

**Spec coverage:**
- §3 inputs/outputs (date-only naming, 11-column Backlog) → Tasks 1, 2, 6, 7 + Global Constraints. ✔
- §4 bucketing incl. two-Assessment mode + cut-lines → Tasks 3, 4, 7. ✔
- §5 carry-forward & descriptions → Task 7 (`analyze` carry-forward) + Task 8 (description authoring). ✔
- §6 change detection with UP/DOWN → Tasks 5, 6. ✔
- §7 review queue → Task 8. ✔
- §8 components (one module each) → Tasks 1–7. ✔
- §9 validation/regression → Task 7. ✔
- §10 edge cases: missing file/sheet (Task 1 throws), blank priority (Tasks 2/3), multiple Assessments (Tasks 4/7), feature in Aha not Assessment (Task 7 buckets only Assessment SYMs). ✔
- §11 resolved decisions → Global Constraints + Tasks 6/7/8. ✔

**Phasing note:** Summary/Detailed sheet generation (spec §12 Phase 2) and deck regeneration (Phase 3) are intentionally out of this plan.

**Placeholder scan:** No TBD/TODO; every code step contains full code.

**Type consistency:** `classify(a, opts)` consistent across Tasks 3/7; `detectChanges(prev, current, assessmentSyms)` consistent across Tasks 5/7; `record` shape `{sym, milestone, product, feature, theme, priority, prob, description}` consistent across Tasks 6/7; renderer headers match Global Constraints.
