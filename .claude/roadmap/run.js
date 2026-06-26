const fs = require('fs');
const path = require('path');
const { parseAssessment, parseAha, parsePrevSource, parsePrevSourceRows, cleanName } = require('./lib/parse');
const { classify, isInternal } = require('./lib/bucket');
const { proposeCut, applyNextAssessment } = require('./lib/propose');
const { detectChanges } = require('./lib/changes');
const { writeOutputs } = require('./lib/render');
const { makeRenamer, loadRenameMap } = require('./lib/rename');
const { loadTheme } = require('./lib/deck-theme');
const { deckFromWorkbook } = require('./lib/deck');

function analyze(paths, opts) {
  const assessPaths = paths.assess;
  const primary = parseAssessment(assessPaths[0]);
  const nextAssess = assessPaths[1] ? parseAssessment(assessPaths[1]) : null;
  const prev = parsePrevSource(paths.prev);
  const ahaAll = paths.aha ? parseAha(paths.aha) : new Map();

  const buckets = {}; const newFeatures = []; const judgment = []; const current = [];
  const assessMeta = {}; const deliveredByPriority = [];
  const assessmentSyms = new Set([...primary.keys(), ...(nextAssess ? nextAssess.keys() : [])]);
  const nextNum = (String(opts.nextRelease).match(/8\.\d+/) || [])[0];

  for (const [sym, a] of primary) {
    assessMeta[sym] = { effort: a.effort, devComplete: a.devComplete };
    if (isInternal(a.summary)) continue;
    // A negative Product Priority marks a feature that has already shipped — treat as Delivered, off the active roadmap.
    if (Number.isFinite(a.priority) && a.priority < 0) {
      const c0 = prev.get(sym);
      deliveredByPriority.push({ sym, feature: c0 ? c0.feature : cleanName(a.summary) });
      continue;
    }
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
  // Carry forward manually-curated prev-Source rows that can never appear in an Assessment
  // (blank, '-', or multi-code Feature Code) so they are not silently dropped (spec §5/§10).
  const isSingleSym = (code) => /^SYM-\d+$/.test(String(code).trim());
  for (const row of parsePrevSourceRows(paths.prev)) {
    if (isSingleSym(row.code) || !row.feature) continue;
    const ms = opts.futureLabel;
    const rec = { sym: row.code || '(no code)', milestone: ms, product: row.product, feature: row.feature,
      theme: row.theme, priority: row.priority === '' ? '' : row.priority, prob: row.prob, description: row.description };
    (buckets[ms] = buckets[ms] || []).push(rec);
    current.push({ sym: rec.sym, milestone: ms, feature: rec.feature, priority: rec.priority });
    judgment.push({ sym: rec.sym, feature: rec.feature, reason: `manually-curated row (no Assessment, prev milestone "${row.milestone}") carried into ${ms} — confirm placement/inclusion` });
  }

  const tail = [...primary.entries()]
    .filter(([s, a]) => !isInternal(a.summary) && !/^1-Yes|^2\.1|^2\.2/.test(String(a.include))
      && Number.isFinite(a.priority) && a.priority <= opts.cutFuture)
    .map(([s, a]) => ({ sym: s, priority: a.priority }));
  // Features present in the Aha export but in neither the Assessment nor the previous Source —
  // unassessed candidates that would otherwise be missing from Source AND Backlog. Surfaced for the user to triage.
  const unassessed = [];
  for (const [sym, h] of ahaAll) {
    if (assessmentSyms.has(sym) || prev.has(sym) || isInternal(h.name)) continue;
    unassessed.push({ sym, feature: cleanName(h.name), priority: h.priority, status: h.status, release: h.release, initiative: h.initiative });
  }

  const proposedCut = proposeCut(tail);
  const changes = detectChanges(prev, current, assessmentSyms);
  changes.delivered = changes.delivered.filter((d) => /^SYM-\d+$/.test(String(d.sym).trim()));
  // Merge negative-priority (shipped) features into the delivered list, de-duplicated.
  const deliveredSeen = new Set(changes.delivered.map((d) => d.sym));
  for (const d of deliveredByPriority) if (!deliveredSeen.has(d.sym)) { changes.delivered.push(d); deliveredSeen.add(d.sym); }
  return { opts, proposedCut, buckets, newFeatures, judgment, changes, assessMeta, unassessed };
}

// Build records for user-approved additions (features chosen from the unassessed Aha list).
// Falls back to the Aha name/priority when the override doesn't specify them.
function buildAdditionRecords(additions, aha, renamer, clean) {
  return (additions || []).map((add) => {
    const h = aha.get(add.sym) || {};
    return {
      sym: add.sym,
      milestone: add.milestone,
      product: renamer(add.product || ''),
      feature: renamer(add.feature || clean(h.name || add.sym)),
      theme: add.theme || '',
      priority: (add.priority !== undefined && add.priority !== '') ? add.priority : (h.priority ?? ''),
      prob: add.prob || '',
      description: renamer(add.description || ''),
    };
  });
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
    // Legacy product-name renames (e.g. "Estimate Mobile" -> "Estimate for iOS"); configurable via --renames or default renames.json
    const renamer = makeRenamer(loadRenameMap(a.renames || path.join(__dirname, 'renames.json')));
    const records = [];
    for (const recs of Object.values(analysis.buckets)) for (const r of recs) {
      const d = (ov.descriptions || {})[r.sym];
      if (d) { r.product = d.product ?? r.product; r.theme = d.theme ?? r.theme; r.description = d.description ?? r.description; }
      if ((ov.milestoneOverrides || {})[r.sym]) r.milestone = ov.milestoneOverrides[r.sym];
      r.product = renamer(r.product); r.feature = renamer(r.feature); r.description = renamer(r.description);
      records.push(r);
    }
    // User-approved additions from the unassessed-Aha list: inject as records and mark them New.
    analysis.changes = analysis.changes || {};
    analysis.changes.added = analysis.changes.added || [];
    for (const rec of buildAdditionRecords(ov.additions, aha, renamer, cleanName)) {
      records.push(rec);
      analysis.changes.added.push({ sym: rec.sym, milestone: rec.milestone, feature: rec.feature });
    }
    const order = { [analysis.opts.currentRelease]: 0, [analysis.opts.nextRelease]: 1, [analysis.opts.futureLabel]: 2 };
    records.sort((x, y) => (order[x.milestone] - order[y.milestone]) || ((parseFloat(x.priority) || 9999) - (parseFloat(y.priority) || 9999)));
    const out = writeOutputs(a.outdir, a.date, { records, aha, prev, changes: analysis.changes, renamer, assessMeta: analysis.assessMeta || {}, opts: analysis.opts });
    console.log(`finalize: wrote\n ${out.srcPath}\n ${out.blPath}\n ${out.repPath}`);
  } else if (cmd === 'deck') {
    let theme;
    try {
      theme = loadTheme(a.theme || path.join(__dirname, 'deck-theme.json'));
    } catch (e) { console.error(`deck failed: ${e.message}`); process.exit(1); }
    const out = path.join(a.outdir, `Product Roadmap Deck ${a.date}.pptx`);
    deckFromWorkbook(a.source, theme, out)
      .then((p) => console.log(`deck: wrote\n ${p}`))
      .catch((e) => { console.error(`deck failed: ${e.message}`); process.exit(1); });
  } else { console.error('usage: run.js analyze|finalize|deck ...'); process.exit(1); }
}

if (require.main === module) main();
module.exports = { analyze, buildAdditionRecords };
