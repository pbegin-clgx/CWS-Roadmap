# AIRW Documentation Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build three HTML documentation files in `docs/PM Process/` that explain the AI-First Requirements Workflow (AIRW) — a flowchart doc, a main framework reference, and an end-to-end example using real feature SYM-2566.

**Architecture:** Three standalone HTML files that share the same CSS design system as the dev team's `docs/Dev team Process/` suite. Each file is fully self-contained (no build step, no bundler — open directly in a browser). The example doc fetches SYM-2566 and its child requirements from Aha at build time and renders them as static content.

**Tech Stack:** HTML5, CSS custom properties, Inter + JetBrains Mono (Google Fonts CDN), Mermaid 11 (CDN, flowchart doc only), `mcp__aha__get_record` (example doc data fetch).

**Design spec:** `docs/superpowers/specs/2026-05-27-pm-documentation-suite-design.md`

---

## File Structure

```
docs/
└── PM Process/                         ← create this folder
    ├── pm-requirements-flowchart.html  ← Task 1
    ├── pm-requirements-workflow.html   ← Tasks 2–4
    └── pm-requirements-example.html   ← Task 5
```

**Build order:** flowchart first (pure HTML/Mermaid, no external data) → framework (most content) → example (requires Aha fetch).

---

## CSS Boilerplate (reference for all tasks)

All three files use this identical CSS variable set and font import. Paste verbatim into each file's `<head>`.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #fbfbfd;
    --surface: #ffffff;
    --surface-2: #f4f4f7;
    --surface-3: #ebebf0;
    --fg: #0f172a;
    --fg-strong: #020617;
    --muted: #64748b;
    --muted-strong: #475569;
    --border: #e4e4ea;
    --border-strong: #d4d4dc;

    --accent: #f59e0b;
    --accent-deep: #d97706;
    --accent-soft: #fff7ed;

    --pm: #6366f1;
    --pm-deep: #4f46e5;
    --pm-soft: #eef2ff;

    --human: #e11d48;
    --human-soft: #fff1f3;

    --shadow-sm: 0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06);
    --shadow-md: 0 4px 12px -2px rgba(15,23,42,0.06), 0 2px 6px -2px rgba(15,23,42,0.04);
    --shadow-lg: 0 20px 40px -12px rgba(15,23,42,0.12), 0 8px 16px -4px rgba(15,23,42,0.06);

    --radius: 12px;
    --radius-sm: 8px;
    --radius-lg: 18px;

    --hero-grad: linear-gradient(135deg, #f59e0b 0%, #ef4444 45%, #ec4899 100%);
    --hero-grad-soft: radial-gradient(ellipse at top left, rgba(245,158,11,0.12), transparent 50%),
                      radial-gradient(ellipse at top right, rgba(236,72,153,0.08), transparent 50%);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #08080b;
      --surface: #111118;
      --surface-2: #16161e;
      --surface-3: #1d1d27;
      --fg: #e4e4e7;
      --fg-strong: #fafafa;
      --muted: #9ca3af;
      --muted-strong: #cbd5e1;
      --border: #27272f;
      --border-strong: #3a3a44;

      --accent: #fbbf24;
      --accent-deep: #f59e0b;
      --accent-soft: rgba(251,191,36,0.08);

      --pm: #818cf8;
      --pm-deep: #6366f1;
      --pm-soft: rgba(129,140,248,0.12);

      --human: #fb7185;
      --human-soft: rgba(251,113,133,0.14);

      --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
      --shadow-md: 0 4px 12px -2px rgba(0,0,0,0.4);
      --shadow-lg: 0 20px 40px -12px rgba(0,0,0,0.6);

      --hero-grad: linear-gradient(135deg, #fbbf24 0%, #f87171 45%, #f472b6 100%);
      --hero-grad-soft: radial-gradient(ellipse at top left, rgba(251,191,36,0.10), transparent 50%),
                        radial-gradient(ellipse at top right, rgba(244,114,182,0.08), transparent 50%);
    }
  }
</style>
```

---

## Scrollspy + Back-to-top JS (reference for framework doc)

Paste this block just before `</body>` in `pm-requirements-workflow.html`:

```html
<button class="back-to-top" id="backToTop" aria-label="Back to top" title="Back to top">↑</button>

<script>
  (function () {
    const links = document.querySelectorAll('.sidebar-nav a');
    const map = new Map();
    links.forEach(a => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) map.set(target, a);
    });

    let activeLink = null;
    const setActive = (el) => {
      if (!el || el === activeLink) return;
      if (activeLink) activeLink.classList.remove('active');
      el.classList.add('active');
      activeLink = el;
    };

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length > 0) {
        const link = map.get(visible[0].target);
        setActive(link);
      }
    }, { rootMargin: '-80px 0px -65% 0px', threshold: 0 });

    map.forEach((_, target) => observer.observe(target));

    const btt = document.getElementById('backToTop');
    const onScroll = () => {
      if (window.scrollY > 400) btt.classList.add('visible');
      else btt.classList.remove('visible');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  })();
</script>
```

---

## Task 1: Flowchart Doc — `pm-requirements-flowchart.html`

**Files:**
- Create: `docs/PM Process/pm-requirements-flowchart.html`

- [ ] **Step 1: Create the `docs/PM Process/` folder and write the flowchart HTML**

Create `docs/PM Process/pm-requirements-flowchart.html` with the following complete content:

```html
<!DOCTYPE html>
<!--
  AI EDITOR INSTRUCTION (Claude Code, Copilot, any AI assistant):
  This file carries a `Last updated: YYYY-MM-DD` line in its header
  (search for class="last-updated"). EVERY time you modify this file:
    1. Run `date "+%Y-%m-%d"` to get the current date.
    2. Update the `Last updated:` value to that exact string before finishing.
    3. Keep the format identical across all AIRW HTML docs in this folder.
  Do NOT guess the date and do NOT skip this step.
