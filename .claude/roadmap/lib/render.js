const { writeSheets } = require('./xlsx-io');

const SOURCE_HEADER = ['Milestone','Product','Feature','Strategic Theme','Feature Code','priority','Prob','Description'];
const BACKLOG_HEADER = ['Feature reference #','Old Priority','New Priority','Feature name','Initiative name','Release name','Feature status','Effort - man days','Dev Complete Rate','Prioritization','Feature tags'];

function sourceRows(records) {
  const rows = [SOURCE_HEADER.slice()];
  for (const r of records) rows.push([r.milestone, r.product, r.feature, r.theme, r.sym, r.priority, r.prob, r.description]);
  return rows;
}

function backlogRows(records, aha, prev) {
  const rows = [BACKLOG_HEADER.slice()];
  for (const r of records) {
    const a = aha.get(r.sym) || {};
    const p = prev.get(r.sym) || {};
    rows.push([r.sym, (p.priority ?? ''), r.priority, a.name || r.feature, a.initiative || '', a.release || '', a.status || '', '', '', a.prioritization || '', '']);
  }
  return rows;
}

function section(title, lines) { return lines.length ? `## ${title}\n${lines.join('\n')}\n\n` : ''; }

function renderChangeReport(ch) {
  let md = '# Roadmap Change Report\n\n';
  md += section('Delivered', ch.delivered.map((d) => `- ${d.sym} — ${d.feature}`));
  md += section('New', ch.added.map((d) => `- ${d.sym} (${d.milestone}) — ${d.feature}`));
  md += section('Priority Changed UP', ch.priorityUp.map((d) => `- ${d.sym} — ${d.feature}: ${d.from} → ${d.to}`));
  md += section('Priority Changed DOWN', ch.priorityDown.map((d) => `- ${d.sym} — ${d.feature}: ${d.from} → ${d.to}`));
  md += section('Re-bucketed', ch.reBucketed.map((d) => `- ${d.sym} — ${d.feature}: ${d.from} → ${d.to}`));
  return md;
}

function writeOutputs(dir, dateStr, { records, aha, prev, changes }) {
  const fs = require('fs'); const path = require('path');
  const srcPath = path.join(dir, `Product Roadmap Source ${dateStr}.xlsx`);
  const blPath = path.join(dir, `Claims Product Backlog ${dateStr}.xlsx`);
  const repPath = path.join(dir, `Roadmap Change Report ${dateStr}.md`);
  writeSheets(srcPath, { Source: sourceRows(records) });
  writeSheets(blPath, { Backlog: backlogRows(records, aha, prev) });
  fs.writeFileSync(repPath, renderChangeReport(changes));
  return { srcPath, blPath, repPath };
}

module.exports = { sourceRows, backlogRows, renderChangeReport, writeOutputs };
