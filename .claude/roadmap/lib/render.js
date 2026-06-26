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

function backlogRows(records, aha, prev, changes, renamer = (s) => s) {
  const rows = [BACKLOG_HEADER.slice()];
  for (const r of records) {
    const a = aha.get(r.sym) || {};
    const p = prev.get(r.sym) || {};
    rows.push([r.sym, (p.priority ?? ''), r.priority, renamer(a.name || r.feature), renamer(a.initiative || ''), a.release || '', a.status || '', '', '', a.prioritization || '', '', changeLabel(r.sym, changes)]);
  }
  // Append delivered features (shipped, off the active roadmap) so the Backlog is a full change log.
  for (const d of (changes && changes.delivered) || []) {
    const a = aha.get(d.sym) || {};
    rows.push([d.sym, '', '', renamer(a.name || d.feature), renamer(a.initiative || ''), a.release || '', a.status || '', '', '', a.prioritization || '', '', 'Delivered']);
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

function writeOutputs(dir, dateStr, { records, aha, prev, changes, renamer }) {
  const srcPath = path.join(dir, `Product Roadmap Source ${dateStr}.xlsx`);
  const blPath = path.join(dir, `Claims Product Backlog ${dateStr}.xlsx`);
  const repPath = path.join(dir, `Roadmap Change Report ${dateStr}.md`);
  writeSheets(srcPath, { Source: sourceRows(records) });
  writeSheets(blPath, { Backlog: backlogRows(records, aha, prev, changes, renamer) });
  fs.writeFileSync(repPath, renderChangeReport(changes));
  return { srcPath, blPath, repPath };
}

module.exports = { sourceRows, backlogRows, renderChangeReport, writeOutputs };
