# Admin Guide — Word to Markdown Migration Guide

This guide walks a Tech Writer through converting each section of the Word Admin Guide into a Markdown file in the `sections/` folder, so that it can be built into the styled HTML output with `npm run build`.

---

## Prerequisites

### Install pandoc (one-time setup)

pandoc converts Word documents to Markdown automatically, including extracting embedded images.

```bash
winget install JohnMacFarlane.Pandoc
```

After installation, close and reopen your terminal, then verify:

```bash
pandoc --version
```

Expected output starts with: `pandoc 3.x.x`

---

## Section mapping

Each Word heading maps to one Markdown file. Use this table to know which file to update for each section.

| Word heading | Target file |
|---|---|
| Revision History | `sections/01-revision-history.md` |
| Introduction + Terminology | `sections/02-introduction.md` |
| Super Admin Functionality | `sections/03-super-admin.md` |
| Local Admin Functionality (intro, My Company, Accounts) | `sections/04-local-admin-overview.md` |
| Company Information | `sections/05-company-information.md` |
| Company Preferences | `sections/06-company-preferences.md` |
| Organization Hierarchy | `sections/07-organization-hierarchy.md` |
| Claim Defaults | `sections/08-claim-defaults.md` |
| Assignments | `sections/09-assignments.md` |
| Users (Hierarchy through User Regions) | `sections/10-users.md` |
| Vendors | `sections/11-vendors.md` |
| Policy Coverage Types | `sections/12-policy-coverage-types.md` |
| Questions and Answers (Q&A) | `sections/13-questionnaires-qa.md` |
| Tasks | `sections/14-tasks.md` |
| Claim Automation | `sections/15-claim-automation.md` |
| Guest User Accounts + Guest Companies | `sections/16-guest-users.md` |
| Service Territories + Branches | `sections/17-service-territories-branches.md` |
| Letterheads + Print Profiles | `sections/18-letterheads-print-profiles.md` |
| Writing/Client Companies | `sections/19-writing-client-companies.md` |

---

## Step-by-step conversion for each section

### Step 1 — Extract the section from Word

1. Open the Word source file
2. Select all content from the section heading to (but not including) the next top-level heading
3. Copy and paste into a new blank Word document
4. Save as `section-temp.docx` somewhere on your desktop

### Step 2 — Convert to Markdown with pandoc

Run this command (replace `XX-section-name` with the target filename from the table above):

```bash
pandoc "section-temp.docx" -t markdown --wrap=none --extract-media=docs/user-guide/admin-guide/assets -o docs/user-guide/admin-guide/sections/XX-section-name.md
```

The `--extract-media` flag saves all embedded images into the `assets/` folder and inserts the correct image references in the Markdown automatically.

### Step 3 — Clean up the Markdown output

pandoc output needs light cleanup before it is ready:

1. **Remove pandoc artifacts** — Delete any lines starting with `:::` (these are pandoc div blocks that do not render correctly)
2. **Fix the heading level** — The section heading should be `##` (two hashes), not `#`. Change the first heading if needed
3. **Keep the file header** — Each file starts with a metadata block like this — do not delete it:
   ```
   > **Admin menu path:** Admin → Company Preferences
   > **Affects:** all users in your company
   > **Last updated:** 8.6
   ```
   Update the `Last updated` version number to match the current release
4. **Rename images** — pandoc saves images as `media/image1.png`, `media/image2.png`, etc. Rename them to something descriptive, for example: `assets/company-preferences-general.png`. Update the image reference in the Markdown to match:
   ```markdown
   ![Company Preferences — General tab](../assets/company-preferences-general.png)
   ```
5. **Remove tracked changes** — If the Word document has tracked changes or comments, make sure they do not appear in the Markdown output

### Step 4 — Build and verify

Run the build from the `docs/user-guide/admin-guide/` folder:

```bash
cd docs/user-guide/admin-guide
npm run build
```

Open `docs/user-guide/admin-guide/dist/admin-guide.html` in a browser. Check:
- The section renders correctly with proper heading hierarchy
- All images display (if any)
- The sidebar TOC includes a link to your new section

### Step 5 — Commit the changes

```bash
git add docs/user-guide/admin-guide/sections/XX-section-name.md
git add docs/user-guide/admin-guide/assets/
git commit -m "docs: migrate [section name] to Markdown (Admin Guide v8.6)"
```

Repeat Steps 1–5 for each section in the mapping table.

---

## Tips

- **Do sections in order** — start with `02-introduction.md` and work forward. It is easier to catch formatting issues early when the document is short.
- **One section per commit** — keeps the review history clean and makes it easy to roll back a single section if something looks wrong.
- **Screenshots change with every release** — when a new feature ships and you update a section, check whether any screenshots in that section need to be recaptured. The `/update-guide` command will flag these for you.
- **The index file (`00-index.md`) does not need conversion** — it was pre-built and links to all sections. Only update it if sections are added or removed.

---

## Publishing a PDF

Once all sections are migrated and the HTML looks correct:

1. Open `docs/user-guide/admin-guide/dist/admin-guide.html` in Google Chrome or Microsoft Edge
2. Press `Ctrl+P`
3. Set Destination to **Save as PDF**
4. Paper size: **Letter**
5. Margins: **Default**
6. Check **Background graphics**
7. Save as `Claims Workspace Administrator Guide v8.6.pdf`

The print stylesheet hides the sidebar and formats the document for letter-size pages automatically.

### Optional: automated PDF via Chrome headless

If you want to generate the PDF without opening a browser manually:

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --headless --print-to-pdf="dist/admin-guide.pdf" --no-pdf-header-footer "dist/admin-guide.html"
```

Adjust the Chrome path if your installation is in a different location.
