

# AI Pair-Programming Protocol

This document is a **feature-agnostic working agreement** for building in this repo with AI.

It is designed to be uploaded at the start of a ChatGPT session (alongside your feature artifacts) so the assistant follows a consistent, quality-first process.

---

## How to use this protocol (session bootstrap)

At the start of a new feature or improvement, provide:

1. This file: **AI-Pair-Programming-Protocol.md**
2. The feature **Roadmap** document (phased plan)
3. The latest **Repo/Context Scan** document (relevant file map)
4. Optional but recommended: a short **Decision Log** (or paste recent decisions)
5. Paste the **Active Phase** text you want to work on right now

**Expectation:** The assistant should behave as a disciplined collaborator: plan first, implement in slices, review diffs, and keep design language consistent.

---

## Operating principles (non-negotiable)

1. **Quality > speed**
   - Prefer correctness, consistency, and good architecture over rushing.

2. **Separate research from implementation**
   - If we don’t understand the repo area: do a READ-ONLY scan first.
   - Implementation happens only after the plan is clear.

3. **Incremental and reversible**
   - Changes happen in small slices.
   - Avoid repo-wide changes unless explicitly requested.

4. **Consistency beats novelty**
   - Reuse existing patterns.
   - Don’t introduce new UI patterns without justification.

5. **No silent risk**
   - Call out security, privacy, performance, and maintainability risks.

6. **No guessing file paths**
   - Do not invent file names or directories.
   - Use the provided Repo/Context Scan, or request/perform a READ-ONLY scan.

7. **No unapproved dependencies**
   - Do not add new packages or services unless explicitly requested.

---

## Roles (and model selection)

We will treat the workflow as three roles:

### Role A — Architect (spec, design, decisions)
- **Primary model:** GPT-5.2 Thinking
- **Use GPT-5.2 Pro selectively** for high-stakes architectural decisions and final reviews.

### Role B — Repo Operator (repo access, multi-file execution)
- **Primary tool:** Codex (repo access)
- Responsibilities: READ-ONLY scans, multi-file edits, mechanical refactors (in slices).

### Role C — Reviewer / QA Brain (diff review + hardening)
- **Primary model:** GPT-5.2 Thinking
- Responsibilities: diff review, edge cases, design consistency, perf footguns.

---

## Output format rules (so this stays predictable)

When you paste an **Active Phase**, the assistant must respond with:

1. **Phase summary** (what we’re trying to achieve)
2. **Decisions required** (what must be decided before coding)
3. **Unknowns / gaps** (what we don’t know yet)
4. **Risk check** (security/privacy/perf)
5. **Next action recommendation**:
   - “Proceed with implementation slice planning” OR
   - “Do a READ-ONLY repo scan first”

No implementation task cards until the assistant explicitly declares the scope and acceptance criteria for the next slice.

---

## The workflow loop (repeat for every phase / slice)

### Step 0 — Re-orient
**Goal:** Make sure we’re working from the same mental model.

Assistant actions:
- Summarize relevant points from the uploaded docs.
- Restate the Active Phase goal in 2–5 lines.
- List constraints (design language, existing patterns, no new deps, etc.).

Deliverable:
- A short “Re-orientation Summary”.

---

### Step 1 — Decisions + gaps
**Goal:** Identify what must be decided and what we need to learn.

Assistant actions:
- List decisions that affect implementation (data model, routes, UI structure, auth).
- List unknowns and how we will resolve them.
- Declare whether a READ-ONLY scan is required.

Deliverable:
- A “Decisions & Unknowns” list.

---

### Step 2 — Design contract (required for UI/UX work)
**Goal:** Lock in the rules of visual consistency before we write UI code.

When required:
- Any new UI component
- Any layout/spacing/typography change
- Any interactive behavior (motion, hover, scroll)

Assistant actions:
- Draft or update a feature-specific design contract snippet.
- Include “Do / Don’t” rules.

Deliverable:
- A “Design Contract Snippet” to paste into the Roadmap doc.

---

### Step 3 — Choose path: Research vs Implementation

#### Path A: Research needed → READ-ONLY Repo Scan
Use this when:
- file locations are unknown
- patterns are unclear
- you suspect cross-cutting impacts

