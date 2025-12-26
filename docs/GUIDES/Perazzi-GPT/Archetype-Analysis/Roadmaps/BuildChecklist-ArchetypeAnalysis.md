# translation-layer-roadmap.md

Status: Draft (macro → buildable)  
Last updated: 2025-12-13  
Owner: You  
Purpose: Evolve PerazziGPT v2 into an AI-native “Translation Layer / Brand Experience OS” where:
- Brand identity stays fixed (truth + voice invariants).
- Delivery adapts (depth, proof style, structure, pacing, metaphors, emphasis).
- Agency exists, but “knobs” are conversational, not UI (until accounts/settings later).
- Evidence stays king (RAG/citations remain the anchor).
- Dev is a glass box; prod is discreet and calm.

---

## 0) Baseline: what this roadmap assumes exists today

Per the current architecture, the system already has:
- A Next.js API route orchestrating: sanitize → intents/topics → archetype inference (5-way vector + smoothing) → guardrails → retrieval (Supabase pgvector) → low-confidence fallback → prompt assembly → OpenAI completion → optional logging.
- Client stores session context (incl. archetype vector) in localStorage and POSTs each request.
- Admin/insights pages exist for reviewing conversations in dev.
- Archetype influences tone/relatability guidance in prompt (not retrieval bias).

If any of these are not true in the repo, update this roadmap before building.

---

## 1) Non-negotiable principles (the compass)

If a feature violates these, it doesn’t ship.

1) Identity invariant
   - Translation may not alter facts, claims, promises, or safety posture.

2) Translation ≠ mirroring
   - Adapt delivery, not “personality cosplay” or audience-segmentation marketing vibes.

3) Agency without UI knobs
   - Control surfaces are linguistic and natural (“quick vs deep”, etc.).
   - UI settings are allowed later only inside explicit accounts.

4) Never narrate tracking
   - Behavioral signals (if used) are invisible in conversation.
   - The assistant must not say “I noticed you hovered…” or anything like it.

5) Evidence > vibes
   - Retrieval relevance beats storytelling in technical contexts.

6) Dev ≠ prod
   - Debug overlays + full traces never leak into production.

---

## 2) Contracts-first build pattern (how we keep this scalable)

Each phase introduces at most ONE new “contract object” and wires it end-to-end.
This prevents logic sprawl and keeps the system debuggable.

Contract objects to introduce over time:
- styleState: baseline/turn/effective + confidence/stability
- control: fork offered/chosen, boundary phrases, cooldowns
- evidencePolicy: rerank bounds + doc metadata expectations
- variantSelection: which site variant rendered + why
- events: prod-safe telemetry stream (feature-level metrics only)

---

# Phase 0 — Constitution + Golden Questions (make the idea executable)

## Goal
Turn “translation layer” into an executable spec: constraints + allowed degrees of freedom + regression set.

## Deliverables (artifacts)
- brand/constitution.md (human-readable)
- brand/constitution.yml (structured, machine-readable)
- brand/translation-adapter.yml (translation axes + allowed ranges)
- qa/golden_questions.json (canonical Q → must-include facts → allowed translation)
- qa/golden_expectations.json (expected doc_types/citations where applicable)

## Build checklist
[ ] Create brand/constitution.md with:
    - Identity invariants (truth, claims, tone bounds)
    - Forbidden tactics (fear/shame/FOMO/manufactured urgency/scarcity)
    - “Many doorways, one room” rule for variants (same truth, different entrances)
    - “Never narrate tracking” rule

[ ] Create brand/constitution.yml (structured)
    Example shape:
      brand:
        name: "Perazzi"
        identity_invariants:
          factuality: "Never change facts to fit a user lens."
          voice:
            adjectives: ["calm","precise","warm","craft-respecting"]
            forbidden_tones: ["salesy","pushy","FOMO-heavy","snarky"]
          forbidden_tactics:
            - "manufactured scarcity"
            - "fear/shame leverage"
            - "coercive urgency loops"
      translation_axes:
        depth: ["brief","standard","deep_tradeoffs"]
        proof_style: ["specs_first","process_first","owner_experience_first","heritage_first"]
        stance: ["neutral_minimal","guided_recommendation"]
        zoom: ["practical","zoomed_out_context"]

