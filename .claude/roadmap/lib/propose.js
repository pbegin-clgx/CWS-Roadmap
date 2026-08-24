function proposeCut(tail) {
  const ps = tail.map((t) => t.priority).filter((p) => Number.isFinite(p)).sort((a, b) => a - b);
  let cut88 = 72;
  if (ps.length) {
    const mid = Math.floor((ps.length - 1) / 2);
    cut88 = ps.length % 2 ? ps[mid] : Math.round((ps[mid] + ps[mid + 1]) / 2);
  }
  return { cut88, cutFuture: 100 };
}

// Once a dedicated assessment exists for the next release, its own Include verdict is authoritative
// for next-release membership — the same way the current release's own Include already governs
// current-release membership. This is symmetric: 1-Yes/2.1/2.2 promotes into the next release (as
// before); 3-No/2.3-Maybe/2.4-Maybe now also demotes OUT of it (previously ignored, which let a
// low current-release-priority number alone park a feature in the next release even when the next
// release's own team had explicitly said no/maybe — see roadmap-build-workflow memory, 2026-08-24).
// A feature the current release already committed to is never reconsidered by the next assessment.
// With no row for this SYM in the next assessment at all, there's no second opinion to trust, so the
// priority-driven result from classify() stands unchanged.
function applyNextAssessment(milestone, sym, nextAssess, { currentRelease, nextRelease, futureLabel, cutFuture }) {
  if (milestone === currentRelease) return milestone;
  if (!nextAssess || !nextAssess.has(sym)) return milestone;
  const inc = String(nextAssess.get(sym).include);
  if (/^1-Yes/.test(inc) || /^2\.1/.test(inc) || /^2\.2/.test(inc)) return nextRelease;
  // Explicitly excluded from the next release — its OWN priority (not the current release's) now
  // decides Future vs. dropped entirely, since it's the more current, dedicated assessment.
  const nextPrio = nextAssess.get(sym).priority;
  return nextPrio <= cutFuture ? futureLabel : 'DROP';
}

module.exports = { proposeCut, applyNextAssessment };