-->
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AIRW Workflow — Flowcharts · Cotality Product Team</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: true, theme: 'default', flowchart: { curve: 'basis', nodeSpacing: 28, rankSpacing: 36, htmlLabels: true } });
</script>
<style>
  :root {
    --bg: #fbfbfd; --surface: #ffffff; --surface-2: #f4f4f7;
    --fg: #0f172a; --fg-strong: #020617; --muted: #64748b; --muted-strong: #475569;
    --border: #e4e4ea; --border-strong: #d4d4dc;
    --accent: #f59e0b; --accent-deep: #d97706; --accent-soft: #fff7ed;
    --pm: #6366f1; --pm-deep: #4f46e5; --pm-soft: #eef2ff;
    --human: #e11d48; --human-soft: #fff1f3;
    --shadow-sm: 0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06);
    --shadow-md: 0 4px 12px -2px rgba(15,23,42,0.06), 0 2px 6px -2px rgba(15,23,42,0.04);
    --radius: 12px;
    --hero-grad: linear-gradient(135deg, #f59e0b 0%, #ef4444 45%, #ec4899 100%);
    --hero-grad-soft: radial-gradient(ellipse at top left, rgba(245,158,11,0.12), transparent 50%),
                      radial-gradient(ellipse at top right, rgba(236,72,153,0.08), transparent 50%);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #08080b; --surface: #111118; --surface-2: #16161e;
      --fg: #e4e4e7; --fg-strong: #fafafa; --muted: #9ca3af; --muted-strong: #cbd5e1;
      --border: #27272f; --border-strong: #3a3a44;
      --accent: #fbbf24; --accent-deep: #f59e0b; --accent-soft: rgba(251,191,36,0.08);
      --pm: #818cf8; --pm-deep: #6366f1; --pm-soft: rgba(129,140,248,0.12);
      --human: #fb7185; --human-soft: rgba(251,113,133,0.14);
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.3); --shadow-md: 0 4px 12px -2px rgba(0,0,0,0.4);
      --hero-grad: linear-gradient(135deg, #fbbf24 0%, #f87171 45%, #f472b6 100%);
      --hero-grad-soft: radial-gradient(ellipse at top left, rgba(251,191,36,0.10), transparent 50%),
                        radial-gradient(ellipse at top right, rgba(244,114,182,0.08), transparent 50%);
    }
  }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
  body {
    margin: 0; font-family: 'Inter', -apple-system, sans-serif; font-size: 16px;
    line-height: 1.62; color: var(--fg); background: var(--bg);
    background-image: var(--hero-grad-soft); background-repeat: no-repeat; background-size: 100% 600px;
    -webkit-font-smoothing: antialiased;
  }
  .page { max-width: 1100px; margin: 0 auto; padding: 0 clamp(1rem, 3vw, 2rem) 5rem; }
  .hero { padding: 3.5rem 0 2rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); }
  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 0.5rem;
    font-size: 0.78rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--accent-deep); background: var(--accent-soft);
    padding: 0.35rem 0.75rem; border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
    margin-bottom: 1.1rem;
  }
  .hero-eyebrow::before {
    content: ""; width: 6px; height: 6px; border-radius: 50%;
    background: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
  }
  @media (prefers-color-scheme: dark) { .hero-eyebrow { color: var(--accent); } }
  h1 {
    font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; line-height: 1.05;
    letter-spacing: -0.025em; margin: 0 0 1rem;
    background: var(--hero-grad); -webkit-background-clip: text;
    background-clip: text; -webkit-text-fill-color: transparent;
  }
  .hero-sub { font-size: 1.05rem; line-height: 1.55; color: var(--muted-strong); max-width: 60ch; margin: 0; }
  .last-updated {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.35rem 0.75rem; font-size: 0.8rem; font-weight: 600;
    color: var(--accent-deep); background: var(--accent-soft);
    border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent); border-radius: 999px;
    margin-top: 1.2rem;
  }
  .last-updated::before { content: "⏱"; font-size: 0.9rem; }
  @media (prefers-color-scheme: dark) { .last-updated { color: var(--accent); } }
  .role {
    display: inline-flex; align-items: center; gap: 0.3rem;
    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em;
    padding: 0.18rem 0.55rem; border-radius: 999px; text-transform: uppercase;
    border: 1px solid color-mix(in srgb, var(--pm) 25%, transparent);
    background: var(--pm-soft); color: var(--pm); vertical-align: middle; margin-left: 0.4rem;
  }
  .role::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--pm); display: inline-block; }
  h2 {
    font-size: 1.6rem; font-weight: 700; letter-spacing: -0.02em; color: var(--fg-strong);
    margin: 3rem 0 0.8rem; padding-bottom: 0.6rem; border-bottom: 1px solid var(--border); position: relative;
  }
  h2::before {
    content: ""; position: absolute; bottom: -1px; left: 0;
    width: 56px; height: 3px; border-radius: 2px; background: var(--hero-grad);
  }
  .legend { display: flex; flex-wrap: wrap; gap: 0.6rem; margin: 1.5rem 0 0.5rem; font-size: 0.85rem; }
  .chip {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: var(--surface); border: 1px solid var(--border);
    padding: 0.3rem 0.7rem; border-radius: 999px; color: var(--muted-strong); font-weight: 500;
    box-shadow: var(--shadow-sm);
  }
  .swatch { width: 11px; height: 11px; border-radius: 3px; display: inline-block; border: 2px solid; }
  .sw-pm   { background: #e0e7ff; border-color: #6366f1; }
  .sw-sync { background: #fef3c7; border-color: #f59e0b; }
  .sw-human{ background: #fff1f3; border-color: #e11d48; }
  .sw-gate { background: #f8fafc; border-color: #94a3b8; }
  @media (prefers-color-scheme: dark) {
    .sw-pm   { background: rgba(99,102,241,0.2); border-color: #818cf8; }
    .sw-sync { background: rgba(245,158,11,0.2); border-color: #fbbf24; }
    .sw-human{ background: rgba(225,29,72,0.2);  border-color: #fb7185; }
    .sw-gate { background: rgba(148,163,184,0.1); border-color: #64748b; }
  }
  .callout {
    background: var(--accent-soft); border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
    border-left: 4px solid var(--accent); padding: 0.9rem 1.2rem; border-radius: var(--radius);
    margin: 1rem 0 1.5rem; font-size: 0.94rem; box-shadow: var(--shadow-sm);
  }
  .diagram-wrap {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 1.5rem; margin: 1rem 0 2.5rem; box-shadow: var(--shadow-md); overflow: auto;
  }
  .mermaid { min-width: 800px; width: fit-content; margin: 0 auto; }
  .page-footer {
    margin-top: 3rem; padding-top: 1.2rem; border-top: 1px solid var(--border);
    font-size: 0.85rem; color: var(--muted);
  }
  .page-footer a { color: var(--pm-deep); font-weight: 500; }
  .page-footer a:hover { color: var(--pm); }
  @media (prefers-color-scheme: dark) { .page-footer a { color: var(--pm); } }
  a { color: var(--pm-deep); text-decoration: none; font-weight: 500; transition: color 0.12s; }
  a:hover { color: var(--pm); text-decoration: underline; text-underline-offset: 3px; }
  @media (prefers-color-scheme: dark) { a { color: var(--pm); } }
</style>
</head>
<body>
<div class="page">

<header class="hero">
  <span class="hero-eyebrow">Cotality Product Team · AIRW Flowcharts</span>
  <h1>AIRW Workflow — Flowcharts</h1>
  <p class="hero-sub">Two diagrams: the end-to-end <strong>/pm-req-*</strong> command flow <span class="role">PM</span>, and the per-requirement state lifecycle.</p>
  <div class="last-updated">Last updated: 2026-05-27</div>
</header>

<div class="legend">
  <span class="chip"><i class="swatch sw-pm"></i> PM command / phase</span>
  <span class="chip"><i class="swatch sw-sync"></i> Sync / dev team handoff</span>
  <span class="chip"><i class="swatch sw-human"></i> Human gate / PM approval</span>
  <span class="chip"><i class="swatch sw-gate"></i> Decision / quality check</span>
</div>

<h2 id="command-flow">Command flow</h2>

<div class="callout">
  Walks one Aha feature from identification through to dev-team-ready child requirements. Each phase gate is a PM approval pause — Claude does not advance until the PM says <strong>"approved"</strong>. The quality gate (<code>/pm-req-review</code>) runs after all requirements are written to Aha; must-fix findings send the PM back to revise.
</div>

<div class="diagram-wrap">
<div class="mermaid">
flowchart TD
    Start([Aha feature identified]):::startend --> Step0

    Step0["<div style='padding:4px 8px;max-width:240px'><div style='font-size:14px;font-weight:800;margin-bottom:4px'>/pm-req-new</div><div style='font-size:12px;font-weight:400'>PM provides feature ref (e.g. SYM-12345). Claude fetches feature from Aha and begins phase-by-phase process.</div></div>"]:::cmdPM

    Step0 --> Ph1["<div style='padding:4px 8px;max-width:240px'><div style='font-size:13px;font-weight:700;margin-bottom:3px'>Phase 1 — Research &amp; Market Problem</div><div style='font-size:12px;font-weight:400'>Deep search of existing requirements + Aha context. Drafts market problem.</div></div>"]:::cmdPM
    Ph1 --> Gate1[/"PM: approve or refine Market Problem"/]:::human
    Gate1 --> Ph2["<div style='padding:4px 8px;max-width:240px'><div style='font-size:13px;font-weight:700;margin-bottom:3px'>Phase 2 — Current Workflow</div><div style='font-size:12px;font-weight:400'>Pain-point table: Step | User Action | Blocker | Impact</div></div>"]:::cmdPM
    Ph2 --> Gate2[/"PM: approve or refine Current Workflow"/]:::human
    Gate2 --> Ph3["<div style='padding:4px 8px;max-width:240px'><div style='font-size:13px;font-weight:700;margin-bottom:3px'>Phase 3 — Objectives</div><div style='font-size:12px;font-weight:400'>Bulleted list, each mapped to a Phase 2 blocker.</div></div>"]:::cmdPM
    Ph3 --> Gate3[/"PM: approve or refine Objectives"/]:::human
    Gate3 --> Ph4["<div style='padding:4px 8px;max-width:240px'><div style='font-size:13px;font-weight:700;margin-bottom:3px'>Phase 4 — Future Workflow</div><div style='font-size:12px;font-weight:400'>Future state table; each row resolves a Phase 2 blocker.</div></div>"]:::cmdPM
    Ph4 --> Gate4[/"PM: approve or refine Future Workflow"/]:::human
    Gate4 --> Ph5["<div style='padding:4px 8px;max-width:240px'><div style='font-size:13px;font-weight:700;margin-bottom:3px'>Phase 5 — Requirements</div><div style='font-size:12px;font-weight:400'>One per product per capability. Always checks Capture + Estimate Mobile for field workflows.</div></div>"]:::cmdPM
    Ph5 --> Gate5{Clarifications needed?}:::gate
    Gate5 -->|yes| Ph6["<div style='padding:4px 8px;max-width:200px'><div style='font-size:13px;font-weight:700;margin-bottom:3px'>Phase 6 — Resolve</div><div style='font-size:12px;font-weight:400'>One question at a time until all markers cleared.</div></div>"]:::cmdPM
    Ph6 --> Gate5
    Gate5 -->|no| Gate5b[/"PM: approve all requirements"/]:::human
    Gate5b --> Ph7["<div style='padding:4px 8px;max-width:240px'><div style='font-size:13px;font-weight:700;margin-bottom:3px'>Phase 7 — Write to Aha</div><div style='font-size:12px;font-weight:400'>Sequential mcp__aha__create_requirement calls, one per requirement. Confirms each.</div></div>"]:::cmdPM
    Ph7 --> Review

    Review["<div style='padding:4px 8px;max-width:240px'><div style='font-size:14px;font-weight:800;margin-bottom:4px'>/pm-req-review</div><div style='font-size:12px;font-weight:400'>Fetches all requirements from Aha. Runs 5 checks: product coverage, contradictions, detail, unresolved markers, format.</div></div>"]:::cmdPM
    Review --> ReviewPass{Clean?}:::gate
    ReviewPass -->|must-fix found| Ph5
    ReviewPass -->|clean| Handoff

    Handoff["<div style='padding:4px 8px;max-width:240px'><div style='font-size:13px;font-weight:700;margin-bottom:4px'>Dev team handoff</div><div style='font-size:12px;font-weight:400'>Requirements ready in Aha. Dev team picks up with /sym-spec-new.</div></div>"]:::sync
    Handoff --> Done([Requirements shipped to dev team]):::startend

    classDef cmdPM   fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#1e1b4b,font-size:14px,font-weight:bold
    classDef sync    fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#78350f,font-size:14px,font-weight:bold
    classDef human   fill:#fff1f3,stroke:#e11d48,stroke-width:1px,color:#9f1239,font-size:11px,font-style:italic
    classDef gate    fill:#ffffff,stroke:#94a3b8,stroke-width:1px,color:#475569,font-size:11px
    classDef startend fill:#0f172a,stroke:#020617,stroke-width:2px,color:#ffffff,font-size:12px
</div>
</div>

<h2 id="req-lifecycle">Requirement lifecycle</h2>

<div class="callout">
  The states a <em>single requirement</em> moves through, from initial draft inside <code>/pm-req-new</code> through to dev-team-ready in Aha. Different requirements for the same feature can sit in different states simultaneously.
</div>

<div class="diagram-wrap">
<div class="mermaid">
flowchart TD
    Drafted["<div style='padding:4px 6px;max-width:200px'><div style='font-size:13px;font-weight:800;margin-bottom:3px'>drafted</div><div style='font-size:11px;font-weight:400'>Requirement exists in Phase 5 response. Not yet in Aha.</div></div>"]:::statePM
    Clarifying["<div style='padding:4px 6px;max-width:200px'><div style='font-size:13px;font-weight:800;margin-bottom:3px'>needs clarification</div><div style='font-size:11px;font-weight:400'>One or more [NEEDS CLARIFICATION] markers present in Details.</div></div>"]:::statePM
    Resolved["<div style='padding:4px 6px;max-width:200px'><div style='font-size:13px;font-weight:800;margin-bottom:3px'>resolved</div><div style='font-size:11px;font-weight:400'>All markers removed. PM approves requirement.</div></div>"]:::statePM
    Written["<div style='padding:4px 6px;max-width:200px'><div style='font-size:13px;font-weight:800;margin-bottom:3px'>written to Aha</div><div style='font-size:11px;font-weight:400'>mcp__aha__create_requirement succeeded. Requirement exists in Aha.</div></div>"]:::stateSync
    Reviewed["<div style='padding:4px 6px;max-width:200px'><div style='font-size:13px;font-weight:800;margin-bottom:3px'>reviewed</div><div style='font-size:11px;font-weight:400'>/pm-req-review: all 5 checks passed. No must-fix findings.</div></div>"]:::stateGate
    DevReady["<div style='padding:4px 6px;max-width:200px'><div style='font-size:13px;font-weight:800;margin-bottom:3px'>dev-team ready</div><div style='font-size:11px;font-weight:400'>Ready for /sym-spec-new pickup by the dev team.</div></div>"]:::stateDone

    Drafted --> Clarifying
    Clarifying -->|Phase 6: one Q at a time| Resolved
    Resolved -->|PM approves all reqs| Written
    Written -->|/pm-req-review| Reviewed
    Reviewed -->|must-fix found| Drafted
    Reviewed -->|all checks pass| DevReady

    classDef statePM   fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#1e1b4b,font-size:13px,font-weight:bold
    classDef stateSync fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#78350f,font-size:13px,font-weight:bold
    classDef stateGate fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#78350f,font-size:13px,font-weight:bold
    classDef stateDone fill:#0f172a,stroke:#020617,stroke-width:2px,color:#ffffff,font-size:13px,font-weight:bold
</div>
</div>

<footer class="page-footer">
  <strong>Companion docs:</strong>
  <a href="pm-requirements-workflow.html">Framework reference</a> &middot;
  <a href="pm-requirements-example.html">End-to-end example (SYM-2566)</a> &middot;
  <a href="../Dev team Process/spec-driven-development.html">Dev team: spec-driven development</a>
</footer>

</div>
</body>
</html>
```

- [ ] **Step 2: Verify the file renders correctly**

Open `docs/PM Process/pm-requirements-flowchart.html` in a browser. Confirm:
- Both Mermaid diagrams render (may take 1–2 seconds to load from CDN)
- Command flow shows: start node → /pm-req-new → Phase 1–7 → /pm-req-review → clean/must-fix branch → done
- Requirement lifecycle shows: drafted → needs clarification → resolved → written → reviewed → dev-team ready
- Hero title appears with gradient text
- Dark mode works if OS is set to dark (or use browser DevTools to emulate)
- Footer links are present

- [ ] **Step 3: Commit**

```bash
git add "docs/PM Process/pm-requirements-flowchart.html"
git commit -m "docs: add AIRW flowchart doc (command flow + requirement lifecycle diagrams)"
```

---

## Task 2: Framework Doc — Scaffold (`pm-requirements-workflow.html`)

**Files:**
- Create: `docs/PM Process/pm-requirements-workflow.html`

This task creates the complete file structure (CSS, hero, sidebar TOC, all 12 section stubs with `id` anchors, footer, back-to-top JS). Content is filled in Tasks 3 and 4. The scaffold must be browser-renderable on its own.

- [ ] **Step 1: Write the scaffold HTML**

Create `docs/PM Process/pm-requirements-workflow.html`:

```html
<!DOCTYPE html>
<!--
  AI EDITOR INSTRUCTION (Claude Code, Copilot, any AI assistant):
  This file carries a `Last updated: YYYY-MM-DD` line in its header
  (search for class="last-updated"). EVERY time you modify this file:
    1. Run `date "+%Y-%m-%d"` to get the current date.
    2. Update the `Last updated:` value to that exact string before finishing.
    3. Keep the format identical across all AIRW HTML docs in this folder.
  Do NOT guess the date and do NOT skip this step.

  COMPANION FLOWCHART (keep in sync):
  `pm-requirements-flowchart.html` is a Mermaid rendering of the workflow described here.
  If you change the workflow shape (phases, gates, loop conditions), update the flowchart too.
-->
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI-First Requirements Workflow · Cotality Product Team</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #fbfbfd; --surface: #ffffff; --surface-2: #f4f4f7; --surface-3: #ebebf0;
    --fg: #0f172a; --fg-strong: #020617; --muted: #64748b; --muted-strong: #475569;
    --border: #e4e4ea; --border-strong: #d4d4dc;
    --accent: #f59e0b; --accent-deep: #d97706; --accent-soft: #fff7ed;
    --pm: #6366f1; --pm-deep: #4f46e5; --pm-soft: #eef2ff;
    --human: #e11d48; --human-soft: #fff1f3;
    --shadow-sm: 0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06);
    --shadow-md: 0 4px 12px -2px rgba(15,23,42,0.06), 0 2px 6px -2px rgba(15,23,42,0.04);
    --shadow-lg: 0 20px 40px -12px rgba(15,23,42,0.12), 0 8px 16px -4px rgba(15,23,42,0.06);
    --radius: 12px; --radius-sm: 8px; --radius-lg: 18px;
    --hero-grad: linear-gradient(135deg, #f59e0b 0%, #ef4444 45%, #ec4899 100%);
    --hero-grad-soft: radial-gradient(ellipse at top left, rgba(245,158,11,0.12), transparent 50%),
                      radial-gradient(ellipse at top right, rgba(236,72,153,0.08), transparent 50%);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #08080b; --surface: #111118; --surface-2: #16161e; --surface-3: #1d1d27;
      --fg: #e4e4e7; --fg-strong: #fafafa; --muted: #9ca3af; --muted-strong: #cbd5e1;
      --border: #27272f; --border-strong: #3a3a44;
      --accent: #fbbf24; --accent-deep: #f59e0b; --accent-soft: rgba(251,191,36,0.08);
      --pm: #818cf8; --pm-deep: #6366f1; --pm-soft: rgba(129,140,248,0.12);
      --human: #fb7185; --human-soft: rgba(251,113,133,0.14);
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.3); --shadow-md: 0 4px 12px -2px rgba(0,0,0,0.4);
      --shadow-lg: 0 20px 40px -12px rgba(0,0,0,0.6);
      --hero-grad: linear-gradient(135deg, #fbbf24 0%, #f87171 45%, #f472b6 100%);
      --hero-grad-soft: radial-gradient(ellipse at top left, rgba(251,191,36,0.10), transparent 50%),
                        radial-gradient(ellipse at top right, rgba(244,114,182,0.08), transparent 50%);
    }
  }
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; scroll-padding-top: 80px; }
  body {
    margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 16px; line-height: 1.62; color: var(--fg); background: var(--bg);
    background-image: var(--hero-grad-soft); background-repeat: no-repeat; background-size: 100% 800px;
    -webkit-font-smoothing: antialiased; font-feature-settings: "cv02","cv03","cv04","cv11","ss01";
  }
  .page { max-width: 1280px; margin: 0 auto; padding: 0 clamp(1rem,3vw,2rem); }
  .layout {
    display: grid; grid-template-columns: minmax(0,1fr); gap: 2.5rem; padding-bottom: 6rem;
  }
  @media (min-width: 1080px) {
    .layout { grid-template-columns: 240px minmax(0,1fr); align-items: start; }
  }
  main { min-width: 0; max-width: 820px; }
  @media (min-width: 1080px) { main { padding-top: 1rem; } }

  /* Hero */
  .hero { padding: 3.5rem 0 2rem; margin-bottom: 1rem; border-bottom: 1px solid var(--border); }
  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 0.5rem;
    font-size: 0.78rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--accent-deep); background: var(--accent-soft);
    padding: 0.35rem 0.75rem; border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent); margin-bottom: 1.1rem;
  }
  .hero-eyebrow::before {
    content: ""; width: 6px; height: 6px; border-radius: 50%;
    background: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
  }
  @media (prefers-color-scheme: dark) { .hero-eyebrow { color: var(--accent); } }
  h1 {
    font-size: clamp(2rem,5vw,3.25rem); font-weight: 800; line-height: 1.05;
    letter-spacing: -0.025em; margin: 0 0 1rem;
    background: var(--hero-grad); -webkit-background-clip: text;
    background-clip: text; -webkit-text-fill-color: transparent; max-width: 20ch;
  }
  .hero-sub { font-size: 1.1rem; line-height: 1.55; color: var(--muted-strong); max-width: 60ch; margin: 0; }
  .hero-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.5rem; font-size: 0.85rem; }
  .hero-meta .chip {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: var(--surface); border: 1px solid var(--border);
    padding: 0.35rem 0.75rem; border-radius: 999px; color: var(--muted-strong); box-shadow: var(--shadow-sm);
  }
  .hero-meta .chip strong { color: var(--fg-strong); font-weight: 600; }
  .last-updated {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.35rem 0.75rem; font-size: 0.8rem; font-weight: 600;
    color: var(--accent-deep); background: var(--accent-soft);
    border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent); border-radius: 999px;
  }
  .last-updated::before { content: "⏱"; font-size: 0.9rem; }
  @media (prefers-color-scheme: dark) { .last-updated { color: var(--accent); } }

  /* Typography */
  h2 {
    font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; color: var(--fg-strong);
    margin: 3.5rem 0 1rem; padding-bottom: 0.65rem; border-bottom: 1px solid var(--border);
    scroll-margin-top: 80px; position: relative;
  }
  h2::before {
    content: ""; position: absolute; bottom: -1px; left: 0;
    width: 56px; height: 3px; border-radius: 2px; background: var(--hero-grad);
  }
  h3 { font-size: 1.22rem; font-weight: 700; letter-spacing: -0.01em; color: var(--fg-strong); margin: 2.2rem 0 0.6rem; scroll-margin-top: 80px; }
  h4 { font-size: 1.02rem; font-weight: 600; color: var(--pm-deep); margin: 1.4rem 0 0.4rem; }
  @media (prefers-color-scheme: dark) { h4 { color: var(--pm); } }
  p { margin: 1.1rem 0; }
  ul, ol { padding-left: 1.4rem; margin: 1rem 0; }
  li { margin: 0.6rem 0; line-height: 1.6; }
  li::marker { color: var(--muted); }
  hr { border: none; border-top: 1px solid var(--border); margin: 3rem 0; }
  a { color: var(--pm-deep); text-decoration: none; font-weight: 500; transition: color 0.12s; }
  a:hover { color: var(--pm); text-decoration: underline; text-underline-offset: 3px; }
  @media (prefers-color-scheme: dark) { a { color: var(--pm); } }
  strong { color: var(--fg-strong); font-weight: 600; }
  a strong, a code { color: inherit; }
  em { color: var(--muted-strong); }

  /* Code */
  code {
    background: var(--surface-2); padding: 0.13rem 0.4rem; border-radius: 5px;
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.84em; font-weight: 500; color: var(--fg-strong);
    word-break: break-word; border: 1px solid var(--border);
  }
  pre {
    background: linear-gradient(180deg, var(--surface-2), var(--surface));
    padding: 1.1rem 1.2rem; border-radius: var(--radius); overflow-x: auto;
    font-size: 0.82rem; line-height: 1.6; border: 1px solid var(--border);
    box-shadow: var(--shadow-sm); margin: 1rem 0;
  }
  pre code { background: transparent; padding: 0; font-size: inherit; border: none; color: var(--fg); }

  /* Tables */
  table {
    width: 100%; border-collapse: separate; border-spacing: 0; margin: 1.2rem 0;
    font-size: 0.92rem; background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-sm);
  }
  th, td { text-align: left; padding: 0.75rem 0.9rem; border-bottom: 1px solid var(--border); vertical-align: top; }
  th { background: var(--surface-2); font-weight: 600; color: var(--fg-strong); font-size: 0.82rem; letter-spacing: 0.02em; text-transform: uppercase; border-bottom: 1px solid var(--border-strong); }
  tr:last-child td { border-bottom: none; }
  tbody tr { transition: background 0.12s; }
  tbody tr:hover td { background: var(--surface-2); }
  td:first-child { font-weight: 500; color: var(--fg-strong); }

  /* Callouts */
  .warn {
    background: var(--accent-soft); border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
    border-left: 4px solid var(--accent); padding: 0.9rem 1.2rem; border-radius: var(--radius);
    font-size: 0.94rem; margin: 1.2rem 0; box-shadow: var(--shadow-sm);
  }
  .warn strong:first-child { color: var(--accent-deep); }
  @media (prefers-color-scheme: dark) { .warn strong:first-child { color: var(--accent); } }
  .info {
    background: var(--pm-soft); border: 1px solid color-mix(in srgb, var(--pm) 20%, transparent);
    border-left: 4px solid var(--pm); padding: 0.9rem 1.2rem; border-radius: var(--radius);
    font-size: 0.94rem; margin: 1.2rem 0; box-shadow: var(--shadow-sm);
  }
  .tldr {
    background: linear-gradient(135deg, var(--accent-soft), transparent 65%), var(--surface);
    border: 1px solid color-mix(in srgb, var(--accent) 22%, var(--border));
    border-radius: var(--radius-lg); padding: 1.5rem 1.7rem; margin: 1.8rem 0 2rem;
    box-shadow: var(--shadow-md); position: relative; overflow: hidden;
  }
  .tldr::before {
    content: ""; position: absolute; top: 0; left: 0;
    width: 100%; height: 3px; background: var(--hero-grad);
  }
  .tldr h3 {
    margin-top: 0; color: var(--accent-deep); font-size: 1.05rem;
    text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700;
    display: flex; align-items: center; gap: 0.55rem;
  }
  .tldr h3::before { content: "✦"; color: var(--accent); font-size: 1.2rem; }
  @media (prefers-color-scheme: dark) { .tldr h3 { color: var(--accent); } }

  /* Role badge */
  .role {
    display: inline-flex; align-items: center; gap: 0.3rem;
    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.06em;
    padding: 0.18rem 0.55rem; border-radius: 999px; margin-left: 0.35rem;
    vertical-align: middle; text-transform: uppercase; border: 1px solid transparent; line-height: 1;
  }
  .role-pm {
    background: var(--pm-soft); color: var(--pm);
    border-color: color-mix(in srgb, var(--pm) 25%, transparent);
  }
  .role-pm::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--pm); }

  /* Phase badge */
  .phase-badge {
    display: inline-flex; align-items: center; gap: 0.3rem;
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
    padding: 0.2rem 0.6rem; border-radius: 999px;
    background: var(--pm-soft); color: var(--pm);
    border: 1px solid color-mix(in srgb, var(--pm) 25%, transparent); margin-right: 0.4rem;
  }

  /* Human gate callout */
  .human-callout {
    background: var(--human-soft); border: 1px solid color-mix(in srgb, var(--human) 18%, transparent);
    border-left: 4px solid var(--human); border-radius: var(--radius);
    padding: 0.85rem 1rem 0.85rem 3rem; margin: 1rem 0; font-size: 0.93rem; position: relative;
  }
  .human-callout::before { content: "👤"; position: absolute; left: 0.85rem; top: 0.75rem; font-size: 1.4rem; }
  .human-callout strong:first-child {
    color: var(--human); text-transform: uppercase; letter-spacing: 0.05em;
    font-size: 0.78rem; display: block; margin-bottom: 0.25rem;
  }

  /* Quick-reference card */
  .qr-table th:first-child { width: 10%; }
  .qr-table td:first-child { font-family: 'JetBrains Mono', monospace; font-size: 0.82em; }

  /* Sidebar TOC */
  .sidebar {
    position: sticky; top: 1.5rem; align-self: start;
    max-height: calc(100vh - 3rem); overflow-y: auto; padding: 1rem 0; font-size: 0.88rem;
  }
  @media (max-width: 1079px) { .sidebar { display: none; } }
  .sidebar-title {
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 0.8rem; padding-left: 0.8rem;
  }
  .sidebar-nav ol { list-style: none; padding: 0; margin: 0; counter-reset: tocsec; }
  .sidebar-nav li { counter-increment: tocsec; margin: 0; }
  .sidebar-nav a {
    display: block; padding: 0.45rem 0.8rem; color: var(--muted-strong);
    border-left: 2px solid transparent; border-radius: 0 6px 6px 0;
    font-weight: 500; transition: all 0.12s; line-height: 1.4;
  }
  .sidebar-nav a::before {
    content: counter(tocsec) "."; display: inline-block; width: 1.5rem;
    color: var(--muted); font-variant-numeric: tabular-nums; font-weight: 500;
  }
  .sidebar-nav a:hover {
    color: var(--fg-strong); background: var(--surface-2);
    text-decoration: none; border-left-color: var(--border-strong);
  }
  .sidebar-nav a.active {
    color: var(--accent-deep); background: var(--accent-soft);
    border-left-color: var(--accent); font-weight: 600;
  }
  .sidebar-nav a.active::before { color: var(--accent-deep); }
  @media (prefers-color-scheme: dark) {
    .sidebar-nav a.active { color: var(--accent); }
    .sidebar-nav a.active::before { color: var(--accent); }
  }
  .sidebar::-webkit-scrollbar { width: 6px; }
  .sidebar::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 3px; }

  /* Top-of-doc TOC card (mobile fallback) */
  .toc {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 1.1rem 1.4rem; margin: 1.5rem 0 2.5rem; font-size: 0.95rem; box-shadow: var(--shadow-sm);
  }
  .toc strong { display: block; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.6rem; }
  .toc ol { margin: 0; padding-left: 1.2rem; }
  .toc li { margin: 0.25rem 0; }
  .toc a { color: var(--fg); font-weight: 500; }
  .toc a:hover { color: var(--accent-deep); }
  @media (min-width: 1080px) { .toc { display: none; } }

  /* Back to top */
  .back-to-top {
    position: fixed; right: 1.5rem; bottom: 1.5rem; width: 44px; height: 44px;
    border-radius: 50%; background: var(--surface); border: 1px solid var(--border-strong);
    color: var(--accent-deep); font-size: 1.2rem; font-weight: 700; cursor: pointer;
    box-shadow: var(--shadow-md); opacity: 0; transform: translateY(8px);
    transition: opacity 0.2s, transform 0.2s, background 0.12s; z-index: 50;
    display: flex; align-items: center; justify-content: center;
  }
  .back-to-top.visible { opacity: 1; transform: translateY(0); }
  .back-to-top:hover { background: var(--accent); color: white; border-color: var(--accent); }
  @media (prefers-color-scheme: dark) {
    .back-to-top { color: var(--accent); }
    .back-to-top:hover { color: var(--bg); }
  }

  /* Meta footer */
  .page-footer { margin-top: 3rem; padding-top: 1.2rem; border-top: 1px solid var(--border); font-size: 0.85rem; color: var(--muted); }
  ::selection { background: color-mix(in srgb, var(--accent) 30%, transparent); color: var(--fg-strong); }
