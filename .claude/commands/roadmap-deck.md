---
name: roadmap-deck
description: /roadmap-deck — Generate the on-brand Roadmap PowerPoint (Summary + Detailed slides) from a Product Roadmap Source workbook
---

# /roadmap-deck

Generates a PowerPoint with the **Release Plan & Roadmap** matrix slide(s) and the per-milestone **Detailed** slides, styled with Cotality's corporate theme (`deck-theme.json`). The narrative slides (title, agenda, themes) stay in your manual master — drop these generated slides in.

## Inputs (confirm with the user)
- A `Product Roadmap Source <date>.xlsx` produced by `/roadmap-build` (it must contain the `Summary` and `Detailed *` sheets — Phase 2).
- Output date `YYYYMMDD` (defaults to the Source file's date).

## Steps
1. Confirm the Source workbook path and the output date.
2. Run (from `.claude/roadmap`):
   ```
   node run.js deck --source "<source xlsx>" --outdir "<repo>/Roadmap" --date "<YYYYMMDD>"
   ```
3. Report the output path and remind the user the deck contains section dividers + Summary + Detailed slides to drop into the master deck.

## Notes
- Colors/fonts come from `.claude/roadmap/deck-theme.json` (Cream `F7EFE2`, Earth `1E1405`, Sunburst `FFCD2E`, TWK Everett). Edit that file if marketing updates the brand.
- The Source workbook MUST have the `Summary`/`Detailed` sheets; if missing, regenerate it with the current `/roadmap-build`.
- If `deck failed: ... EBUSY`, the output pptx is open in PowerPoint — close it and re-run.
- TWK Everett renders on machines where the font is installed; elsewhere PowerPoint substitutes but the font name is preserved.
