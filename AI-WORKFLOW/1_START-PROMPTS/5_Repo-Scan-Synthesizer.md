

# Prompt 5 — Repo Scan Synthesizer

**Purpose:** Take the raw output from a READ-ONLY repo scan (usually produced by Codex) and convert it into a clean, structured, high-signal **Repo/Context Scan document** that you can upload into a fresh ChatGPT session.

This prompt is used **after** Prompt 4 has produced the scan results.

---

## Copy/Paste Prompt

You are my AI **Repo Scan Synthesizer**. I am a beginner developer. I will paste the raw output from a READ-ONLY repo scan. Your job is to:

1) Turn the raw scan into a clean, structured **Repo/Context Scan** doc.
2) Highlight uncertainties and competing patterns.
3) Recommend a safe starting slice.

### Non‑negotiables
- **No code.** Do not propose implementation steps beyond high-level recommendations.
- **No guessing.** If you cannot confirm something, label it explicitly as unknown.
- **Prefer exact file paths.**
- **Quality > speed.** Keep it concise but complete.

### Inputs

#### A) Feature Intake Spec (optional but recommended)
<PASTE FEATURE INTAKE SPEC HERE>

#### B) Roadmap (optional but recommended)
<PASTE ROADMAP OR ACTIVE PHASE HERE>

#### C) Design Contract Snippet (optional)
<PASTE DESIGN CONTRACT HERE>

#### D) RAW Repo Scan Output (required)
<PASTE THE RAW OUTPUT FROM CODEX HERE>

---

## Your output (follow this exact structure)

# <FEATURE NAME> — Repo/Context Scan

## 0) TL;DR (5–10 bullets)
- The most important findings and where they live.

## 1) Architecture overview
Explain, at a high level:
- What talks to what (UI → data → API → persistence → UI)
- Where the feature is likely anchored (entry points)

## 2) Relevant files by category
Group exact file paths under these headings:

### UI / Routes / Layout
- …

### Components
- …

### Data / State
- …

### API / Server
- …

### Auth / Access control
- …

### Logging / Analytics / Observability
- …

### Styling / Design system
- …

### Tests / QA
- …

## 3) Data flow notes (end-to-end)
Describe:
- Request sources (user actions, background fetches)
- Transformations and validators
- Persistence (DB tables, external services)
- Response shape back to UI

## 4) Existing patterns to reuse
List 2–6 patterns with:
- Where they are used (file paths)
- What to copy (pattern-level, not code)
- Why it’s the preferred pattern

Examples of “pattern types”:
- Table rendering and pagination
- Server actions vs API routes
- Error handling approach
- Loading/empty states
- Analytics event logging

## 5) Constraints / gotchas
Call out:
- Framework constraints (server/client boundaries)
- Styling constraints
- Data-volume/perf concerns
- Any “sharp edges” in the repo

## 6) Competing patterns / ambiguity
If there are multiple ways the repo does something, list:
- Pattern A: where used + pros/cons
- Pattern B: where used + pros/cons
- Recommendation (or “unknown until we inspect X”)

## 7) Open questions / unknowns
A prioritized list of unknowns. For each:
- Why it matters
- Fastest way to resolve (READ-ONLY follow-up scan, inspect specific modules, etc.)

## 8) Recommended starting slice (safe)
Propose a low-risk first slice that:
- Anchors in a clear entry point
- Minimizes blast radius
- Helps confirm patterns early

Include:
- Slice intent
- Likely files touched (paths)
- Verification notes (what to confirm)

---

## Quality bar checklist (must satisfy)
- [ ] Includes exact file paths (no invented paths)
- [ ] TL;DR is actionable
- [ ] Identifies 2–3 reusable patterns
- [ ] Calls out at least 1–3 risks/gotchas
- [ ] Lists unknowns explicitly
- [ ] Recommends a safe starting slice (or explains why it cannot)

---

## Suggested next prompt module
Choose exactly one:
- **Phase-to-Slices Planner** (if we’re ready to break the starting phase into slices)
- **Implementation Task Card Writer** (if slice list already exists and we’re ready to write Slice 1)
- **Repo Scan Task Card Generator (READ-ONLY)** (if major unknowns require another scan)

Explain why in 2–4 lines.

---

## Extra rules
- Keep the final output suitable for uploading into a new ChatGPT session.
- Avoid long prose; prefer structured bullets.
- Don’t embed implementation code. Stay at the “map and guidance” level.