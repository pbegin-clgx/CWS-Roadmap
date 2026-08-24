const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os'); const path = require('path'); const fs = require('fs');
const { writeSheets } = require('../lib/xlsx-io');
const { analyze } = require('../run');

const tmp = (n) => path.join(os.tmpdir(), `${n}-${process.pid}-${Math.floor(performance.now())}.xlsx`);
const aHeader = ['Aha','FB','Summary','Release in Aha','Priority Category','Product Priority','Project Code','Branch','Status','Include in release?','Dev Comments','Craig','Effort Estimate'];
const aRow = (sym, prio, inc) => { const r = new Array(13).fill(''); r[0]=sym; r[2]=`${sym} thing - Implement`; r[3]='Release 8.7'; r[5]=prio; r[9]=inc; return r; };

const OPTS = { currentRelease: 'v8.7 (Q3 2026)', nextRelease: 'v8.8 (Q4 2026)', futureLabel: 'Future (Q1-Q2 2027)', cut88: 72, cutFuture: 110 };

test('a feature with a low current-release priority but No/Maybe in the next release assessment is NOT bucketed into the next release', () => {
  const assessF = tmp('assess87'); const nextAssessF = tmp('assess88'); const ahaF = tmp('aha'); const prevF = tmp('prev');
  writeSheets(assessF, { 'Release Assessment': [aHeader,
    aRow('SYM-1', 7, '3-No'),  // low 8.7-priority number would have landed it in v8.8 under the old priority-only rule
  ] });
  writeSheets(nextAssessF, { 'Release Assessment': [aHeader,
    aRow('SYM-1', 20, '2.3-Maybe'), // the 8.8 team's own dedicated assessment says no, and its own priority still fits under cutFuture
  ] });
  writeSheets(ahaF, { Report: [['Feature reference #','test','Feature name','Product Priority','Feature status','Release name','a','b','Prioritization','c','d','Initiative name']] });
  writeSheets(prevF, { Source: [['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description']] });

  const a = analyze({ aha: ahaF, assess: [assessF, nextAssessF], prev: prevF }, OPTS);

  const inBucket = (ms, sym) => (a.buckets[ms] || []).some((r) => r.sym === sym);
  assert.ok(!inBucket('v8.8 (Q4 2026)', 'SYM-1'), 'not bucketed into v8.8 despite a low 8.7-priority number');
  assert.ok(inBucket('Future (Q1-Q2 2027)', 'SYM-1'), 'instead lands in Future, per the 8.8 assessment\'s OWN priority (20 <= cutFuture)');

  [assessF, nextAssessF, ahaF, prevF].forEach((f) => fs.unlinkSync(f));
});

test('a feature explicitly excluded by the next-release assessment AND worse than cutFuture there is dropped entirely (surfaced only in belowCutLine)', () => {
  const assessF = tmp('assess87b'); const nextAssessF = tmp('assess88b'); const ahaF = tmp('aha'); const prevF = tmp('prev');
  writeSheets(assessF, { 'Release Assessment': [aHeader,
    aRow('SYM-2', 7, '3-No'),
  ] });
  writeSheets(nextAssessF, { 'Release Assessment': [aHeader,
    aRow('SYM-2', 500, '3-No'), // excluded from 8.8, and its own priority is way past cutFuture too
  ] });
  writeSheets(ahaF, { Report: [['Feature reference #','test','Feature name','Product Priority','Feature status','Release name','a','b','Prioritization','c','d','Initiative name']] });
  writeSheets(prevF, { Source: [['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description']] });

  const a = analyze({ aha: ahaF, assess: [assessF, nextAssessF], prev: prevF }, OPTS);

  const inAnyBucket = (sym) => Object.values(a.buckets).flat().some((r) => r.sym === sym);
  assert.ok(!inAnyBucket('SYM-2'), 'not on the Source/deck roadmap at all');
  assert.ok(a.belowCutLine.some((r) => r.sym === 'SYM-2'), 'still surfaced in belowCutLine for the Backlog');

  [assessF, nextAssessF, ahaF, prevF].forEach((f) => fs.unlinkSync(f));
});

test('a feature the current release already committed to is never bumped to the next release by the next assessment', () => {
  const assessF = tmp('assess87c'); const nextAssessF = tmp('assess88c'); const ahaF = tmp('aha'); const prevF = tmp('prev');
  writeSheets(assessF, { 'Release Assessment': [aHeader,
    aRow('SYM-3', 5, '1-Yes'), // committed to v8.7
  ] });
  writeSheets(nextAssessF, { 'Release Assessment': [aHeader,
    aRow('SYM-3', 5, '1-Yes'), // also tracked (e.g. carried over) in the 8.8 file
  ] });
  writeSheets(ahaF, { Report: [['Feature reference #','test','Feature name','Product Priority','Feature status','Release name','a','b','Prioritization','c','d','Initiative name']] });
  writeSheets(prevF, { Source: [['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description']] });

  const a = analyze({ aha: ahaF, assess: [assessF, nextAssessF], prev: prevF }, OPTS);

  const inBucket = (ms, sym) => (a.buckets[ms] || []).some((r) => r.sym === sym);
  assert.ok(inBucket('v8.7 (Q3 2026)', 'SYM-3'), 'stays in v8.7 despite also appearing 1-Yes in the 8.8 file');
  assert.ok(!inBucket('v8.8 (Q4 2026)', 'SYM-3'), 'is NOT bumped to v8.8');

  [assessF, nextAssessF, ahaF, prevF].forEach((f) => fs.unlinkSync(f));
});