[ ] Create brand/translation-adapter.yml
    - Defines allowed adaptation axes
    - Defines default delivery plan per lens (not just tone)

[ ] Create qa/golden_questions.json (25–50 questions)
    Example entry:
      {
        "id": "compare_mx8_vs_mx2000",
        "question": "Compare MX8 vs MX2000 for a competitive trap shooter.",
        "must_include": ["tradeoffs","fit/feel caveat","service/maintenance mention"],
        "allowed_translation_axes": ["depth","proof_style","stance"],
        "forbidden": ["manufactured urgency","price anchoring"]
      }

[ ] Add a “constitution lint” step (lightweight)
    - Validate required fields exist
    - Validate enums match known values
    - Fail CI/dev start if malformed

## Definition of Done
- Constitution exists (human + structured)
- Translation axes are explicitly enumerated
- Golden questions exist and are reviewable
- A lint step prevents malformed constitution/config from shipping

## Common failure modes
- Writing values without enforceable constraints (“be ethical” isn’t executable)
- Allowing loopholes (“urgency is just framing”) that reintroduce dark patterns

---

# Phase 1 — Dev Observatory vs Production Discretion (split the souls)

## Goal
Keep your dev microscope (for tuning + reviewer visibility) while production stays calm and discreet.

## New dependency (optional)
- Config validation (zod/json-schema) if you don’t already have it
- Basic auth middleware or a proper auth provider for admin protection (choice later)

## Deliverables (artifacts + switches)
- PERAZZI_OBSERVABILITY_LEVEL=0|1|2 (runtime switch)
- src/lib/observabilityPolicy.* (single source of truth)
- src/lib/redaction.* (URL sanitization, minimal PII scrubbing)
- Optional: perazzi_ai_events table for prod-safe telemetry

## Build checklist
[ ] Add PERAZZI_OBSERVABILITY_LEVEL with semantics:
    - 0: Off (prod strict)
    - 1: Metrics/events only (prod-safe)
    - 2: Full trace (dev only)

[ ] Create an observability policy object
    Example shape:
      {
        "level": 1,
        "allow": {
          "store_raw_messages": false,
          "store_prompt": false,
          "store_response": false,
          "store_pageUrl": "sanitized_only",
          "store_vectors": true,
          "store_retrieval_chunk_text": false,
          "store_retrieval_chunk_ids": true
        }
      }

[ ] Add redaction/sanitization rules:
    - pageUrl: keep origin + pathname, drop query + fragment
    - if text is ever stored in prod: store derived features, not raw

[ ] Split logging channels (recommended):
    - Dev-only: full conversation logs (restricted access)
    - Prod: events/metrics only (no raw messages by default)