</style>
</head>
<body>
<div class="page">
<div class="layout">

<aside class="sidebar" aria-label="Table of contents">
  <div class="sidebar-title">On this page</div>
  <nav class="sidebar-nav">
    <ol>
      <li><a href="#output">What this process produces</a></li>
      <li><a href="#overview">The 8-stage workflow</a></li>
      <li><a href="#stage1">Stage 1 — Research &amp; Context</a></li>
      <li><a href="#stage2">Stage 2 — Market Problem</a></li>
      <li><a href="#stage3">Stage 3 — Current Workflow</a></li>
      <li><a href="#stage4">Stage 4 — Objectives</a></li>
      <li><a href="#stage5">Stage 5 — Future Workflow</a></li>
      <li><a href="#stage6">Stage 6 — Requirements</a></li>
      <li><a href="#stage7">Stage 7 — Submit to Aha</a></li>
      <li><a href="#quality">Quality Gate</a></li>
      <li><a href="#conventions">Conventions &amp; markers</a></li>
      <li><a href="#quickref">Quick-reference card</a></li>
    </ol>
  </nav>
</aside>

<main>

<header class="hero">
  <span class="hero-eyebrow">Cotality Product Team · Requirements Process</span>
  <h1>AI-First Requirements Workflow</h1>
  <p class="hero-sub">From Aha feature to dev-team-ready child requirements — a structured, phase-by-phase process with Claude as co-author. <span class="role role-pm">PM</span></p>
  <div class="hero-meta">
    <span class="chip"><strong>2</strong> commands &middot; /pm-req-new, /pm-req-review</span>
    <span class="chip"><strong>7</strong> phases + quality gate</span>
    <span class="chip"><strong>5</strong> PM approval gates</span>
    <span class="last-updated">Last updated: 2026-05-27</span>
  </div>
