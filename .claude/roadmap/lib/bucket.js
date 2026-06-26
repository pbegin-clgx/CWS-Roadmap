const INTERNAL = /translation|Apply API changes\/fixes|Migrate UX|Angular Update|ClaimWrapper|Intune|MixPanel|Mixpanel/i;
const isInternal = (summary) => INTERNAL.test(String(summary));

function classify(a, opts) {
  const { currentRelease, nextRelease, futureLabel, cut88, cutFuture } = opts;
  const inc = String(a.include);
  const rel = String(a.releaseInAha);
  const prio = (a.priority == null || a.priority === '' || a.priority === '-') ? Infinity : parseFloat(a.priority);
  if (/^1-Yes/.test(inc) || /^2\.1/.test(inc) || /^2\.2/.test(inc)) return currentRelease;
  if (/^2\.3/.test(inc) || /^2\.4/.test(inc)) return nextRelease;
  // 3-No (and any other non-current status): compare the release named in Aha against the next release number
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