[ ] Protect admin routes (/admin/*):
    - Minimal: basic auth + non-indexing
    - Later: full auth provider

[ ] Add minimum regression checks:
    - guardrails still fire correctly
    - reset behavior works and short-circuits
    - observability policy is enforced (no accidental full logs in prod)

## Definition of Done
- Same system runs in two modes: dev glass-box vs prod discreet
- Admin is protected
- A regression test prevents debug leakage into prod

## Common failure modes
- Shipping dev dashboards/overlays to prod (aura killer)
- Using production logs as a convenience instead of a contract

---

# Phase 2 — Value-Lens Model v2 (confidence + stability + baseline vs turn)

## Goal
Upgrade archetype from “tone hint” into a reliable preference model that drives translation safely.

## New contract object
- styleState

## Deliverables
- turnVector (fast-moving)
- baselineVector (slow-moving; session-level first)
- effectiveVector = mix(baseline, turn)
- confidence (uncertainty scalar)
- stability (whiplash scalar)
- gating rules for baseline updates (no drift)

## Build checklist
[ ] Define styleState shape
    Example shape:
      {
        "baseline":  {"loyalist":0.2,"prestige":0.2,"analyst":0.2,"achiever":0.2,"legacy":0.2},
        "turn":      {"loyalist":0.1,"prestige":0.3,"analyst":0.4,"achiever":0.1,"legacy":0.1},
        "effective": {"loyalist":0.16,"prestige":0.22,"analyst":0.28,"achiever":0.18,"legacy":0.16},
        "confidence": 0.62,
        "stability": 0.81
      }

[ ] Define confidence computation (document it)
    - Recommendation: entropy-based confidence (peaked distribution = higher confidence)

[ ] Define stability computation (document it)
    - Recommendation: based on vector delta over time, mapped to [0..1]

[ ] Define gating thresholds in config (not scattered constants)
    Example gating config:
      baseline_update:
        min_confidence: 0.65
        min_stability: 0.70
        required_turns: 3
        freeze_on: ["topic_shift","low_confidence"]

[ ] Update client persistence schema:
    - store baseline vector + last effective vector locally
    - keep reset phrase as an “invisible exit door”
    - in prod: keep it anonymous unless accounts exist

## Definition of Done
- Every response has styleState (baseline/turn/effective/confidence/stability)
- Baseline drift is controlled (no whiplash, no overfitting to browsing)
- Dev can visualize; prod keeps it invisible

## Common failure modes
- Overweighting pageUrl/modelSlug so browsing feels like surveillance
- Making baseline too sticky so the system can’t flex with context

---

# Phase 3 — Conversational Control Plane v1 (“coded but human knobs”)

## Goal
Provide agency without UI knobs: rare, natural forks that self-calibrate delivery.

## New contract object
- control

## Deliverables
- Fork library (config-driven)
- Fork trigger policy (config-driven)
- Cooldowns + max-per-session constraints
- Fork interpreter updates translation axes (delivery prefs) only
- Boundary phrases (“keep it neutral”, etc.) behave reliably

## Build checklist
[ ] Create brand/forks.yml (fork library)
    Example shape:
      forks:
        depth:
          prompt: "Want the quick answer, or the detailed version with tradeoffs?"
          options:
            brief:    { depth: "brief" }
            detailed: { depth: "deep_tradeoffs" }
        proof_style:
          prompt: "Do you want specs-first, or the 'why owners love it' version?"
          options:
            specs: { proof_style: "specs_first" }
            story: { proof_style: "owner_experience_first" }

[ ] Create brand/forkTriggers.yml (trigger policy)
    Example shape:
      policy:
        cooldown_turns: 4
        max_forks_per_session: 4
        triggers:
          - name: "cold_start"
            when: "turn_index <= 1"
          - name: "low_confidence"
            when: "confidence < 0.55"
          - name: "user_friction"
            when: "intent == 'frustration' OR repeat_question == true"

[ ] Add control metadata in dev observatory only
    Example response metadata:
      {
        "control": {
          "forkOffered": {
            "type": "proof_style",
            "reason": "low_confidence",
            "options": ["specs","story"],
            "cooldownTurns": 4
          }
        }
      }

[ ] Define boundary phrases (small set) and behavior:
    - “keep it neutral” → reduce personalization strength / default variant
    - “just the facts” → enforce neutral_minimal stance
    - “short version” → enforce brief depth
    - “stop zooming out” → enforce practical zoom

[ ] Ensure forks are rare and not survey-like:
    - one fork max per N turns
    - one fork max in first 1–2 turns unless confidence remains low

## Definition of Done
- Forks are config-driven, rare, and effective
- Users can steer without UI
- Dev reviewers can audit fork behavior; prod just feels natural

## Common failure modes
- Over-forking (becomes a questionnaire)
- Fork language that reveals profiling (“I think you’re an Analyst”) and kills aura

---

# Phase 4 — Evidence-aware Translation (rerank, don’t filter)

## Goal
Personalization touches evidence ordering/structure safely, without reducing factual relevance.

## New contract object (light)
- evidencePolicy (or evidenceRerankMetrics)

## Deliverables
- Corpus taxonomy (small, strict vocabulary)
- Evidence affinity map (style → doc_type preferences)
- Bounded rerank policy (cap boost)
- Golden question regression for retrieval relevance

## Build checklist
[ ] Create corpus/taxonomy.yml
    Example:
      doc_type: [spec, heritage, service, fitting, competition, pricing_sensitive]
      proof_type: [data, process, narrative, authority, historical]
      lifecycle_stage: [prospect, owner, service, upgrade, legacy]

[ ] Ensure documents/chunks are tagged consistently
    - If missing tags: safe fallback (no bias)

[ ] Create brand/evidenceAffinity.yml
    Example:
      affinity:
        doc_type:
          spec:        { analyst: 0.30, achiever: 0.10 }
          heritage:    { legacy: 0.25, prestige: 0.15, loyalist: 0.10 }
          competition: { achiever: 0.25, analyst: 0.10 }

[ ] Define rerank policy (bounded boost)
    - Retrieve top N by similarity (unchanged)
    - Compute affinityScore from styleState.effective
    - finalScore = similarity + clamp(affinityScore * BOOST, -MIN, +MAX)
    - Cap boost so similarity still dominates

[ ] Add golden expectations for evidence:
    - expected doc_types in top results for key questions
    - rerank never removes must-have evidence

## Definition of Done
- Same question → different evidence ordering by lens → same factual coverage
- No regressions where “story beats spec” in technical contexts

## Common failure modes
- Over-biasing retrieval so relevant evidence disappears
- Overcomplicating taxonomy (start small, expand only when needed)

---

# Phase 5 — Multi-surface Experience v1 (site variants, prewritten first)

## Goal
Chat + site feel like one coherent concierge world.

## New contract object
- variantSelection

## Deliverables
- 3–5 high-leverage content blocks with 2–5 prewritten variants each
- Variant selection policy (confidence-gated)
- Governance: invariants per block (“many doorways, one room”)

## Build checklist
[ ] Choose a variant storage strategy
    Option A (fast): file-based MDX
      content/blocks/<blockName>/<variant>.mdx
    Option B (later): headless CMS with variant fields

[ ] Start with 3–5 blocks:
    - homepage hero
    - “why Perazzi” section
    - model page intro
    - service/maintenance overview

[ ] Each block variant includes invariants + allowed axes
    Example frontmatter (conceptual):
      block: homeHero
      variant: analyst
      invariants:
        - "No pricing promises"
        - "No urgency language"
      allowed_axes:
        - proof_style
        - depth

[ ] Variant selection policy (confidence-aware)
    Example config:
      variant_selection:
        min_confidence: 0.60
        fallback: neutral
        strategy: top_archetype

[ ] Dev observability only:
    - Show which variant was selected and why
    - Prod: show nothing mechanical

## Definition of Done
- 3–5 blocks have variants
- Confidence gating prevents personalization when uncertain
- Site + chat feel coherent as one experience

## Common failure modes
- Generating site copy dynamically too early (brand drift risk)
- Chat feels bespoke but site stays generic (experience dissonance)

---

# Phase 6 — Accounts + Lifecycle Copilot (optional, later)

## Goal
Relationship-grade continuity (service records, purchases, personalization controls) with explicit consent.

## New dependency (choose one)
- NextAuth OR Supabase Auth OR Clerk

## Deliverables
- Auth + identity
- user_profiles table (baseline vector + consent + retention)
- RLS policies for user-owned data
- Settings UI (knobs belong here)

## Build checklist
[ ] Add auth provider and identity primitives
[ ] Create user_profiles table (conceptual fields):
    - user_id (pk)
    - baseline_style_vector (json)
    - personalization_level: "none" | "light" | "full"
    - consent_behavioral_signals (bool)
    - retention_days (int)

[ ] Add RLS policies (Supabase) so users only access their own rows

[ ] Build account settings:
    - personalization level
    - retention window
    - export/delete profile

## Definition of Done
- Users can choose the depth of relationship
- Users can reset/export/delete their profile
- Concierge experience stays knob-free unless logged in

## Common failure modes
- Building accounts before the translation experience is already “magical”
- Letting lifecycle data become persuasion leverage

---

# Phase 7 — Experimentation + Measurement (prove “performance through experience”)

## Goal
Validate the hypothesis with metrics that match the thesis (clarity + trust), not shallow CTR.

## New contract object
- events (prod-safe telemetry)

## Deliverables
- Feature flags for forks/rerank/variants
- Prod-safe event stream (no raw text by default)
- Experience-native KPI definitions

## Build checklist
[ ] Add config/flags.yml
    Example:
      flags:
        forks_enabled: true
        evidence_rerank:
          enabled: true
          max_boost: 0.05
        site_variants:
          enabled: true
          min_confidence: 0.60

[ ] Implement prod-safe events:
    Events to include:
      - fork_offered
      - fork_chosen
      - reset_requested
      - low_confidence_triggered
      - variant_selected
      - guardrail_blocked

    Example event payload:
      {
        "event_name": "variant_selected",
        "properties": {
          "block": "homeHero",
          "variant": "analyst",
          "confidence": 0.72
        }
      }

[ ] Add docs/metrics/experience-kpis.md with:
    - turns-to-clarity
    - repeat-question rate
    - reset/neutralization rate
    - low-confidence frequency
    - helpfulness micro-feedback
    - return rate (non-creepy)

## Definition of Done
- You can flip forks/rerank/variants on/off
- You can compare outcomes with prod-safe metrics
- You can defend “this works” with evidence

## Common failure modes
- Measuring only conversions and drifting into manipulation
- Collecting too much data “just in case”

---

## Milestone plateaus (recommended ship points)

Plateau A (Private Alpha): Phase 0 + Phase 1 + Phase 2  
Plateau B (Beta Concierge): + Phase 3  
Plateau C (Evidence Translation): + Phase 4  
Plateau D (Coherent World): + Phase 5  
Plateau E (Relationship-grade): + Phase 6 + Phase 7

---

## “Don’t do this” list (how to accidentally ruin the vibe)

- Don’t ship site-wide dynamic generation before prewritten variants + constitution enforcement.
- Don’t mention behavioral tracking in chat (“I noticed you hovered…”).
- Don’t let dev dashboards/debug overlays leak into production.
- Don’t optimize for shallow CTR metrics if your thesis is “felt relief.”
- Don’t add more signals until confidence/stability/control plane are working.

---

## Appendix: Artifact index by phase (quick reference)

Phase 0:
- brand/constitution.md
- brand/constitution.yml
- brand/translation-adapter.yml
- qa/golden_questions.json
- qa/golden_expectations.json

Phase 1:
- src/lib/observabilityPolicy.*
- src/lib/redaction.*
- optional: perazzi_ai_events table + admin auth gate

Phase 2:
- styleState contract in API payload + local persistence schema updates

Phase 3:
- brand/forks.yml
- brand/forkTriggers.yml
- control contract object + fork event instrumentation

Phase 4:
- corpus/taxonomy.yml
- brand/evidenceAffinity.yml
- rerank policy + golden evidence regression expectations

Phase 5:
- content/blocks/** variants (MDX) or CMS schema
- variantSelection contract + dev-only selection trace

Phase 6:
- auth dependency + user_profiles table + RLS + settings UI

Phase 7:
- config/flags.yml
- docs/metrics/experience-kpis.md
- prod-safe events stream + analysis dashboards/scripts
