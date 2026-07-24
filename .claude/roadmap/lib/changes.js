const fin = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };

function detectChanges(prev, current, assessmentSyms) {
  // "Removed": on the previous roadmap but absent from the current Assessment. This is an
  // inference (dropped from the plan) — not proof of shipping. Explicitly-shipped features are
  // detected separately via negative Product Priority and reported under "Delivered".
  const removed = [];
  for (const [sym, p] of prev) if (!assessmentSyms.has(sym)) removed.push({ sym, feature: p.feature });

  const added = [];
  for (const c of current) if (!prev.has(c.sym)) added.push({ sym: c.sym, milestone: c.milestone, feature: c.feature });

  const priorityUp = [], priorityDown = [], reBucketed = [];
  for (const c of current) {
    const p = prev.get(c.sym);
    if (!p) continue;
    const from = fin(p.priority), to = fin(c.priority);
    if (from != null && to != null && from !== to) {
      (to < from ? priorityUp : priorityDown).push({ sym: c.sym, feature: c.feature, from, to });
    }
    if (p.milestone && c.milestone && p.milestone !== c.milestone) {
      reBucketed.push({ sym: c.sym, feature: c.feature, from: p.milestone, to: c.milestone });
    }
  }
  return { removed, added, priorityUp, priorityDown, reBucketed };
}

module.exports = { detectChanges };
