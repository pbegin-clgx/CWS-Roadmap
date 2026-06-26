// .claude/roadmap/test/regression.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'); const path = require('path');
const { analyze } = require('../run');
const { parsePrevSource } = require('../lib/parse');

const RM = path.resolve(__dirname, '../../../Roadmap');
const ASSESS = path.join(RM, '2026-06-22 Release 8.7 Assessment v1.0.xlsx');
const AHA = path.join(RM, 'aha_list_features_260623115843.xlsx');
const PREV = path.join(RM, 'backtest/old_baseline/Product Roadmap Source 20260525.xlsx');
const REAL = path.join(RM, 'Product Roadmap Source 20260623.xlsx');
const present = [ASSESS, AHA, PREV, REAL].every(fs.existsSync);

test('backtest reproduces >=90% milestone agreement and 100% current-release recall',
  { skip: present ? false : 'backtest files not present' }, () => {
  const a = analyze({ aha: AHA, assess: [ASSESS], prev: PREV },
    { currentRelease: 'v8.7 (Q3 2026)', nextRelease: 'v8.8 (Q4 2026)', futureLabel: 'Future (Q4 2026 - Q1 2027)', cut88: 72, cutFuture: 110 });
  const mine = new Map();
  for (const [ms, recs] of Object.entries(a.buckets)) for (const r of recs) mine.set(r.sym, ms);
  const norm = (m) => /8\.7/.test(m) ? '8.7' : /8\.8/.test(m) ? '8.8' : 'Future';
  const realSrc = parsePrevSource(REAL);
  let shared = 0, same = 0, real87 = 0, got87 = 0;
  for (const [sym, p] of realSrc) {
    if (!/^SYM-\d/.test(sym)) continue;
    const rN = norm(p.milestone);
    if (rN === '8.7') { real87++; if (mine.has(sym) && norm(mine.get(sym)) === '8.7') got87++; }
    if (mine.has(sym)) { shared++; if (norm(mine.get(sym)) === rN) same++; }
  }
  const agreement = same / shared;
  const recall87 = got87 / real87;
  console.log(`  agreement: ${(agreement*100).toFixed(1)}% (${same}/${shared}), recall87: ${(recall87*100).toFixed(1)}% (${got87}/${real87})`);
  assert.ok(agreement >= 0.90, `milestone agreement ${(agreement*100).toFixed(0)}% < 90%`);
  assert.strictEqual(recall87, 1, `current-release recall ${(recall87*100).toFixed(0)}% != 100%`);
});
