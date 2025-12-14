Below is your **“one more zoom” roadmap**: for every phase, I’m calling out **exactly what needs coding / new deps / new artifacts**, plus **a small concrete example** (schemas/config shapes, event payloads, file layouts, naming conventions, etc.) so you can infer the rest without me dumping code.

I’m grounding this in your current implemented spine: the Next.js API route orchestrates rate limit/origin checks → sanitization → intents/topics → archetype breakdown → guardrails → retrieval (Supabase pgvector) → low-confidence fallback → prompt assembly (Phase‑1 spec from disk) → OpenAI completion → logging/insights. 

---

# Phase 0 — North‑star spec lock‑in (make the “constitution” executable)

## What requires coding / new artifacts

1. **Structured “Brand Constitution” artifact** (not just prose)

* Create a **machine-readable** constitution file *plus* a human-readable one.
* Why structured: later phases will validate prompts, variants, and output against it.

**Add:**

* `brand/constitution.md` (human)
* `brand/constitution.yml` (structured)

**Example `brand/constitution.yml` (shape only)**

```yaml
brand:
  name: "Perazzi"
  identity_invariants:
    voice:
      adjectives: ["calm", "precise", "warm", "craft-respecting"]
      forbidden_tones: ["salesy", "pushy", "snarky", "FOMO-heavy"]
    factuality:
      rule: "Never change facts to fit the user lens."
    boundaries:
      - "No manufactured scarcity"
      - "No fear/shame leverage"
      - "No pretending to have personal experience"
translation_axes:
  depth: ["brief", "standard", "deep_tradeoffs"]
  proof_style: ["specs_first", "process_first", "owner_experience_first", "heritage_first"]
  stance: ["neutral_minimal", "guided_recommendation"]
  zoom: ["practical", "zoomed_out_context"]
claims:
  allowed:
    - id: "craftsmanship"
      text: "Hand-built craftsmanship"
  forbidden:
    - id: "price_guarantees"
      text: "Any pricing promise not in approved pricing docs"
```

2. **Golden Questions dataset** (for regression + QA)
   This becomes the anchor for testing “translation” without drift.

**Add:**

* `qa/golden_questions.json`

**Example entry**

```json
{
  "id": "compare_mx8_vs_mx2000",
  "question": "Compare MX8 vs MX2000 for a competitive trap shooter.",
  "must_include": [
    "tradeoffs",
    "intended use positioning",
    "fit/feel caveat",
    "service/support mention"
  ],
  "allowed_translation": {
    "proof_style": ["specs_first", "process_first", "owner_experience_first"],
    "depth": ["brief", "standard", "deep_tradeoffs"]
  },
  "forbidden": ["manufactured urgency", "price anchoring"]
}
```

3. **Constitution “lint” checks** (lightweight)
   Not full “LLM judges” yet—just basic validation:

* required fields exist
* allowed enums are valid
* forbidden tactics list exists

**Minimal dependency option:** `zod` (or JSON schema validator) to validate config objects at runtime/build time.

## Where it plugs into your existing system

* The prompt builder in `src/app/api/perazzi-assistant/route.ts` already injects Phase‑1 spec text and archetype tone guidance ; Phase 0 makes the “identity invariant” explicit and referenced by prompt assembly.

## Definition of Done

* Constitution exists in both forms (human + structured)
* Golden questions exist (25–50)
* A “lint step” fails if constitution is malformed

---

# Phase 1 — Dev Observatory vs Production Discretion (split the souls)

Your audit shows logging can store prompts/responses/context and there’s “no redaction observed”; retention and access are open questions.  
You also have admin insights pages reading `perazzi_conversation_logs`. 

## What requires coding / new deps / new artifacts

## 1) Observability levels (central switch)

**Add env var:**

* `PERAZZI_OBSERVABILITY_LEVEL=0|1|2`

  * 0 = off (prod strict)
  * 1 = metrics/events only
  * 2 = full trace (dev only)

**Add module:**

* `src/lib/observabilityPolicy.ts`

**Example policy object**

```json
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
```

## 2) Redaction/sanitization pipeline (prod safety)

Even if you keep logs minimal, you still need **URL sanitization** (paths only; remove query params), and basic PII scrubbing if any text is stored.

**Add module:**

* `src/lib/redaction.ts`

**Example redaction rules (not code)**

* `pageUrl`: keep origin + pathname only, drop query string
* `messages`: if stored at all, store only:

  * length
  * hashed fingerprint (optional)
  * extracted “features” (intents/topics, fork choices)

