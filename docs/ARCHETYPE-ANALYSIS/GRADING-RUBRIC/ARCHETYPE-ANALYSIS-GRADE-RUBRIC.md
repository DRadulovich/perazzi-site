You can treat **“Archetype Analysis V2”** like a little operating system: the only thing you’re allowed to look at is what it *outputs* to the same prompts, and you want a way to grade whether the system is behaving well **internally** (per archetype) and **relationally** (across archetypes).

Here’s the single‑document assessment I’d use. It’s built around one idea:

**Every response should share the same Perazzi “decision engine,” but express a different “human wrapper.”**
So you grade both: **invariants** (what must stay constant) and **separability** (what must differ).

---

## 1) Set up a “two-layer” scorecard per prompt

For each prompt, you score each archetype response on:

### Layer A — Core Invariants (should be consistent across all archetypes)

This answers: *Is it still correct and useful, regardless of vibe?*

A simple checklist (0/1 each, or 0–2 if you want more granularity):

1. Defines the **job/use-case** before options
2. Locks **platform/architecture** early
3. Addresses **barrels + rib** as sight picture + balance
4. Treats **fit/stock geometry** as non‑negotiable
5. Handles **gauge/frame strategy** (and future flexibility) coherently
6. Covers **chokes** (fixed vs multi) appropriately
7. Covers **trigger/serviceability** appropriately
8. Places **aesthetics last** and explains why
9. Includes **regret-prevention questions** (not just features)
10. Includes **handoff hygiene** (spec sheet, checkpoints, miscommunication prevention)

Score: **0–10**.

What you’re looking for:

* Every archetype should pass the “core” at a high rate.
* If one archetype starts dropping core steps, your archetype wrapper is eating the decision engine.

---

### Layer B — Archetype Fidelity (should differ across archetypes)

This answers: *Is it “Loyalist/Prestige/Analyst/etc.” in a way that’s recognizable and not leaky?*

For each archetype, score three things:

**1) Signal Strength (0–5)**
Does it reinforce that archetype’s motivation?

**2) Sensitivity Avoidance (0–5)**
Does it avoid what that archetype hates (price talk, hype, persuasion, mass-market framing, etc.)?

**3) Emphasis Discipline (0–5)**
Does it spend extra words in the right places (heritage vs curation vs evidence vs milestones vs stewardship), without bloating everything?

Score: **0–15** per response.

---

## 2) Add the “separability test” (the best single-source comparative tool)

This is the killer feature because it only depends on the outputs inside your doc.

### Archetype Attribution Accuracy (Blind Label Test)

* Remove the archetype headings.
* Have a grader (human or an LLM judge) answer: **“Which archetype wrote this?”** and **“Why?”**
* Score it as:

  * **2 = unmistakable**
  * **1 = plausible but could be 1–2 others**
  * **0 = indistinguishable / wrong**

Do this for all responses for that prompt.
Then compute **Separability Score** = average attribution.

What you’re looking for:

* High separability **without** sacrificing Core Invariants.
* If separability is low, your archetypes are too similar.
* If separability is high but core drops, your archetypes are “cosplay” and not product-truth.

This one metric is incredibly diagnostic.

---

## 3) Add “cross-response health checks” inside the same document

These are the “system integrity” tests. They’re not about one response; they’re about whether your whole set behaves like a coherent brand brain.

### A) Contradiction Scan (0–5)

Pick 5–8 “load-bearing decisions” and check for contradictions across archetypes:

* what gets decided first
* fixed vs adjustable rib philosophy
* when to choose gauge strategy
* fixed vs multi-choke guidance
* dealer/fitter process emphasis
* lead-time claims and sourcing style

Score:

* **5 = consistent guidance, only tone differs**
* **3 = minor differences that read as preference**
* **1 = conflicting advice that would confuse a buyer**

### B) Shared Core Consistency (0–5)

Do they all preserve the Perazzi “spine” (fit-first, architecture-first, longevity/service mindset), even if language changes?

### C) Brand Voice Cohesion (0–5)

Even with different archetypes, do they still sound like the same *brand*?
(You want “different suits, same person,” not “different people.”)

---

## 4) Add a “credibility hygiene” audit (especially if Analysts exist)

This is where a lot of otherwise-good systems quietly die.

Inside each response, highlight **hard factual claims** (numbers, standards, factory details, lead times, model specifics, “Perazzi says…”).

Score **Credibility Discipline (0–5)**:

* **5** = claims are either sourced, framed as “typical/commonly,” or avoided
* **3** = a few confident claims that might be true but are risky
* **1** = lots of specificity that could be wrong (and therefore erodes trust)

For an Analyst archetype, this matters *more* than for the others, because they punish “confident unsourced specifics.”

---

## 5) The single best “one-page” rubric to put in your document

For each prompt, make a table like this (copy/pasteable into Notion):

**Per Prompt Scorecard**

| Archetype | Core Invariants (0–10) | Archetype Fidelity (0–15) | Separability (0–2) | No Red Flags? (Y/N) | Notes (1–2 sentences) |
| --------- | ---------------------: | ------------------------: | -----------------: | ------------------- | --------------------- |
| Loyalist  |                        |                           |                    |                     |                       |
| Prestige  |                        |                           |                    |                     |                       |
| Analyst   |                        |                           |                    |                     |                       |
| Achiever  |                        |                           |                    |                     |                       |
| Legacy    |                        |                           |                    |                     |                       |

Then below it, add:

**Cross-Response Health**

* Contradiction Scan (0–5):
* Shared Core Consistency (0–5):
* Brand Voice Cohesion (0–5):
* Credibility Discipline avg (0–5):

This gives you a “single source comparative analysis” *inside one document* without needing V1 vs V2 comparisons.

---

## 6) What counts as “red flags” (fast, objective, and archetype-specific)

I’d track these as a binary “violation” list:

**Global red flags**

* Overly salesy / persuasive (“you need,” “don’t miss,” “best deal,” etc.)
* Unsafe or irresponsible guidance
* Contradictory sequencing (“aesthetics first” in one place, “aesthetics last” elsewhere)
* Overconfident factual claims with no hedging/sourcing
* Suggesting the gun will “raise scores” instead of “reduce variability” (ethically cleaner and more believable)

**Archetype leakage red flags (examples)**

* Loyalist starts talking status/rarity too much → prestige bleed
* Prestige starts using spreadsheety validation gates → analyst bleed
* Analyst starts going poetic and “lineage” heavy → loyalist bleed
* Achiever becomes preachy/rah-rah → cringe risk
* Legacy talks trendy aesthetics / “latest” framing → anti-legacy

---

## 7) The one insight that will make your grading way more sensitive

Don’t just grade “is it good.” Grade **where it spends attention**.

A simple way to do that within one doc:

* Mark each paragraph as one of: **Function / Fit / Proof / Ceremony / Identity / Stewardship / CTA**
* Then check whether each archetype’s distribution matches its intent.

Example expected “attention profile”:

* Loyalist: Identity + continuity, with solid function underneath
* Prestige: Ceremony + curation + restraint
* Analyst: Proof + gates + contradiction avoidance
* Achiever: Performance reality + pressure/fatigue + action plan
* Legacy: Stewardship + timelessness + provenance

If the distributions start converging, your archetype system is homogenizing even if the words still look different.

---

## If you want one “north star metric” per prompt

Use this trio:

1. **Core Invariants ≥ 8/10** for every archetype
2. **Separability average ≥ 1.5/2** (people can tell them apart)
3. **Contradiction Scan ≥ 4/5** (they don’t fight each other)

Hit those and your V2 is doing its job.

---