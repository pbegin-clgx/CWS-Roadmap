# Design — `/roadmap-deck`: Generate the on-brand Roadmap PowerPoint (Phase 3)

**Owner:** Pascal Begin, VP Product — Cotality Workspace Claims
**Author:** Claude
**Date:** 2026-06-26
**Status:** Draft for review

---

## 1. Problem

`/roadmap-build` now produces the Source workbook with deck-ready `Summary` and `Detailed *` sheets (Phase 2). The last manual step remains: getting that content into a branded PowerPoint. Today Pascal copies cells into a template deck by hand. This command generates the table slides directly, styled with the corporate color theme, so there is nothing left to paste.

## 2. Goal & non-goals

**Goal:** A separate `/roadmap-deck` command that reads the Source workbook's deck sheets and emits a PowerPoint containing the Release-Plan matrix slide(s) and the per-milestone Detailed slides, styled with Cotality's corporate palette and font.

**In scope:**
- Section divider slides: "Release Plan & Roadmap", and one per milestone (Q3 / Q4 / Future).
- Summary matrix slide(s): Product × milestone, bulleted feature cells.
- Detailed slides per milestone: Product | Feature (SYM) | Description, auto-paginated.
- Corporate theme (colors + font) applied throughout.

**Out of scope:**
- Narrative slides (title, agenda, strategic themes) — they stay in Pascal's manual master; the generated slides are dropped in.
- Editing/round-tripping the existing branded `.pptx` (we generate fresh slides, per the chosen approach).
- The separate "Scope & Inspect" deck section (different team).

## 3. Inputs & outputs

### Inputs
- The generated `Product Roadmap Source <YYYYMMDD>.xlsx` — specifically its `Summary` sheet and the `Detailed <release>` sheets (built in Phase 2).
- `deck-theme.json` (committed) — the corporate palette + fonts (see §5).

### Run parameters
- `--source <path>` to the Source workbook; `--outdir`; `--date <YYYYMMDD>`; optional `--theme <path>` (defaults to `deck-theme.json`).

### Output
- `Product Roadmap Deck <YYYYMMDD>.pptx` — section dividers + Summary + Detailed slides, ready to drop into the master deck.

## 4. Approach

Generate a fresh deck with **`pptxgenjs`** (Node). This was chosen over cloning the branded template because it is far more robust to changing feature counts; the trade-off — not inheriting the template master — is addressed by applying the corporate theme explicitly (§5). `pptxgenjs`'s table `autoPage` handles pagination across slides automatically, so neither the Summary nor the Detailed tables need a hard-coded rows-per-slide limit.

## 5. Theme handling

A committed **`deck-theme.json`**, seeded from the template's `ppt/theme/theme1.xml`:
```json
{
  "colors": { "dk1": "1E1405", "lt1": "F7EFE2", "dk2": "000000", "lt2": "FFFFFF",
    "accent1": "FFCD2E", "accent2": "FF6E80", "accent3": "FF8E65",
    "accent4": "DD37D2", "accent5": "148DEF", "accent6": "339B62" },
  "majorFont": "TWK Everett", "minorFont": "TWK Everett"
}
```
The command reads this file, so the palette is always the official corporate one. If marketing revises the brand, this single file is updated (or re-extracted from a new template). Colors are stored as 6-hex (no `#`), the form pptxgenjs expects.

## 6. Components (under `.claude/roadmap/`)

| Unit | Responsibility | Interface |
|---|---|---|
| `deck-theme.json` | Corporate colors + fonts | data file |
| `lib/deck-data.js` | Pure transforms: workbook sheet rows → table data structures | `summaryTable(rows)`, `detailedTable(rows)` |
| `lib/deck.js` | Build the pptx via pptxgenjs | `buildDeck({summary, detailed}, theme, outPath)` |
| `run.js` `deck` subcommand | Read the Source workbook + theme, invoke `buildDeck` | CLI |
| `.claude/commands/roadmap-deck.md` | The `/roadmap-deck` skill | command |

- `summaryTable(rows)` → `{ header: [...], rows: [[product, cell, cell, cell], ...] }` where each milestone cell is the sheet's bulleted text (already newline-bulleted from Phase 2).
- `detailedTable(rows)` → `{ header: ['Product','Feature','Description'], rows: [[...], ...] }` for one Detailed sheet.
- `buildDeck` composes: a "Release Plan & Roadmap" divider, the Summary slide(s), then for each milestone a divider + the Detailed table (autoPaged).

## 7. Slide styling (from theme)

- **Section dividers:** background `dk1` (Earth), title in `lt1` (Cream), a `accent1` (Sunburst) accent bar.
- **Tables:** header row fill `dk1` with `lt1` text; body rows light (`lt2`/`lt1`) with `dk1` text; thin `accent1` or grey gridlines. Font `majorFont` for headings, `minorFont` for body.
- **Slide background:** `lt1` (Cream) to match the brand deck.
- **Footer:** "© 2026 Cotality" + slide number, small, in `dk1`.
- Standard 16:9 layout.

## 8. Data flow

1. `/roadmap-deck` confirms the Source workbook path + date.
2. `node run.js deck --source <xlsx> --outdir <dir> --date <YYYYMMDD>`.
3. `deck` reads `Summary` and each `Detailed <release>` sheet via `readSheet`, transforms them with `deck-data.js`, loads `deck-theme.json`, and calls `buildDeck`.
4. Writes `Product Roadmap Deck <YYYYMMDD>.pptx`; prints the path.

## 9. Testing

- **`deck-data.js`** (pure) — unit tests: a Summary sheet (header + product rows with bulleted cells) maps to the expected matrix; a Detailed sheet maps to the expected `Product|Feature|Description` rows; empty cells handled.
- **Theme load** — unit test: `deck-theme.json` parses to the expected colors/fonts.
- **`buildDeck` smoke test** — build a small deck to a temp file from synthetic data, then read the `.pptx` (zip) back and assert the slide XML contains expected strings (a section title, a product name, a feature with its SYM). Confirms a valid, non-empty deck with the right content.

## 10. Edge cases & error handling

- **Missing `Summary`/`Detailed` sheets** in the workbook (e.g., an older Source without Phase-2 sheets) → clear error telling the user to regenerate the Source with the current `/roadmap-build`.
- **Empty milestone** (no Detailed rows) → still emit the divider, with a "No items" note, rather than a broken empty table.
- **Long descriptions / many rows** → rely on `autoPage`; descriptions wrap within the cell.
- **Font not installed in the rendering environment** → PowerPoint substitutes; the font name is still set so it renders correctly on Pascal's machine where TWK Everett is installed.
- **`pptxgenjs` write failure / output file locked** (open in PowerPoint) → surface the error and ask the user to close the file (same pattern as the xlsx `EBUSY` case).

## 11. Dependencies

- `pptxgenjs` (new dependency in `.claude/roadmap/package.json`). Its bundled JSZip is reused by the smoke test to read the generated deck.

## 12. Relationship to the other commands

`/roadmap-build` (Phases 1–2) produces the Source workbook; `/roadmap-deck` (Phase 3) consumes it. They are intentionally separate: the deck depends only on the workbook's deck sheets, so it can be re-run on any Source workbook without re-running the bucketing pipeline.
