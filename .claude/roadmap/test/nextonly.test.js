const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os'); const path = require('path'); const fs = require('fs');
const { writeSheets } = require('../lib/xlsx-io');
const { analyze } = require('../run');

const tmp = (n) => path.join(os.tmpdir(), `${n}-${process.pid}-${Math.floor(performance.now())}.xlsx`);
const aHeader = ['Aha','FB','Summary','Release in Aha','Priority Category','Product Priority','Project Code','Branch','Status','Include in release?','Dev Comments','Craig','Effort Estimate'];
const aRow = (sym, prio, inc, summary) => { const r = new Array(13).fill(''); r[0]=sym; r[2]=summary || `${sym} thing - Implement`; r[3]='Release 8.7'; r[5]=prio; r[9]=inc; return r; };

const OPTS = { currentRelease: 'v8.7 (Q3 2026)', nextRelease: 'v8.8 (Q4 2026)', futureLabel: 'Future (Q1-Q2 2027)', cut88: 72, cutFuture: 110 };

test('a feature that only exists in the next-release assessment (never in the current one) is bucketed, not invisible', () => {
  const assessF = tmp('assess87'); const nextAssessF = tmp('assess88'); const ahaF = tmp('aha'); const prevF = tmp('prev');
  writeSheets(assessF, { 'Release Assessment': [aHeader,
    aRow('SYM-100', 5, '1-Yes'), // a normal current-release feature, for contrast
  ] });
  writeSheets(nextAssessF, { 'Release Assessment': [aHeader,
    aRow('SYM-200', 18, '1-Yes'), // brand new, only ever assessed for 8.8
  ] });
  writeSheets(ahaF, { Report: [['Feature reference #','test','Feature name','Product Priority','Feature status','Release name','a','b','Prioritization','c','d','Initiative name']] });
  writeSheets(prevF, { Source: [['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description']] });

  const a = analyze({ aha: ahaF, assess: [assessF, nextAssessF], prev: prevF }, OPTS);

  const inBucket = (ms, sym) => (a.buckets[ms] || []).some((r) => r.sym === sym);
  assert.ok(inBucket('v8.8 (Q4 2026)', 'SYM-200'), 'lands in v8.8 per its own 1-Yes verdict, instead of vanishing');
  assert.ok(a.judgment.some((j) => j.sym === 'SYM-200'), 'flagged for review since it is a newly-surfaced category');
  assert.ok(!a.unassessed.some((u) => u.sym === 'SYM-200'), 'not ALSO listed as unassessed, since it is now properly handled');

  [assessF, nextAssessF, ahaF, prevF].forEach((f) => fs.unlinkSync(f));
});

test('a next-only feature the next assessment excludes (No/Maybe) falls to Future or Drop by its own priority, same as the second-assessment gate', () => {
  const assessF = tmp('assess87b'); const nextAssessF = tmp('assess88b'); const ahaF = tmp('aha'); const prevF = tmp('prev');
  writeSheets(assessF, { 'Release Assessment': [aHeader] });
  writeSheets(nextAssessF, { 'Release Assessment': [aHeader,
    aRow('SYM-300', 50, '3-No'),  // excluded from 8.8, own priority fits Future
    aRow('SYM-400', 500, '3-No'), // excluded from 8.8, own priority misses cutFuture -> dropped
  ] });
  writeSheets(ahaF, { Report: [['Feature reference #','test','Feature name','Product Priority','Feature status','Release name','a','b','Prioritization','c','d','Initiative name']] });
  writeSheets(prevF, { Source: [['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description']] });

  const a = analyze({ aha: ahaF, assess: [assessF, nextAssessF], prev: prevF }, OPTS);

  const inAnyBucket = (sym) => Object.values(a.buckets).flat().some((r) => r.sym === sym);
  assert.ok((a.buckets['Future (Q1-Q2 2027)'] || []).some((r) => r.sym === 'SYM-300'), 'lands in Future by its own priority');
  assert.ok(!inAnyBucket('SYM-400'), 'not on the roadmap at all');
  assert.ok(a.belowCutLine.some((r) => r.sym === 'SYM-400'), 'still surfaced in belowCutLine for the Backlog');

  [assessF, nextAssessF, ahaF, prevF].forEach((f) => fs.unlinkSync(f));
});

test('an internal/tech-debt item that only exists in the next-release assessment is still excluded from the customer roadmap', () => {
  const assessF = tmp('assess87c'); const nextAssessF = tmp('assess88c'); const ahaF = tmp('aha'); const prevF = tmp('prev');
  writeSheets(assessF, { 'Release Assessment': [aHeader] });
  writeSheets(nextAssessF, { 'Release Assessment': [aHeader,
    aRow('SYM-500', 5, '1-Yes', 'Integrate MixPanel in Claims Workspace - Implement'),
  ] });
  writeSheets(ahaF, { Report: [['Feature reference #','test','Feature name','Product Priority','Feature status','Release name','a','b','Prioritization','c','d','Initiative name']] });
  writeSheets(prevF, { Source: [['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description']] });

  const a = analyze({ aha: ahaF, assess: [assessF, nextAssessF], prev: prevF }, OPTS);

  const inAnyBucket = (sym) => Object.values(a.buckets).flat().some((r) => r.sym === sym);
  assert.ok(!inAnyBucket('SYM-500'), 'internal item stays excluded, same as if it had been in the current-release file');
  assert.ok(!a.belowCutLine.some((r) => r.sym === 'SYM-500'), 'not even in belowCutLine -- internal items are excluded outright, not just below the cut-line');

  [assessF, nextAssessF, ahaF, prevF].forEach((f) => fs.unlinkSync(f));
});
