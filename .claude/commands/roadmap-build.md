---
name: roadmap-build
description: /roadmap-build — Build the Product Roadmap Source, Backlog, and Change Report from the cycle's Aha export and Release Assessment(s)
---

# /roadmap-build

Builds a review-ready **Product Roadmap Source** workbook, **Claims Product Backlog**, and **Change Report** from raw inputs. Keeps the user's judgment in the loop for cut-lines, borderline placements, and new-feature descriptions.

## Inputs (confirm with the user before running)
- Aha feature export (xlsx) in `Roadmap/`.
- One or more Release Assessment files (xlsx) — the current release first, an optional next-release one second.
- The previous `Product Roadmap Source` workbook (carry-forward base).
- Release labels: current (e.g. `v8.7 (Q3 2026)`), next (e.g. `v8.8 (Q4 2026)`), future (e.g. `Future (Q4 2026 - Q1 2027)`).

## Steps

1. **Confirm inputs and labels** with the user (file names + the three release labels + today's date `YYYYMMDD`).

2. **Run analyze** (from `.claude/roadmap`):
   ```
   node run.js analyze --aha "<aha>" --assess "<assess1>[,<assess2>]" --prev "<prev>" \
     --current "<label>" --next "<label>" --future "<label>" --out analysis.json
   ```
   Read `analysis.json`.

3. **Present the review queue** (do NOT write outputs yet):
   - **Cut-line:** show `proposedCut` and the sorted `3-No`/`2.x` tail around it; ask the user to confirm or adjust `cut88`/`cutFuture`. If changed, re-run `analyze` with `--cut88/--cutFuture` so re-bucketing reflects the new lines.
   - **Judgment items:** list `analysis.judgment` with the reason; ask the user's call for each (keep / move to a named milestone / drop).
   - **New descriptions:** for each entry in `analysis.newFeatures`, draft a short Description **in the house style from `product-team-claude/CLAUDE.md`** (personas/terminology/example requirements) plus a proposed Product and Strategic Theme from the known sets. Present for approval/edit.

4. **Assemble `overrides.json`** in `.claude/roadmap/`:
   ```json
   { "descriptions": { "SYM-xxxx": {"product": "...", "theme": "...", "description": "..."} },
     "milestoneOverrides": { "SYM-yyyy": "<milestone label>" } }
   ```

5. **Run finalize:**
   ```
   node run.js finalize --analysis analysis.json --overrides overrides.json \
     --aha "<aha>" --prev "<prev>" --outdir "<repo>/Roadmap" --date "<YYYYMMDD>"
   ```

6. **Report** the three output paths and a one-paragraph summary: counts per milestone, # carried vs # newly described, # delivered, # priority UP/DOWN, # flagged for review.

## Notes
- Lower priority number = higher priority.
- Never write outputs before the user approves the review queue.
- Internal/tech-debt items and features below the Future cut-line are dropped silently from the roadmap and are NOT surfaced as a "removed" list (by design).
