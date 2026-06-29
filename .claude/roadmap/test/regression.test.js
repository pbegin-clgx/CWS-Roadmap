// .claude/roadmap/test/regression.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const path = require('path');
const { analyze } = require('../run');
const { parseAssessment, parsePrevSource } = require('../lib/parse');

const RM = path.resolve(__dirname, '../../../Roadmap');
const ASSESS = path.join(RM, '2026-06-22 Release 8.7 Assessment v1.0.xlsx');
const AHA = path.join(RM, 'aha_list_features_260623115843.xlsx');
const PREV = path.join(RM, 'backtest/old_baseline/Product Roadmap Source 20260525.xlsx');
const REAL = path.join(RM, 'Product Roadmap Source 20260623.xlsx');
const present = [ASSESS, AHA, PREV, REAL].every(fs.existsSync);
const OPTS = { currentRelease: 'v8.7 (Q3 2026)', nextRelease: 'v8.8 (Q4 2026)', futureLabel: 'Future (Q4 2026 - Q1 2027)', cutFuture: 110 };
const norm = (m) => (/8\.7/.test(m) ? '8.7' : /8\.8/.test(m) ? '8.8' : 'Future');

// "This release" (8.7) is driven by 1-Yes/2.1/2.2 — unchanged by the 8.8 refinement — so it should still
// reproduce Pascal's hand-built 8.7 set exactly. We deliberately no longer assert 8.8/Future agreement with
// the old deck: the refined rule intentionally diverges there (it was redefined after this baseline).
test('backtest still reproduces 100% of the current-release (8.7) features',
  { skip: present ? false : 'backtest files not present' }, () => {
  const a = analyze({ aha: AHA, assess: [ASSESS], prev: PREV }, OPTS);
  const mine = new Map();
  for (const [ms, recs] of Object.entries(a.buckets)) for (const r of recs) mine.set(r.sym, ms);
  const realSrc = parsePrevSource(REAL);
  let real87 = 0, got87 = 0;
  for (const [sym, p] of realSrc) {
    if (!/^SYM-\d/.test(sym)) continue;
    if (norm(p.milestone) === '8.7') { real87++; if (mine.has(sym) && norm(mine.get(sym)) === '8.7') got87++; }
  }
  console.log(`  current-release recall: ${got87}/${real87}`);
  assert.strictEqual(got87, real87, `current-release recall ${got87}/${real87} != 100%`);
});

// Invariants of the refined 8.8 rule, checked against the real assessment data.
test('refined rule: every 8.8 feature is a Maybe within window OR an Aha-tagged-8.8 item',
  { skip: present ? false : 'backtest files not present' }, () => {
  const a = analyze({ aha: AHA, assess: [ASSESS], prev: PREV }, OPTS);
  const assess = parseAssessment(ASSESS);
  const in88 = (a.buckets[OPTS.nextRelease] || []).map((r) => r.sym);
  let no3WithoutTag = 0, maybeOverLine = 0;
  for (const sym of in88) {
    const e = assess.get(sym);
    if (!e) continue; // additions / non-assessment rows are allowed in 8.8 by user choice
    const tagged88 = /Release\s+8\.8/.test(String(e.releaseInAha));
    if (/^3-No/.test(e.include) && !tagged88) no3WithoutTag++;
    if (/^2\.[34]/.test(e.include) && Number.isFinite(e.priority) && e.priority > OPTS.cutFuture) maybeOverLine++;
  }
  assert.strictEqual(no3WithoutTag, 0, `${no3WithoutTag} untagged 3-No items leaked into 8.8`);
  assert.strictEqual(maybeOverLine, 0, `${maybeOverLine} below-the-line Maybes leaked into 8.8`);
});
