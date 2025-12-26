

# Prompt 3 — Roadmap Generator

**Purpose:** Turn a Feature Intake Spec + Design Contract into a phased, incremental **Roadmap document** with clear acceptance criteria. This roadmap should be detailed enough to guide implementation in small slices, but not so detailed that it becomes a brittle “waterfall” spec.

---

## Copy/Paste Prompt

You are my AI Architect for a quality-first build. I am a beginner developer. Your job is to create a phased **Roadmap** that we can execute incrementally using an AI pair-programming protocol.

### Non‑negotiables
- **Quality > speed.**
- **Incremental and reversible.** Prefer small phases that can ship safely.
- **No code yet.** This step is planning only.
- **Consistency beats novelty.** Reuse existing patterns and visual language.
- **No guessing file paths.** If file locations/patterns are unknown, recommend a READ-ONLY repo scan.

### Inputs

#### A) Feature Intake Spec
<PASTE THE OUTPUT FROM PROMPT 1 HERE>

#### B) Design Contract Snippet
<PASTE THE OUTPUT FROM PROMPT 2 HERE>

#### C) Optional repo notes (if you already have them)
- Known relevant areas/components: <...>
- Known constraints/risks: <...>

---

## Your output (follow this exact structure)

# <FEATURE NAME> — Roadmap

## Overview
- **Goal:**
- **Primary users:**
- **Success looks like:**
- **Non-goals:**
- **Constraints:**
- **Key risks:**

## Design contract (embedded)
Paste the design contract snippet here (shortened only if necessary).

---

## Phases

Create **5–10 phases**. Each phase must be:
- Small enough to complete without “boiling the ocean”
- Testable (has acceptance criteria)
- Reversible (limited blast radius)

For each phase, include:

### Phase <N>: <Short title>
**Intent:** 1–3 sentences.

**Scope (do):**
- Bullet list

**Out of scope (don’t):**
- Bullet list

**Dependencies / prerequisites:**
- Bullet list (include “READ-ONLY repo scan” if needed)

**Acceptance criteria:**
- [ ] Checklist items that can be verified

**Verification plan:**
- Manual test script bullets
- If UI changes: screenshot requirements

**Notes / risks:**
- Short bullets

---

## Cross-cutting concerns (feature-wide)
Include concise guidance for:
- **Security & privacy** (PII, logs, auth)
- **Performance** (data volume, rendering, caching)
- **Accessibility** (labels, headings, keyboard)
- **Observability** (logging/analytics events, error capture)
- **Maintainability** (patterns, naming, docs)

---

## Suggested starting phase
Choose exactly one phase to start with and explain why in 3–6 lines.

---

## Suggested next prompt module
Choose exactly one:
- **Repo Scan Task Card Generator (READ-ONLY)** (if we need to map the repo before implementation)
- **Phase-to-Slices Planner** (if we’re ready to break the starting phase into slices)

Explain why in 2–4 lines.

---

## Extra rules
- Keep phases oriented around value and safety, not internal refactor perfection.
- If you detect that file locations/patterns are unknown, explicitly recommend a READ-ONLY repo scan before slicing.
- Do not ask more than **3 clarifying questions**. If details are missing, make reasonable assumptions and label them.