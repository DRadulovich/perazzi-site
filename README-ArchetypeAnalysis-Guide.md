# Archetype Analysis Guide (Non-Dev)

This guide explains Archetype Analysis in plain language: what it is, what you should expect to see, and how to evaluate whether it’s working well. No coding required.

For developer implementation details, see `README-ArchetypeAnalysis.md`.

---

## What Archetype Analysis is

Archetype Analysis is PerazziGPT’s internal way of estimating **what kind of help you’re looking for**—not just *what topic* you asked about, but what style of value you want:
- Clarity and tradeoffs (Analyst)
- Performance progression and consistency (Achiever)
- Craftsmanship, presentation, and curation (Prestige)
- Long-term ownership, trust, and belonging (Loyalist)
- Heritage, stewardship, and “what it means over time” (Legacy)

It is not a permanent label. Most people are a blend.

---

## What it is allowed to change (and what it is not)

Archetype is allowed to change:
- **Structure**: how an answer is organized (checklist vs narrative vs decision criteria).
- **Emphasis**: what details are highlighted first vs later.
- **Tone**: the “human wrapper” around the same underlying truth.

Archetype is not allowed to change:
- Facts and technical accuracy.
- Safety boundaries and refusals.
- Policy boundaries (especially pricing and gunsmithing/illegal advice).
- The user should not be told “you are a Loyalist/Prestige/etc.” as an identity label.

---

## The five archetypes (quick reference)

- **Loyalist**: “This is my brand; I want trust, continuity, and long-term partnership.”
- **Prestige**: “I care about craftsmanship, aesthetics, and the quiet signal of taste.”
- **Analyst**: “Explain how it works, the tradeoffs, and how to test/verify.”
- **Achiever**: “Help me improve and perform consistently under pressure.”
- **Legacy**: “I care about heritage, stewardship, and what this gun will mean in 10–30 years.”

---

## How it behaves when it’s confident vs not confident

Archetype Analysis always keeps an internal “blend” across all five archetypes.

- When the system is **confident**, it selects a **primary archetype** for this moment and leans into that style.
- When the system is **not confident**, it treats the user as **mixed/balanced** and answers neutrally:
  - clear structure
  - no overly personalized tone
  - no “clinging” to a vibe that might be wrong

---

## What you should notice in real answers

If Archetype Analysis is working, you should see:
- **Same truth, different wrapper**: the recommendations stay consistent, but the framing changes.
- **Better “lead with what matters”**: Analysts get decision criteria; Achievers get a practical plan; Legacy gets stewardship framing; etc.
- **No contradictions across archetypes**: tone may differ, but the guidance should not fight itself.

Red flags:
- One archetype starts skipping core decision steps (the “wrapper” is eating the “engine”).
- Archetypes contradict each other on key decisions.
- Overconfident specifics appear without sourcing/hedging (especially harmful for Analyst).
- The assistant starts sounding salesy or identity-labeling.

---

## How to evaluate quality (the recommended scorecard)

Use the official grading rubric:
- `docs/ARCHETYPE-ANALYSIS/GRADING-RUBRIC/ARCHETYPE-ANALYSIS-GRADE-RUBRIC.md`

At a high level, you’re checking two things:

1) **Core invariants (should be consistent across archetypes)**
   - The same Perazzi decision logic shows up regardless of vibe.

2) **Archetype fidelity + separability (should differ across archetypes)**
   - You can tell which archetype it is *without being told* (blind attribution test).

If separability rises but core quality drops, you’ve created “cosplay” (style without truth).

---

## Where to look for real evidence (Insights / dashboards)

If logging is enabled, Archetype Analysis emits tuning signals you can track:
- How often a primary archetype is chosen (vs mixed/balanced)
- Confidence margin trends over time
- Which signals were most commonly triggered (what’s driving the classifier)
- Which response templates are being used per archetype

These are used by the PGPT Insights admin UI and supporting SQL views.

If you’re not seeing useful Insights data, ask a developer to confirm logging is enabled and configured safely.

---

## How tuning works (conceptually)

There are three tuning “dials”:

1) **How the system detects archetype**
   - Better phrase/keyword signals, and better damping so context doesn’t overpower what the user is actually saying.

2) **How the answer changes when archetype is confident**
   - Better per-archetype structures (templates) that change ordering and emphasis while keeping facts constant.

3) **How retrieval favors certain knowledge chunks**
   - A small, safe “nudge” so archetype-relevant material is more likely to appear, without overriding semantic relevance.

If you want to tune the experience, start with templates and evaluation (human-visible), then adjust detection and retrieval only if needed.

---

## Common problems and what they usually mean

- **“It’s always Prestige”**
  - The context (page/model) may be biasing too strongly, or Prestige signals are too broad.

- **“It snaps too often / too rarely”**
  - Confidence threshold needs adjustment, or signals are too strong/too weak.

- **“The answers don’t feel different across archetypes”**
  - Template variants aren’t distinct enough; separability test will confirm.

- **“The answers contradict each other”**
  - The core decision engine isn’t being preserved; fix templates and guardrails first.

---

## Who should edit what

If you are not a developer, the safe changes are:
- Editing rubric and evaluation docs under `docs/ARCHETYPE-ANALYSIS/` (grading criteria, sample prompts, output packs).
- Updating brand/archetype definitions in the brand strategy docs (with care).

Ask a developer for changes to:
- Any runtime behavior (classification logic, templates, retrieval weighting, logging).
- Any environment variables / feature flags.

