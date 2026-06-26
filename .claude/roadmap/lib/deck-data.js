function table(rows) {
  const all = rows || [];
  const header = all[0] || [];
  const body = all.slice(1).filter((r) => String(r[0] || '').trim() !== '');
  return { header, body };
}

const summaryTable = (rows) => table(rows);
const detailedTable = (rows) => table(rows);

module.exports = { summaryTable, detailedTable };
