// .claude/roadmap/test/parse.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const os = require('os'); const path = require('path'); const fs = require('fs');
const { writeSheets } = require('../lib/xlsx-io');
const { parseAssessment, parseAha, parsePrevSource, parsePrevSourceRows, cleanName } = require('../lib/parse');

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
  assert.strictEqual(m.get('SYM-2561').effort, 100);
  assert.strictEqual(m.get('SYM-2497').priority, Infinity);
  fs.unlinkSync(f);
});

test('parseAssessment computes devComplete as the average of cols Q/R/S (idx 16/17/18)', () => {
  const f = tmp('assess-dc');
  const header = ['Aha','FB','Summary','Release in Aha','Priority Category','Product Priority','Project Code','Branch','Status','Include in release?','Dev Comments','Craig','Effort Estimate','DevDays','QADays','BSADays','Dev Stories Completed','QA Stories Completed','BT Stories Completed'];
  const row = (sym, dev, qa, bt) => { const r = new Array(19).fill(''); r[0]=sym; r[2]=sym+' - Implement'; r[5]=1; r[9]='1-Yes'; r[12]=50; r[16]=dev; r[17]=qa; r[18]=bt; return r; };
  writeSheets(f, { 'Release Assessment': [header, row('SYM-1', 0.9, 0, 0.3), row('SYM-2', '', '', '')] });
  const m = parseAssessment(f);
  assert.ok(Math.abs(m.get('SYM-1').devComplete - (0.9 + 0 + 0.3) / 3) < 1e-9);
  assert.strictEqual(m.get('SYM-2').devComplete, ''); // all blank -> blank
  fs.unlinkSync(f);
});

test('parseAha filters non-SYM rows and extracts name, prioritization, and initiative', () => {
  const f = tmp('aha');
  writeSheets(f, { 'Report': [
    ['Feature reference #','test','Feature name','Product Priority','Feature status','Release name','Feature assigned to','Designer','Prioritization','Branch','ARC','Initiative name'],
    ['SYM-2561','','Claims Workspace Enhancement','2','Green','Release 8.6.50x','','','High','','','Q3 Strategic Initiative'],
    ['not-a-sym','','Another Feature','1','Green','Release 8.6.50x','','','Medium','','','Q3 Strategic Initiative'],
  ]});
  const m = parseAha(f);
  assert.strictEqual(m.size, 1);
  assert.strictEqual(m.get('SYM-2561').name, 'Claims Workspace Enhancement');
  assert.strictEqual(m.get('SYM-2561').prioritization, 'High');
  assert.strictEqual(m.get('SYM-2561').initiative, 'Q3 Strategic Initiative');
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

test('parsePrevSource/parsePrevSourceRows resolve columns by header name, so a Source workbook with 2 Prob columns (from a multi-assessment cycle) still parses Description correctly', () => {
  const f = tmp('prev-multiprob');
  writeSheets(f, { 'Source': [
    ['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob 8.7','Prob 8.8','Description'],
    ['v8.7 (Q3 2026)','Workspace','Autosave Payment Progress','UX','SYM-2561',17,'1-Yes','3-No','Autosaves work.'],
  ]});
  const m = parsePrevSource(f);
  assert.strictEqual(m.get('SYM-2561').product, 'Workspace');
  assert.strictEqual(m.get('SYM-2561').priority, 17);
  assert.strictEqual(m.get('SYM-2561').description, 'Autosaves work.'); // not shifted/garbled by the extra Prob column
  assert.strictEqual(m.get('SYM-2561').prob, '1-Yes'); // first Prob-like column, for the legacy single-value carry-forward path

  const rows = parsePrevSourceRows(f);
  assert.strictEqual(rows[0].code, 'SYM-2561');
  assert.strictEqual(rows[0].description, 'Autosaves work.');
  fs.unlinkSync(f);
});
