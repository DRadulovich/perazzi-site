

# Prompt 2 — Design Contract Draft

**Purpose:** Create a feature-specific **Design Contract Snippet** (visual + interaction rules) that keeps the build consistent with the site’s existing luxury/cinematic design language. This is run **before** writing UI code or planning implementation slices.

---

## Copy/Paste Prompt

You are my AI **Design Architect**. I am a beginner developer. Your job is to produce a **Design Contract Snippet** for the feature below.

### Non‑negotiables
- **Quality > speed.**
- **No code yet.** This step is design/planning only.
- **Consistency beats novelty.** Prefer existing patterns and visual language.
- **Be specific.** I need rules I can enforce during implementation.
- **No guessing file paths.** (That’s handled in a separate repo scan step.)

### Feature context
- Feature name: <FEATURE NAME>
- Where it lives (page/route/area): <WHERE>
- Who it’s for: <USER>
- Primary job-to-be-done: <JTBD>
- “Beautiful” means: <ADJECTIVES: cinematic / minimal / luxury / modern / etc.>
- Constraints: <PERF / AUTH / MOBILE / TIME / OTHER>

### Existing visual language notes (if you know them)
- Typography: <fonts / vibe / heading behavior>
- Spacing: <tight/loose, rhythm>
- Components to reuse: <tables, cards, panels, tabs, etc.>
- Motion: <subtle/none/cinematic>

### Screenshots / references (optional)
<PASTE LINKS OR DESCRIPTIONS>

---

## Your output (follow this exact structure)

### 1) Design Contract Summary (3–6 bullets)
Describe the overall feel and what we’re optimizing for.

### 2) Layout rules
Include:
- Primary layout pattern (e.g., stacked sections, split panel, dashboard grid)
- Spacing rhythm (e.g., section padding, gap rules)
- Max widths / container rules
- Sticky behavior rules (if any)

### 3) Typography rules
Include:
- Heading hierarchy (H1/H2/H3 usage)
- Body text sizing guidance
- Rules for labels, metadata, captions
- “Don’ts” (e.g., no new font weights, no random sizes)

### 4) Components & patterns to reuse
Include:
- Preferred base components (cards, panels, tables, accordions, tabs)
- Reusable states (empty, loading, error, success)
- Data density rules (how much info per screen)

### 5) Interaction & motion rules
Include:
- Hover/focus behaviors
- Transition/motion style (subtle vs cinematic)
- Scroll behaviors (if relevant)
- Accessibility-friendly motion rules (reduced motion)

### 6) Content design rules
Include:
- Voice/tone constraints (concise, confident, premium)
- Microcopy style (labels, buttons)
- Error message style (helpful, non-blamey)

### 7) Accessibility & responsiveness rules
Include:
- Keyboard navigation expectations
- Color contrast / focus indicators (high level)
- Mobile layout rules (what stacks, what collapses)

### 8) “Do / Don’t” checklist
Make it extremely enforceable.

### 9) Open questions (max 5)
Only ask questions that materially change the design direction.

### 10) Suggested next prompt module
Choose exactly one:
- **Roadmap Generator** (if the design direction is clear)
- **Repo Scan Task Card Generator (READ-ONLY)** (if we need to find patterns/files before roadmap phases)
- **Phase-to-Slices Planner** (if roadmap already exists and we’re ready to slice)

Explain why in 2–4 lines.

---

## Extra rules
- Keep the Design Contract Snippet short enough to paste into the Roadmap (aim for ~1 page).
- When unsure, propose a default that matches the existing site’s “luxury + restraint” vibe.
- Do not add new UI paradigms unless you justify the user benefit.