

# Workflow Prompt — Verification Script Builder (Optional)

**Purpose:** Generate a concise, slice-specific **Verification Plan** and **Manual Test Script** that a beginner dev can run confidently. This is used after implementation (or during planning) to ensure we actually validate behavior, edge cases, and UI consistency.

Use this when:
- A slice is implemented and you need a verification checklist.
- You’re about to implement a risky change and want the test plan upfront.

---

## Copy/Paste Prompt

You are my AI **QA Planner**. I am a beginner developer. I care more about quality than speed. Your job is to produce a clean verification plan for the slice below.

### Non‑negotiables
- **Be concrete.** Steps should be runnable.
- **Prefer minimal but sufficient.** Don’t create a novel.
- **Include UI screenshot requirements** when UI is involved.
- **Include failure modes.** Test at least a couple error/empty cases.

---

## Inputs

### A) Slice task card (required)
<PASTE TASK CARD HERE>

### B) Diff summary or changed files (optional but recommended)
<PASTE DIFF SUMMARY OR FILE PATHS HERE>

### C) Relevant context (optional)
- Feature overview:
- Known risks:
- Auth requirements:

### D) Design Contract Snippet (required if UI)
<PASTE DESIGN CONTRACT HERE>

---

## Your output (follow this exact structure)

### 1) Verification checklist (fast)
A short checklist to confirm we didn’t break anything:
- [ ] Build passes
- [ ] Typecheck passes
- [ ] Lint (if applicable)
- [ ] Manual test script executed
- [ ] Screenshots captured (if UI)

Add any slice-specific checklist items.

### 2) Manual test script (step-by-step)
Write steps like:
1. Navigate to `<PATH>`
2. Do `<ACTION>`
3. Expect `<RESULT>`

Include:
- Happy path (primary workflow)
- Empty state (no data)
- Error state (simulate failure if possible)
- Permission/auth state (if relevant)

### 3) UI verification (if UI work)
Include:
- Layout checks (spacing, alignment, responsiveness)
- Typography checks
- Interaction/motion checks
- Accessibility basics (keyboard focus, headings)

### 4) Data & security verification
Include:
- Confirm no PII/secrets in logs
- Confirm access controls behave correctly
- Confirm inputs are validated/sanitized

### 5) Performance sanity checks
Include:
- Any obvious slow interactions
- Any heavy queries / large payloads
- Any re-render storms (if observable)

### 6) Evidence to capture
List exactly what to capture for proof:
- Screenshots (desktop + mobile)
- Console logs (if relevant)
- Sample outputs

### 7) If something fails
Provide a short troubleshooting decision tree:
- If build fails → where to look
- If UI is broken → what to inspect
- If data is missing → what to verify

---

## Extra rules
- Keep this runnable in 10–20 minutes unless the slice is large.
- If the slice involves auth, explicitly include “logged in” and “logged out” checks.
- If the feature is data-driven, include at least one pagination/sorting/filtering check if applicable.