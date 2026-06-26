const { readSheet } = require('./xlsx-io');

const isSym = (s) => /^SYM-\d/.test(String(s).trim());
const num = (v) => (v === '' || v === '-' || v == null) ? Infinity : parseFloat(v);
const clean1 = (s) => String(s).replace(/\r?\n/g, ' ').trim();
const cleanName = (s) => clean1(s).replace(/^\s*\d+[A-Z]?\s*-\s*/, '').replace(/\s*-\s*Implement\s*$/i, '').trim();

function parseAssessment(path, sheetName = 'Release Assessment') {
  const rows = readSheet(path, sheetName);
  const m = new Map();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; const sym = String(r[0]).trim();
    if (!isSym(sym)) continue;
    m.set(sym, { include: clean1(r[9]), releaseInAha: clean1(r[3]), priority: num(r[5]), summary: clean1(r[2]), effort: r[12] });
  }
  return m;
}

function parseAha(path, sheetName = 'Report') {
  const rows = readSheet(path, sheetName);
  const m = new Map();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; const sym = String(r[0]).trim();
    if (!isSym(sym)) continue;
    m.set(sym, { name: clean1(r[2]), priority: r[3], status: r[4], release: clean1(r[5]), prioritization: r[8], initiative: clean1(r[11]) });
  }
  return m;
}

function parsePrevSource(path, sheetName = 'Source') {
  const rows = readSheet(path, sheetName);
  const m = new Map();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; const sym = String(r[4]).trim();
    if (!sym) continue;
    m.set(sym, { milestone: clean1(r[0]), product: clean1(r[1]), feature: clean1(r[2]), theme: clean1(r[3]),
                 priority: r[5], prob: clean1(r[6]), description: String(r[7]).trim() });
  }
  return m;
}

function parsePrevSourceRows(path, sheetName = 'Source') {
  const rows = readSheet(path, sheetName);
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    out.push({
      milestone: clean1(r[0]), product: clean1(r[1]), feature: clean1(r[2]), theme: clean1(r[3]),
      code: clean1(r[4]), priority: r[5], prob: clean1(r[6]), description: String(r[7]).trim(),
    });
  }
  return out;
}

module.exports = { parseAssessment, parseAha, parsePrevSource, parsePrevSourceRows, cleanName };