</header>

<!-- Mobile TOC -->
<nav class="toc" aria-label="Page contents">
  <strong>On this page</strong>
  <ol>
    <li><a href="#output">What this process produces</a></li>
    <li><a href="#overview">The 8-stage workflow</a></li>
    <li><a href="#stage1">Stage 1 — Research &amp; Context</a></li>
    <li><a href="#stage2">Stage 2 — Market Problem</a></li>
    <li><a href="#stage3">Stage 3 — Current Workflow</a></li>
    <li><a href="#stage4">Stage 4 — Objectives</a></li>
    <li><a href="#stage5">Stage 5 — Future Workflow</a></li>
    <li><a href="#stage6">Stage 6 — Requirements</a></li>
    <li><a href="#stage7">Stage 7 — Submit to Aha</a></li>
    <li><a href="#quality">Quality Gate</a></li>
    <li><a href="#conventions">Conventions &amp; markers</a></li>
    <li><a href="#quickref">Quick-reference card</a></li>
  </ol>
</nav>

<!-- SECTION 1 -->
<h2 id="output">1. What this process produces</h2>
<!-- CONTENT: Task 3 fills this -->
<p><em>[Placeholder — filled in Task 3]</em></p>

<!-- SECTION 2 -->
<h2 id="overview">2. The 8-stage workflow</h2>
<!-- CONTENT: Task 3 fills this -->
<p><em>[Placeholder — filled in Task 3]</em></p>

<!-- SECTION 3 -->
<h2 id="stage1">3. Stage 1 — Research &amp; Context</h2>
<!-- CONTENT: Task 3 fills this -->
<p><em>[Placeholder — filled in Task 3]</em></p>

<!-- SECTION 4 -->
<h2 id="stage2">4. Stage 2 — Market Problem</h2>
<!-- CONTENT: Task 3 fills this -->
<p><em>[Placeholder — filled in Task 3]</em></p>

<!-- SECTION 5 -->
<h2 id="stage3">5. Stage 3 — Current Workflow</h2>
<!-- CONTENT: Task 3 fills this -->
<p><em>[Placeholder — filled in Task 3]</em></p>

<!-- SECTION 6 -->
<h2 id="stage4">6. Stage 4 — Objectives</h2>
<!-- CONTENT: Task 3 fills this -->
<p><em>[Placeholder — filled in Task 3]</em></p>

<!-- SECTION 7 -->
<h2 id="stage5">7. Stage 5 — Future Workflow</h2>
<!-- CONTENT: Task 4 fills this -->
<p><em>[Placeholder — filled in Task 4]</em></p>

<!-- SECTION 8 -->
<h2 id="stage6">8. Stage 6 — Requirements</h2>
<!-- CONTENT: Task 4 fills this -->
<p><em>[Placeholder — filled in Task 4]</em></p>

<!-- SECTION 9 -->
<h2 id="stage7">9. Stage 7 — Submit to Aha</h2>
<!-- CONTENT: Task 4 fills this -->
<p><em>[Placeholder — filled in Task 4]</em></p>

<!-- SECTION 10 -->
<h2 id="quality">10. Quality Gate</h2>
<!-- CONTENT: Task 4 fills this -->
<p><em>[Placeholder — filled in Task 4]</em></p>

<!-- SECTION 11 -->
<h2 id="conventions">11. Conventions &amp; markers</h2>
<!-- CONTENT: Task 4 fills this -->
<p><em>[Placeholder — filled in Task 4]</em></p>

<!-- SECTION 12 -->
<h2 id="quickref">12. Quick-reference card</h2>
<!-- CONTENT: Task 4 fills this -->
<p><em>[Placeholder — filled in Task 4]</em></p>

<hr>
<p class="page-footer">
  <strong>Companion docs:</strong>
  <a href="pm-requirements-flowchart.html">Workflow flowcharts</a> &middot;
  <a href="pm-requirements-example.html">End-to-end example (SYM-2566)</a> &middot;
  <a href="../Dev team Process/spec-driven-development.html">Dev team: spec-driven development</a>
</p>

</main>
</div>
</div>

<button class="back-to-top" id="backToTop" aria-label="Back to top" title="Back to top">↑</button>

