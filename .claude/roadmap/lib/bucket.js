// Angular version-upgrade summaries appear in either word order ("Angular Update", "Update to
// Angular NN") — match both (2026-08-24: "Update to Angular 22" slipped through as customer-facing).
const INTERNAL = /translation|Apply API changes\/fixes|Migrate UX|Angular\s+Update|Update\s+to\s+Angular|ClaimWrapper|Intune|MixPanel|Mixpanel/i;
const isInternal = (summary) => INTERNAL.test(String(summary));

// Roadmap bucketing — PRIORITY-DRIVEN. The current release (8.7) is set by dev confidence
// (1-Yes / 2.1 / 2.2). Every other feature is placed by Product Priority: <= cut88 (default 70)
// -> next release; <= cutFuture (default 110) -> Future; worse -> dropped. An explicit Aha
// next-release tag still overrides priority. (Include status 2.3/2.4 vs 3-No no longer matters
// for the next-release/Future split — priority is the main driver.)
function classify(a, opts) {
  const { currentRelease, nextRelease, futureLabel, cut88, cutFuture } = opts;
  const inc = String(a.include);
  const rel = String(a.releaseInAha);
  const prio = (a.priority == null || a.priority === '' || a.priority === '-') ? Infinity : parseFloat(a.priority);
  if (/^1-Yes/.test(inc) || /^2\.1/.test(inc) || /^2\.2/.test(inc)) return currentRelease;
  // Explicit Aha release tag overrides priority for everything else.
  const nextNum = parseFloat((String(nextRelease).match(/(\d+\.\d+)/) || [])[1]);
  const relMatch = rel.match(/Release\s+(\d+\.\d+|\d+)/);
  const relNum = relMatch ? parseFloat(relMatch[1]) : null;
  if (Number.isFinite(nextNum) && relNum != null) {
    if (relNum === nextNum) return nextRelease;
    if (relNum > nextNum) return futureLabel;
  }
  if (prio <= cut88) return nextRelease;
  if (prio <= cutFuture) return futureLabel;
  return 'DROP';
}

module.exports = { classify, isInternal, INTERNAL };
