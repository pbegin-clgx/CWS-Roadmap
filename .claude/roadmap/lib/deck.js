const PptxGenJS = require('pptxgenjs');
const { readSheet } = require('./xlsx-io');
const { detailedSheetName } = require('./render');
const { summaryTable, detailedTable } = require('./deck-data');

const GRID = 'D9D2C5';

function headerCells(header, theme) {
  return header.map((h) => ({ text: String(h), options: { bold: true, color: theme.colors.lt1, fill: { color: theme.colors.dk1 }, fontFace: theme.majorFont } }));
}

function addDivider(pptx, theme, title) {
  // Dividers are full-bleed dark (dk1); intentionally NOT on the BRAND master —
  // the master's light footer/slide-number would be low-contrast on this background.
  const s = pptx.addSlide();
  s.background = { color: theme.colors.dk1 };
  s.addText(String(title), { x: 0.6, y: 2.7, w: 12.1, h: 1.3, fontSize: 40, bold: true, color: theme.colors.lt1, fontFace: theme.majorFont });
  s.addShape(pptx.ShapeType.rect, { x: 0.6, y: 4.1, w: 2.2, h: 0.14, fill: { color: theme.colors.accent1 } });
}

function addTableSlide(pptx, theme, title, table, colW) {
  const s = pptx.addSlide({ masterName: 'BRAND' });
  s.addText(String(title), { x: 0.4, y: 0.3, w: 12.5, h: 0.6, fontSize: 22, bold: true, color: theme.colors.dk1, fontFace: theme.majorFont });
  const rows = [headerCells(table.header, theme), ...table.body.map((r) => r.map((c) => String(c)))];
  s.addTable(rows, {
    x: 0.4, y: 1.05, w: 12.5, colW,
    autoPage: true, autoPageRepeatHeader: true, newSlideStartY: 0.6,
    border: { type: 'solid', pt: 0.5, color: GRID },
    fontFace: theme.minorFont, fontSize: 11, color: theme.colors.dk1, valign: 'top',
  });
}

// The Summary is styled per the corporate edits: product names in the accent color, real bulleted
// feature lists, and the configured column widths (theme.summary). We paginate MANUALLY (one table
// per slide, NO autoPage) — pptxgenjs's autoPage splits bulleted runs into per-WORD paragraphs,
// which would put a bullet on every word. Products are packed onto a slide up to a line budget.
function addSummarySlides(pptx, theme, title, table) {
  const sm = theme.summary || {};
  const budget = sm.linesPerSlide || 18;
  // Parse each product row into its bullet lines per milestone, with a height "weight".
  const productRows = table.body.map((r) => {
    const milestoneCells = r.slice(1).map((cellText) => String(cellText).split('\n').map((ln) => ln.replace(/^•\s*/, '').trim()).filter(Boolean));
    return { product: String(r[0]), milestoneCells, weight: Math.max(1, ...milestoneCells.map((c) => c.length)) };
  });
  // Pack products into slide-sized chunks.
  const chunks = []; let cur = []; let acc = 0;
  for (const pr of productRows) {
    if (cur.length && acc + pr.weight > budget) { chunks.push(cur); cur = []; acc = 0; }
    cur.push(pr); acc += pr.weight;
  }
  if (cur.length) chunks.push(cur);
  if (!chunks.length) chunks.push([]);
  for (const chunk of chunks) {
    const s = pptx.addSlide({ masterName: 'BRAND' });
    s.addText(String(title), { x: 0.4, y: 0.3, w: 12.5, h: 0.6, fontSize: 22, bold: true, color: theme.colors.dk1, fontFace: theme.majorFont });
    const rows = [headerCells(table.header, theme)];
    for (const pr of chunk) {
      const product = { text: pr.product, options: { bold: true, color: sm.productColor || theme.colors.dk1 } };
      const cells = pr.milestoneCells.map((lines) => (lines.length
        ? { text: lines.map((ln) => ({ text: ln, options: { bullet: { characters: sm.bulletChar || '•' }, breakLine: true } })) }
        : ''));
      rows.push([product, ...cells]);
    }
    s.addTable(rows, {
      x: 0.4, y: 1.05, w: 12.5, colW: sm.colW || undefined,
      border: { type: 'solid', pt: 0.5, color: GRID },
      fontFace: theme.minorFont, fontSize: 11, color: theme.colors.dk1, valign: 'top',
    });
  }
}

function buildDeck({ summary, detailedByMilestone }, theme, outPath) {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.defineSlideMaster({
    title: 'BRAND',
    background: { color: theme.colors.lt1 },
    objects: [{ text: { text: '© 2026 Cotality', options: { x: 0.4, y: 7.0, w: 5, h: 0.3, fontSize: 8, color: theme.colors.dk1, fontFace: theme.minorFont } } }],
    slideNumber: { x: 12.4, y: 7.0, w: 0.6, h: 0.3, color: theme.colors.dk1, fontSize: 8, fontFace: theme.minorFont },
  });

  addDivider(pptx, theme, 'Release Plan & Roadmap');
  addSummarySlides(pptx, theme, 'Release Plan & Roadmap', summary);

  for (const { milestone, table } of detailedByMilestone) {
    addDivider(pptx, theme, milestone);
    if (table.body.length === 0) {
      const s = pptx.addSlide({ masterName: 'BRAND' });
      s.addText(`${milestone} — no items`, { x: 0.4, y: 0.4, w: 12.5, h: 0.6, fontSize: 22, bold: true, color: theme.colors.dk1, fontFace: theme.majorFont });
    } else {
      addTableSlide(pptx, theme, `${milestone} — Detailed`, table, [1.9, 4.3, 6.3]);
    }
  }
  return pptx.writeFile({ fileName: outPath }).then(() => outPath);
}

function deckFromWorkbook(sourcePath, theme, outPath) {
  const summaryRows = readSheet(sourcePath, 'Summary');
  const milestones = (summaryRows[0] || []).slice(1).filter((m) => String(m).trim() !== '');
  const summary = summaryTable(summaryRows);
  const detailedByMilestone = milestones.map((m) => ({ milestone: m, table: detailedTable(readSheet(sourcePath, detailedSheetName(m))) }));
  return buildDeck({ summary, detailedByMilestone }, theme, outPath);
}

module.exports = { buildDeck, deckFromWorkbook };
