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
- Release labels: current (e.g. `v8.7 (Q3 2026)`), next (e.g. `v8.8 (Q4 2026)`), future (e.g. `Future (Q1-Q2 2027)`).

## Steps

1. **Confirm inputs and labels** with the user (file names + the three release labels + today's date `YYYYMMDD`).

2. **Run analyze** (from `.claude/roadmap`):
   ```
   node run.js analyze --aha "<aha>" --assess "<assess1>[,<assess2>]" --prev "<prev>" \
     --current "<label>" --next "<label>" --future "<label>" --out analysis.json
   ```
   Read `analysis.json`.

3. **Present the review queue** (do NOT write outputs yet):
   - **Cut-line (priority-driven):** placement of everything outside the current release is driven by Product Priority, NOT Include status. Priority ≤ `cut88` (default 70) → next release; ≤ `cutFuture` (default 100, caps the roadmap at ~top 100 by priority) → Future; worse → dropped. An explicit Aha next-release tag overrides priority. `cut88` is the main knob — show the next-release/Future boundary around it and ask the user to confirm or adjust; if changed, re-run `analyze --cut88 <n>`. (Per-cycle deprioritizations, e.g. pushing assignment-workflow features to Future, are done via `milestoneOverrides`.)
   - **Judgment items:** list `analysis.judgment` with the reason; ask the user's call for each (keep / move to a named milestone / drop).
   - **New descriptions:** for each entry in `analysis.newFeatures`, draft a short Description **in the house style from `product-team-claude/CLAUDE.md`** (personas/terminology/example requirements) plus a proposed Product and Strategic Theme from the known sets. Present for approval/edit.
   - **Unassessed Aha features:** list `analysis.unassessed` — features in the Aha export but in neither the Assessment nor the previous Source (they would otherwise be missing from Source AND Backlog). For each, show its Aha priority, status, release, and initiative. Ask the user **which (if any) to add and at which milestone**. For each chosen feature, draft a Product / Strategic Theme / Description in house style.

4. **Assemble `overrides.json`** in `.claude/roadmap/`:
   ```json
   { "descriptions": { "SYM-xxxx": {"product": "...", "theme": "...", "description": "..."} },
     "milestoneOverrides": { "SYM-yyyy": "<milestone label>" },
     "additions": [ {"sym": "SYM-zzzz", "milestone": "<label>", "product": "...", "theme": "...", "description": "..."} ] }
   ```
   `additions` are the user-approved unassessed features; they are injected as records and marked **New** (New Priority defaults to the Aha Product Priority).

5. **Run finalize:**
   ```
   node run.js finalize --analysis analysis.json --overrides overrides.json \
     --aha "<aha>" --prev "<prev>" --outdir "<repo>/Roadmap" --date "<YYYYMMDD>"
   ```

6. **Report** the three output paths and a one-paragraph summary: counts per milestone, # carried vs # newly described, # added from the unassessed-Aha list, # delivered, # priority UP/DOWN, # flagged for review.

The Source workbook is written with the `Source` sheet plus deck-ready tabs: `Summary` (Product × milestone matrix, bulleted cells) and `Detailed <release>` sheets (Product | Feature (SYM) | Description) for each milestone.

## Notes
- Lower priority number = higher priority.
- **A negative Product Priority means the feature has already shipped → it is marked Delivered and dropped from the active roadmap (appears only in the Delivered list / Backlog, never in a release bucket).**
- Backlog `Effort - man days` comes from the Assessment col M (Effort Estimate); `Dev Complete Rate` is the average of Assessment cols Q/R/S (Dev/QA/BT Stories Completed). Both are carried in `analysis.assessMeta` and written by finalize.
- Legacy product names are normalized via `renames.json` (e.g. Estimate Mobile / Mobile Estimating → Estimate for iOS); edit that file to add future renames.
- Never write outputs before the user approves the review queue.
- If finalize fails with `EBUSY` / file locked, the target xlsx is open in Excel — ask the user to close it, then re-run finalize.
- Internal/tech-debt items and features below the Future cut-line are dropped silently from the roadmap and are NOT surfaced as a "removed" list (by design).
