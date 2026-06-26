const INTERNAL = /translation|Apply API changes\/fixes|Migrate UX|Angular Update|ClaimWrapper|Intune|MixPanel|Mixpanel/i;
const isInternal = (summary) => INTERNAL.test(String(summary));

function classify(a, opts) {
  const { currentRelease, nextRelease, futureLabel, cut88, cutFuture } = opts;
  const inc = String(a.include);
  const rel = String(a.releaseInAha);
  const prio = (a.priority == null || a.priority === '' || a.priority === '-') ? Infinity : parseFloat(a.priority);
  if (/^1-Yes/.test(inc) || /^2\.1/.test(inc) || /^2\.2/.test(inc)) return currentRelease;
  if (/^2\.3/.test(inc) || /^2\.4/.test(inc)) return nextRelease;
  // 3-No (and any other non-current status)
  const nextNum = (String(nextRelease).match(/8\.\d+/) || [])[0];
  if (nextNum && new RegExp(`Release ${nextNum.replace('.', '\\.')}`).test(rel)) return nextRelease;
  if (/Release 8\.9|Release 9/.test(rel)) return futureLabel;
  if (prio <= cut88) return nextRelease;
  if (prio <= cutFuture) return futureLabel;
  return 'DROP';
}

module.exports = { classify, isInternal, INTERNAL };
