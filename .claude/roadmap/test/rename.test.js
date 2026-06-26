const { test } = require('node:test');
const assert = require('node:assert');
const { makeRenamer } = require('../lib/rename');

test('makeRenamer applies ordered literal replacements', () => {
  const r = makeRenamer([
    { from: 'Estimate Mobile', to: 'Estimate for iOS' },
    { from: 'Capture Questionnaire as Assembly', to: 'Estimate for iOS Questionnaire as Assembly' },
    { from: 'CAPTURE -', to: 'Estimate for iOS -' },
  ]);
  assert.strictEqual(r('Estimate Mobile: Autosave Photos'), 'Estimate for iOS: Autosave Photos');
  assert.strictEqual(r('91945 - Capture Questionnaire as Assembly - Implement'), '91945 - Estimate for iOS Questionnaire as Assembly - Implement');
  assert.strictEqual(r('69623 - CAPTURE - Prevent Editing'), '69623 - Estimate for iOS - Prevent Editing');
  assert.strictEqual(r('No legacy name here'), 'No legacy name here');
});

test('makeRenamer does not touch the lowercase verb "capture" or "Capture Questionnaires" rebrand line', () => {
  const r = makeRenamer([
    { from: 'Capture Questionnaire as Assembly', to: 'Estimate for iOS Questionnaire as Assembly' },
    { from: 'CAPTURE -', to: 'Estimate for iOS -' },
  ]);
  assert.strictEqual(r('the platform will capture metadata'), 'the platform will capture metadata');
  assert.strictEqual(r('Rebrand Desk Adjuster & Capture Questionnaires'), 'Rebrand Desk Adjuster & Capture Questionnaires');
});

test('makeRenamer with empty map is identity and tolerates null', () => {
  const r = makeRenamer([]);
  assert.strictEqual(r('x'), 'x');
  assert.strictEqual(r(''), '');
  assert.strictEqual(r(null), null);
});