<script>
  (function () {
    const links = document.querySelectorAll('.sidebar-nav a');
    const map = new Map();
    links.forEach(a => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) map.set(target, a);
    });
    let activeLink = null;
    const setActive = (el) => {
      if (!el || el === activeLink) return;
      if (activeLink) activeLink.classList.remove('active');
      el.classList.add('active');
      activeLink = el;
    };
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length > 0) { const link = map.get(visible[0].target); setActive(link); }
    }, { rootMargin: '-80px 0px -65% 0px', threshold: 0 });
    map.forEach((_, target) => observer.observe(target));
    const btt = document.getElementById('backToTop');
    const onScroll = () => {
      if (window.scrollY > 400) btt.classList.add('visible');
      else btt.classList.remove('visible');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  })();
</script>
</body>
</html>
```

- [ ] **Step 2: Verify the scaffold renders correctly**

Open `docs/PM Process/pm-requirements-workflow.html` in a browser. Confirm:
- Gradient title "AI-First Requirements Workflow" appears
- At ≥ 1080px wide: left sidebar shows 12 numbered TOC links
- At < 1080px wide: inline TOC card shows instead
- All 12 `<h2>` sections exist with correct `id` attributes (use browser DevTools → Elements to check)
- Back-to-top button appears after scrolling down > 400px
- Footer links are present

- [ ] **Step 3: Commit**

```bash
git add "docs/PM Process/pm-requirements-workflow.html"
git commit -m "docs: add AIRW framework doc scaffold (CSS, hero, sidebar TOC, 12 section stubs)"
```

---

## Task 3: Framework Doc — Content Sections 1–6

**Files:**
- Modify: `docs/PM Process/pm-requirements-workflow.html` (replace placeholder `<p>` tags in sections 1–6)

Read the file before editing. Replace each `<p><em>[Placeholder — filled in Task 3]</em></p>` block under its respective `<h2>` with the actual HTML content shown below.

- [ ] **Step 1: Fill Section 1 — "What this process produces"**

Replace the placeholder `<p>` under `<h2 id="output">` with:

```html
<div class="tldr">
  <h3>The output</h3>
  <ul>
    <li>One or more <strong>Aha child requirements</strong> under the parent feature — structured, dev-team-ready, already written to Aha via MCP.</li>
    <li>Each requirement covers exactly one product and one capability. Multi-product features produce multiple requirements.</li>
    <li>Requirements pass a 5-check quality gate (<code>/pm-req-review</code>) before handoff. No unresolved questions, no missing products, no format gaps.</li>
  </ul>
</div>

<h3>Quality dimensions</h3>
<p>Every requirement targets <strong>Level 4 (Proficient)</strong> or <strong>Level 5 (Exemplary)</strong> on three dimensions:</p>
<table>
  <thead>
    <tr><th>Dimension</th><th>Level 4 — Proficient</th><th>Level 5 — Exemplary</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Clarity</strong></td>
      <td>Active voice, consistent terminology aligned with CLAUDE.md. No vague verbs, no "TBD" placeholders.</td>
      <td>Zero room for misinterpretation. A developer reading it cannot make two different valid implementations.</td>
    </tr>
    <tr>
      <td><strong>Completeness</strong></td>
      <td>Covers all primary requirements and functional states.</td>
      <td>Also covers error states, edge cases, and offline behavior for mobile products.</td>
    </tr>
    <tr>
      <td><strong>Traceability</strong></td>
      <td>Market Problem is linked to a business goal and client value.</td>
      <td>Every requirement detail traces back to a specific blocker in the Current Workflow table.</td>
    </tr>
  </tbody>
</table>
```

- [ ] **Step 2: Fill Section 2 — "The 8-stage workflow"**

Replace the placeholder `<p>` under `<h2 id="overview">` with:

```html
<p>The AIRW runs across two commands. <code>/pm-req-new</code> drives Stages 1–7 in a strictly sequential, phase-by-phase loop. <code>/pm-req-review</code> is Stage 8 — the quality gate run after all requirements are written to Aha.</p>

<table>
  <thead>
    <tr><th>#</th><th>Stage</th><th>Who acts</th><th>Claude's role</th><th>Artifact produced</th></tr>
  </thead>
  <tbody>
    <tr><td>1</td><td>Research &amp; Context</td><td>Claude</td><td>Searches repo + Aha for related requirements; fetches feature</td><td>Top 2–3 related features list</td></tr>
    <tr><td>2</td><td>Market Problem</td><td>Claude drafts, PM approves</td><td>Drafts problem statement from feature + search findings</td><td>Background &amp; Market Problem prose</td></tr>
    <tr><td>3</td><td>Current Workflow</td><td>Claude drafts, PM approves</td><td>Models today's pain points in a structured table</td><td>Current Workflow table (Step / User Action / Blocker / Impact)</td></tr>
    <tr><td>4</td><td>Objectives</td><td>Claude drafts, PM approves</td><td>Derives objectives from Phase 2 blockers</td><td>Bulleted objective list</td></tr>
    <tr><td>5</td><td>Future Workflow</td><td>Claude drafts, PM approves</td><td>Models the to-be state resolving each current blocker</td><td>Future Workflow table (Step / User Action / New Capability / System Response)</td></tr>
    <tr><td>6</td><td>Requirements</td><td>Claude drafts, PM approves</td><td>Writes one requirement per product per capability; flags gaps inline</td><td>Full set of child requirements (in-session)</td></tr>
    <tr><td>7</td><td>Submit to Aha</td><td>Claude (after PM approval)</td><td>Calls <code>mcp__aha__create_requirement</code> sequentially for each requirement</td><td>Requirements written to Aha under the parent feature</td></tr>
    <tr><td>8</td><td>Quality Gate</td><td>Claude, PM acts on findings</td><td>Runs 5 checks; reports must-fix and should-fix issues</td><td>Review report; clean requirements</td></tr>
  </tbody>
</table>

<div class="warn">
  <strong>One phase at a time.</strong> Claude pauses at the end of each phase and waits for the PM to say <strong>"approved"</strong> before advancing. Do not ask Claude to skip phases or generate the full document at once — each pause is a quality checkpoint.
</div>
```

- [ ] **Step 3: Fill Section 3 — "Stage 1 — Research & Context"**

Replace the placeholder `<p>` under `<h2 id="stage1">` with:

```html
<p><span class="phase-badge">Phase 0 + 1a</span> This stage happens before any drafting. Claude fetches the feature from Aha and searches the existing repository for related work.</p>

<h3>Step 0 — Get the feature reference</h3>
<p>Invoke <code>/pm-req-new</code> and provide the Aha feature reference (e.g., <code>SYM-12345</code>). Claude calls <code>mcp__aha__get_record</code> to retrieve:</p>
<ul>
  <li>Feature title and full description</li>
  <li>Any promoted idea content or customer context attached to the feature</li>
  <li>Existing child requirements (if any — for context, not to replace)</li>
</ul>

<h3>Step 1a — Deep search</h3>
<p>Claude then searches the repository before drafting anything:</p>
<ul>
  <li>Calls <code>mcp__aha__search_documents</code> with 2–3 key terms from the feature title to find related existing requirements.</li>
  <li>Uses the Glob tool on <code>docs/**/*</code> to identify any documentation files relevant to the subject area.</li>
</ul>

<h3>Step 1b — Report findings</h3>
<p>Claude lists the <strong>top 2–3 most closely related existing features or documents</strong> before drafting the Market Problem. If nothing overlaps, it explicitly states: <em>"No overlapping features or workflows found."</em></p>
<div class="info">
  <strong>Why this matters:</strong> Related features reveal existing product patterns, previous decisions, and constraints that the new requirements must respect. Reading them prevents contradictions at the review stage.
</div>
```

- [ ] **Step 4: Fill Section 4 — "Stage 2 — Market Problem"**

Replace the placeholder `<p>` under `<h2 id="stage2">` with:

```html
<p><span class="phase-badge">Phase 1b + 1c</span> Claude drafts the Background &amp; Market Problem section using the Aha feature description and the search findings from Stage 1.</p>

<h3>What a good market problem looks like</h3>
<p>The market problem must satisfy three criteria:</p>
<ol>
  <li><strong>Identifies who is affected and how</strong> — name the specific user role (use sub-types from CLAUDE.md, not just "adjuster"). Describe the concrete impact on their work.</li>
  <li><strong>Evidences the pain</strong> — cite specifics from the feature description, customer quotes, or prior Aha content. Avoid vague claims like "users find it difficult."</li>
  <li><strong>Connects to a business goal</strong> — tie the problem to a carrier outcome (reduced LAE, faster cycle time, lower leakage, higher adoption) or a strategic objective.</li>
</ol>

<div class="human-callout">
  <strong>PM approval gate</strong>
  After presenting the Market Problem draft, Claude pauses. The PM refines or approves. Approved Market Problem is the foundation every later phase references back to — invest time here.
</div>
```

- [ ] **Step 5: Fill Section 5 — "Stage 3 — Current Workflow"**

Replace the placeholder `<p>` under `<h2 id="stage3">` with:

```html
<p><span class="phase-badge">Phase 2</span> Claude models today's workflow — showing exactly where it breaks down. This table becomes the traceability backbone: every Objective (Stage 4) and every Future Workflow row (Stage 5) must map back to a blocker row here.</p>

<h3>Table structure</h3>
<table>
  <thead>
    <tr><th>Step</th><th>User Action</th><th>Blocker</th><th>Impact</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>What the user does at this point in the workflow</td>
      <td>Where the current system or process fails them</td>
      <td>Concrete downstream cost: time lost, error introduced, LAE increase, etc.</td>
    </tr>
    <tr>
      <td>2</td>
      <td>…</td>
      <td>…</td>
      <td>…</td>
    </tr>
  </tbody>
</table>

<h3>How to validate it</h3>
<p>A well-formed Current Workflow table:</p>
<ul>
  <li>Uses specific user role names from CLAUDE.md (e.g., "Adjuster — Field (Experienced)" rather than "adjuster")</li>
  <li>Has at least one row per distinct pain point — do not merge unrelated blockers into a single row</li>
  <li>Connects each Impact to a real consequence (use LAE, leakage, cycle time, or explicit user friction)</li>
  <li>Contains enough rows that the Objectives in Stage 4 can each be traced to exactly one blocker</li>
</ul>

<div class="human-callout">
  <strong>PM approval gate</strong>
  Claude pauses after presenting the table. The PM corrects any mischaracterization of the current workflow before continuing. This table is not changed again after approval.
</div>
```

- [ ] **Step 6: Fill Section 6 — "Stage 4 — Objectives"**

Replace the placeholder `<p>` under `<h2 id="stage4">` with:

```html
<p><span class="phase-badge">Phase 3</span> Claude derives the Objectives from the Current Workflow blockers. Each bullet must be traceable to a specific row in the Phase 2 table.</p>

<h3>Objective bullet rules</h3>
<ul>
  <li><strong>Specific and actionable</strong> — "Enable field adjusters to scan a room and generate a floor plan in under 60 seconds" passes. "Improve the sketching experience" fails.</li>
  <li><strong>No "improve" or "enhance" without qualification</strong> — state what "better" means in measurable or unambiguous terms.</li>
  <li><strong>One objective per blocker</strong> — if Phase 2 has 4 blocker rows, Stage 4 should have approximately 4 objectives. Merging multiple blockers into one objective hides scope.</li>
  <li><strong>Level 4/5 traceability</strong> — the objective must make the Phase 2 blocker it resolves obvious to a reader who hasn't seen the conversation.</li>
