# /update-guide — Draft Admin Guide Updates for a Release

Draft proposed changes to the Admin Guide Markdown sections based on the requirements in an Aha release. Produces a structured review document for the PM and Tech Writer. Does NOT modify any files until explicitly approved.

## Usage

```
/update-guide [aha-release-reference]
```

Example: `/update-guide SYM-R-456`

If no release reference is provided, ask: "Which Aha release would you like to process? Please provide the release reference."

---

## Step 1 — Fetch the release requirements

Use `mcp__aha__get_record` with the release reference as the argument to fetch the release record and its child requirements.

If the Aha MCP is unavailable or returns an error, ask the PM to paste the list of requirements from the release directly into the chat (requirement reference, product, and details for each). Proceed from that input.

For each requirement, record:
- Requirement reference (e.g. SYM-2557-1)
- Product it applies to (must match: Claims Workspace, Claims Estimate, Estimate Mobile, Link, Capture, Workspace Questionnaires, Engage Video)
- Feature area and admin-configurable behaviour described in the Details

**Only Claims Workspace requirements can affect the Admin Guide.** For requirements applying to other products, note them as "No admin guide impact — [product] only" and do not analyse further.

---

## Step 2 — Map each requirement to guide sections

Read the Admin menu path headers in `docs/user-guide/admin-guide/sections/` to understand which section covers which area.

For each Claims Workspace requirement, identify:

**Section file affected:** The `sections/XX-filename.md` file whose Admin menu path matches the feature area. Most requirements touch exactly one section. If genuinely unclear, list two candidates and flag for PM decision.

**Change type:**
- `New content` — a new setting, toggle, or behaviour not currently documented
- `Update` — existing content needs revision (e.g. a setting was renamed or its behaviour changed)
- `No admin impact` — the requirement changes adjuster-facing UI only, with no admin configuration involved (explain why)

**Screenshots:** List any screenshots in the affected section that are likely to need recapturing based on the UI change described.

---

## Step 3 — Draft the proposed Markdown changes

For each affected section, write the exact Markdown to add or replace. Be specific — write the actual paragraph text, bullet points, and table rows. Do not write descriptions of what to write.

Follow the style of the existing section content:
- Match heading levels (## for section headings, ### for sub-sections, #### for settings)
- Use bullet points for option lists
- Use `**bold**` for UI labels and field names
- Use `> **Note:**` callout blocks for important caveats
- For new screenshots: write the alt text and caption, then add a flag on the next line:
  ```
  ⚠️ Screenshot needed: [describe what the screen should show, e.g. "Company Preferences → Features tab with the new ClaimSearch toggle visible"]
  ```

---

## Step 4 — Output the review document

Present the review document in this format:

---

## Admin Guide Update Review — [Release Reference]

**Release:** [release name from Aha]
**Date drafted:** [today's date]
**PM reviewer:** _(sign off when approved)_
**Tech Writer reviewer:** _(sign off when approved)_

---

### [SYM-XXXX-1] — [Requirement name]

**Product:** Claims Workspace
**Section affected:** `sections/06-company-preferences.md`
**Change type:** New content

**Proposed Markdown:**

```markdown
[exact markdown to add or modify]
```

**Screenshots to recapture:** [list filenames, or "None"]

---

_(repeat for each requirement)_

---

### Requirements with no admin guide impact

| Requirement | Product | Reason |
|---|---|---|
| SYM-XXXX-2 | Claims Estimate | Estimating UI only — no admin configuration |

---

### Summary

| | Count |
|---|---|
| Requirements reviewed | X |
| Require admin guide updates | X |
| Require new screenshots | X |
| No admin guide impact | X |

---

## Step 5 — Await approval

After presenting the review document, say:

> "Please review the proposed changes above. When you and the Tech Writer are ready, say **'approved'** to apply them, or let me know which items need revision."

**Do NOT modify any .md files until the PM says "approved".**

When approved:
1. Apply each proposed Markdown change to the relevant section file
2. Run the build: `cd docs/user-guide/admin-guide && npm run build`
3. Confirm the build succeeds and report the output file size
4. Commit:
   ```bash
   git add docs/user-guide/admin-guide/sections/
   git add docs/user-guide/admin-guide/assets/
   git commit -m "docs(admin-guide): update for release [reference] — [brief summary]"
   ```
5. Confirm: "✓ Admin Guide updated for [release reference]. Run `npm run build` in `docs/user-guide/admin-guide/` to regenerate the HTML, then print to PDF for distribution."
