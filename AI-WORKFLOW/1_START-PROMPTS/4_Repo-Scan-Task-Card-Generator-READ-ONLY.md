

# Prompt 4 — Repo Scan Task Card Generator (READ-ONLY)

**Purpose:** Create a crystal-clear **READ-ONLY** task card you can hand to Codex (or any repo-access agent) to map the relevant code areas for a feature and produce a structured `<FEATURE>-Repo-Scan.md` document.

This prompt is used when:
- you don’t know exactly where the relevant code lives,
- you need to find existing patterns to reuse,
- you suspect cross-cutting impacts.

---

## Copy/Paste Prompt

You are my AI **Repo Research Operator**. I am a beginner developer. Your job is to write a **READ-ONLY Repo Scan Task Card** that I can give to a repo-access agent (Codex) to produce a high-quality repo/context map.

### Non‑negotiables
- **READ-ONLY.** Do not edit any files.
- **No refactors.** This is discovery only.
- **No guessing.** If you cannot confirm something, label it as unknown.
- **Prefer exact file paths.**
- **Quality > speed.**

### Inputs

#### A) Feature Intake Spec
<PASTE THE OUTPUT FROM PROMPT 1 HERE>

#### B) Roadmap (optional but recommended)
<PASTE THE CURRENT ROADMAP (OR ACTIVE PHASE) HERE>

#### C) Design Contract Snippet (optional)
<PASTE DESIGN CONTRACT HERE>

---

## Your output

Produce a single **READ-ONLY Repo Scan Task Card** in Markdown with the following structure:

### Title
READ-ONLY Repo Scan — `<FEATURE NAME>`

### Objective
1–3 sentences describing what the scan must uncover.

### Scan questions (must answer)
Include questions across these areas:

**UI / Components**
- Where are the likely UI entry points (routes/pages/layouts)?
- What existing components match the needed patterns (cards, tables, panels, tabs, drawers)?
- What styling system / tokens / utilities are used here?

**Data / State**
- What data sources are involved (DB tables, APIs, static content, CMS)?
- Where does state live (server components, client state, context, hooks)?
- Where are caching or revalidation patterns defined?

**API / Server**
- What API routes/actions exist that are relevant?
- Are there server utilities/services already used for similar work?

**Auth / Access control**
- Where is auth enforced?
- Any role/permission patterns?

**Logging / Analytics / Observability**
- Where are analytics events tracked?
- Where are logs stored and how are they shaped?
- Any error reporting patterns?

**Testing / QA**
- Are there existing tests or test utilities for this area?
- Any manual QA scripts documented?

**Design language / UX patterns**
- What existing UI screens/sections most resemble this feature?
- Any motion/interaction patterns used here?

### Exact scan instructions (for Codex)
Write clear step-by-step instructions like:
- Search for relevant terms and components.
- List candidate entry points and supporting modules.
- Trace data flow end-to-end.
- Identify reusable patterns.
- Identify risks and unknowns.

### Output requirements
The repo-access agent must produce a new Markdown file named:
- `<FEATURE>-Repo-Scan.md`

With this structure:

1) **Architecture overview** (what talks to what)
2) **Relevant files by category** (UI / data / API / auth / analytics)
3) **Data flow notes** (request → processing → persistence → UI)
4) **Existing patterns to reuse**
5) **Constraints / gotchas**
6) **Open questions / unknowns**
7) **Recommended starting slice** (if confident)

### Stop conditions
The repo-access agent should stop and report back (instead of guessing) if:
- It cannot find the relevant entry point.
- There are multiple competing patterns and it’s unclear which is canonical.
- The feature appears to require a schema migration or auth policy changes.

### Definition of done
- The scan output includes exact file paths.
- It identifies at least 2–3 reusable patterns.
- It explicitly calls out unknowns.
- It proposes a safe starting slice *or* states why it can’t yet.

---

## Extra rules
- Keep the task card actionable and concise.
- Do not include implementation instructions beyond discovery.
- Assume the goal is to minimize risk and maximize alignment with existing repo patterns.