const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os'); const path = require('path'); const fs = require('fs');
const { writeSheets } = require('../lib/xlsx-io');
const { analyze } = require('../run');

const tmp = (n) => path.join(os.tmpdir(), `${n}-${process.pid}-${Math.floor(performance.now())}.xlsx`);
const aHeader = ['Aha','FB','Summary','Release in Aha','Priority Category','Product Priority','Project Code','Branch','Status','Include in release?','Dev Comments','Craig','Effort Estimate','x','y','z','Dev Stories Completed','QA Stories Completed','BT Stories Completed'];
const aRow = (sym, prio, inc, eff) => { const r = new Array(19).fill(''); r[0]=sym; r[2]=`${sym} thing - Implement`; r[3]='Release 8.7'; r[5]=prio; r[9]=inc; r[12]=eff; r[16]=1; r[17]=1; r[18]=1; return r; };

test('a negative Product Priority marks a feature Delivered ONLY when Include does not commit it to the current release', () => {
  const assessF = tmp('assess'); const ahaF = tmp('aha'); const prevF = tmp('prev');
  writeSheets(assessF, { 'Release Assessment': [aHeader,
    aRow('SYM-100', 5, '1-Yes', 40),
    aRow('SYM-200', -78, '3-No', 150), // carried-over, already-shipped remnant: negative priority, NOT committed to this release
  ] });
  writeSheets(ahaF, { Report: [['Feature reference #','test','Feature name','Product Priority','Feature status','Release name','a','b','Prioritization','c','d','Initiative name']] });
  writeSheets(prevF, { Source: [['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description'],
    ['v8.7 (Q3 2026)','Workspace','Shipped feature','UX','SYM-200',9,'1-Yes','desc']] });

  const a = analyze({ aha: ahaF, assess: [assessF], prev: prevF },
    { currentRelease: 'v8.7 (Q3 2026)', nextRelease: 'v8.8 (Q4 2026)', futureLabel: 'Future (Q4 2026 - Q1 2027)', cut88: 72, cutFuture: 110 });

  const inAnyBucket = (sym) => Object.values(a.buckets).flat().some((r) => r.sym === sym);
  assert.ok(inAnyBucket('SYM-100'), 'normal feature stays on the roadmap');
  assert.ok(!inAnyBucket('SYM-200'), 'negative-priority feature not committed to this release is NOT on the roadmap');
  assert.ok(a.changes.delivered.some((d) => d.sym === 'SYM-200'), 'negative-priority feature is marked Delivered');
  assert.strictEqual(a.assessMeta['SYM-200'].effort, 150);

  [assessF, ahaF, prevF].forEach((f) => fs.unlinkSync(f));
});

test('a negative Product Priority does NOT mark a feature Delivered when Include commits it to the current release', () => {
  // Some Assessments use negative numbers as an "absolute top priority" ranking tier for locked-in
  // current-release work that has not shipped yet — Include=1-Yes must win over the priority sign.
  const assessF = tmp('assess'); const ahaF = tmp('aha'); const prevF = tmp('prev');
  writeSheets(assessF, { 'Release Assessment': [aHeader,
    aRow('SYM-300', -77, '1-Yes', 80),
  ] });
  writeSheets(ahaF, { Report: [['Feature reference #','test','Feature name','Product Priority','Feature status','Release name','a','b','Prioritization','c','d','Initiative name']] });
  writeSheets(prevF, { Source: [['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description']] });

  const a = analyze({ aha: ahaF, assess: [assessF], prev: prevF },
    { currentRelease: 'v8.7 (Q3 2026)', nextRelease: 'v8.8 (Q4 2026)', futureLabel: 'Future (Q4 2026 - Q1 2027)', cut88: 72, cutFuture: 110 });

  const inAnyBucket = (sym) => Object.values(a.buckets).flat().some((r) => r.sym === sym);
  assert.ok(inAnyBucket('SYM-300'), 'current-release-committed feature stays on the roadmap despite negative priority');
  assert.ok(!a.changes.delivered.some((d) => d.sym === 'SYM-300'), 'current-release-committed feature is NOT marked Delivered');
  assert.strictEqual(a.buckets['v8.7 (Q3 2026)'][0].sym, 'SYM-300');

  [assessF, ahaF, prevF].forEach((f) => fs.unlinkSync(f));
});
