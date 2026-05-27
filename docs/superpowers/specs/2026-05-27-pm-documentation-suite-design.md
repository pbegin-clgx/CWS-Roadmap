# Design: AI-First Requirements Workflow — Documentation Suite

**Date:** 2026-05-27
**Author:** Pascal Begin (VP Product, Cotality)
**Status:** Approved — ready for implementation

---

## Overview

Create a 3-doc HTML documentation suite for the product team's AI-First Requirements Workflow (AIRW), mirroring the visual style and structural depth of the dev team's `docs/Dev team Process/` suite. The docs explain the `/pm-req-new` and `/pm-req-review` commands, visualize the workflow, and provide a concrete end-to-end example using a real Aha feature (SYM-2566).

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | 3 docs (core trio) | Framework + flowchart + example covers all real-world use cases; no animated demo needed |
| Process name | **AI-First Requirements Workflow (AIRW)** | Signals AI-native approach; differentiates from legacy PM tooling |
| Framework doc structure | Workflow Journey (Approach B) | Explains the *why* at each stage; better for onboarding; ends with quick-reference card |
| Example feature | SYM-2566 (real feature, full realism) | Live content is more credible than placeholder text |
| Visual style | Exact match to dev team HTML suite | Same CSS variables, fonts (Inter + JetBrains Mono), gradient hero, sidebar TOC, dark/light mode |
| Role badge | `PM` in indigo (#6366f1) | Matches the BSA badge colour in the dev team docs (closest equivalent role) |
| Location | `docs/PM Process/` | Mirrors `docs/Dev team Process/` in the same repo |

---

## File Structure

```
docs/
├── Dev team Process/               (existing — do not modify)
│   ├── spec-driven-development.html
│   ├── spec-driven-development-flowchart.html
│   └── ...
└── PM Process/                     (new folder — create)
    ├── pm-requirements-workflow.html     (Doc 1 — main framework reference)
    ├── pm-requirements-flowchart.html    (Doc 2 — Mermaid flowchart)
    └── pm-requirements-example.html     (Doc 3 — SYM-2566 end-to-end walkthrough)
```

Each doc links to the other two in its footer. The main doc and flowchart also link to `../Dev team Process/spec-driven-development.html` at the handoff point.

---

## Doc 1: `pm-requirements-workflow.html` — Main Framework Reference

**Hero:** Title "AI-First Requirements Workflow", eyebrow "Cotality Product Team · Requirements Process", subtitle describing the process (Aha feature → dev-team-ready child requirements). `PM` role badge (indigo). `Last updated:` timestamp chip.

### Sidebar TOC (12 sections)

| # | Section | Content summary |
|---|---------|----------------|
| 1 | What this process produces | The output artifact: well-formed Aha child requirements. The Level 4/5 quality table (Clarity, Completeness, Traceability) with concrete descriptions of each level |
| 2 | The 8-stage workflow | Summary table — stage name, who acts, Claude's role, artifact produced at each stage |
| 3 | Stage 1 — Research & Context | Phase 0 (feature ref) + Phase 1a (deep search). What Claude looks for, what the PM provides |
| 4 | Stage 2 — Market Problem | Phase 1b/1c. Rules for a good market problem: identifies who is affected, evidences pain, connects to a business goal |
| 5 | Stage 3 — Current Workflow | Phase 2. The pain-point table structure (Step / User Action / Blocker / Impact). How to validate it |
| 6 | Stage 4 — Objectives | Phase 3. Objective bullet rules: specific and actionable, each maps to a Phase 2 blocker |
| 7 | Stage 5 — Future Workflow | Phase 4. Future state table. How each row must resolve a current workflow blocker |
| 8 | Stage 6 — Requirements | Phase 5. The central section: product-split rule, one req per product per capability, exact format (Applies to / Statement / Details / Example), `[NEEDS CLARIFICATION]` marker, always-check-Capture-and-EstimateMobile rule for field workflows |
| 9 | Stage 7 — Submit to Aha | Phase 6 (resolve clarifications) + Phase 7 (write to Aha). Sequential `mcp__aha__create_requirement` calls. Confirmation pattern |
| 10 | Quality Gate | `/pm-req-review` — all 5 checks with examples of must-fix vs should-fix findings. The re-run cycle (fix must-fix items, re-run until clean) |
| 11 | Conventions & markers | `[NEEDS CLARIFICATION]` rules (gating — must resolve before PM approval), exact product names (must match CLAUDE.md), persona sub-type rules (not just "adjuster"), product-split rule, always-applicable constraints from CLAUDE.md |
| 12 | Quick-reference card | Compact table: Stage → PM action → Claude action → Gate condition. Designed to be kept open in a second tab during active use |

**Footer links:** flowchart doc · example doc (SYM-2566) · dev team's spec-driven-development.html

---

## Doc 2: `pm-requirements-flowchart.html` — Flowchart

**Hero:** Title "AIRW Workflow — Flowcharts", subtitle "Two diagrams: end-to-end command flow and per-requirement state lifecycle."

**Legend chips:** PM command (indigo) · Sync/handoff (amber) · Human gate (rose) · Quality check (slate)

### Diagram 1: Command flow

Full Mermaid flowchart TD from `Aha feature identified` through all 7 phases (each with a PM approval gate), the clarification loop (Phase 6 iterates until no `[NEEDS CLARIFICATION]` markers remain), write to Aha (Phase 7), `/pm-req-review` quality gate (must-fix findings loop back to Phase 5), and `Requirements shipped to dev team`.

Key nodes:
- `/pm-req-new` — entry point, fetches SYM-12345 from Aha
- Phase 1–7 nodes — indigo fill, styled as the dev team's command nodes
- PM approval gates — rose parallelograms (human steps)
- `Clarifications needed?` — white diamond gate
- `/pm-req-review` — indigo node
- `Clean?` — white diamond gate
- `Dev team handoff` — amber sync node linking to `/sym-spec-new`

### Diagram 2: Requirement lifecycle

Per-requirement state machine: `drafted` → `needs clarification` → `resolved` → `written to Aha` → `reviewed` → `dev-team ready`. Must-fix findings from `/pm-req-review` loop back to `drafted`.

**Footer links:** framework reference · example (SYM-2566) · dev team spec-driven-development.html

---

## Doc 3: `pm-requirements-example.html` — End-to-End Example (SYM-2566)

**Hero:** "End-to-end example: SYM-2566 — [feature title from Aha]". Subtitle: "A complete run of `/pm-req-new` and `/pm-req-review` on a real Aha feature."

**Build-time dependency:** Fetch SYM-2566 and all child requirements from Aha using `mcp__aha__get_record` to populate real content.

### Sections

| Section | Content |
|---------|---------|
| Feature context | The Aha feature card as received: title, description, any promoted idea content. Styled as a distinct "source" callout |
| Phase 1 output | Repository search findings (top 2–3 related features) + drafted Market Problem prose |
| Phase 2 output | Current Workflow table (Step / User Action / Blocker / Impact) |
| Phase 3 output | Objectives bullet list |
| Phase 4 output | Future Workflow table |
| Phase 5 output | All requirements as drafted, `[NEEDS CLARIFICATION]` markers highlighted in amber |
| Phase 6 output | Clarification Q&A exchanges — question → PM answer → updated requirement (before/after for each resolved marker). Omit this section if SYM-2566 had no clarifications |
| Phase 7 output | Write confirmation: "✓ N requirements written to SYM-2566." |
| Quality gate output | Full `/pm-req-review` output. If there were findings + a re-run, show both passes |
| Final requirements | The approved requirements as they appear in Aha — the canonical dev-team handoff artifact |

Each section has a phase badge (`Phase 1`, `Phase 2`, etc.) in its header, matching the dev team's step-label style.

**Footer links:** framework reference · flowchart · dev team spec-driven-development.html

---

## Visual Design Spec

All three docs use the same CSS as the dev team's HTML suite:

```css
/* Fonts */
Inter (400/500/600/700/800) — body
JetBrains Mono (400/500/600) — code

/* Key CSS variables */
--hero-grad: linear-gradient(135deg, #f59e0b 0%, #ef4444 45%, #ec4899 100%)
--accent: #f59e0b / #fbbf24 (dark)
--pm: #6366f1        /* role badge — indigo */
--pm-soft: #eef2ff

/* Features */
- Dark/light mode via @media (prefers-color-scheme: dark)
- Sticky sidebar TOC with scrollspy (IntersectionObserver)
- Last updated: timestamp chip in hero
- Back-to-top button (fixed, bottom-right)
- Role badge: PM (indigo dot + pill)
- AI EDITOR INSTRUCTION comment block for Last updated: maintenance
```

---

## Cross-Links Summary

| From | Links to |
|------|---------|
| `pm-requirements-workflow.html` | flowchart · example (SYM-2566) · `../Dev team Process/spec-driven-development.html` |
| `pm-requirements-flowchart.html` | framework · example (SYM-2566) · `../Dev team Process/spec-driven-development.html` |
| `pm-requirements-example.html` | framework · flowchart · `../Dev team Process/spec-driven-development.html` |

---

## Out of Scope

- Animated interactive demo (high effort, low marginal value vs the static example)
- Comparison doc (no equivalent to spec-kit for the PM workflow)
- Infrastructure summary doc (the PM tooling is two command files — not enough to warrant a separate infra doc)

These can be added later if the team grows or the tooling expands.

---

## Implementation Notes

1. **Build order:** flowchart first (pure HTML/Mermaid, no external data), then framework doc (most content), then example doc (requires Aha fetch of SYM-2566).
2. **SYM-2566 fetch:** Use `mcp__aha__get_record` at build time. Fetch the feature + all child requirements. Render each phase's output as a static section.
3. **`Last updated:` rule:** Each file carries the same AI editor instruction comment as the dev team docs — run `date` and update the timestamp on every edit.
4. **`docs/PM Process/` folder:** Create it. The `.gitkeep` in `docs/design-docs/` and `docs/specs/` can stay; this is a new peer folder.
