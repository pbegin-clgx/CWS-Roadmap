// .claude/roadmap/test/carryforward.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os'); const path = require('path'); const fs = require('fs');
const { writeSheets } = require('../lib/xlsx-io');
const { analyze } = require('../run');

function tmp(name) { return path.join(os.tmpdir(), `${name}-${process.pid}.xlsx`); }

test('carry-forward: non-SYM prev-Source rows appear in Future bucket and judgment; multi-code not in delivered', () => {
  const prevFile = tmp('cf-prev');
  const assessFile = tmp('cf-assess');
  const ahaFile = tmp('cf-aha');

  writeSheets(prevFile, { 'Source': [
    ['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description'],
    // single-SYM row — must NOT be carried forward (handled by assessment loop)
    ['v8.7 (Q3 2026)','Workspace','Some single feature','UX','SYM-1000',5,'1-Yes','Single SYM desc.'],
    // multi-code row — must be carried forward
    ['Future (Q4 2026 - Q1 2027)','Workspace','Contents reporting enhancements','Analytics','SYM-2296, SYM-2297, SYM-2298',80,'2.1-Likely','Multi-code desc.'],
    // dash-code row — must be carried forward
    ['Future (Q4 2026 - Q1 2027)','Mobile','Estimate Mobile - continued','Mobile','- ',90,'2.2-Maybe','Dash desc.'],
  ]});

  writeSheets(assessFile, { 'Release Assessment': [
    ['Aha','FB','Summary','Release in Aha','Priority Category','Product Priority','Project Code','Branch','Status','Include in release?','Dev Comments','Craig','Effort Estimate'],
    ['SYM-1000','','Some single feature','Release 8.7','',5,'','','Green','1-Yes','','',50],
  ]});

  writeSheets(ahaFile, { 'Report': [
    ['Feature reference #','test','Feature name','Product Priority','Feature status','Release name','Feature assigned to','Designer','Prioritization','Branch','ARC','Initiative name'],
  ]});

  const opts = {
    currentRelease: 'v8.7 (Q3 2026)',
    nextRelease: 'v8.8 (Q4 2026)',
    futureLabel: 'Future (Q4 2026 - Q1 2027)',
    cut88: 72,
    cutFuture: 110,
  };
  const a = analyze({ aha: ahaFile, assess: [assessFile], prev: prevFile }, opts);

  const futureRecs = a.buckets['Future (Q4 2026 - Q1 2027)'] || [];
  const futureFeatures = futureRecs.map((r) => r.feature);

  // 1. multi-code row feature appears in Future bucket
  assert.ok(
    futureFeatures.includes('Contents reporting enhancements'),
    `Expected "Contents reporting enhancements" in Future bucket, got: ${JSON.stringify(futureFeatures)}`
  );

  // 2. dash-code row feature appears in Future bucket
  assert.ok(
    futureFeatures.includes('Estimate Mobile - continued'),
    `Expected "Estimate Mobile - continued" in Future bucket, got: ${JSON.stringify(futureFeatures)}`
  );

  // 3. both appear in judgment
  const judgmentFeatures = a.judgment.map((j) => j.feature);
  assert.ok(
    judgmentFeatures.includes('Contents reporting enhancements'),
    `Expected "Contents reporting enhancements" in judgment, got: ${JSON.stringify(judgmentFeatures)}`
  );
  assert.ok(
    judgmentFeatures.includes('Estimate Mobile - continued'),
    `Expected "Estimate Mobile - continued" in judgment, got: ${JSON.stringify(judgmentFeatures)}`
  );

  // 4. multi-code row NOT mislabeled as delivered
  const deliveredSyms = a.changes.delivered.map((d) => d.sym);
  assert.ok(
    !deliveredSyms.includes('SYM-2296, SYM-2297, SYM-2298'),
    `Multi-code sym must not appear in delivered, got: ${JSON.stringify(deliveredSyms)}`
  );

  fs.unlinkSync(prevFile);
  fs.unlinkSync(assessFile);
  fs.unlinkSync(ahaFile);
});
