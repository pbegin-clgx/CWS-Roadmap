# Product Team — CLAUDE.md
**Owner:** Pascal Begin, VP Product — Cotality Workspace Products
**Last updated:** 2026-05-26

This file is always loaded into your context. Use it as the authoritative source for product knowledge, requirement conventions, and domain terminology when generating or reviewing requirements.

---

## Products

### Claims Workspace
[FILL IN: 2–3 sentences — what the product does, who uses it, and what platform it runs on.]

**Platform:** Web (browser)
**Primary users:** [FILL IN — e.g., Adjuster, Manager]

### Claims Estimate
[FILL IN: 2–3 sentences.]

**Platform:** Web (browser)
**Primary users:** [FILL IN]

### Estimate Mobile (iOS)
[FILL IN: 2–3 sentences.]

**Platform:** iOS
**Primary users:** [FILL IN]

### Link
[FILL IN: 2–3 sentences.]

**Platform:** Web (browser)
**Primary users:** [FILL IN]

### Capture
[FILL IN: 2–3 sentences.]

**Platform:** Android
**Primary users:** Field Tech

---

## User Roles

### Adjuster
[FILL IN: What does an adjuster do day-to-day? What is their primary goal? What tools do they use? What frustrates them?]

### Field Tech
[FILL IN: What does a field tech do? Where do they work (in the field, on mobile)? What data do they capture?]

### Manager
[FILL IN: Supervisory role. What do they need to see/do that adjusters don't? What reports or oversight functions?]

### Insured
[FILL IN: The policyholder. What limited interactions do they have with Cotality products? What do they see or submit?]

---

## Requirement Conventions

### Exact format for every child requirement

**Applies to:** [Product name — must match a product name listed in the Products section above]
**Statement:** As a [user role], I want to [specific action] so that [specific benefit].
**Details:**
1. [Concrete system behavior — what the system does, not just what the user sees]
2. [Another specific behavior]
3. [Edge case, error state, or constraint]

### Product-split rule
If a feature affects multiple products, write one separate requirement per product. Do not combine products in a single requirement. A feature that affects Claims Workspace and Capture becomes two separate requirements.

### Products to always consider for field/mobile features
For any feature touching field workflows, mobile data capture, or offline scenarios: always check whether Capture (Android) and Estimate Mobile (iOS) are affected, even if not explicitly mentioned in the feature description.

### [NEEDS CLARIFICATION] marker
Use `[NEEDS CLARIFICATION: your specific question]` inline in the Details section when product behavior for a specific product is uncertain. Ask these questions one at a time. Resolve all markers before finalizing requirements.

---

## Terminology

[FILL IN: 10–15 domain terms. Keep each definition to 1–2 sentences. These are terms Claude must not misuse or confuse.]

- **Claim:** [FILL IN]
- **Feature (Aha):** A unit of product work in Aha Roadmaps. Not the same as a UI feature or code feature.
- **Requirement (Aha):** A child record under an Aha Feature. One requirement = one capability for one product. This tool creates these.
- **[FILL IN term]:** [FILL IN definition]
- **[FILL IN term]:** [FILL IN definition]
- **[FILL IN term]:** [FILL IN definition]

---

## Always-Applicable Constraints

[FILL IN: Rules that apply to every requirement regardless of feature. Examples to consider:]
- [FILL IN — e.g., audit trail: all actions on claim data must log acting user + timestamp]
- [FILL IN — e.g., offline behavior for mobile apps]
- [FILL IN — e.g., accessibility standard]
- [FILL IN — e.g., performance expectation for load times]

---

## Cross-Product Consistency Rules

[FILL IN: Rules about how behaviors must stay in sync across products. Examples to consider:]
- [FILL IN — e.g., status labels used in multiple products must use identical wording]
- [FILL IN — e.g., if a notification is sent in one product, the corresponding record must reflect the same state in all products]

---

## Example Requirements (Quality Reference)

Use these as format and depth benchmarks when generating requirements. Do not copy their content — match their structure and level of detail.

### Example 1
**Applies to:** Claims Workspace
**Statement:** As an adjuster, I want to [FILL IN specific action] so that [FILL IN specific benefit].
**Details:**
1. [FILL IN concrete behavior]
2. [FILL IN concrete behavior]
3. [FILL IN edge case or constraint]

### Example 2
**Applies to:** Capture (Android)
**Statement:** As a field tech, I want to [FILL IN specific action] so that [FILL IN specific benefit].
**Details:**
1. [FILL IN concrete behavior]
2. [FILL IN concrete behavior]

---

## Dev Team Integration

Requirements produced by `/pm-req-new` are consumed by the dev team via `/sym-spec-new`. For the handoff to work without back-and-forth:
- Every requirement must have enough detail that a developer can implement without asking the PM for clarification.
- The `/pm-req-review` quality gate checks this before handoff.
- Aha feature references follow the pattern `[PROJECT]-[NUMBER]` (e.g., `SYM-12345`). Child requirement references append a counter: `SYM-12345-1`, `SYM-12345-2`, etc.