</ul>

<div class="human-callout">
  <strong>PM approval gate</strong>
  Claude pauses after presenting the objectives list. This is a good moment to question scope: if an objective would require a separate multi-month project, flag it for de-scoping before requirements are drafted.
</div>
```

- [ ] **Step 7: Verify sections 1–6 in browser**

Open the file and scroll through sections 1–6. Confirm:
- Quality dimensions table renders with 3 rows (Clarity, Completeness, Traceability)
- 8-stage workflow summary table renders with all 8 rows
- Phase badges (`<span class="phase-badge">`) display in indigo pill style
- Human approval callouts appear with 👤 icon and rose-colored left border
- Info callout in Stage 1 appears with indigo left border
- TL;DR box in Section 1 has gradient top bar

- [ ] **Step 8: Commit**

```bash
git add "docs/PM Process/pm-requirements-workflow.html"
git commit -m "docs: fill AIRW framework doc sections 1–6 (output, overview, research, market problem, current workflow, objectives)"
```

---

## Task 4: Framework Doc — Content Sections 7–12 + Quick-Reference Card

**Files:**
- Modify: `docs/PM Process/pm-requirements-workflow.html` (replace placeholder `<p>` tags in sections 7–12)

Read the file before editing.

- [ ] **Step 1: Fill Section 7 — "Stage 5 — Future Workflow"**

Replace the placeholder `<p>` under `<h2 id="stage5">` with:

```html
<p><span class="phase-badge">Phase 4</span> Claude drafts the Future Workflow table — the to-be state that resolves the blockers identified in Stage 3.</p>

<h3>Table structure</h3>
<table>
  <thead>
    <tr><th>Step</th><th>User Action</th><th>New Feature / Capability</th><th>System Response</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td>What the user does (same action as Phase 2, now frictionless)</td>
      <td>The new product capability enabling this step</td>
      <td>What the system does automatically in response</td>
    </tr>
    <tr>
      <td>2</td><td>…</td><td>…</td><td>…</td>
    </tr>
  </tbody>
</table>

<h3>Traceability check</h3>
<p>Every row in the Future Workflow table must resolve a specific row in the Current Workflow table. If the Current Workflow had 4 blockers, the Future Workflow should have 4 corresponding rows (though one new capability may resolve multiple blockers — that's acceptable if documented clearly).</p>

<div class="human-callout">
  <strong>PM approval gate</strong>
  Claude pauses. The PM validates that the future state described is what was actually intended — this is the last checkpoint before requirements are written. Changes to the Future Workflow after approval require revising the requirements.
</div>
```

- [ ] **Step 2: Fill Section 8 — "Stage 6 — Requirements"**

Replace the placeholder `<p>` under `<h2 id="stage6">` with:

```html
<p><span class="phase-badge">Phase 5 + 6</span> The central deliverable. Claude writes one requirement per product per capability. This section is the most rule-dense part of the process.</p>

<h3>Product-split rule</h3>
<div class="warn">
  <strong>One requirement per product.</strong> If a capability affects Claims Workspace, Capture, and Estimate Mobile, that is <em>three separate requirements</em>. Never combine two products in one requirement — the dev team consumes these as independent work items, often by different squads.
</div>

<h3>Field/mobile check (always apply)</h3>
<p>For any feature touching field workflows, mobile data capture, or offline scenarios: always evaluate whether <strong>Capture (Android)</strong> and <strong>Estimate Mobile (iOS)</strong> are affected, even if not mentioned in the feature description. Claude checks this automatically — but the PM should verify the result.</p>

<h3>Exact requirement format</h3>
<pre><code><strong>Applies to:</strong> [Product name — must match a product name in CLAUDE.md]
<strong>Statement:</strong> As a [user role], I want to [specific action] so that [specific benefit].
<strong>Details:</strong>
1. [Concrete system behavior — what the system does, not just what the user sees]
2. [Another specific behavior]
3. [Edge case, error state, or constraint]
<strong>Example:</strong> [A concrete scenario showing how this requirement works in practice]</code></pre>

<ul>
  <li><strong>Applies to:</strong> must be an exact product name from CLAUDE.md — no abbreviations, no "mobile" as a product name.</li>
  <li><strong>Statement:</strong> user story format; use persona sub-types (e.g., "Adjuster — Field (Experienced)", not "adjuster").</li>
  <li><strong>Details:</strong> numbered list; each item is a concrete behavior or constraint. Not a rephrasing of the Statement.</li>
  <li><strong>Example:</strong> a realistic scenario that disambiguates any implementation ambiguity in the Details.</li>
</ul>

<h3>The <code>[NEEDS CLARIFICATION]</code> marker</h3>
<p>When Claude cannot determine the correct behavior for a specific product, it writes <code>[NEEDS CLARIFICATION: specific question]</code> inline in the Details section. Rules:</p>
<ul>
  <li>Claude asks one clarification question at a time (Phase 6), in the order they appear.</li>
  <li><strong>Gating:</strong> no requirement with an unresolved marker is written to Aha. The clarification loop (Phase 6) must complete before Phase 7 begins.</li>
  <li><code>/pm-req-review</code> Check D will catch any marker that slips through — this is a must-fix finding.</li>
</ul>

<h3>Numbered presentation</h3>
<p>Claude presents all requirements as a numbered list (1 of N, 2 of N, etc.) so the PM can refer to specific items by number when requesting revisions.</p>

<div class="human-callout">
  <strong>PM approval gate</strong>
  After all clarifications are resolved, Claude re-presents the full requirements set. The PM reviews and approves before anything is written to Aha. This is the final edit opportunity.
</div>
```

- [ ] **Step 3: Fill Section 9 — "Stage 7 — Submit to Aha"**

Replace the placeholder `<p>` under `<h2 id="stage7">` with:

```html
<p><span class="phase-badge">Phase 6 + 7</span> Once the PM says "approved," Claude writes every requirement to Aha sequentially using <code>mcp__aha__create_requirement</code>.</p>

<h3>Write sequence</h3>
<p>Claude calls <code>mcp__aha__create_requirement</code> once per requirement, <strong>in sequence</strong> (not in parallel):</p>
<ul>
  <li><code>feature_id</code>: the Aha feature reference (e.g., <code>SYM-12345</code>)</li>
  <li><code>name</code>: the product name from the "Applies to" line (e.g., <code>Claims Workspace</code>)</li>
  <li><code>description</code>: the full requirement text starting from <strong>Applies to:</strong></li>
</ul>
<p>Claude confirms each write succeeds before calling the next. If a write fails, it stops and reports the error — do not continue writing until the failure is resolved.</p>

<h3>Confirmation message</h3>
<p>After all requirements are written, Claude reports:</p>
<blockquote>✓ [N] requirements written to [feature reference]. Run /pm-req-review to quality-check before handing off to the dev team.</blockquote>
```

- [ ] **Step 4: Fill Section 10 — "Quality Gate"**

Replace the placeholder `<p>` under `<h2 id="quality">` with:

```html
<p>Run <code>/pm-req-review SYM-12345</code> after all requirements are written to Aha. Claude fetches every child requirement and runs five checks.</p>

<h3>The five checks</h3>
<table>
  <thead>
    <tr><th>Check</th><th>What Claude evaluates</th><th>Finding level</th></tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>A — Product coverage</strong></td>
      <td>Based on the feature description and CLAUDE.md product knowledge: which products should be affected? Is there a requirement for each?</td>
      <td><strong>must-fix</strong> if a product is missing</td>
    </tr>
    <tr>
      <td><strong>B — No contradictions</strong></td>
      <td>Do any two requirements contradict each other? (e.g., one says only adjusters can see a feature; another implies managers see it too)</td>
      <td><strong>must-fix</strong> if found</td>
    </tr>
    <tr>
      <td><strong>C — Sufficient detail</strong></td>
      <td>Is each requirement specific enough that a developer can implement it without asking the PM for clarification? Vague status labels, missing error states, undefined personas — all fail this check.</td>
      <td><strong>should-fix</strong></td>
    </tr>
    <tr>
      <td><strong>D — No unresolved markers</strong></td>
      <td>Does any requirement still contain a <code>[NEEDS CLARIFICATION: ...]</code> marker?</td>
      <td><strong>must-fix</strong> if found</td>
    </tr>
    <tr>
      <td><strong>E — Format compliance</strong></td>
      <td>Does each requirement follow the exact format: Applies to / Statement (user story) / Details (numbered list)?</td>
      <td><strong>should-fix</strong></td>
    </tr>
  </tbody>
</table>

<h3>Re-run cycle</h3>
<p>If must-fix findings are reported:</p>
<ol>
  <li>Fix each must-fix item (update the requirement in Aha or add a missing requirement via <code>/pm-req-new</code>).</li>
  <li>Run <code>/pm-req-review</code> again.</li>
  <li>Repeat until the review reports clean.</li>
</ol>
<p>Should-fix items are recommended but do not block handoff. Fix them if time allows.</p>

<div class="info">
  <strong>Clean review = handoff ready.</strong> Once <code>/pm-req-review</code> reports "✓ All N requirements passed," the feature is ready for the dev team to pick up with <code>/sym-spec-new</code>.
</div>
```

- [ ] **Step 5: Fill Section 11 — "Conventions & markers"**

Replace the placeholder `<p>` under `<h2 id="conventions">` with:

```html
<h3>Product names</h3>
<p>Always use the exact product names from CLAUDE.md. These are the valid values for "Applies to":</p>
<ul>
  <li>Claims Workspace</li>
  <li>Claims Estimate</li>
  <li>Estimate Mobile (iOS)</li>
  <li>Link</li>
  <li>Capture</li>
  <li>Workspace Questionnaires</li>
  <li>Engage Video</li>
</ul>
<p>Legacy names (<em>Claims Connect, Mobile Claims, Desk Adjuster, Video Connect</em>) must not appear in requirements. Use the current names above.</p>

<h3>Persona sub-types</h3>
<p>The Statement's user role must use a specific sub-type, not just "adjuster." Valid roles from CLAUDE.md:</p>
<ul>
  <li>Adjuster — Field (Experienced) / Adjuster — Field (Novice) / Adjuster — Inside/Desk / Adjuster — Large Loss</li>
  <li>Field Tech · Claims Supervisor · Claims Manager · VP, Claims · IA Manager</li>
  <li>Contractor / Restoration Estimator · Insured</li>
</ul>

<h3><code>[NEEDS CLARIFICATION]</code> rules</h3>
<ul>
  <li>Written as <code>[NEEDS CLARIFICATION: the specific question]</code> inline inside the Details block.</li>
  <li><strong>Gating:</strong> Claude will not write a requirement containing this marker to Aha. Phase 6 must resolve all markers first.</li>
  <li><code>/pm-req-review</code> Check D treats any surviving marker as a must-fix finding.</li>
  <li>Ask one question at a time — Claude resolves markers sequentially, updating each requirement before asking the next question.</li>
</ul>

<h3>Always-applicable constraints from CLAUDE.md</h3>
<table>
  <thead>
    <tr><th>Constraint</th><th>What it means for requirements</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>Single source of truth</td>
      <td>No requirement may introduce a workflow where data lives only in one product without syncing to Claims Workspace.</td>
    </tr>
    <tr>
      <td>Data integrity end-to-end</td>
      <td>Data captured in Capture or Estimate Mobile must flow to Claims Estimate and Claims Workspace without manual re-entry. Requirements must not contradict this.</td>
    </tr>
    <tr>
      <td>Offline behavior for mobile</td>
      <td>Every Capture and Estimate Mobile requirement must explicitly state how the feature behaves when there is no network connectivity.</td>
    </tr>
    <tr>
      <td>Leakage prevention</td>
      <td>Every estimating or scoping requirement must note whether it reduces variance or missed scope — the primary leakage sources.</td>
    </tr>
  </tbody>
</table>
```

- [ ] **Step 6: Fill Section 12 — "Quick-reference card"**

Replace the placeholder `<p>` under `<h2 id="quickref">` with:

```html
<p>Keep this open in a second tab during active use.</p>

<table class="qr-table">
  <thead>
    <tr><th>Stage</th><th>Name</th><th>PM action</th><th>Claude action</th><th>Gate condition to advance</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>0</td>
      <td>Start</td>
      <td>Run <code>/pm-req-new SYM-12345</code></td>
      <td>Fetches feature via <code>mcp__aha__get_record</code></td>
      <td>—</td>
    </tr>
    <tr>
      <td>1</td>
      <td>Research &amp; Context</td>
      <td>Review related features list</td>
      <td>Searches repo + Aha; lists top 2–3 related features</td>
      <td>—</td>
    </tr>
    <tr>
      <td>2</td>
      <td>Market Problem</td>
      <td>Refine or say <strong>"approved"</strong></td>
      <td>Drafts Background &amp; Market Problem</td>
      <td>PM says "approved"</td>
    </tr>
    <tr>
      <td>3</td>
      <td>Current Workflow</td>
      <td>Validate pain points; refine or approve</td>
      <td>Drafts pain-point table (Step / Action / Blocker / Impact)</td>
      <td>PM says "approved"</td>
    </tr>
    <tr>
      <td>4</td>
      <td>Objectives</td>
      <td>Check traceability to blockers; approve</td>
      <td>Derives objectives from Phase 2 blockers</td>
      <td>PM says "approved"</td>
    </tr>
    <tr>
      <td>5</td>
      <td>Future Workflow</td>
      <td>Validate to-be state; approve</td>
      <td>Drafts future-state table, each row resolving a blocker</td>
      <td>PM says "approved"</td>
    </tr>
    <tr>
      <td>6</td>
      <td>Requirements</td>
      <td>Review all reqs; answer clarifications</td>
      <td>Drafts reqs (one per product per capability); flags uncertainties with <code>[NEEDS CLARIFICATION]</code></td>
      <td>All markers resolved; PM says "approved"</td>
    </tr>
    <tr>
      <td>7</td>
      <td>Submit to Aha</td>
      <td>Monitor confirmations</td>
      <td>Sequential <code>mcp__aha__create_requirement</code> calls; confirms each</td>
      <td>All N requirements confirmed written</td>
    </tr>
    <tr>
      <td>8</td>
      <td>Quality Gate</td>
      <td>Fix must-fix items; re-run until clean</td>
      <td>Runs 5 checks; reports must-fix / should-fix findings</td>
      <td>Review reports "✓ All N requirements passed"</td>
    </tr>
  </tbody>
</table>
```

- [ ] **Step 7: Verify complete doc in browser**

Open the file and scroll through all 12 sections. Confirm:
- No `[Placeholder]` text remains
- Sidebar scrollspy highlights the correct section as you scroll
- All tables render correctly (quality dimensions, 8-stage overview, 5 checks, quick-reference card)
- Human approval callouts (rose left border + 👤) appear in Stages 2–6
- `[NEEDS CLARIFICATION]` marker examples render in monospace code style
- Back-to-top button appears after scrolling > 400px

- [ ] **Step 8: Commit**

```bash
git add "docs/PM Process/pm-requirements-workflow.html"
git commit -m "docs: fill AIRW framework doc sections 7–12 (future workflow, requirements, submit, quality gate, conventions, quick-ref card)"
```

---

## Task 5: Example Doc — `pm-requirements-example.html` (SYM-2566)

**Files:**
- Create: `docs/PM Process/pm-requirements-example.html`

**Build-time dependency:** Fetch SYM-2566 and all child requirements from Aha before writing this file. The content must be real, not placeholder.

- [ ] **Step 1: Fetch SYM-2566 from Aha**

Call `mcp__aha__get_record` with record ID `SYM-2566`. Extract:
- Feature title (use as page title and hero heading)
- Feature description (Background & Market Problem, Current Workflow, Objectives, Future Workflow sections if structured)
- All child requirement reference numbers listed in the response (e.g., `SYM-2566-1`, `SYM-2566-2`, etc.)

Then call `mcp__aha__get_record` for each child requirement individually to get the full requirement text. (The parent feature response lists only names and refs — not the full bodies.)

Record the following for use in Step 2:
- Feature title (for hero)
- Feature description text (for "Feature context" section)
- Total count of child requirements (for Phase 7 confirmation line)
- Each child requirement: ref number, Applies to, Statement, Details, Example

- [ ] **Step 2: Write the example HTML**

Create `docs/PM Process/pm-requirements-example.html`. Use the scaffold below, replacing all `<!-- REAL CONTENT -->` comments with the actual data fetched in Step 1. The complete file structure:

```html
<!DOCTYPE html>
<!--
  AI EDITOR INSTRUCTION (Claude Code, Copilot, any AI assistant):
  This file carries a `Last updated: YYYY-MM-DD` line in its header.
  EVERY time you modify this file:
    1. Run `date "+%Y-%m-%d"` to get the current date.
    2. Update the `Last updated:` value before finishing.
  Do NOT guess the date.
-->
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>End-to-end example: SYM-2566 · Cotality Product Team</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  /* --- CSS VARIABLES: paste the full light + dark :root blocks from the CSS Boilerplate at the
     top of this plan --- */
  /* --- LAYOUT, TYPOGRAPHY, CODE, TABLE, CALLOUT, ROLE, PHASE-BADGE, BACK-TO-TOP, SIDEBAR ---
     Copy the full style block from pm-requirements-workflow.html.
     The example doc shares the identical CSS — no differences. --- */

  /* Phase section divider */
  .phase-section {
    margin: 2.5rem 0 0; padding: 1.5rem 1.7rem; border-radius: var(--radius-lg);
    background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-sm);
    position: relative; overflow: hidden;
  }
  .phase-section::before {
    content: ""; position: absolute; top: 0; left: 0;
    width: 100%; height: 3px; background: var(--hero-grad);
  }
  .phase-section-title {
    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 0.75rem;
    display: flex; align-items: center; gap: 0.5rem;
  }
  .phase-section-title .phase-badge { margin-right: 0; }

  /* Requirement card */
  .req-card {
    margin: 1.5rem 0; border: 1px solid var(--border); border-radius: var(--radius);
    background: var(--surface); box-shadow: var(--shadow-sm); overflow: hidden;
  }
  .req-card-header {
    background: var(--pm-soft); border-bottom: 1px solid color-mix(in srgb, var(--pm) 15%, var(--border));
    padding: 0.65rem 1.1rem; display: flex; align-items: center; gap: 0.6rem;
    font-size: 0.82rem; font-weight: 700; color: var(--pm);
  }
  .req-card-body { padding: 1rem 1.2rem; font-size: 0.93rem; }
  .req-card-body p { margin: 0.4rem 0; }
  .req-card-body strong { color: var(--fg-strong); }

  /* Source callout (Aha feature card) */
  .source-card {
    background: var(--surface); border: 2px solid var(--border); border-radius: var(--radius-lg);
    padding: 1.5rem 1.7rem; margin: 1.5rem 0; box-shadow: var(--shadow-md);
  }
  .source-card-label {
    font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 0.75rem;
    display: flex; align-items: center; gap: 0.4rem;
  }
  .source-card-label::before {
    content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0;
  }
  .source-card h3 { margin-top: 0; font-size: 1.15rem; }
