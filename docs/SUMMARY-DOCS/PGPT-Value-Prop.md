# PGPT Value Proposition (Marketing Summary)

## What “PGPT” is (in plain language)

`PGPT/` is the source library and operating playbook behind the website’s Perazzi concierge assistant.

Think of it as two things working together:

1) **The curated “truth set”** the assistant is allowed to use (brand, models, craft, process, service, dealer info).
2) **The behavioral contract** that ensures answers stay on-brand, safe, and consistent (voice, guardrails, modes, and archetype guidance).

The result is an on-site assistant that behaves less like a generic chatbot and more like a high-trust Perazzi guide—grounded in approved materials, designed to help a visitor take the next right step.

---

## Quick non-dev summary: what the assistant does

The assistant is designed to act as a **digital concierge** across three core “situations” a visitor is in:

- **Prospect mode**: helps a potential buyer orient (platform differences, “where do I start,” what to explore next), without turning into a pricing engine.
- **Owner mode**: helps owners care for and understand their gun over time, with strong boundaries that route sensitive work to authorized service.
- **Navigation mode**: helps people find the right place on the site quickly (“where do I go for X?”).

What makes it valuable (marketing lens):

- **Scales a premium concierge experience**: 24/7 “first conversation” that feels intentional, not transactional.
- **Turns confusion into momentum**: reduces choice paralysis by guiding a visitor to a small set of sensible paths.
- **Protects brand tone automatically**: the assistant consistently speaks in the Perazzi voice (quiet confidence, reverence for craft, clarity before romance).
- **Creates cleaner handoffs**: routes users to the right real-world next step (dealer, service center, events, bespoke inquiry) rather than “answering into a dead-end.”

---

## Quick non-dev summary: what Archetype Analysis does

**Archetype Analysis** is the assistant’s internal way of adapting *how* it communicates based on *why* a person is asking—not by demographics, but by motivation.

It works with five motivational lenses:

- **Loyalist** (trust, continuity, belonging)
- **Prestige** (curation, craftsmanship, presence)
- **Analyst** (clarity, tradeoffs, verification)
- **Achiever** (performance progression, consistency)
- **Legacy** (stewardship, decades-long meaning)

Important: it is **not** a permanent label and it should **not** tell users “you are a Prestige buyer,” etc. It only changes **structure, emphasis, and tone**, not facts or rules.

What makes it valuable (marketing lens):

- **Improves resonance without feeling “salesy”**: the same truth, framed in the way the user is most likely to trust.
- **Supports multiple brand entry points**: heritage-first visitors, performance-first visitors, and craft-first visitors all get a coherent Perazzi experience.
- **Gives you a measurement surface**: when logging is enabled, the system can show trends in which motivations are showing up and which templates perform well (useful for content strategy and funnel design).

---

## What’s in `PGPT/` (and why it matters)

`PGPT/V2/` is organized like a brand + product knowledge vault:

- **Brand Strategy (`PGPT/V2/Brand-Strategy/`)**
  - Defines how Perazzi should be described, what language resonates, and how archetypes map to messaging.
  - Examples: `PGPT/V2/Brand-Strategy/Brand-Bible.md`, `PGPT/V2/Brand-Strategy/Writing-Tone.md`, `PGPT/V2/Brand-Strategy/Audience-Psych-Archetypes.md`

- **Making a Perazzi (`PGPT/V2/Making-A-Perazzi/`)**
  - A craftsmanship and process “handbook” that supports the site’s atelier framing (what it means to build, fit, and steward a Perazzi).
  - This is a major source of differentiation because it explains *why Perazzi is Perazzi* in a way that can be reused across conversations and content.

- **Gun Info (`PGPT/V2/Gun-Info/`)**
  - Structured model and platform corpuses that help the assistant explain options clearly (platform families, disciplines, rib info, model variants/spec text).
  - This is where the assistant gets precision without becoming a spec-dump machine.

- **Company Info (`PGPT/V2/Company-Info/`)**
  - Official “real world” anchors: authorized dealers, recommended service centers, events, athletes/medals, consumer warnings.
  - These enable confident CTAs: “Here’s where to go next, safely and officially.”

- **Operational (`PGPT/V2/Operational/`)**
  - The site map and flow logic the assistant uses to guide people through the website experience (especially Navigation mode and concierge journeys).

- **Pricing Lists (`PGPT/V2/Pricing-Lists/`)**
  - Present for internal structure and completeness, but treated as **pricing-sensitive**: the assistant must not quote prices or negotiate.

`PGPT/V2/AI-Docs/` is the “rules of the system”:

- **Phase 1 (Behavior & voice)**: how it should act, speak, and what it must never do (e.g., `PGPT/V2/AI-Docs/P1/Assistant-Spec.md`, `PGPT/V2/AI-Docs/P1/NonNegotiable-Guardrails.md`).
- **Phase 2 (Corpus governance)**: which sources are eligible and how they’re handled (e.g., `PGPT/V2/AI-Docs/P2/Source-Corpus.md`).
- **Phase 3 (Runtime contract)**: how the experience is wired end-to-end (useful context for product/ops, not needed for day-to-day marketing edits).

The most important governance concept for non-devs:

- `PGPT/V2/AI-Docs/P2/Source-Corpus.md` is the **allowlist** for what the assistant is permitted to learn from. If it’s not active there, it’s not meant to shape answers.

---

## Why this matters to the marketing team

PGPT turns “brand strategy” into something operational:

- **Every visitor gets a coherent Perazzi story** (even if they enter through a narrow question).
- **Brand voice stays consistent at scale** across pages, questions, and funnels.
- **Archetypes become a practical tool** for tailoring journeys (what we lead with, what we link to, what the CTA should be).
- **The assistant becomes a conversion tool without becoming a salesperson**: it clarifies, curates, and routes—then hands off to the right human channel.

---

## Guardrails (the boundaries that protect the brand)

These constraints are features, not limitations:

- **No prices, quotes, discounts, or negotiation framing** (routes price questions to authorized channels).
- **No competitor head-to-head comparisons by name**.
- **No step-by-step gunsmithing or modification instructions** (routes to authorized service).
- **No “identity labeling” of users by archetype** (archetypes shape tone/structure, not labels).

Canonical reference: `PGPT/V2/AI-Docs/P1/NonNegotiable-Guardrails.md`.

---

## How marketing can use PGPT day-to-day (without touching code)

- **Update voice and messaging**: refine tone, phrasing, and “what to emphasize” in `PGPT/V2/Brand-Strategy/`.
- **Add campaign-aligned knowledge** (that the assistant can use): create new documents under `PGPT/V2/` and ensure they’re listed as active in `PGPT/V2/AI-Docs/P2/Source-Corpus.md`.
- **Improve archetype resonance**: refine the archetype definitions and messaging patterns in `PGPT/V2/Brand-Strategy/Audience-Psych-Archetypes.md` (without turning them into labels).
- **Strengthen CTAs**: keep `PGPT/V2/Company-Info/` current so the assistant can route people to the right dealer, service center, or event reliably.

