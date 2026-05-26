# Product Team Claude — PM Requirements Automation

This project gives your team Claude Code skills to write structured Aha child requirements in 15–30 minutes per feature.

---

## What you get

- **/pm-req-new** — Claude fetches your Aha feature, reads relevant design docs, drafts child requirements split by product, asks clarifying questions, and writes the approved requirements to Aha.
- **/pm-req-review** — Claude checks your requirements for missing products, contradictions, thin details, and unresolved questions before you hand off to the dev team.

---

## One-time setup (do this once)

### 1. Get your personal Aha API key

In Aha: click your avatar → **Settings** → **Security** → **API keys** → **Create token**.

Copy the token — you'll need it in step 2.

### 2. Set your Aha API key as a Windows environment variable

This keeps your key secure — it's never stored in the project files.

1. Press **Win + R**, type `sysdm.cpl`, press Enter
2. Click **Advanced** → **Environment Variables**
3. Under **User variables** (top section), click **New**
4. Variable name: `AHA_API_KEY`
5. Variable value: paste your Aha API key
6. Click OK on all dialogs

**Then restart Claude Code** — it reads environment variables at launch time.

### 3. Install Node.js (if not already installed)

Claude Code uses Node.js to run the Aha connection. Check if you have it:

1. Open PowerShell (search "PowerShell" in the Start menu)
2. Type `node --version` and press Enter

If you see a version number (e.g., `v22.16.0`), you're good. If you see an error, download Node.js from [nodejs.org](https://nodejs.org) — install the LTS version.

### 4. Clone this repo and open in Claude Code

Ask IT or your team lead for the repo URL, then:

1. In Claude Code desktop: **File** → **Open Folder**
2. Select the cloned `product-team-claude/` folder
3. Start a new conversation

### 5. Verify the Aha connection

In Claude Code, start a new conversation and type:

```
/mcp
```

You should see `aha` listed as **connected** with 4 tools. If it shows as disconnected:
- Check that `AHA_API_KEY` is set (step 2) and you restarted Claude Code
- Check that Node.js is installed and in your PATH (step 3)

---

## Using the skills

### Write requirements for a new feature

```
/pm-req-new SYM-12345
```

Replace `SYM-12345` with your actual feature reference from Aha.

Claude will:
1. Fetch the feature from Aha
2. Read any relevant design docs in the `docs/` folder
3. Draft requirements split by affected product
4. Ask you questions for anything unclear — one at a time
5. Show you the full draft and ask you to approve
6. Write the approved requirements directly to Aha

**Typical time:** 15–30 minutes per feature.

### Review requirements before dev team handoff

```
/pm-req-review SYM-12345
```

Claude checks:
- All affected products have requirements
- No contradictions between requirements
- Each requirement has enough detail for developers
- No unresolved `[NEEDS CLARIFICATION]` markers
- All requirements follow the correct format

A clean pass means the feature is ready for the dev team to pick up.

---

## Adding design documents

Design docs help Claude write more accurate requirements. To add a document:

1. Go to this repo in GitHub (or Azure DevOps)
2. Navigate to `docs/design-docs/`
3. Click **Add file** → **Upload files**
4. Upload your PDF, Word, or HTML document
5. Commit the change

Claude will find and read relevant documents automatically the next time you run `/pm-req-new`.

---

## Getting help

Ask Claude Code directly — it knows this project:
- "How does /pm-req-new work?"
- "Why did the review flag this requirement?"
- "What products should I check for a field workflow feature?"
