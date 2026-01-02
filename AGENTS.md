# AGENTS.md — Expandable Section Motion System

These instructions apply to all task cards in this repo. Follow them unless a task card explicitly overrides them.

## Target Spec Summary (non-negotiable)
- Shared timeline with phases: `collapsed -> prezoom -> expanded` and `expanded -> closingHold -> collapsed`.
- Standard slot/variant names: `section`, `background`, `scrimTop`, `scrimBottom`, `collapsedHeader`, `glass`, `expandedHeader`, `mainVisual`, `meta`, `content`, `ctaRow`.
- Collapse is faster than expand (roughly 2x), and container must not "pop" before exits finish.
- Preserve existing visual styling and DOM structure unless the task requires changes.

## Accessibility + Performance Constraints
- Respect reduced motion: disable parallax and letter animation; prefer opacity-only motion.
- Do not animate `height: auto` for main expand/collapse; use layout or measured height.
- Do not apply per-letter animation to body text or long strings.
- Avoid unmounting critical nodes mid-transition; use `closingHold` to gate exits.

## Repo Workflow
- Determine package manager by checking lockfiles and `package.json`.
- Determine verification commands by reading `package.json` scripts.
- Always run repo lint + typecheck after changes that touch code; run tests if present and relevant.

## Next.js Rules
- Any module using React hooks must be client-safe (add `'use client'` in hook modules).
- Avoid importing client-only modules from server components.

## Dependency Policy
- Do not add new dependencies without explicit user approval.