## 3) Separate dev logs vs prod metrics tables (optional but clean)

Right now you log to `perazzi_conversation_logs` when `PERAZZI_AI_LOGGING_ENABLED=true`. 
For the north-star, consider splitting:

* `perazzi_conversation_logs` = dev/full trace (restricted)
* `perazzi_ai_events` = prod-safe metrics only

**Example `perazzi_ai_events` schema**

```text
id (uuid)
ts (timestamp)
env (text)
session_id_hash (text)
event_name (text)  // e.g., "fork_offered", "fork_chosen", "low_confidence"
properties (jsonb) // structured, no raw text
```

## 4) Admin route protection

Audit notes no explicit auth middleware and env gating like `PGPT_INSIGHTS_ALLOW_PROD`. 

**Dependency options (choose one):**

* **Minimal**: Basic Auth middleware for `/admin/*`
* **Standard**: NextAuth / Clerk / Supabase Auth (later, you’ll want this anyway)

**Example of “minimal gate” design**

* env vars:

  * `ADMIN_BASIC_AUTH_USER`
  * `ADMIN_BASIC_AUTH_PASS`
* middleware: only applies to `/admin/pgpt-insights/*`

## Definition of Done

* A single switch can flip the whole system between:

  * DEV glass-box (debug UI + full logs)
  * PROD discreet (metrics only, no raw content storage)
* Admin routes require auth (or are physically unreachable in prod)

---

# Phase 2 — Value-Lens Model v2 (confidence + stability + baseline vs turn)

Today:

* archetype inference exists and is smoothed 0.75 prior / 0.25 new 
* confidence is not computed 
* baseline is effectively “whatever the client sends as prior vector” 

## What requires coding / artifacts

## 1) New state object for style (baseline + turn + effective)

You keep your existing 5-way vector, but wrap it in a state model.

**Add type shape (conceptual)**

```json
{
  "baseline": { "loyalist": 0.2, "prestige": 0.2, "analyst": 0.2, "achiever": 0.2, "legacy": 0.2 },
  "turn":     { "loyalist": 0.1, "prestige": 0.3, "analyst": 0.4, "achiever": 0.1, "legacy": 0.1 },
  "effective":{ "loyalist": 0.16,"prestige": 0.22,"analyst": 0.28,"achiever": 0.18,"legacy": 0.16 },
  "confidence": 0.62,
  "stability": 0.81,
  "updatedAt": "2025-12-13T12:34:56Z"
}
```

## 2) Confidence calculation (example)

Don’t overcomplicate. One clean option is entropy-based confidence.

**Example definition**

* `confidence = 1 - (entropy(vector) / log(K))` where K=5 archetypes
  Interpretation:
* close to 0 → uncertain distribution
* close to 1 → very peaked distribution

## 3) Stability calculation (example)

Stability reflects how much the vector changes per turn.

**Example definition**

* `delta = L1_norm(effective_t - effective_t-1)`
* `stability = exp(-delta / tau)` (tau is a tuning constant)

## 4) Update gating rules (example thresholds)

These turn into your “don’t drift / don’t whiplash” guardrails.

**Example gating config**

```yaml
baseline_update:
  min_confidence: 0.65
  min_stability: 0.70
  required_turns: 3
  freeze_on:
    - "topic_shift"
    - "low_confidence"
```

## 5) API contract updates

Your response already returns `archetypeBreakdown` with `primary`, `vector`, `signalsUsed`. 
You’d extend it with:

* `styleState` (baseline/turn/effective/confidence/stability)
* `controlState` placeholder (next phase)

## 6) Client persistence updates

Currently the client stores `archetypeVector` in localStorage and sends it each request. 
You’d store:

* `baselineStyleVector`
* last `effectiveStyleVector` (for stability)
* fork history/cooldowns (Phase 3)

## Definition of Done

* Every request produces:

  * turn vector
  * baseline vector
  * effective vector
  * confidence + stability
* Baseline updates are gated, not automatic

---

# Phase 3 — Conversational Control Plane v1 (human knobs, no UI knobs)

You already have reset/override phrases in the system (and reset short-circuits before retrieval/LLM). 
This phase turns “control” into a **first-class runtime component**.

## What requires coding / artifacts

## 1) Fork library as structured config (not scattered strings)

**Add:**

* `brand/forks.yml`

**Example `brand/forks.yml`**