</style>
</head>
<body>
<div class="page">
<div class="layout">

<aside class="sidebar" aria-label="Table of contents">
  <div class="sidebar-title">On this page</div>
  <nav class="sidebar-nav">
    <ol>
      <li><a href="#feature">Feature context</a></li>
      <li><a href="#phase1">Phase 1 — Research &amp; Market Problem</a></li>
      <li><a href="#phase2">Phase 2 — Current Workflow</a></li>
      <li><a href="#phase3">Phase 3 — Objectives</a></li>
      <li><a href="#phase4">Phase 4 — Future Workflow</a></li>
      <li><a href="#phase5">Phase 5 — Requirements</a></li>
      <!-- Add Phase 6 section only if SYM-2566 had [NEEDS CLARIFICATION] markers -->
      <li><a href="#phase7">Phase 7 — Written to Aha</a></li>
      <li><a href="#review">Quality Gate</a></li>
      <li><a href="#final">Final requirements</a></li>
    </ol>
  </nav>
</aside>

<main>

<header class="hero">
  <span class="hero-eyebrow">Cotality Product Team · AIRW End-to-End Example</span>
  <!-- REAL CONTENT: Replace [Feature Title from Aha] with the actual SYM-2566 title -->
  <h1>End-to-end example:<br>SYM-2566</h1>
  <p class="hero-sub">
    <!-- REAL CONTENT: Insert the feature title here -->
    <strong>[Feature Title from Aha]</strong> — a complete run of
    <code>/pm-req-new</code> and <code>/pm-req-review</code> on a real Aha feature.
    <span class="role role-pm">PM</span>
  </p>
  <div class="hero-meta">
    <!-- REAL CONTENT: Replace N with the actual count of child requirements -->
    <span class="chip"><strong>SYM-2566</strong> · [Feature Title]</span>
    <span class="chip"><strong>N</strong> requirements</span>
    <span class="last-updated">Last updated: 2026-05-27</span>
  </div>
</header>

<!-- Mobile TOC -->
<nav class="toc" aria-label="Page contents">
  <strong>On this page</strong>
  <ol>
    <li><a href="#feature">Feature context</a></li>
    <li><a href="#phase1">Phase 1 — Research &amp; Market Problem</a></li>
    <li><a href="#phase2">Phase 2 — Current Workflow</a></li>
    <li><a href="#phase3">Phase 3 — Objectives</a></li>
    <li><a href="#phase4">Phase 4 — Future Workflow</a></li>
    <li><a href="#phase5">Phase 5 — Requirements</a></li>
    <li><a href="#phase7">Phase 7 — Written to Aha</a></li>
    <li><a href="#review">Quality Gate</a></li>
    <li><a href="#final">Final requirements</a></li>
  </ol>
</nav>

<!-- ===== FEATURE CONTEXT ===== -->
<h2 id="feature">Feature context</h2>
<p>The Aha feature as received — the starting point for <code>/pm-req-new</code>.</p>
<div class="source-card">
  <div class="source-card-label">Aha feature · SYM-2566</div>
  <!-- REAL CONTENT: Feature title as h3 -->
  <h3>[Feature Title]</h3>
  <!-- REAL CONTENT: Feature description from Aha, rendered as paragraphs.
       If the description has sub-headings, preserve them as <h4> elements.
       If it includes promoted idea content or customer quotes, include them here. -->
  <p>[Feature description from mcp__aha__get_record]</p>
