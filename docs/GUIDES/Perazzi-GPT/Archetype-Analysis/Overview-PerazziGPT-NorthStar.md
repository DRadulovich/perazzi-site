## 1) Non‑developer speak: what you want as the product + north‑star

Here’s what I think you’re hiring me to build, stated plainly:

You want a **website experience that feels like a world‑class human concierge for the brand**—calm, patient, knowledgeable, and deeply “gets me”—but **without the brand shape‑shifting** or turning into a manipulative marketing machine.

The magic trick is this:

* **Brand identity stays fixed.**
* **The “delivery” adapts** to how a visitor recognizes value (proof vs story, specs vs meaning, mastery vs heritage, etc.).
* The assistant uses **subtle, human‑sounding conversational forks** (“quick vs deep”, “specs-first vs story-first”) to stay aligned—so the user has agency, but it never feels like a settings panel.

Your north‑star experience looks like:

* A visitor lands on the site and—whether they’re chatting or browsing—everything feels **coherent, on‑brand, and tailored in *presentation***.
* They feel **relief**, not overwhelm.
* They feel **understood**, not tracked.
* They leave thinking: *“That was unusually good. Those people are serious.”*

And crucially: this isn’t “personalization for conversion.” It’s **translation for clarity**, with ethical constraints that keep the system from becoming dark‑pattern personalization.

You already have a strong “prototype spine” for this: a Next.js concierge chat with RAG, archetype inference, guardrails, and logging/instrumentation for testing. 

---

## 2) Developer speak: what’s required to build the true end‑state system

I’m going to describe this like a technical design doc for the north‑star system—not just “improve archetypes,” but **turn your current PerazziGPT v2 pipeline into an AI‑native brand experience layer**.

### 2.1 Current foundation you already have (important because we can build on it)

Per your audit, the existing runtime pipeline is already a clean orchestrator:

1. rate‑limit + origin allowlist
2. validate + sanitize messages
3. infer intents/topics + effective mode
4. reset/override detection
5. compute archetype breakdown (heuristics + smoothing)
6. guardrail checks
7. retrieval (pgvector Supabase)
8. low‑confidence fallback
9. system prompt assembly (Phase‑1 spec + archetype tone/bridge)
10. OpenAI completion
11. optional logging (console/DB/file) 

Also: archetype is currently **tone-only** in the system prompt; retrieval is not archetype-biased. 

Archetype inference is a **5-way normalized vector** (loyalist/prestige/analyst/achiever/legacy), updated via heuristics and smoothed with 0.75 prior / 0.25 new. 

The client currently persists context + prior archetype vectors in localStorage and POSTs them each request.  

LLM provider is OpenAI (default `gpt-4.1`) and embeddings default `text-embedding-3-large`. 

This matters because the end-state system should treat what you have as:

* a **routing + safety chassis**
* plus a **first-pass “value lens” inference head**
* plus an **evaluation/logging harness** (dev)

---

### 2.2 The north‑star architecture (the “brand experience OS”)

To hit your end goal, we need **four major layers**:

#### Layer A — Brand Constitution (identity invariant)

This is the “non‑negotiable” foundation you kept pointing at: a machine‑enforceable definition of what *cannot change*.

Concretely, this becomes a **policy+style spec** that the runtime enforces:

* **Claim constraints** (allowed claims, forbidden claims, pricing sensitivity handling)
* **Tone constraints** (Perazzi voice boundaries)
* **Ethical constraints** (no fear/shame/FOMO pressure loops)
* **Disclosure constraints** (never mention behavioral tracking signals in conversation)
* **Safety constraints** (legal, gunsmithing limits, etc.)

In code terms, this should not be just “prompt text.” It should be:

* a versioned config artifact (YAML/JSON/MD with structured sections)
* validated by tests
* referenced by the prompt builder and guardrail router

You already have guardrails and prompt assembly pulling Phase‑1 spec content in the API route.  
The upgrade is: make the constitution **explicit, structured, testable, and auditable**.

---

#### Layer B — Value‑Lens Model (preference inference)

Your current archetype vector is the right “primitive,” but the end state requires a more formal model with uncertainty and time-scales.

**Data model:**

* `turn_style_vector` (fast-moving, per-request)
* `baseline_style_vector` (slow-moving, per-session or per-account)
* `effective_style_vector = mix(baseline, turn)` where mixing weights depend on confidence/stability and task class

**Required model primitives:**

* **uncertainty**: e.g., entropy/confidence computed from the vector (currently “none computed” in your doc) 
* **stability**: rolling norm of vector deltas; detects whiplash
* **update gating**: only update baseline when confidence is high for N turns (or with explicit user account consent)

**Signal ingestion (conceptual):**

* conversational signals (you already have: latest message language + context signals like pageUrl/modelSlug/mode) 
* optional behavioral signals (dwell/revisit/scroll), BUT used only as internal ranking/ordering input; never surfaced in chat

**Storage choices:**

* anonymous: local-only baseline (localStorage / encrypted cookie)
* logged-in: user profile table storing baseline vector + consent flags + retention policy

Right now you have no auth framework and session-level identity only (sessionId in localStorage; userId null). 
That’s fine for an experiment; the north-star production version needs a clean identity layer if you want cross-session continuity.

---

#### Layer C — Conversational Control Plane (“coded but human” knobs)

This is the heart of what you described: *the UX knobs must be linguistic, not UI*.

Technically, this becomes a **Conversation Policy Engine** that decides when to offer a “fork,” which fork to offer, and how to interpret the user’s response.

**You build this as:**

