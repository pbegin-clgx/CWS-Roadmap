const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os'); const path = require('path'); const fs = require('fs');
const { writeSheets } = require('../lib/xlsx-io');
const { analyze, buildAdditionRecords } = require('../run');

const tmp = (n) => path.join(os.tmpdir(), `${n}-${process.pid}-${Math.floor(performance.now())}.xlsx`);
const aHeader = ['Aha','FB','Summary','Release in Aha','Priority Category','Product Priority','Project Code','Branch','Status','Include in release?','Dev Comments','Craig','Effort Estimate'];
const ahaHeader = ['Feature reference #','test','Feature name','Product Priority','Feature status','Release name','x','y','Prioritization','z','w','Initiative name'];

test('analyze surfaces Aha features missing from both Assessment and prev Source (excluding internal)', () => {
  const assessF = tmp('assess'); const ahaF = tmp('aha'); const prevF = tmp('prev');
  const aRow = (sym) => { const r = new Array(13).fill(''); r[0]=sym; r[2]=`${sym} thing - Implement`; r[3]='Release 8.7'; r[5]=5; r[9]='1-Yes'; return r; };
  writeSheets(assessF, { 'Release Assessment': [aHeader, aRow('SYM-1')] });
  const ahaRow = (sym, name) => { const r = new Array(12).fill(''); r[0]=sym; r[2]=name; r[3]=1; r[4]='In development'; r[5]='Design Backlog'; r[11]='Init'; return r; };
  writeSheets(ahaF, { Report: [ahaHeader,
    ahaRow('SYM-1', '1 - Assessed - Implement'),
    ahaRow('SYM-2', '2 - In prev source - Implement'),
    ahaRow('SYM-3', '93520 - New Cool Feature - Implement'),
    ahaRow('SYM-4', '93034 - Incorporate new 8.7 translations - Implement'),
  ] });
  writeSheets(prevF, { Source: [['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description'],
    ['v8.7 (Q3 2026)','Workspace','Prev feature','UX','SYM-2',9,'1-Yes','desc']] });

  const a = analyze({ aha: ahaF, assess: [assessF], prev: prevF },
    { currentRelease: 'v8.7 (Q3 2026)', nextRelease: 'v8.8 (Q4 2026)', futureLabel: 'Future (Q4 2026 - Q1 2027)', cut88: 72, cutFuture: 110 });

  const syms = a.unassessed.map((u) => u.sym);
  assert.deepStrictEqual(syms, ['SYM-3']); // 1 assessed, 2 in prev, 4 internal -> only 3
  assert.strictEqual(a.unassessed[0].feature, 'New Cool Feature');

  [assessF, ahaF, prevF].forEach((f) => fs.unlinkSync(f));
});

test('buildAdditionRecords maps overrides and falls back to Aha name/priority', () => {
  const aha = new Map([['SYM-C', { name: '93520 - New Cool Feature - Implement', priority: 1 }]]);
  const id = (s) => s;
  const clean = (s) => String(s).replace(/^\s*\d+\s*-\s*/, '').replace(/\s*-\s*Implement$/, '');
  const recs = buildAdditionRecords([
    { sym: 'SYM-C', milestone: 'v8.8 (Q4 2026)', product: 'Workspace', theme: 'UX', description: 'A new thing.' },
  ], aha, id, clean);
  assert.strictEqual(recs.length, 1);
  assert.strictEqual(recs[0].milestone, 'v8.8 (Q4 2026)');
  assert.strictEqual(recs[0].feature, 'New Cool Feature'); // fell back to cleaned Aha name
  assert.strictEqual(recs[0].priority, 1); // fell back to Aha Product Priority
  assert.strictEqual(recs[0].description, 'A new thing.');
});