```yaml
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
  boundary:
    prompt: "We can keep this practical—tell me if you'd rather I stop zooming out."
    options:
      practical: { zoom: "practical" }
      zoomed:    { zoom: "zoomed_out_context" }
```

## 2) Fork trigger policy (example)

Forks should be rare, triggered by signals.

**Add config:**

* `brand/forkTriggers.yml`

**Example**

```yaml
policy:
  cooldown_turns: 4
  max_forks_per_session: 4
  triggers:
    - name: "cold_start"
      when: "turn_index <= 1"
    - name: "low_confidence"
      when: "confidence < 0.55"
    - name: "user_friction"
      when: "detected_intent in ['frustration','repeat_question']"
```

## 3) Fork “envelope” in the response payload (dev mode only)

In production, forks appear as normal text.
In dev mode, you attach structured fork metadata to let testers see what happened.

**Example response addition**

```json
{
  "control": {
    "forkOffered": {
      "type": "proof_style",
      "prompt": "Do you want specs-first, or the 'why owners love it' version?",
      "options": ["specs", "story"],
      "reason": "low_confidence",
      "cooldownTurns": 4
    }
  }
}
```

## 4) Fork outcome capture

When a user responds, you detect which option they chose and update delivery prefs (translation axes), not “truth.”

**Example event**

```json
{
  "event_name": "fork_chosen",
  "properties": {
    "fork_type": "proof_style",
    "choice": "specs",
    "updated_axes": { "proof_style": "specs_first" }
  }
}
```

## Definition of Done

* Forks are **config-driven**
* Fork selection is **policy-driven**
* Fork outcomes update delivery preferences
* Dev mode shows fork internals; prod just feels like conversation

---

# Phase 4 — Evidence‑aware Translation (rerank, don’t filter)

Right now retrieval is embedding similarity with basic filters and no archetype bias. 
Your docs table already has metadata like `category` and `doc_type`. 

## What requires coding / artifacts

## 1) Metadata taxonomy + enforcement

You need a small controlled vocabulary:

* doc_type: spec | heritage | service | fitting | competition | pricing_sensitive | …
* proof_type: data | process | narrative | authority | historical
* lifecycle_stage: prospect | owner | service | upgrade | legacy

**Add:**

* `corpus/taxonomy.yml`

**Example**

```yaml
doc_type: [spec, heritage, service, fitting, competition, pricing_sensitive]
proof_type: [data, process, narrative, authority, historical]
lifecycle_stage: [prospect, owner, service, upgrade, legacy]
```

## 2) Style affinity map (how style influences ranking)

**Add:**

* `brand/evidenceAffinity.yml`

**Example**

```yaml
affinity:
  doc_type:
    spec:      { analyst: 0.30, achiever: 0.10 }
    heritage:  { legacy: 0.25, prestige: 0.15, loyalist: 0.10 }
    service:   { loyalist: 0.20, analyst: 0.10 }
    competition:{ achiever: 0.25, analyst: 0.10 }
```

## 3) Rerank policy (bounded boost)

**Example policy definition**

* retrieve top N by similarity (unchanged)
* compute affinityScore = dot(styleVector, docAffinityVector)
* finalScore = similarity + clamp(affinityScore * 0.05, -0.02, +0.05)

That cap is what prevents “pretty narrative beats correct spec.”

## 4) Regression checks with Golden Questions

You already have a low-confidence fallback when retrieval scores are weak. 
Add tests that assert:

* required doc_types appear in top results for each golden question
* rerank never removes the must-have evidence

**Example “expectation record”**

```json
{
  "golden_id": "compare_mx8_vs_mx2000",
  "expected_doc_types_in_top5": ["spec", "competition"],
  "must_have_min_similarity": 0.60
}
```

## Definition of Done

* Corpus is consistently tagged
* Rerank is bounded and test-covered
* Evidence ordering changes by lens, but truth coverage stays constant

---

# Phase 5 — Multi‑surface Experience v1 (prewritten variants first)

## What requires coding / new dependencies / artifacts

## 1) Content variant storage

Two practical routes:

### Route A: MDX / file-based (fastest)

**Add directory pattern**

* `content/blocks/<blockName>/<variant>.mdx`

**Example**

* `content/blocks/homeHero/neutral.mdx`
* `content/blocks/homeHero/analyst.mdx`
* `content/blocks/homeHero/legacy.mdx`

**Example frontmatter**

```yaml
---
block: homeHero
variant: analyst
invariants:
  - "No pricing claims"
  - "No urgency language"
allowed_axes:
  - proof_style
  - depth
---
```

