const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os'); const path = require('path'); const fs = require('fs');
const { writeSheets } = require('../lib/xlsx-io');
const { analyze } = require('../run');
const { backlogRows, renderChangeReport } = require('../lib/render');

const tmp = (n) => path.join(os.tmpdir(), `${n}-${process.pid}-${Math.floor(performance.now())}.xlsx`);

test('a feature below the Future cut-line is kept off the roadmap but surfaced separately for the Backlog', () => {
  const assessF = tmp('assess'); const ahaF = tmp('aha'); const prevF = tmp('prev');
  const aHeader = ['Aha','FB','Summary','Release in Aha','Priority Category','Product Priority','Project Code','Branch','Status','Include in release?','Dev Comments','Craig','Effort Estimate'];
  const aRow = (sym, prio) => { const r = new Array(13).fill(''); r[0]=sym; r[2]=`${sym} thing - Implement`; r[3]='Release 8.7'; r[5]=prio; r[9]='3-No'; return r; };
  writeSheets(assessF, { 'Release Assessment': [aHeader, aRow('SYM-900', 900)] });
  writeSheets(ahaF, { Report: [['Feature reference #','test','Feature name','Product Priority','Feature status','Release name','a','b','Prioritization','c','d','Initiative name']] });
  writeSheets(prevF, { Source: [['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description']] });

  const a = analyze({ aha: ahaF, assess: [assessF], prev: prevF },
    { currentRelease: 'v8.7 (Q3 2026)', nextRelease: 'v8.8 (Q4 2026)', futureLabel: 'Future (Q4 2026 - Q1 2027)', cut88: 72, cutFuture: 110 });

  const inAnyBucket = (sym) => Object.values(a.buckets).flat().some((r) => r.sym === sym);
  assert.ok(!inAnyBucket('SYM-900'), 'below-cut-line feature is not on the Source/deck roadmap');
  assert.ok(a.belowCutLine.some((r) => r.sym === 'SYM-900'), 'below-cut-line feature is surfaced for the Backlog');

  const changes = { belowCutLine: a.belowCutLine };
  const rows = backlogRows([], new Map(), new Map(), changes);
  const row = rows.find((r) => r[0] === 'SYM-900');
  assert.ok(row, 'below-cut-line feature appears as a Backlog row even though records (Source) is empty');
  assert.strictEqual(row[11], 'Below Cut-Line');

  const md = renderChangeReport(changes);
  assert.match(md, /## Below Cut-Line \(Backlog only, not on roadmap\)/);
  assert.match(md, /SYM-900/);

  [assessF, ahaF, prevF].forEach((f) => fs.unlinkSync(f));
});
