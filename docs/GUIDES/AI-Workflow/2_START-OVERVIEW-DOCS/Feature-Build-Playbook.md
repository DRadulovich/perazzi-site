

# Feature Build Playbook

A repeatable, quality-first process for building any new feature in the Perazzi site (or any similar product). This document is designed for a **beginner developer** working with AI tools, where **design consistency and long-term correctness matter more than speed**.

---

## What this playbook is

This is the “start-to-finish operating system” you open **before** you build something new.

It helps you:
- Convert a vague idea into a clear spec.
- Create the right supporting artifacts (roadmap + repo/context map + decision log).
- Execute implementation in small, reversible slices.
- Keep design/visual language consistent.
- Use the right AI model for the right job.

---

## Core principles

1. **Separate thinking from doing**
   - Research and planning first.
   - Implementation only after you can describe the change clearly.

2. **Incremental, reversible changes**
   - Small slices.
   - Each slice can be reverted.
   - No “big bang” refactors unless explicitly approved.

3. **Consistency beats novelty**
   - Prefer existing patterns and the site’s design language.
   - Only introduce new patterns when there is a clear reason.

4. **Quality gates are non-negotiable**
   - Builds pass.
   - Types pass.
   - No new secrets/PII exposure.
   - UI changes have screenshots.

5. **Decisions are documented**
   - A short decision log prevents re-litigating choices.

---

## Roles (and which AI to use)

Think of your AI workflow as three distinct roles. Don’t let one role quietly do the other two.

### Role A — Architect (Decisions + Design)
**Primary model:** GPT-5.2 Pro (selectively) or GPT-5.2 Thinking
- Use when the decision is expensive to reverse.
- Output: spec, tradeoffs, design contract draft, acceptance criteria.

### Role B — Repo Operator (Execution)
**Primary tool:** Codex (repo access)
- Use for read-only scans and multi-file implementation.
- Output: code changes in small slices + notes.

### Role C — Reviewer / QA Brain (Hardening + Consistency)
**Primary model:** GPT-5.2 Thinking
- Use for diff review, edge cases, and design consistency checks.
- Output: issues found + recommended fixes + verification checklist.

---

## The three “foundation artifacts” (create these for every new feature)

### 1) Roadmap document
A phased plan that breaks the feature into incremental, testable steps.

**Minimum contents:**
- Goal + non-goals
- Phases with tasks
- Acceptance criteria per phase
- Risk notes (security/perf/data)

### 2) Repo/Context Scan document
A shared map of the relevant code areas.

**Minimum contents:**
- Architectural overview (what talks to what)
- Key file paths (grouped by responsibility)
- Data flow notes
- Known constraints and “gotchas”

### 3) Decision Log
A short, dated record of key choices.

**Minimum contents:**
- What we decided
- Why
- Alternatives considered
- Implications

---

## The end-to-end process

### Step 0 — Intake (clarify the ask)
**Owner:** Architect

Write a short intake spec:
- **Problem / opportunity:** what are we improving?
- **User(s):** who benefits?
- **Success looks like:** measurable or observable outcomes
- **Non-goals:** what we’re explicitly not doing
- **Constraints:** time, platform, auth, performance, design constraints

**Output:** 5–15 bullet “Feature Intake Spec” (paste into your chat thread).

---

### Step 1 — Draft a design contract (even if you think it’s “just UI tweaks”)
**Owner:** Architect

Before implementation, define what “on-brand” means for this feature.

Include:
- Layout rules (grid, spacing scale, breakpoints)
- Typography rules (heading sizes, body sizes, usage constraints)
- Component rules (what existing component patterns to reuse)
- Interaction rules (motion/hover/scroll behaviors)
- “Don’ts” (things that must not change)

**Output:** A short design contract section you can paste into the roadmap.

> Note: You’ll create a reusable Design Contract Template as a separate doc later.

---

### Step 2 — Create (or update) the Roadmap document
**Owner:** Architect

Start with your intake spec and design contract. Then break the work into phases.

Rules:
- Each phase should be small enough to ship safely.
- Each phase has acceptance criteria.
- If a phase requires unknown repo knowledge, that’s a signal you need a Repo Scan.

**Output:** `<FEATURE>-Roadmap.md`

---

### Step 3 — Repo Scan (READ-ONLY)
**Owner:** Repo Operator

Run a read-only pass to map:
- Relevant files, components, routes, API handlers
- State management patterns
- Data sources (DB tables, analytics events, logs)
- Existing UI patterns to match