* a classifier/router that outputs a `conversation_control` object per turn, e.g.:

```ts
type ControlFork =
  | { type: "depth"; options: ["brief", "detailed_tradeoffs"] }
  | { type: "proof_style"; options: ["specs_first", "owner_experience_first"] }
  | { type: "stance"; options: ["neutral_minimal", "contextual_guidance"] }
  | { type: "boundary"; options: ["keep_zoomed_out", "keep_practical"] };

type ConversationControl = {
  shouldOfferFork: boolean;
  fork?: ControlFork;
  reason: "low_confidence" | "topic_shift" | "user_frustration" | "high_entropy_style" | "new_session" | ...;
  cooldownTurns: number;
};
```

**Trigger heuristics (first pass):**

* high entropy (low confidence) on `effective_style_vector`
* user friction signals: “just tell me”, “stop”, repeated follow-up loops
* new session cold start
* detected “decision point” intent (compare models, select config, etc.)
* response length mismatch (user wants short; assistant keeps going long)

**Interpretation (very important):**

* The user’s answer to the fork should update the **delivery preference**, not the **truth content**.
* The fork should also act as an implicit consent/agency valve: “keep it neutral,” “keep it practical,” etc.

You already have natural-language reset and override phrases in dev; the production version generalizes this into a richer set of *human boundary utterances*, still conversational.  

---

#### Layer D — Multi‑surface Experience Layer (chat + site copy + content)

This is where your vision becomes more than “a great assistant.”

You want the **site itself** to adapt in presentation while remaining identity-consistent.

There are two safe patterns:

##### Pattern 1: Prewritten variants (recommended early)

* Author 2–5 variants per content block keyed to archetype/value lens (Analyst vs Legacy, etc.)
* System selects variant using `effective_style_vector`
* Guarantees identity integrity and avoids hallucinated marketing copy

**Implementation requirements:**

* CMS/content store that supports variants (Sanity, Contentful, MDX, etc.)
* runtime selector:

  * `variant = argmax(effective_style_vector · variant_profile_vector)`
* caching strategy (edge, ISR, etc.) so personalization doesn’t kill performance

##### Pattern 2: Constrained generation (later, and only if needed)

* allow generation only inside strict templates:

  * structure fixed
  * allowed claims fixed
  * citations required for factual assertions
* run a policy validator on the output before rendering

Given your current setup already has RAG + guardrails + low-confidence fallbacks, you have the bones of a constrained generation pipeline. 

---

### 2.3 Retrieval and evidence: make “translation” evidence-aware (optional but powerful)

Today retrieval is pure similarity + filters, with no archetype bias. 

For the north star, the safe way to improve relevance-by-lens is:

1. retrieve top N by similarity (do not filter away relevant docs)
2. apply a small reranking boost based on doc metadata alignment (doc_type/category) and `effective_style_vector`
3. cap boost so similarity still dominates (prevents “pretty story beats correct spec”)

This requires:

* metadata hygiene in the corpus (`doc_type`, `category`, lifecycle stage tags)
* reranker scoring function (deterministic, testable)
* regression tests to ensure ground truth relevance isn’t degraded

Your audit indicates the corpus is in Supabase `public.documents/chunks/embeddings` with visibility/status filters already. 

---

### 2.4 Observability, evaluation, and “does this actually outperform?”

You can’t claim “performance through experience” unless you can measure it without becoming creepy.

**Key principle:** log *features* and *outcomes*, not raw personal content (outside dev).

You currently can log prompts/responses and context when enabled, and the audit notes no redaction observed + retention unspecified.  
That’s okay for dev, but the end-state needs:

* PII redaction pipeline (URLs, emails, phones, names where feasible)
* retention policy (time-based deletion)
* access controls / RLS if multi-tenant
* explicit separation: `dev_debug_logs` vs `prod_metrics_events`

**Metrics that match your thesis (examples):**

* “turns to clarity” (how many back-and-forth turns until user stops asking the same thing)
* “helpfulness proxy” (thumbs up/down, or “was this what you needed?” single-tap)
* repeat visits / return-to-chat rate
* reduction in low-confidence fallbacks
* override/reset rates (if users keep neutralizing, you’re annoying them)
* referral/advocacy proxies (share link, “send to friend” clicks)

---

### 2.5 Security + abuse resistance (necessary once it’s real traffic)

Your current mitigations include rate limiting + origin allowlist, guardrail filters, and low-confidence fallback.  

North-star hardening requires:

* auth + authorization for admin dashboards (today it’s environment-gated; no explicit auth middleware noted)  
* prompt-injection and retrieval-injection regression tests (explicitly called out as missing tests in the audit) 
* gating any “override” mechanisms to dev/admin only (your audit flags override phrase abuse risk if exposed) 

---

## The punchline (developer summary)

To build your north‑star product, we’re not “building an archetype model.”

We’re building a **Brand Voice Compiler**:

* Input: brand constitution + curated corpus + user’s current question + inferred value lens + conversational control state
* Output: an on-brand, evidence-grounded response (and eventually on-brand adaptive site content) that feels human, not engineered

And the key technical leap is:
**turn “coded but human” conversational forks into a first-class control plane**, so users can steer depth/proof/stance/boundaries naturally—without a settings UI—while the brand stays coherent and the system remains auditable and safe.

If you want the cleanest next step after this: I’d formalize your north-star into a one-page “Product Constitution” + “Brand Constitution,” then map each clause to the exact runtime components that enforce it (prompt builder, guardrails, control plane, retrieval policy, logging policy). That’s how you keep the soul intact as the system grows.
