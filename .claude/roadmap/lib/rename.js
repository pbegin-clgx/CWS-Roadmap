const fs = require('fs');

// Build a renamer that applies an ORDERED list of literal find→replace pairs.
// Literal (split/join) — no regex escaping needed; order matters (earlier pairs run first).
function makeRenamer(pairs) {
  const list = (pairs || []).map((p) => [String(p.from), String(p.to)]);
  return (s) => {
    if (s == null) return s;
    let out = String(s);
    for (const [from, to] of list) if (from) out = out.split(from).join(to);
    return out;
  };
}

// Load the rename map (array of {from, to}) from a JSON file; returns [] if absent.
function loadRenameMap(path) {
  if (!path || !fs.existsSync(path)) return [];
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

module.exports = { makeRenamer, loadRenameMap };
