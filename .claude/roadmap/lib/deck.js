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
  addTableSlide(pptx, theme, 'Release Plan & Roadmap', summary, [2.4, 3.37, 3.37, 3.36]);

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
