const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os'); const path = require('path'); const fs = require('fs');
const { writeSheets } = require('../lib/xlsx-io');
const { analyze } = require('../run');

const tmp = (n) => path.join(os.tmpdir(), `${n}-${process.pid}-${Math.floor(performance.now())}.xlsx`);
const aHeader = ['Aha','FB','Summary','Release in Aha','Priority Category','Product Priority','Project Code','Branch','Status','Include in release?','Dev Comments','Craig','Effort Estimate'];
const aRow = (sym, prio, inc) => { const r = new Array(13).fill(''); r[0]=sym; r[2]=`${sym} thing - Implement`; r[3]='Release 8.7'; r[5]=prio; r[9]=inc; return r; };

test('with two assessment files, each record gets independent probs from BOTH files, regardless of final milestone', () => {
  const assessF = tmp('assess87'); const nextAssessF = tmp('assess88'); const ahaF = tmp('aha'); const prevF = tmp('prev');
  writeSheets(assessF, { 'Release Assessment': [aHeader,
    aRow('SYM-1', 5, '1-Yes'),   // committed to current release (8.7)
    aRow('SYM-2', 8, '3-No'),    // not this release; lands in v8.8 by priority
  ] });
  writeSheets(nextAssessF, { 'Release Assessment': [aHeader,
    aRow('SYM-1', 5, '3-No'),    // 8.7 item also assessed (differently) in the 8.8 file
    aRow('SYM-2', 8, '1-Yes'),   // 8.8's own assessment locks SYM-2 in for 8.8
  ] });
  writeSheets(ahaF, { Report: [['Feature reference #','test','Feature name','Product Priority','Feature status','Release name','a','b','Prioritization','c','d','Initiative name']] });
  writeSheets(prevF, { Source: [['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description']] });

  const a = analyze({ aha: ahaF, assess: [assessF, nextAssessF], prev: prevF },
    { currentRelease: 'v8.7 (Q3 2026)', nextRelease: 'v8.8 (Q4 2026)', futureLabel: 'Future (Q1-Q2 2027)', cut88: 72, cutFuture: 110 });

  assert.deepStrictEqual(a.assessLabels, ['8.7', '8.8']);

  const sym1 = a.buckets['v8.7 (Q3 2026)'].find((r) => r.sym === 'SYM-1');
  assert.ok(sym1, 'SYM-1 lands in v8.7');
  assert.deepStrictEqual(sym1.probs, ['1-Yes', '3-No']);

  const sym2 = a.buckets['v8.8 (Q4 2026)'].find((r) => r.sym === 'SYM-2');
  assert.ok(sym2, 'SYM-2 lands in v8.8');
  assert.deepStrictEqual(sym2.probs, ['3-No', '1-Yes']); // pulled independently from EACH file, not just the bucket it landed in

  [assessF, nextAssessF, ahaF, prevF].forEach((f) => fs.unlinkSync(f));
});

test('with a single assessment file, probs is a one-element array (backward compatible with the bare Prob column)', () => {
  const assessF = tmp('assess-solo'); const ahaF = tmp('aha'); const prevF = tmp('prev');
  writeSheets(assessF, { 'Release Assessment': [aHeader, aRow('SYM-5', 5, '1-Yes')] });
  writeSheets(ahaF, { Report: [['Feature reference #','test','Feature name','Product Priority','Feature status','Release name','a','b','Prioritization','c','d','Initiative name']] });
  writeSheets(prevF, { Source: [['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description']] });

  const a = analyze({ aha: ahaF, assess: [assessF], prev: prevF },
    { currentRelease: 'v8.7 (Q3 2026)', nextRelease: 'v8.8 (Q4 2026)', futureLabel: 'Future (Q1-Q2 2027)', cut88: 72, cutFuture: 110 });

  assert.deepStrictEqual(a.assessLabels, ['8.7']);
  assert.deepStrictEqual(a.buckets['v8.7 (Q3 2026)'][0].probs, ['1-Yes']);

  [assessF, ahaF, prevF].forEach((f) => fs.unlinkSync(f));
});
