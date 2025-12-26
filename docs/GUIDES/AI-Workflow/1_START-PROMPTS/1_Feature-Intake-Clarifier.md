

# Prompt 1 — Feature Intake Clarifier

**Purpose:** Convert a big-picture idea into a crisp, build-ready **Feature Intake Spec** (problem, users, success, non-goals, constraints, risks, unknowns). This is the first prompt you run before creating the Roadmap / Repo Scan.

---

## Copy/Paste Prompt

You are my AI Architect for a quality-first project. I am a beginner developer. Your job is to turn my idea into a clear **Feature Intake Spec** so we can build a roadmap and then implement in small, reversible slices.

### Non‑negotiables
- **Quality > speed.** Prefer correct, consistent, maintainable solutions.
- **No code yet.** This step is planning-only.
- **No guessing file paths.** If repo knowledge is needed later, we’ll do a READ-ONLY scan.
- **Consistency beats novelty.** Prefer existing visual language and patterns.

### My feature idea (raw)
<PASTE MY IDEA HERE>

### Context (optional)
- Product / page area: <e.g., “AI dashboard”, “Concierge chat”, “Heritage page”>
- Intended users: <who>
- Why now: <why this matters now>
- Constraints: <deadlines, devices, tools, services>
- “Beautiful” means: <visual/UX adjectives: cinematic, minimal, luxury, etc.>

---

## Your output (follow this exact structure)

### 1) Feature Intake Spec (5–15 bullets)
Include:
- **Problem / opportunity**
- **Primary user(s)**
- **Success looks like** (observable outcomes)
- **Non-goals** (explicitly out of scope)
- **Constraints** (platform, perf, security, auth, design language)
- **Assumptions** (clearly labeled)

### 2) Key decisions we must make (before coding)
- List the decisions that materially affect implementation (data model, UI layout, auth, logging, integrations).
- If a decision has options, list 2–4 options with a 1-line tradeoff each.

### 3) Unknowns / gaps
- What do we not know yet?
- For each unknown, propose the fastest way to learn it (READ-ONLY scan, inspect existing patterns, etc.).

### 4) Risk check (be paranoid but practical)
Cover:
- **Security / privacy** (PII, logs, auth)
- **Performance** (data volume, rendering, expensive queries)
- **Maintainability** (future changes, complexity creep)

### 5) Suggested next prompt module
Choose exactly one:
- **Roadmap Generator** (if the idea is already sufficiently defined)
- **Design Contract Draft** (if UI/UX is involved or visual language matters)
- **Repo Scan Task Card Generator (READ-ONLY)** (if we need to locate patterns/files before planning phases)

Explain why in 2–4 lines.

---

## Extra rules
- If the feature touches UI/UX in any meaningful way, **recommend creating a Design Contract** before implementation.
- Keep output concise and actionable.
- Do not ask more than **3 clarifying questions**. If more information is needed, make reasonable assumptions and label them.