# /pm-req-new — Generate Child Requirements for an Aha Feature

You are helping a Product Manager write structured child requirements for an Aha feature. Follow these steps exactly and in order. Do not skip steps or combine them.

---

## Step 1: Get the feature reference

Extract the Aha feature reference from the PM's message (e.g., `SYM-12345`).

If no reference is provided, ask:
> "Which Aha feature would you like to write requirements for? Please provide the feature reference (e.g., SYM-12345)."

---

## Step 2: Fetch the feature from Aha

Use `mcp__aha__get_record` with the feature reference.

From the result, note:
- Feature title
- Feature description
- Any promoted idea content or attached customer context

---

## Step 3: Fetch historical requirements for style context

Use `mcp__aha__search_documents` with 2–3 key terms from the feature title and description.

Retrieve results. Use them only as format and style reference — do not reuse their content.

---

## Step 4: Search docs/ for relevant context

Use the Glob tool with pattern `docs/**/*` to list all files in the docs folder.

Read any files whose names suggest relevance to this feature's subject area (design documents, historical spec files). Skip files that are clearly unrelated.

---

## Step 5: Draft child requirements

Write a complete set of child requirements using everything gathered in Steps 2–4 and the product knowledge in CLAUDE.md.

**Rules — read carefully:**
- One requirement per logical capability per affected product
- A single capability that affects 3 products = 3 separate requirements
- Only include products that are actually affected — not all five every time
- For any field or mobile workflow: always check Capture (Android) and Estimate Mobile (iOS), even if not mentioned

**Exact format for each requirement:**
```
**Applies to:** [Product name — must match a product name in CLAUDE.md]
**Statement:** As a [user role], I want to [specific action] so that [specific benefit].
**Details:**
1. [Concrete system behavior]
2. [Another concrete behavior]
3. [Edge case, error state, or constraint]
```

**Flag uncertainty inline:**
Where the correct behavior for a specific product is unclear, write `[NEEDS CLARIFICATION: your specific question]` inside the Details section.

---

## Step 6: Resolve clarifications — one question at a time

For each `[NEEDS CLARIFICATION]` marker:
1. Ask the PM ONE question. Quote the product and the context.
2. Wait for the answer.
3. Update the requirement before asking the next question.

Do not ask multiple questions at once.

---

## Step 7: Present final draft for approval

Show the complete set of requirements, formatted exactly per Step 5.

Number each one (1 of N, 2 of N, etc.) and label the product clearly.

Then ask:
> "Here are [N] requirements for [feature reference]. Type **approve** to write these to Aha, or tell me what to change."

---

## Step 8: Write to Aha on approval

When the PM types "approve":

For each requirement, call `mcp__aha__create_requirement` with:
- `feature_id`: the feature reference (e.g., `SYM-12345`)
- `name`: the product name from the "Applies to" line (e.g., `Claims Workspace`)
- `description`: the full requirement text, starting from `**Applies to:**`

Call these in sequence (one at a time), not in parallel. Confirm each succeeds before calling the next.

After all requirements are written, say:
> "✓ [N] requirements written to [feature reference]. Run /pm-req-review to quality-check before handing off to the dev team."
