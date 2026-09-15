# Product Team Claude — Roadmap Automation

This project gives you Claude Code skills to build and maintain the Cotality Workspace Products roadmap — from the cycle's raw Aha export to a review-ready workbook to an on-brand PowerPoint deck.

---

## What you get

- **/roadmap-build** — Turns the cycle's Aha feature export and Release Assessment(s) into a **Product Roadmap Source** workbook, a **Claims Product Backlog**, and a **Change Report**. Applies the priority-driven cut-line rules automatically, then walks you through every judgment call — borderline placements, new-feature descriptions, unassessed features — before writing anything.
- **/roadmap-deck** — Generates the **Release Plan & Roadmap** PowerPoint (Summary matrix + per-milestone Detailed slides) from a Product Roadmap Source workbook, styled with Cotality's corporate theme. Drop the generated slides into your manual master deck alongside the narrative slides (title, agenda, themes).

---

## One-time setup

### 1. Install Node.js (if not already installed)

Claude Code uses Node.js to run the roadmap build and deck scripts. Check if you have it:

1. Open PowerShell (search "PowerShell" in the Start menu)
2. Type `node --version` and press Enter

If you see a version number (e.g., `v22.16.0`), you're good. If you see an error, download Node.js from [nodejs.org](https://nodejs.org) — install the LTS version.

### 2. Install script dependencies

From the repo root:

```
cd .claude/roadmap
npm install
```

This installs the `xlsx`, `pptxgenjs`, and `jszip` packages the build and deck scripts depend on.

### 3. Clone this repo and open in Claude Code

1. In Claude Code desktop: **File** → **Open Folder**
2. Select the cloned `product-team-claude/` folder
3. Start a new conversation

---

## Using the skills

### Build the roadmap Source, Backlog, and Change Report

```
/roadmap-build
```

Before running, have ready:
- The cycle's **Aha feature export** (xlsx), placed in `Roadmap/`
- One or more **Release Assessment** files (xlsx) — current release first, optional next-release second
- The **previous Product Roadmap Source** workbook (used as the carry-forward base)
- The three **release labels** — current, next, and future (e.g. `v8.7 (Q3 2026)`, `v8.8 (Q4 2026)`, `Future (Q1-Q2 2027)`)

Claude will:
1. Confirm the input files and release labels with you
2. Run the analysis and present a review queue — the current/next-release cut-line, borderline judgment calls, draft descriptions for new features, and any Aha features missing from both the Assessment and prior Source
3. Wait for your decisions on every item — nothing is written until you approve
4. Write the **Product Roadmap Source**, **Claims Product Backlog**, and **Change Report** to `Roadmap/`, and summarize what changed

### Generate the roadmap deck

```
/roadmap-deck
```

Point Claude at the **Product Roadmap Source `<date>.xlsx`** produced by `/roadmap-build` (it must contain the `Summary` and `Detailed *` sheets). Claude will:
1. Confirm the source workbook and the output date
2. Generate the PowerPoint — section dividers, the Summary matrix slide, and a Detailed slide per milestone
3. Report the output path in `Roadmap/`, ready to drop into your master deck

---

## Keeping things current

- **Legacy product names** (e.g. "Estimate Mobile" → "Estimate for iOS") are normalized via `.claude/roadmap/renames.json` — edit that file when a product is renamed.
- **Deck branding** (colors, fonts) lives in `.claude/roadmap/deck-theme.json` — edit it if marketing updates the brand guidelines.
- **Cut-line thresholds** default to top ~70 by priority for next release, ~100 for Future — `/roadmap-build` will show you the boundary and let you adjust it per cycle.

---

## Getting help

Ask Claude Code directly — it knows this project:
- "How does /roadmap-build decide the cut-line?"
- "Why was this feature moved to Future?"
- "What do I need before running /roadmap-deck?"
