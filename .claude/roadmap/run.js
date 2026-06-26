const fs = require('fs');
const { parseAssessment, parseAha, parsePrevSource, cleanName } = require('./lib/parse');
const { classify, isInternal } = require('./lib/bucket');
const { proposeCut, applyNextAssessment } = require('./lib/propose');
const { detectChanges } = require('./lib/changes');
const { writeOutputs } = require('./lib/render');

function analyze(paths, opts) {
  const assessPaths = paths.assess;
  const primary = parseAssessment(assessPaths[0]);
  const nextAssess = assessPaths[1] ? parseAssessment(assessPaths[1]) : null;
  const prev = parsePrevSource(paths.prev);

  const buckets = {}; const newFeatures = []; const judgment = []; const current = [];
  const assessmentSyms = new Set([...primary.keys(), ...(nextAssess ? nextAssess.keys() : [])]);
  const nextNum = (String(opts.nextRelease).match(/8\.\d+/) || [])[0];

  for (const [sym, a] of primary) {
    if (isInternal(a.summary)) continue;
    let ms = classify(a, opts);
    if (ms === 'DROP') continue;
    ms = applyNextAssessment(ms, sym, nextAssess, opts);
    const c = prev.get(sym);
    const prio = a.priority === Infinity ? '' : a.priority;
    const rec = { sym, milestone: ms, product: c ? c.product : '', feature: c ? c.feature : cleanName(a.summary),
      theme: c ? c.theme : '', priority: prio, prob: a.include, description: c ? c.description : '' };
    (buckets[ms] = buckets[ms] || []).push(rec);
    current.push({ sym, milestone: ms, feature: rec.feature, priority: prio });
    if (!c) newFeatures.push({ sym, feature: rec.feature, milestone: ms });
    const rel = String(a.releaseInAha);
    const namesOtherRelease = /Release 8\.\d/.test(rel) && (!nextNum || !rel.includes(nextNum));
    const relConflict = namesOtherRelease && ms === opts.futureLabel;
    const nearCut = !c && Number.isFinite(a.priority) && Math.abs(a.priority - opts.cut88) <= 5;
    if (relConflict || nearCut) judgment.push({ sym, feature: rec.feature, reason: relConflict ? `Aha says ${rel} but rule placed ${ms}` : 'new feature near cut-line' });
  }
  const tail = [...primary.entries()]
    .filter(([s, a]) => !isInternal(a.summary) && !/^1-Yes|^2\.1|^2\.2/.test(String(a.include)))
    .map(([s, a]) => ({ sym: s, priority: a.priority }));
  const proposedCut = proposeCut(tail);
  const changes = detectChanges(prev, current, assessmentSyms);
  return { opts, proposedCut, buckets, newFeatures, judgment, changes };
}

function parseArgs(argv) { const o = {}; for (let i = 0; i < argv.length; i += 2) o[argv[i].replace(/^--/, '')] = argv[i + 1]; return o; }

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const a = parseArgs(rest);
  if (cmd === 'analyze') {
    const opts = { currentRelease: a.current, nextRelease: a.next, futureLabel: a.future, cut88: parseFloat(a.cut88 || '72'), cutFuture: parseFloat(a.cutFuture || '110') };
    const res = analyze({ aha: a.aha, assess: String(a.assess).split(','), prev: a.prev }, opts);
    fs.writeFileSync(a.out || 'analysis.json', JSON.stringify(res, null, 2));
    console.log(`analyze: wrote ${a.out || 'analysis.json'} (proposedCut ${JSON.stringify(res.proposedCut)})`);
  } else if (cmd === 'finalize') {
    const analysis = JSON.parse(fs.readFileSync(a.analysis, 'utf8'));
    const ov = a.overrides ? JSON.parse(fs.readFileSync(a.overrides, 'utf8')) : {};
    const aha = parseAha(a.aha); const prev = parsePrevSource(a.prev);
    const records = [];
    for (const recs of Object.values(analysis.buckets)) for (const r of recs) {
      const d = (ov.descriptions || {})[r.sym];
      if (d) { r.product = d.product ?? r.product; r.theme = d.theme ?? r.theme; r.description = d.description ?? r.description; }
      if ((ov.milestoneOverrides || {})[r.sym]) r.milestone = ov.milestoneOverrides[r.sym];
      records.push(r);
    }
    const order = { [analysis.opts.currentRelease]: 0, [analysis.opts.nextRelease]: 1, [analysis.opts.futureLabel]: 2 };
    records.sort((x, y) => (order[x.milestone] - order[y.milestone]) || ((parseFloat(x.priority) || 9999) - (parseFloat(y.priority) || 9999)));
    const out = writeOutputs(a.outdir, a.date, { records, aha, prev, changes: analysis.changes });
    console.log(`finalize: wrote\n ${out.srcPath}\n ${out.blPath}\n ${out.repPath}`);
  } else { console.error('usage: run.js analyze|finalize ...'); process.exit(1); }
}

if (require.main === module) main();
module.exports = { analyze };
