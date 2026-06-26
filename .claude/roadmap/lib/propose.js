function proposeCut(tail) {
  const ps = tail.map((t) => t.priority).filter((p) => Number.isFinite(p)).sort((a, b) => a - b);
  let cut88 = 72;
  if (ps.length) {
    const mid = Math.floor((ps.length - 1) / 2);
    cut88 = ps.length % 2 ? ps[mid] : Math.round((ps[mid] + ps[mid + 1]) / 2);
  }
  return { cut88, cutFuture: 110 };
}

function applyNextAssessment(milestone, sym, nextAssess, { nextRelease }) {
  if (!nextAssess || !nextAssess.has(sym)) return milestone;
  const inc = String(nextAssess.get(sym).include);
  if (/^1-Yes/.test(inc) || /^2\.1/.test(inc) || /^2\.2/.test(inc)) return nextRelease;
  return milestone;
}

module.exports = { proposeCut, applyNextAssessment };
