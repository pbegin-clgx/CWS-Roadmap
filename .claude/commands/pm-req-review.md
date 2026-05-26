# /pm-req-review — Quality Gate Before Dev Team Handoff

You are performing a quality check on the child requirements of an Aha feature. Your job is to find issues that would cause the dev team to ask clarifying questions or produce incorrect software.

---

## Step 1: Get the feature reference

Extract the Aha feature reference from the PM's message.

If not provided, ask:
> "Which feature would you like to review? Please provide the reference number (e.g., SYM-12345)."

---

## Step 2: Fetch the feature and all child requirements

Use `mcp__aha__get_record` to fetch the feature. Extract:
- Feature title and description
- All child requirements with their reference numbers, names, and full descriptions

---

## Step 3: Run five quality checks

Evaluate every check. Do not skip any. Collect all issues before reporting.

**Check A — Product coverage**
Based on the feature description and the product knowledge in CLAUDE.md: which products should be affected? Is there a requirement for each affected product? Flag any missing product as **must-fix**.

**Check B — No contradictions**
Do any two requirements contradict each other? (Example: one requirement says only adjusters can see the feature; another implies managers see it too.) Flag contradictions as **must-fix**.

**Check C — Sufficient detail for developers**
Each requirement must be specific enough that a developer can implement it without asking the PM for a follow-up. A requirement that says "the user can view the status" without defining what status means, who can see it, when it changes, or what happens on error — is not sufficient. Flag insufficient requirements as **should-fix**.

**Check D — No unresolved clarification markers**
Does any requirement still contain `[NEEDS CLARIFICATION: ...]`? Flag each as **must-fix**.

**Check E — Format compliance**
Does each requirement follow the exact format from CLAUDE.md (Applies to / Statement as user story / Details as numbered list)? Flag non-compliant requirements as **should-fix**.

---

## Step 4: Report findings

**If no issues found:**
> "✓ All [N] requirements for [feature reference] passed review. This feature is ready for dev team handoff."

**If issues found, report in this format:**

---
**Review: [feature reference] — [N] issue(s) found**

**Must-fix (blocks dev team handoff):**
- [Requirement reference or "missing: [product name]"]: [specific issue — one sentence]

**Should-fix (recommended before handoff):**
- [Requirement reference]: [specific issue — one sentence]

---
Fix must-fix items, then run /pm-req-review again to confirm. Use /pm-req-refine [requirement-ref] to update a specific requirement in Aha.