</div>

<!-- ===== PHASE 1 ===== -->
<h2 id="phase1">Phase 1 — Research &amp; Market Problem</h2>
<div class="phase-section">
  <div class="phase-section-title"><span class="phase-badge">Phase 1a</span>Repository search findings</div>
  <!-- REAL CONTENT: List the top 2–3 related features or documents Claude found.
       If none were found, write: "No overlapping features found in the repository." -->
  <ul>
    <li><strong>[Related feature ref]</strong> — [brief description of why it's related]</li>
    <li><strong>[Related feature ref]</strong> — [brief description]</li>
  </ul>
</div>
<div class="phase-section" style="margin-top: 1rem;">
  <div class="phase-section-title"><span class="phase-badge">Phase 1b/1c</span>Market Problem draft</div>
  <!-- REAL CONTENT: The Background & Market Problem prose as drafted in Phase 1c.
       Use <p> tags for each paragraph. -->
  <p>[Market Problem prose from the /pm-req-new session]</p>
</div>

<!-- ===== PHASE 2 ===== -->
<h2 id="phase2">Phase 2 — Current Workflow</h2>
<div class="phase-section">
  <div class="phase-section-title"><span class="phase-badge">Phase 2</span>Current Workflow table</div>
  <!-- REAL CONTENT: The actual pain-point table from the session -->
  <table>
    <thead><tr><th>Step</th><th>User Action</th><th>Blocker</th><th>Impact</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>[action]</td><td>[blocker]</td><td>[impact]</td></tr>
    </tbody>
  </table>
</div>

<!-- ===== PHASE 3 ===== -->
<h2 id="phase3">Phase 3 — Objectives</h2>
<div class="phase-section">
  <div class="phase-section-title"><span class="phase-badge">Phase 3</span>Objectives</div>
  <!-- REAL CONTENT: The actual objectives bullet list from the session -->
  <ul>
    <li>[Objective 1]</li>
  </ul>
</div>

<!-- ===== PHASE 4 ===== -->
<h2 id="phase4">Phase 4 — Future Workflow</h2>
<div class="phase-section">
  <div class="phase-section-title"><span class="phase-badge">Phase 4</span>Future Workflow table</div>
  <!-- REAL CONTENT: The actual future-state table from the session -->
  <table>
    <thead><tr><th>Step</th><th>User Action</th><th>New Feature / Capability</th><th>System Response</th></tr></thead>
    <tbody>
      <tr><td>1</td><td>[action]</td><td>[capability]</td><td>[system response]</td></tr>
    </tbody>
  </table>
</div>

<!-- ===== PHASE 5 ===== -->
<h2 id="phase5">Phase 5 — Requirements (as drafted)</h2>
<p>All requirements as presented by <code>/pm-req-new</code> before writing to Aha.
<!-- Only add this sentence if SYM-2566 had [NEEDS CLARIFICATION] markers: -->
<!-- Markers that required clarification are highlighted below. -->
</p>
<!-- REAL CONTENT: One .req-card per requirement.
     If a requirement had [NEEDS CLARIFICATION] markers, highlight them with:
     <mark style="background: #fef3c7; padding: 0.1em 0.3em; border-radius: 3px;">[NEEDS CLARIFICATION: ...]</mark>
-->
<div class="req-card">
  <div class="req-card-header">SYM-2566-1 · [Product name]</div>
  <div class="req-card-body">
    <p><strong>Applies to:</strong> [Product]</p>
    <p><strong>Statement:</strong> As a [role], I want to [action] so that [benefit].</p>
    <p><strong>Details:</strong></p>
    <ol>
      <li>[Detail 1]</li>
      <li>[Detail 2]</li>
    </ol>
    <p><strong>Example:</strong> [Example scenario]</p>
  </div>
</div>

<!-- ===== PHASE 6 (only if SYM-2566 had clarifications) ===== -->
<!-- If SYM-2566 had no [NEEDS CLARIFICATION] markers, delete this entire section. -->
<!--
<h2 id="phase6">Phase 6 — Clarification Q&amp;A</h2>
<p>For each resolved marker, show the question, PM answer, and the updated requirement.</p>
-->

<!-- ===== PHASE 7 ===== -->
<h2 id="phase7">Phase 7 — Written to Aha</h2>
<!-- REAL CONTENT: Replace N with the actual count -->
<div class="warn" style="border-left-color: #10b981; background: #ecfdf5; border-color: rgba(16,185,129,0.2);">
  <strong style="color: #065f46;">✓ N requirements written to SYM-2566.</strong>
  Each was written sequentially using <code>mcp__aha__create_requirement</code>. All confirmed successful.
</div>

<!-- ===== QUALITY GATE ===== -->
<h2 id="review">Quality Gate — <code>/pm-req-review</code></h2>
<p>Run after all requirements were written to Aha.</p>
<!-- REAL CONTENT: Show the actual /pm-req-review output.
     If the first run had must-fix findings and a re-run was needed, show both passes.
     If the first run was clean, show just the clean result. -->
<div class="phase-section">
  <div class="phase-section-title">Review pass 1</div>
  <p>[Actual /pm-req-review output — either clean result or list of findings]</p>
</div>

<!-- ===== FINAL REQUIREMENTS ===== -->
<h2 id="final">Final requirements</h2>
<p>The approved requirements as they appear in Aha — the canonical dev-team handoff artifact.</p>
<!-- REAL CONTENT: One .req-card per requirement showing the FINAL, post-review version.
     These should match what is in Aha after all revisions. -->
<div class="req-card">
  <div class="req-card-header">SYM-2566-1 · [Product name]</div>
  <div class="req-card-body">
    <p><strong>Applies to:</strong> [Product]</p>
    <p><strong>Statement:</strong> As a [role], I want to [action] so that [benefit].</p>
    <p><strong>Details:</strong></p>
    <ol>
      <li>[Detail 1]</li>
    </ol>
    <p><strong>Example:</strong> [Example scenario]</p>
  </div>
</div>

<hr>
<p class="page-footer">
  <strong>Companion docs:</strong>
  <a href="pm-requirements-workflow.html">Framework reference</a> &middot;
  <a href="pm-requirements-flowchart.html">Workflow flowcharts</a> &middot;
  <a href="../Dev team Process/spec-driven-development.html">Dev team: spec-driven development</a>
</p>

</main>
</div>
</div>

<button class="back-to-top" id="backToTop" aria-label="Back to top" title="Back to top">↑</button>

<script>
  /* Paste the same scrollspy + back-to-top JS from the CSS Boilerplate section of this plan */
  (function () {
    const links = document.querySelectorAll('.sidebar-nav a');
    const map = new Map();
    links.forEach(a => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) map.set(target, a);
    });
    let activeLink = null;
    const setActive = (el) => {
      if (!el || el === activeLink) return;
      if (activeLink) activeLink.classList.remove('active');
      el.classList.add('active');
      activeLink = el;
    };
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length > 0) { const link = map.get(visible[0].target); setActive(link); }
    }, { rootMargin: '-80px 0px -65% 0px', threshold: 0 });
    map.forEach((_, target) => observer.observe(target));
    const btt = document.getElementById('backToTop');
    const onScroll = () => {
      if (window.scrollY > 400) btt.classList.add('visible');
      else btt.classList.remove('visible');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  })();
</script>
</body>
</html>
```

> **Note on Phase 1–4 content:** These phases are conversational outputs from the `/pm-req-new` session — they are not stored in Aha. Obtain this content from one of these sources (in order of preference):
> 1. The actual session transcript where SYM-2566 was processed with `/pm-req-new` (check session history)
> 2. The feature description in Aha — if it already contains structured headings (Background & Market Problem, Current Workflow, Objectives, Future Workflow), extract them directly
> 3. If neither is available, note in the example doc: *"Phase 1–4 intermediate outputs were not archived for this session. See the Final requirements below."*

- [ ] **Step 3: Verify the example doc in browser**

Open `docs/PM Process/pm-requirements-example.html`. Confirm:
- Hero title shows "End-to-end example: SYM-2566" with real feature title in subtitle
- No `<!-- REAL CONTENT -->` comments remain (they should be replaced with actual data)
- No placeholder `[Feature Title]` or `[action]` text remains
- Requirement cards (`req-card`) render with indigo header stripe
- Phase section cards render with gradient top bar
- Sidebar scrollspy works
- All footer links point to correct files

- [ ] **Step 4: Commit**

```bash
git add "docs/PM Process/pm-requirements-example.html"
git commit -m "docs: add AIRW end-to-end example doc (SYM-2566) with full phase outputs and final requirements"
```

---

## Self-Review Checklist

### 1. Spec coverage

| Spec requirement | Task that covers it |
|-----------------|-------------------|
| 3 HTML files in `docs/PM Process/` | Tasks 1, 2–4, 5 |
| Flowchart: command flow diagram | Task 1 |
| Flowchart: requirement lifecycle diagram | Task 1 |
| Flowchart: legend chips (4 colors) | Task 1 |
| Framework: 12-section sidebar TOC | Task 2 |
| Framework: hero with PM role badge + chip stats | Task 2 |
| Framework: Section 1 — quality table (Level 4/5) | Task 3 |
| Framework: Section 2 — 8-stage summary table | Task 3 |
| Framework: Stages 3–6 with approval gates | Task 3 |
| Framework: Stage 6 — product-split rule, [NEEDS CLARIFICATION], Capture/Estimate Mobile check | Task 4 |
| Framework: Stage 7 — sequential write pattern | Task 4 |
| Framework: Section 10 — 5 quality checks table + re-run cycle | Task 4 |
| Framework: Section 11 — product names, persona sub-types, always-applicable constraints | Task 4 |
| Framework: Section 12 — quick-reference card | Task 4 |
| Example: real SYM-2566 content from Aha | Task 5 |
| Example: phase-by-phase section structure | Task 5 |
| Example: final requirements as req-cards | Task 5 |
| Dark/light mode | Tasks 1, 2, 5 (CSS in each file) |
| Sidebar TOC with scrollspy | Tasks 2, 5 |
| Back-to-top button | Tasks 2, 5 |
| Inter + JetBrains Mono fonts | All tasks |
| AI editor instruction comment block | All tasks |
| Cross-links in footer (all 3 docs + dev team doc) | All tasks |

### 2. Placeholder scan

Before each commit, search the file for these strings — none should remain in the final output:
- `[Placeholder`
- `<!-- REAL CONTENT`
- `[Feature Title`
- `[action]`
- `[role]`
- `[benefit]`
- `[Detail`
- `[blocker]`

### 3. Type consistency

- All section `id` attributes in the framework doc (`output`, `overview`, `stage1`–`stage5`, `stage6`–`stage7`, `quality`, `conventions`, `quickref`) must match the `href` values in both the sidebar `<nav>` and the mobile `.toc`.
- All footer `<a href>` paths use relative paths (`pm-requirements-workflow.html`, not absolute).
- The flowchart footer links to `pm-requirements-example.html` (not `pm-requirements-examples.html`).