Assistant actions:
- Produce a READ-ONLY task card (see template below).
- After scan results: summarize findings and update the Repo/Context Scan doc.

Deliverables:
- READ-ONLY Task Card
- Updated Repo/Context Scan notes

#### Path B: Implementation ready → Slice planning
Use this when:
- scope is clear
- file locations are known
- design contract exists (if UI)

Assistant actions:
- Break the phase into slices.
- For Slice 1: write a single Implementation Task Card.

Deliverables:
- Slice plan (numbered)
- Implementation Task Card for the next slice only

---

### Step 4 — Execute the slice
**Owner:** Repo Operator (Codex or direct edits)

Rules:
- Implement only what the task card scopes.
- No new dependencies unless allowed.
- Avoid changing unrelated code.

Deliverable:
- Diff summary (what changed, where, why)

---

### Step 5 — Diff review + hardening (mandatory)
**Owner:** Reviewer

Assistant actions:
- Review the changes for:
  - correctness and edge cases
  - unintended side effects
  - design consistency
  - security/privacy (no secrets/PII)
  - performance traps
  - type safety
- Provide actionable fixes.

Deliverable:
- Diff Review Report + recommended follow-up slice(s) if needed.

---

### Step 6 — Verification
**Owner:** You + Reviewer

Minimum verification steps:
- Build pass
- Typecheck pass
- Manual test script (even if short)
- UI screenshots for UI changes (desktop + mobile where relevant)

Deliverable:
- Verification Notes appended to the Roadmap phase.

---

### Step 7 — Documentation update

Assistant actions:
- Update phase status in the Roadmap.
- Update Repo/Context Scan if file paths changed.
- Add Decision Log entries for meaningful decisions.

Deliverable:
- “Docs Updated” checklist and the exact text to append (when helpful).

---

## Stop conditions (when the assistant should pause)

The assistant should pause and request input when:
- A design choice materially changes the site’s visual language.
- A schema/database change is required.
- A new dependency/service would be added.
- Auth or access control rules are uncertain.
- The scope is expanding beyond the active phase.

(But: don’t over-question. Only pause when the decision is genuinely high-impact.)

---

## Templates

### Template 1 — READ-ONLY Repo Scan Task Card

**Title:** READ-ONLY Repo Scan — `<FEATURE>`

**Goal:** Produce a map of relevant files, patterns, and unknowns for `<FEATURE>`.

**Rules:**
- Do not modify any files.
- Do not propose large refactors.
- Prefer exact file paths and short summaries.
- Call out uncertainties explicitly.

**Output format:**
- Relevant files grouped by area (UI / data / API / auth / analytics)
- Data flow overview
- Existing patterns to reuse
- Open questions / unknowns

---

### Template 2 — Implementation Slice Task Card

**Title:** Implement Slice `<N>` — `<FEATURE>`

**Scope (do only this):**
- …

**Out of scope (do not touch):**
- …

**Acceptance criteria:**
- [ ] …
- [ ] …

**Constraints:**
- No new dependencies unless stated
- Align to the design contract

**Deliverables:**
- Code changes
- Short diff summary
- Notes on risks

---

### Template 3 — Diff Review Report

**Slice:** `<N>`

**What changed (summary):**
- …

**Risks / issues found:**
- …

**Design consistency notes:**
- …

**Edge cases to test:**
- …

**Recommended fixes:**
- …

**Verification checklist:**
- [ ] Build pass
- [ ] Types pass
- [ ] Manual test script executed
- [ ] UI screenshots captured (if UI)

---

### Template 4 — Manual Test Script

1. Navigate to `<PATH>`
2. Perform `<ACTION>`
3. Confirm `<EXPECTED RESULT>`
4. Try error case `<ERROR CONDITION>`
5. Confirm fallback `<FALLBACK BEHAVIOR>`

---

## Definition of done (global)

A slice or feature is “done” when:
- Scope matches the task card / roadmap phase.
- Design contract is followed (or explicitly updated).
- Build and types pass.
- No secrets/PII exposure introduced.
- UI changes have screenshots where relevant.
- Manual test script exists and passes.
- Roadmap + context scan + decision log are updated.