const INTERNAL = /translation|Apply API changes\/fixes|Migrate UX|Angular Update|ClaimWrapper|Intune|MixPanel|Mixpanel/i;
const isInternal = (summary) => INTERNAL.test(String(summary));

// Roadmap bucketing. cutFuture is the single roadmap-window line (default 110): worse-priority
// items fall to Future or off the roadmap. (The former cut88 knob is retired — 3-No no longer
// promotes to the next release by priority; only an explicit Aha next-release tag does.)
function classify(a, opts) {
  const { currentRelease, nextRelease, futureLabel, cutFuture } = opts;
  const inc = String(a.include);
  const rel = String(a.releaseInAha);
  const prio = (a.priority == null || a.priority === '' || a.priority === '-') ? Infinity : parseFloat(a.priority);
  if (/^1-Yes/.test(inc) || /^2\.1/.test(inc) || /^2\.2/.test(inc)) return currentRelease;
  // "Maybe" items target the next release, but only within the roadmap window; lower-priority Maybes go to Future.
  if (/^2\.3/.test(inc) || /^2\.4/.test(inc)) return prio <= cutFuture ? nextRelease : futureLabel;
  // 3-No (and any other non-current status): only an explicit Aha next-release tag puts it in the next release.
  const nextNum = parseFloat((String(nextRelease).match(/(\d+\.\d+)/) || [])[1]);
  const relMatch = rel.match(/Release\s+(\d+\.\d+|\d+)/);
  const relNum = relMatch ? parseFloat(relMatch[1]) : null;
  if (Number.isFinite(nextNum) && relNum != null) {
    if (relNum === nextNum) return nextRelease;
    if (relNum > nextNum) return futureLabel;
  }
  if (prio <= cutFuture) return futureLabel;
  return 'DROP';
}

module.exports = { classify, isInternal, INTERNAL };
