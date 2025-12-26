## CODEX TASK CARD PASS

### 1) Section 5 — Objective

**Phase 4: Make archetype shape response structure (not just tone).**
Upgrade template selection so response “architecture” (what leads, how it’s structured) can vary by **intent + archetype** (e.g., `models + analyst` gets comparison + decision criteria + how-to-test), while **never labeling the user** and **falling back to neutral templates** when archetype confidence is mixed/balanced.

---

### 2) Repo touchpoints

**Primary**

* `src/lib/perazzi-intents.ts`

  * `TEMPLATE_GUIDES` currently maps **intent → guidance string** only (neutral). ([GitHub][1])
  * `buildResponseTemplates(hints)` currently selects templates based on `hints.intents` (and a models fallback). ([GitHub][1])

**Wiring**

* `src/app/api/perazzi-assistant/route.ts`

  * Route currently does `const responseTemplates = buildResponseTemplates(hints);` and injects these into the system prompt as “Response structure guidelines.” ([GitHub][2])
  * Route already has `effectiveArchetype` which can be `null` (via snap gating). ([GitHub][2])

---

### 3) Proposed Task Cards

**Card count: 2**

#### Card #1 — Add archetype-aware template map + selection logic with confidence gating

**Scope**

* Replace/extend `TEMPLATE_GUIDES` to support **intent + archetype** variants (nested map or composite keys).
* Update `buildResponseTemplates(...)` to accept `archetype?: Archetype | null` and:

  * if archetype is **null**, return **current neutral templates** (no change in behavior)
  * if archetype is set, prefer intent+archetype variant; else fall back to neutral intent template
* Add at least these archetype variants (as guidance strings that **never mention archetype**):

  * `models + analyst` (comparison table + decision criteria + “how to test”)
  * `models + achiever` (performance path + training implications)
  * `service + legacy` (preservation + documentation + stewardship; still “authorized service only”)
  * `bespoke + prestige` (curated options + discreet next step; no pricing)
* Add lightweight dev-only checks to validate selection and that mixed archetype uses neutral.

**Files to touch**

* `src/lib/perazzi-intents.ts` --> `https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/lib/perazzi-intents.ts`

**Acceptance criteria**

* `buildResponseTemplates(hints, null)` returns the same templates as current behavior for the same `hints` (neutral fallback works). ([GitHub][1])
* For `hints.intents` including `models` and `archetype="analyst"`, templates include the analyst-structured models guidance (and do **not** include any “you are an Analyst” wording).
* For `hints.intents` including `service` and `archetype="legacy"`, templates include preservation/stewardship framing **and** still instruct “authorized centers / no DIY.”
* No template contains explicit archetype labels (“analyst”, “achiever”, etc.) aimed at the user.
* TypeScript compiles cleanly.

**Test notes**

* Add a dev-only self-test block that calls `buildResponseTemplates()` with synthetic `hints` and archetype values and asserts:

  * neutral fallback when archetype is null
  * variant chosen when archetype set and mapping exists
* Quick manual sanity: run one models prompt and confirm the system prompt includes the expected structure guidance.

**Dependencies**

* None (but relies on `Archetype` type being available to import from your types).

---

#### Card #2 — Route wiring: pass `effectiveArchetype` into template selection

**Scope**

* Update route to call `buildResponseTemplates(hints, effectiveArchetype)` instead of `buildResponseTemplates(hints)`. ([GitHub][2])
* Ensure confidence gating is respected automatically:

  * if `effectiveArchetype` is null, neutral templates are used
* Keep API response schema unchanged (still returns `templates: string[]`, etc.). ([GitHub][2])

**Files to touch**

* `src/app/api/perazzi-assistant/route.ts` --> `https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/app/api/perazzi-assistant/route.ts`

**Acceptance criteria**

* When `effectiveArchetype` is null (mixed/balanced), templates returned are neutral (same as today).
* When `effectiveArchetype` is set, templates returned can differ (based on intent+archetype mapping).
* No API response schema changes; chat still works.

**Test notes**

* With dev server running:

  * Send a strong analyst prompt that reliably yields `effectiveArchetype="analyst"` and `intents` include `models`; confirm response `templates` reflect analyst-structured models template.
  * Send a neutral prompt that yields `effectiveArchetype=null`; confirm `templates` are neutral.

**Dependencies**

* Card #1 (needs new `buildResponseTemplates(hints, archetype)` signature + map).

---

### 4) External / Manual Tasks

* None (no DB/Supabase, no ingestion, no env vars required).
* Optional: if you log `templates` already (you do), you’ll naturally see the effect in logs for evaluation. ([GitHub][2])

---

### 5) Risks & gotchas

* Over-structuring: archetype templates can make answers feel “samey” if too rigid; keep them as **light guidance** (lead + structure), not a full script.
* Guardrail drift: ensure prestige/bespoke templates don’t nudge into pricing; ensure service templates don’t encourage DIY gunsmithing.
* Multi-line templates + current prompt formatting: route wraps each template with `- ${template}`, and templates themselves contain `- ...` lines already. This is already true today, so we’ll keep consistency rather than reformatting globally. ([GitHub][2])

---

### 6) Ready to write Task Cards checklist

* Confirm `buildResponseTemplates` is only called from `route.ts` (it appears to be). ([GitHub][2])
* Confirm `effectiveArchetype` is the snap-gated value (can be null), so it’s safe to use as the confidence gate for templates. ([GitHub][2])
* Confirm we keep template strings free of “you are X” wording (internal structure-only guidance).
* Local dev can run (`pnpm dev`) so we can verify template output quickly via the API response’s `templates` field.

When you say **“Create Task Card #1”**, I’ll write the full detailed Codex Task Card for Card #1 only.

[1]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/lib/perazzi-intents.ts "raw.githubusercontent.com"
[2]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/app/api/perazzi-assistant/route.ts "raw.githubusercontent.com"
