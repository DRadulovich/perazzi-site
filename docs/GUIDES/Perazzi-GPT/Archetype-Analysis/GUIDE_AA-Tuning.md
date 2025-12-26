# Fine Tuning Guide for **ARCHETYPE ANALYSIS & RETRIEVAL**

---

## NAMES & DEFINITIONS:

* If you want to tune any of these, adjust the env vars below for quick changes (candidate limit, rerank toggle, archetype confidence) or edit the constants/text in the files below for deeper retuning.

---

### 1 - CANDIDATE LIMIT: 
#### MODIFY: Size of **candidateLimit** with **ENV VARS** listed below

- **EXPLANATION**
    - How many chunks are pulled from Postgres before reranking trims to the final result count. Defaults to 60 (capped at 200) when rerank is on; otherwise it just pulls the final limit (default 12).

- **ENV VARS** 
    - **`PERAZZI_ENABLE_RERANK`**
        - If turned on, the system reshuffles results after the first pass to put the most relevant ones on top; if off, you just get the raw first-pass order.
    - **`PERAZZI_RERANK_CANDIDATE_LIMIT`**
        - Caps how many items are considered in that reshuffling step; a lower number is faster but may miss some good items, a higher number is slower but can improve quality.
    * **NOTE:** Base retrieval limit when rerank is turned off is default of **12** determined by `PERAZZI_RETRIEVAL_LIMIT` 
    
- **CODE LOCATION**
    - **`src/lib/perazzi-retrieval.ts`**
        - `getRerankCandidateLimit`
        - `retrievePerazziContext`
    - **`src/lib/perazzi-zr1-flags.ts`**
        - FLAG READER

---

### 2 - ENTITY MATCHES & PLATFORM/DISCIPLINE BOOSTS: 
#### MODIFY: Scoring nudges to **entity matches** and **platform/discipline boosts**

- **EXPLANATION**
    - Small scoring nudges during rerank for chunks whose metadata aligns with the user context and hints

- **FUNCTION WEIGHTS**
    - mode match: +0.06
    - platform tag: +0.10
    - hint platform overlap: +0.08
    - discipline overlap: +0.06
    - entity/model overlap
        - Up to:
        * +0.12 (context model)
        * +0.15 (focus entity)
    - topic tags 
        * +0.06 (chunk context)
        * +0.04 (section labels)
        * +0.04 (doc tags)
    - keywords formula:
        * (formula: 0.02 + 0.01 * min(matches, 4), clamped to 0.06)
    * All function weights are literal numbers found in **`computeBoostV2`**
    * Metadata parsing and boosts live together
    * **NOTE: these boosts only run when rerank is enabled and the total boost is clamped to [-0.1, 0.5]**

    * **SIDE NOTE** Dead/legacy code version of **`computeBoost`** is not active but still in code

    
- **CODE LOCATION**
    - **`src/lib/perazzi-retrieval.ts`**
        - `computeBoostV2`


---

### 3 - ARCHETYPE BOOST: 
#### MODIFY: Hard coded **K** within the **archetypeBoost** formula

- **EXPLANATION**
    - Extra nudge when a chunk’s **`archetype_bias`** metadata aligns with the user’s archetype profile and confidence.

- **FORMULA**
    - **`K`** x **`alignment`** x **`specialization`** x **`confidence`**
    - **`K`** is currently hard-coded to **0.08**. 
        * In order to tune, edit the constant variable **`K`**
        * Confidence is bounded by the archetype threshold below in **4 - MODE PRIORS & ARCHETYPE CONFIDENCE THRESHOLD**

    
- **CODE LOCATION**
    - **`src/lib/perazzi-retrieval.ts`**
        - `computeArchetypeBoost`

---

### 4 - MODE PRIORS & ARCHETYPE CONFIDENCE THRESHOLD: 
#### MODIFY: Mode Priors are hard coded in **applyModeSignals** and use the **ENV VARS** listed below for Confidence Threshold

- **EXPLANATION**
    - **Mode priors** are the built-in starting weights for archetype inference (e.g., “prospect” adds prestige/analyst/achiever weight) before the model looks at language signals.
    - **Archetype Confidence Threshold** decides when an archetype is “strong enough” to use in the retrieval and response to the user.

- **ENV VARS**
    - **`PERAZZI_ARCHETYPE_CONFIDENCE_MIN`**
        - (Default: **0.08**) in both archetype inference and retrieval gating.

    
- **CODE LOCATION**
    - **`src/lib/perazzi-archetypes.ts`**
        - `applyModeSignals`
    - **`src/lib/perazzi-archetypes.ts`**
        * Archetype Inference
    - **`src/lib/perazzi-retrieval.ts`**
        * Retrieval Gating
        - `getArchetypeConfidenceMin` --> mirrored in **`src/lib/perazzi-zr1-flags.ts`**

---

### 5 - ARCHETYPE AWARE TEMPLATES: 
#### MODIFY: Change the literal text prompt templates that are hard coded and detailed out below 

- **EXPLANATION**
    - Response structure guides that change with intent and, when confident, the user’s archetype (e.g., analysts get comparison checklists; prestige gets curated bespoke paths). If no template matches but topics include “models,” it falls back to the neutral models template; archetype variants only apply when an archetype is confident enough to be passed in.

- **PROMPT TEMPLATES**
    - **`TEMPLATE_GUIDES`**
        - Neutral style prompt guidance based off of the following categories:
            * Models, Dealers, Service, Olympic, Heritage, & Events
            * **NOTE:** No neutral "bespoke" template exists today in order to keep neutral parity -- meaning that if there was a "bespoke" template, it would then be separated from any of the above templates, but the way it currently is, it can be "inside" of all templates.
    - **`TEMPLATE_GUIDES_BY_ARCHETYPE`**
        - More specific style prompt guidance for the following category/archetype combos (can always add more):
            * **Models Template**:
                - Analyst
                - Achiever
            * **Service Template**:
                - Legacy
            * **Bespoke Template**:
                - Prestige

    
- **CODE LOCATION**
    - **`src/lib/perazzi-intents.ts`**
        - `buildResponseTemplates`
        - `TEMPLATE_GUIDES`
        - `TEMPLATE_GUIDES_BY_ARCHETYPE`
    - **`src/app/api/perazzi-assistant/route.ts`**
        * This is where they are injected into the system prompt from when building a reply

---