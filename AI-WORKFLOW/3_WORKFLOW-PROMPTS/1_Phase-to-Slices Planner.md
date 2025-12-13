

# Workflow Prompt — Phase-to-Slices Planner

**Purpose:** Convert a single **Roadmap Phase** into a small set of **implementation slices** that are incremental, reversible, and easy to review. This produces a slice plan plus (optionally) a task card for **Slice 1 only**.

Use this after you have:
- A Roadmap document, and
- A Repo/Context Scan (or strong confidence in where the work lives), and
- A Design Contract snippet (if UI/UX is involved).

---

## Copy/Paste Prompt

You are my AI **Architect + Delivery Planner**. I am a beginner developer. I will paste the active roadmap phase and supporting docs.

Your job: break the phase into **small, reversible implementation slices** so we can execute one slice at a time (often via Codex) and do mandatory diff reviews.

### Non‑negotiables
- **Quality > speed.**
- **Incremental and reversible.** Each slice should have limited blast radius.
- **No code yet.** This step is planning only.
- **No guessing file paths.** Use the Repo/Context Scan. If missing, recommend a READ-ONLY scan.
- **Consistency beats novelty.** Reuse existing patterns and visual language.
- **One task card at a time.** Only write the full task card for **Slice 1**.

---

## Inputs

### A) Active Phase (required)
<PASTE THE ENTIRE PHASE TEXT HERE>

### B) Roadmap context (optional but recommended)
<PASTE THE ROADMAP OVERVIEW OR RELEVANT NEARBY PHASES HERE>

### C) Repo/Context Scan (required unless you are 100% sure)
<PASTE THE REPO SCAN SUMMARY + RELEVANT FILE PATHS HERE>

### D) Design Contract Snippet (required for UI/UX work)
<PASTE THE DESIGN CONTRACT SNIPPET HERE>

### E) Constraints / preferences (optional)
- No new dependencies: <yes/no>
- Testing expectations: <manual only / add tests / both>
- Data sensitivity: <low/medium/high>

---

## Your output (follow this exact structure)

### 1) Phase summary (2–5 lines)
Restate the goal of the phase in plain language.

### 2) Readiness check
Answer:
- Do we have enough repo context to slice confidently? If not, recommend a READ-ONLY scan.
- Any missing decisions that block slicing?

### 3) Slice plan (aim for 3–8 slices)
For each slice, provide:

**Slice <N>: <Short title>**
- **Intent:** 1–2 sentences
- **Scope (do):** 2–6 bullets
- **Out of scope (don’t):** 1–4 bullets
- **Likely files touched:** list exact file paths (or “unknown—needs scan”)
- **Acceptance checks:** 2–5 checkbox items
- **Verification notes:** quick manual checks + screenshot notes if UI
- **Risk notes:** 1–3 bullets

### 4) Dependencies between slices
- Bullet list describing ordering constraints (if any).

### 5) Recommended Slice 1
Choose the safest/high-signal first slice and explain why in 3–6 lines.

### 6) Task card for Slice 1 (only)
Write a single Implementation Task Card for Slice 1 using this format:

**Title:** Implement Slice 1 — <FEATURE / PHASE>

**Scope (do only this):**
- …

**Out of scope (do not touch):**
- …

**Acceptance criteria:**
- [ ] …
- [ ] …

**Constraints:**
- No new dependencies unless stated
- Align to Design Contract

**Deliverables:**
- Code changes
- Short diff summary
- Notes on risks

### 7) Suggested next prompt module
Choose exactly one:
- **Implementation Task Card Writer** (if you want a separate module per slice)
- **Repo Scan Task Card Generator (READ-ONLY)** (if file paths/patterns are still unclear)
- **Diff Review Prompt** (if changes already exist and need review)

Explain why in 2–4 lines.

---

## Extra rules
- Keep slices small enough to finish in one focused coding session.
- Prefer establishing structure first (routing/layout/skeleton/empty states) before advanced logic.
- Always include empty/loading/error states early if the feature is UI-driven.
- If there is any ambiguity around auth, data access, or privacy, call it out as a blocking decision.