### Route B: Headless CMS (later scale)

**New dependency/service**

* Sanity / Contentful / etc.
  Same idea: block records with variant fields.

## 2) Variant selection policy

Selection is deterministic and confidence-aware:

* if confidence < threshold → neutral
* else pick top archetype or a weighted blend (start simple: top archetype)

**Example config**

```yaml
variant_selection:
  min_confidence: 0.60
  fallback: neutral
  strategy: "top_archetype"
```

## 3) Rendering integration

* Site pages request `effectiveStyleVector` (from chat/session context)
* Use it to select variants for the handful of blocks you chose

## 4) Dev observability hook

In dev mode, show a subtle debug badge:

* “Variant: homeHero/analyst (confidence 0.72)”
  In prod: nothing.

## Definition of Done

* 3–5 high leverage blocks have variants
* Selection uses effective style + confidence gating
* “Many doorways, one room” is enforced by review checklist + invariants

---

# Phase 6 — Accounts + Lifecycle Copilot (only when you want relationship-grade continuity)

Audit notes no auth framework and anonymous requests; `userId` is null and identity is sessionId localStorage. 

## What requires coding / new dependencies / new artifacts

## 1) Auth provider decision (new dependency)

Pick one:

* NextAuth (self-managed)
* Clerk (managed)
* Supabase Auth (fits your Supabase footprint)

## 2) New DB tables (examples)

### `user_profiles`

```text
user_id (uuid pk)
created_at
baseline_style_vector (jsonb)
personalization_level (text)  // "none" | "light" | "full"
consent_behavioral_signals (bool)
retention_days (int)
```

### `service_records` (if you go there)

```text
id (uuid pk)
user_id (uuid fk)
gun_serial (text)
service_type (text)
performed_at (date)
notes (text)
attachments (jsonb)
```

## 3) Row Level Security (Supabase)

RLS policies so users only access their own rows—this becomes mandatory once you store anything personal.

## 4) UI settings (here is where knobs belong)

In account settings:

* personalization level
* memory retention
* export/delete

This keeps the concierge experience knob-free, while accounts are explicit “technology.”

## Definition of Done

* Auth works
* User profiles exist
* Consent flags exist
* Users can reset/delete/export profile data

---

# Phase 7 — Experimentation + Measurement (prove the thesis without becoming creepy)

Audit suggests monitoring items like spikes in reset/override usage, oscillating vectors, low-confidence frequency, etc. 

## What requires coding / deps / artifacts

## 1) Feature flag system

Start simple:

* config-driven flags (env or JSON)
  Later:
* DB-driven flags with targeting

**Example `config/flags.yml`**

```yaml
flags:
  forks_enabled: true
  evidence_rerank:
    enabled: true
    max_boost: 0.05
  site_variants:
    enabled: true
    min_confidence: 0.60
```

## 2) Metrics event stream (prod-safe)

If you don’t want external analytics yet, store in DB.

**Example events**

* `fork_offered`
* `fork_chosen`
* `low_confidence_triggered`
* `variant_selected`
* `guardrail_blocked`
* `session_reset_requested`

**Example event payload**

```json
{
  "event_name": "low_confidence_triggered",
  "properties": {
    "similarity": 0.42,
    "mode": "prospect",
    "confidence": 0.51
  }
}
```

## 3) Experience-native KPIs (artifact)

Create a doc:

* `docs/metrics/experience-kpis.md`

Define metrics that match your thesis:

* turns-to-clarity
* repeat-question rate
* reset rate
* “helpful?” micro feedback
* return rate

## Definition of Done

* You can flip forks/rerank/variants on/off
* You can compare outcomes using only prod-safe metrics
* You can defend “this feels better” with numbers

---

# One final meta-pattern that makes all this buildable

When you’re implementing each phase, add **one new “contract object”** to your pipeline at a time, rather than sprinkling logic everywhere.

Your current pipeline already returns structured metadata (`archetypeBreakdown`, intents/topics, guardrail status, similarity, etc.). 
Keep that style:

* Phase 2 introduces `styleState`
* Phase 3 introduces `control`
* Phase 4 adds `evidencePolicy`/rerank metrics
* Phase 5 adds `variantSelection`
* Phase 7 adds `events`

That’s how you stay scalable and keep the aura intact in production.

If you want, next we can turn this into a single “Implementation Checklist” doc you can literally paste into your repo (like `docs/ROADMAP/translation-layer-roadmap.md`) with checkboxable items per phase—still no code, but very build-operational.