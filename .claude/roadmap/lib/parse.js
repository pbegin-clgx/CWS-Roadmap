const { readSheet } = require('./xlsx-io');

const isSym = (s) => /^SYM-\d/.test(String(s).trim());
const num = (v) => (v === '' || v === '-' || v == null) ? Infinity : parseFloat(v);
const clean1 = (s) => String(s).replace(/\r?\n/g, ' ').trim();
// Average of three story-completion fractions (Dev/QA/BT). Missing values count as 0;
// returns '' only when all three are non-numeric (no data to report).
const avg3 = (a, b, c) => {
  const vals = [a, b, c].map((v) => parseFloat(v));
  if (!vals.some(Number.isFinite)) return '';
  return vals.map((v) => (Number.isFinite(v) ? v : 0)).reduce((s, v) => s + v, 0) / 3;
};
const cleanName = (s) => clean1(s).replace(/^\s*\d+[A-Z]?\s*-\s*/, '').replace(/\s*-\s*Implement\s*$/i, '').trim();

function parseAssessment(path, sheetName = 'Release Assessment') {
  const rows = readSheet(path, sheetName);
  const m = new Map();
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; const sym = String(r[0]).trim();
    if (!isSym(sym)) continue;
    // Effort = col M (Effort Estimate, idx 12); Dev Complete Rate = avg of cols Q/R/S (Dev/QA/BT Stories Completed, idx 16/17/18)
    m.set(sym, { include: clean1(r[9]), releaseInAha: clean1(r[3]), priority: num(r[5]), summary: clean1(r[2]), effort: r[12], devComplete: avg3(r[16], r[17], r[18]) });
  }
  return m;
}

// Build a case-insensitive header-name -> column-index map from the header row.
function headerIndex(headerRow) {
  const idx = {};
  (headerRow || []).forEach((h, i) => {
    const key = clean1(h).toLowerCase();
    if (key && !(key in idx)) idx[key] = i;
  });
  return idx;
}

function parseAha(path, sheetName = 'Report') {
  const rows = readSheet(path, sheetName);
  const m = new Map();
  if (!rows.length) return m;
  // Resolve columns by header name so the parser survives Aha column changes
  // (older exports carried an extra unlabeled column that shifted every field right by one).
  // Fall back to the legacy fixed indices when a header is missing.
  const H = headerIndex(rows[0]);
  const col = (name, fallback) => (name in H ? H[name] : fallback);
  const cSym = col('feature reference #', 0);
  const cName = col('feature name', 2);
  const cPriority = col('product priority', 3);
  const cStatus = col('feature status', 4);
  const cRelease = col('release name', 5);
  const cPrior = col('prioritization', 8);
  const cInit = col('initiative name', 11);
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]; const sym = String(r[cSym]).trim();
    if (!isSym(sym)) continue;
    m.set(sym, { name: clean1(r[cName]), priority: r[cPriority], status: r[cStatus], release: clean1(r[cRelease]), prioritization: r[cPrior], initiative: clean1(r[cInit]) });
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