Rules:
- No edits during this step.
- Prefer links/paths and short summaries.
- Call out “unknowns” and questions.

**Output:** `<FEATURE>-Repo-Scan.md`

---

### Step 4 — Plan implementation slices (task cards)
**Owner:** Architect

Convert phases into a sequence of implementation slices.

A good slice:
- Touches a small, coherent area.
- Has a clear “done” statement.
- Can be reviewed quickly.

**Output:** A numbered list of slices + one task card per slice.

---

### Step 5 — Implement slices
**Owner:** Repo Operator

Implement one slice at a time.

Rules:
- Keep changes minimal and aligned to the design contract.
- Avoid adding new dependencies unless explicitly required.
- Prefer existing abstractions and patterns.

**Output:** Code changes + a short summary of what changed and why.

---

### Step 6 — Diff review + hardening (mandatory)
**Owner:** Reviewer

After each slice:
- Review the diff like a paranoid staff engineer.
- Check edge cases.
- Check visual/UX consistency.
- Check logging/PII exposure.
- Check perf footguns.

**Output:**
- Findings (bulleted)
- Fix suggestions
- Verification checklist for that slice

---

### Step 7 — Verification (build + manual test script)
**Owner:** You + Reviewer

Minimum verification:
- Build passes
- Types pass
- UI screenshots captured (if UI)
- Manual test script executed

**Output:** A short “Verification Notes” section appended to the roadmap phase.

---

### Step 8 — Documentation update
**Owner:** Architect/Reviewer

Update:
- Roadmap status
- Repo scan if file paths changed
- Decision log if decisions were made

**Output:** Docs remain the source of truth.

---

## Model selection rules (quick cheat sheet)

Use **GPT-5.2 Thinking** as your default “co-pilot brain” for:
- Translating big-picture vision into actionable steps
- Writing roadmaps
- Reviewing diffs
- Creating acceptance criteria and test scripts
- Polishing UI/UX consistency rules

Use **GPT-5.2 Pro** selectively for:
- High-stakes architecture decisions
- Non-obvious tradeoffs (security/perf/complexity)
- Final review before a major merge
- “If we do this wrong, we’ll regret it for months” decisions

Use **Codex** for:
- Repo-wide read-only scans
- Multi-file implementations
- Mechanical refactors and repetitive changes

---

## Definition of done (global)

A feature (or slice) is “done” when:
- The scope matches the roadmap phase.
- The design contract is followed (or explicitly updated).
- Builds pass and types pass.
- No new secrets/PII are exposed.
- UI work has screenshots (desktop + mobile where relevant).
- A manual test script exists and passes.
- Docs are updated (roadmap + scan + decision log).

---

## Appendix A — Task card templates

### A1) READ-ONLY Repo Scan Task Card (template)

**Title:** READ-ONLY Repo Scan — `<FEATURE>`

**Goal:** Produce a repo/context map that identifies the relevant files, patterns, and unknowns.

**Rules:**
- Do not modify any files.
- Prefer short summaries with exact file paths.
- Call out uncertainties explicitly.

**Output format:**
- Relevant files grouped by area
- Data flow overview
- Existing patterns to follow
- Open questions / unknowns

---

### A2) Implementation Slice Task Card (template)

**Title:** Implement Slice `<N>` — `<FEATURE>`

**Scope:**
- What this slice changes
- What this slice must not change

**Acceptance criteria:**
- Concrete checklist

**Constraints:**
- No new dependencies unless stated
- Align to design contract rules

**Deliverables:**
- Code changes
- Short summary of diff
- Notes on risks

---

## Appendix B — Diff review checklist (template)

- Behavior matches the slice scope
- No unintended side effects
- Error states handled
- Loading states handled
- Accessibility basics (labels, headings, keyboard)
- Visual consistency with existing design language
- No secrets/PII in logs
- Performance: no obvious re-render storms or expensive loops
- Types are correct; no unsafe casts added without reason

---

## Appendix C — Manual test script (template)

1. Navigate to `<PATH>`
2. Perform `<ACTION>`
3. Confirm `<EXPECTED RESULT>`
4. Try error case `<ERROR CONDITION>`
5. Confirm fallback `<FALLBACK BEHAVIOR>`

---

## Appendix D — Decision log entry (template)

**Date:** YYYY-MM-DD

**Decision:**

**Why:**

**Alternatives considered:**

**Implications / follow-ups:**