const { writeSheets } = require('./xlsx-io');
const fs = require('fs');
const path = require('path');

const SOURCE_HEADER = ['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description'];
const BACKLOG_HEADER = ['Feature reference #','Old Priority','New Priority','Feature name','Initiative name','Release name','Feature status','Effort - man days','Dev Complete Rate','Prioritization','Feature tags','Change'];

// Classify a feature's cross-cycle change for the Backlog "Change" column.
// Combines tags when more than one applies (e.g. re-bucketed AND priority moved).
function changeLabel(sym, changes) {
  const ch = changes || {};
  const has = (arr) => (arr || []).some((d) => d.sym === sym);
  const tags = [];
  if (has(ch.added)) tags.push('New');
  if (has(ch.priorityUp)) tags.push('Priority Up');
  if (has(ch.priorityDown)) tags.push('Priority Down');
  if (has(ch.reBucketed)) tags.push('Re-bucketed');
  return tags.length ? tags.join(', ') : 'Unchanged';
}

function sourceRows(records) {
  const rows = [SOURCE_HEADER.slice()];
  for (const r of records) rows.push([r.milestone, r.product, r.feature, r.theme, r.sym, r.priority, r.prob, r.description]);
  return rows;
}

function backlogRows(records, aha, prev, changes, renamer = (s) => s, assessMeta = {}) {
  const meta = (sym) => assessMeta[sym] || {};
  const rows = [BACKLOG_HEADER.slice()];
  for (const r of records) {
    const a = aha.get(r.sym) || {};
    const p = prev.get(r.sym) || {};
    const m = meta(r.sym);
    rows.push([r.sym, (p.priority ?? ''), r.priority, renamer(a.name || r.feature), renamer(a.initiative || ''), a.release || '', a.status || '', m.effort ?? '', m.devComplete ?? '', a.prioritization || '', '', changeLabel(r.sym, changes)]);
  }
  // Append delivered features (shipped, off the active roadmap) so the Backlog is a full change log.
  for (const d of (changes && changes.delivered) || []) {
    const a = aha.get(d.sym) || {};
    const m = meta(d.sym);
    rows.push([d.sym, '', '', renamer(a.name || d.feature), renamer(a.initiative || ''), a.release || '', a.status || '', m.effort ?? '', m.devComplete ?? '', a.prioritization || '', '', 'Delivered']);
  }
  return rows;
}

// ---- Deck sheets: Summary matrix + Detailed per-milestone sheets ----
const PRODUCT_ORDER = ['Workspace', 'Estimate', 'Estimate for iOS', 'Contents', 'Reporting', 'API', 'Reinspect', 'DHA & Integrations', 'Engage Video', 'Engage Link'];
const productRank = (p) => { const i = PRODUCT_ORDER.indexOf(p); return i === -1 ? PRODUCT_ORDER.length : i; };
const orderedProducts = (recs) => [...new Set(recs.map((r) => r.product).filter(Boolean))].sort((a, b) => (productRank(a) - productRank(b)) || a.localeCompare(b));
const featureWithCode = (r) => (/SYM-\d/.test(String(r.sym)) ? `${r.feature} (${r.sym})` : r.feature);
// Excel sheet name (<=31 chars, no : \ / ? * [ ]) for a milestone's Detailed tab.
function detailedSheetName(label) {
  const m = String(label).match(/(\d+\.\d+)/);
  if (m) return `Detailed ${m[1]}`;
  if (/future/i.test(label)) return 'Detailed Future';
  return ('Detailed ' + String(label).replace(/[:\\/?*[\]]/g, '')).slice(0, 31);
}

// On the Summary (which is grouped by Product), the "Estimate for iOS:" / "Estimate for iOS -"
// prefix is redundant, so strip it from the feature names there (Detailed keeps the full name).
const summaryFeature = (f) => String(f).replace(/^Estimate for iOS\s*[:\-]\s*/, '');

// Product × milestone matrix; each cell is a newline-separated bulleted list of feature names (priority order).
function summaryRows(records, milestones) {
  const grid = {};
  for (const r of records) {
    if (!r.product) continue;
    (grid[r.product] = grid[r.product] || {});
    (grid[r.product][r.milestone] = grid[r.product][r.milestone] || []).push(summaryFeature(r.feature));
  }
  const rows = [['Product', ...milestones]];
  for (const p of orderedProducts(records)) {
    rows.push([p, ...milestones.map((m) => ((grid[p] && grid[p][m]) || []).map((f) => `• ${f}`).join('\n'))]);
  }
  return rows;
}

// One Detailed sheet's rows for a milestone: Product | Feature (SYM) | Description, grouped by product (canonical order), priority order within.
function detailedRows(records, milestone) {
  const inM = records.filter((r) => r.milestone === milestone);
  const rows = [['Product', 'Feature', 'Description']];
  for (const p of orderedProducts(inM)) {
    for (const r of inM.filter((x) => x.product === p)) rows.push([p, featureWithCode(r), r.description]);
  }
  return rows;
}

function section(title, lines) { return lines.length ? `## ${title}\n${lines.join('\n')}\n\n` : ''; }

function renderChangeReport(ch) {
  let md = '# Roadmap Change Report\n\n';
  md += section('Delivered', (ch.delivered || []).map((d) => `- ${d.sym} — ${d.feature}`));
  md += section('New', (ch.added || []).map((d) => `- ${d.sym} (${d.milestone}) — ${d.feature}`));
  md += section('Priority Changed UP', (ch.priorityUp || []).map((d) => `- ${d.sym} — ${d.feature}: ${d.from} → ${d.to}`));
  md += section('Priority Changed DOWN', (ch.priorityDown || []).map((d) => `- ${d.sym} — ${d.feature}: ${d.from} → ${d.to}`));
  md += section('Re-bucketed', (ch.reBucketed || []).map((d) => `- ${d.sym} — ${d.feature}: ${d.from} → ${d.to}`));
  return md;
}

function writeOutputs(dir, dateStr, { records, aha, prev, changes, renamer, assessMeta, opts }) {
  const srcPath = path.join(dir, `Product Roadmap Source ${dateStr}.xlsx`);
  const blPath = path.join(dir, `Claims Product Backlog ${dateStr}.xlsx`);
  const repPath = path.join(dir, `Roadmap Change Report ${dateStr}.md`);
  const sheets = { Source: sourceRows(records) };
  if (opts) {
    const milestones = [opts.currentRelease, opts.nextRelease, opts.futureLabel];
    sheets.Summary = summaryRows(records, milestones);
    for (const m of milestones) sheets[detailedSheetName(m)] = detailedRows(records, m);
  }
  writeSheets(srcPath, sheets);
  writeSheets(blPath, { Backlog: backlogRows(records, aha, prev, changes, renamer, assessMeta) });
  fs.writeFileSync(repPath, renderChangeReport(changes));
  return { srcPath, blPath, repPath };
}

module.exports = { sourceRows, backlogRows, renderChangeReport, writeOutputs, summaryRows, detailedRows, detailedSheetName };
