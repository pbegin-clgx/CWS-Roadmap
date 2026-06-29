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
   - **Cut-line:** the roadmap window is bounded by a single line, `cutFuture` (default 110). "Maybe" (2.3/2.4) items reach the next release only at priority ≤ cutFuture (lower-priority Maybes → Future); `3-No` items reach the next release ONLY via an explicit Aha next-release tag (no priority promotion). Show the next-release/Future boundary around `cutFuture` and ask the user to confirm or adjust it; if changed, re-run `analyze --cutFuture <n>`.
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
