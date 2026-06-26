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
