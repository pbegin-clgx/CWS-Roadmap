# Design — `/roadmap-build`: Automated Product Roadmap Source & Backlog Builder

**Owner:** Pascal Begin, VP Product — Cotality Workspace Claims
**Author:** Claude
**Date:** 2026-06-26
**Status:** Draft for review

---

## 1. Problem

Each release cycle, Pascal rebuilds the Product Roadmap by hand:

1. Read the Dev team's **Release Assessment** to decide which features land in this release, the next release, or Future.
2. Use the **Product Priority** column to break ties and draw the line between releases.
3. Fill the **Product Roadmap Source** workbook — Product, Strategic Theme, Feature, and a short **Description** (today: paste feature names into Aha's "Elle" assistant, copy results back).
4. Hand-derive the **Claims Product Backlog** deliverable and a verbal "what changed" story for Customer Success & Sales.

Building the Source workbook is the biggest time sink. A backtest of the 8.6→8.7 cycle showed the release-assignment logic can be reproduced at **94% agreement** with Pascal's hand-built result (100% recall on "what's in this release"), and that short Descriptions can be generated directly in house style — removing the Elle round-trip.

## 2. Goal & non-goals

**Goal:** A repeatable `/roadmap-build` command that ingests the cycle's raw inputs and produces a review-ready **Source workbook**, **Claims Product Backlog**, and **Change Report**, keeping Pascal's judgment in the loop for the ~6% of decisions a rule cannot make.

**In scope (Phase 1):**
- Bucket features into current / next / Future releases from the Assessment + priority cut-lines.
- Carry forward Product / Theme / Description by feature code; draft fresh Descriptions for new features.
- Detect delivered, new, dropped, priority-changed, and re-bucketed features.
- Present a **review queue** (cut-line proposal, judgment items, draft descriptions) before writing files.
- Emit Source workbook, Backlog workbook, and Change Report.

**Out of scope (later phases):**
- Generating the Summary matrix + Detailed sheets inside the Source workbook (Phase 2).
- Regenerating the PowerPoint deck from the template (Phase 3).
- Direct Aha API pull (inputs stay as file exports for now).

## 3. Inputs & outputs

### Inputs (placed in `Roadmap/`)
| Input | Role | Key fields used |
|---|---|---|
| Aha feature export `aha_list_features_*.xlsx` | Feature metadata for the Backlog | Feature reference #, Feature name, Product Priority, Feature status, Release name, Initiative name |
| Release Assessment(s) `*Assessment*.xlsx` (1+ per cycle) | The bucketing driver | `Aha` (SYM code), `Summary`, `Release in Aha`, `Product Priority`, `Include in release?` |
| Previous `Product Roadmap Source *.xlsx` | Carry-forward base + priority/release baseline for change detection | Milestone, Product, Feature, Strategic Theme, Feature Code, priority, Prob, Description |

### Run parameters (prompted, with sensible defaults)
- `currentRelease`, `nextRelease` labels (e.g. `v8.7 (Q3 2026)`, `v8.8 (Q4 2026)`, `Future (Q4 2026 - Q1 2027)`).
- `cut88` / `cutFuture` priority cut-lines — **proposed by the tool**, confirmed/adjusted by Pascal.

### Outputs (written to `Roadmap/`, named `<name> <YYYYMMDD>.xlsx`)
- `Product Roadmap Source <YYYYMMDD>.xlsx` — `Source` sheet populated; columns identical to the existing template.
- `Claims Product Backlog <YYYYMMDD>.xlsx` — the CS/Sales deliverable. Columns reproduce the latest distributed Backlog exactly: `Feature reference #`, `Old Priority`, `New Priority`, `Feature name`, `Initiative name`, `Release name`, `Feature status`, `Effort - man days`, `Dev Complete Rate`, `Prioritization`, `Feature tags`. (`Old Priority` = previous Source priority; `New Priority` = current Product Priority.)
- `Roadmap Change Report <YYYYMMDD>.md` — delivered, new, priority changes, re-bucketing (see §6).

## 4. The bucketing algorithm (validated)

Keyed by feature code (SYM). Statuses come from `Include in release?`.

**Current release** is driven by the current-release Assessment's `Include` status:
```
1-Yes / 2.1 / 2.2   → currentRelease   (confidence-based)
```

**Next release** placement has two modes:
- **If a next-release Assessment exists** (e.g. an 8.8 Assessment alongside the 8.7 one), drive it the same way as the current release — its own `Include` status (`1-Yes / 2.1 / 2.2 → nextRelease`). This is the preferred path once the next Assessment is in hand.
- **Otherwise (cut-line fallback)** — derive next-release from the leftover tail of the current Assessment:
```
2.3 / 2.4                                 → nextRelease   (any priority)
3-No:
    Release in Aha = nextRelease          → nextRelease
    Release in Aha = release beyond next  → Future
    Product Priority ≤ cut88              → nextRelease
    Product Priority ≤ cutFuture          → Future
    otherwise                             → dropped (not shown)
```

**Always applied:**
```
internal items (translations, API back-merges, library/Angular/ClaimWrapper
    migrations, Intune, analytics SDKs)   → dropped
features in previous Source but absent from any Assessment → "Delivered" (listed, not lost)
```

The cut-lines are **fit per cycle**, not hard-coded: the tool sorts the `3-No` tail by priority and proposes `cut88` near the top-half boundary; Pascal adjusts and it re-runs. Validated cut for the 8.7 cycle (cut-line fallback mode): `cut88=72`, `cutFuture=110`.

## 5. Carry-forward & descriptions

- **Product, Strategic Theme, Description** are Pascal's per-feature judgment; no input field drives them. For any feature whose code appears in the previous Source, copy these verbatim.
- For **new features**, draft a short Description in house style (per `CLAUDE.md` personas/terminology/examples) and propose a Product and Strategic Theme from the known sets. These are flagged in the review queue for approval.
- **Feature display name**: reuse the previous Source's cleaned name for recurring features; for new ones, derive from the Assessment `Summary` (strip the `NNNNN -`/`- Implement` affixes).
- Multi-code roadmap rows (one line covering several tickets, e.g. `SYM-2296, SYM-2297, SYM-2298`) have no single Assessment row — carried forward verbatim and flagged for review.

## 6. Change detection (for CS & Sales)

Compare new inputs against the previous Source. The Change Report surfaces:
- **Delivered** — in previous Source, absent from the new Assessment (the "shipped since last time" story).
- **New** — in the new roadmap, not in previous Source.
- **Priority changed** — previous priority ≠ new Product Priority (also feeds Backlog Old/New Priority). Each change is labelled with its **direction**: since a *lower* priority number means *higher* priority, a decrease in the number is reported as **Priority Changed UP** and an increase as **Priority Changed DOWN** (e.g. `17 → 2` = UP, `30 → 45` = DOWN). The report groups changes under "Priority Changed UP" and "Priority Changed DOWN" so CS/Sales can see at a glance what gained or lost priority, each line showing `old → new`.
- **Re-bucketed** — milestone moved between cycles (placement change CS/Sales should know).

**Not** surfaced in the report (by decision): features that fell off because they were de-prioritized or filtered as internal. These are still computed and logged for the tool's own diagnostics, but no "Removed from roadmap" list is shown to CS/Sales.

## 7. Interaction: the review queue

The command runs deterministic bucketing, then **pauses for review before writing files**, presenting:
1. **Cut-line proposal** — the sorted `3-No` tail with the proposed 8.8/Future boundary; Pascal confirms or moves it.
2. **Judgment items** — borderline cases the rule flags rather than decides: deferred-initiative clusters, Aha-release-vs-priority conflicts, multi-code rows.
3. **Draft descriptions & Product/Theme** for new features, for quick approval/edit.

On confirmation, the files are written. Re-running with adjusted cut-lines is cheap.

## 8. Components

A skill (`/roadmap-build`) orchestrating committed Node scripts (Node is the available runtime; Python is not). Each script has one job and a defined I/O contract:

| Unit | Responsibility | In → Out |
|---|---|---|
| `read-inputs.js` | Parse the three workbooks into normalized JSON | xlsx files → `{features, assessment, previousSource}` |
| `bucket.js` | Apply the algorithm; emit buckets + the `3-No` priority tail for the cut-line proposal | normalized JSON + cut-lines → `{byMilestone, droppedInternal, proposedCut}` |
| `changes.js` | Diff vs previous Source | normalized JSON → `{delivered, new, dropped, priorityChanged, reBucketed}` |
| `write-outputs.js` | Render Source + Backlog xlsx and Change Report md | resolved records → files |
| skill prompt | Run the scripts, author new descriptions, drive the review queue, finalize | — |

Scripts live under `.claude/roadmap/` (or `scripts/roadmap/`); the skill file under `.claude/commands/`. The `xlsx` npm dependency is vendored/installed in that script directory.

## 9. Validation & accuracy expectations

- Backtest harness (the 8.6→8.7 cycle, files under `Roadmap/backtest/`) is the regression baseline: re-running must reproduce ≥94% milestone agreement and 100% current-release recall.
- The command reports its own confidence: counts per bucket, # carried vs # newly described, # flagged for review.

## 10. Edge cases & error handling

- **Missing input file / wrong sheet name** → stop with a clear message naming the expected file/sheet.
- **Feature in Assessment but missing a priority** → treat as lowest priority; surface in review.
- **Multiple Assessments** → each tagged to its target release; a feature is bucketed by the Assessment for the release it is evaluated against (next-release Assessment status drives next-release placement per §4); the current-release Assessment wins on conflict; the priority cut-line is used only for releases with no Assessment yet.
- **Feature code present in Aha but not Assessment** → not roadmap-eligible this cycle; excluded, logged.
- **Blank/`-` feature codes** (manually curated rows: Estimate Mobile bundles, Contents) → carried forward from previous Source, flagged.

## 11. Resolved decisions

1. **Output file naming** — date only: `<name> <YYYYMMDD>.xlsx`, matching the existing convention.
2. **Backlog columns** — reproduce the latest distributed Backlog exactly (the 11 columns listed in §3); no extra Theme/Milestone columns.
3. **Two Assessments** — when a next-release Assessment exists, its own `Include` status drives next-release placement (§4); the priority cut-line is the fallback only for a release with no Assessment yet.
4. **Removed list** — the Change Report does **not** include a "Removed from roadmap" list; it carries delivered, new, priority changes, and re-bucketing only (§6).

## 12. Phasing

- **Phase 1 (this spec):** Source + Backlog + Change Report with review queue.
- **Phase 2:** auto-build Summary matrix + Detailed Q-sheets in the Source workbook.
- **Phase 3:** regenerate the PowerPoint deck from the template.
