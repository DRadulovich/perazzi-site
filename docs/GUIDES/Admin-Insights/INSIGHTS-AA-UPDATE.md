Yep — I can see both pages on your `feature/archetype-zr1-rerank` branch:

* `/admin/pgpt-insights` page: `src/app/admin/pgpt-insights/page.tsx` ([GitHub][1])
* `/admin/pgpt-insights/session/[sessionId]` page: `src/app/admin/pgpt-insights/session/[sessionId]/page.tsx` ([GitHub][2])

And from those files, I can also trace the **front-end “surface area”** (the components/sections the UI is built from), which tells us exactly *where* to “bring it up to spec” for the new tuning/logging metadata.

Before we plan upgrades, one key reality check: your logging table already supports this kind of evolution because it stores `metadata` as `jsonb` (`perazzi_conversation_logs.metadata`). ([GitHub][3])
So your admin UI can absolutely display what we built — it just needs to **extract + render** the new metadata keys (and ideally aggregate them into charts).

---

## What these admin pages render today (component map)

### `/admin/pgpt-insights` (`src/app/admin/pgpt-insights/page.tsx`)

This page is a **dashboard shell** that mounts multiple “section” components and uses query-string filters.

**Components/sections mounted (in the page file):** ([GitHub][1])

* `FiltersBar`
* `ArchetypeFiltersBar`
* Section components:

  * `OverviewSection`
  * `TopIssuesSection`
  * `RagSection`
  * `GuardrailsSection`
  * `ArchetypesSection`
  * `MetricsSection`
  * `LogsSection`
  * `TrendsSection`

**Notable:**

* It’s explicitly dynamic (`export const dynamic = "force-dynamic"`). ([GitHub][1])
* It blocks access in production unless `PGPT_INSIGHTS_ALLOW_PROD === "true"`. ([GitHub][1])
* It already has tuning-oriented filters in `SearchParams`, including: `winner_changed`, `margin_lt`, `score_archetype`, `low_conf`, etc. ([GitHub][1])
  That’s *perfect* because Phase 6 logging adds exactly the kind of fields those filters want.

### `/admin/pgpt-insights/session/[sessionId]` (`src/app/admin/pgpt-insights/session/[sessionId]/page.tsx`)

This page is a **session drill-down** that fetches:

* `fetchSessionLogsPreview(...)`
* `fetchSessionTimelineRows(...)` ([GitHub][2])

…and renders:

* `SessionFiltersBar`
* `SessionSummarySection`
* `SessionArchetypeTimeline`
* `LogsTableWithDrawer` ([GitHub][2])

**Notable:**

* It also supports `winner_changed`, `margin_lt`, `score_archetype` in the session-level filters. ([GitHub][2])

---

## What new “tuning data” is now available to visualize

Because `logAiInteraction()` inserts rows into `perazzi_conversation_logs` including a `metadata` jsonb blob, we can store *arbitrary* diagnostic fields there. ([GitHub][3])

From what we implemented in the recent task cards, the admin UI should now expect (in `metadata`) things like:

### Rerank diagnostics

* `rerankEnabled`
* `candidateLimit`
* `topReturnedChunks: [{ chunkId, baseScore, boost, archetypeBoost, finalScore }]`

### Archetype confidence diagnostics

* `archetypeWinner`
* `archetypeRunnerUp`
* `archetypeConfidenceMargin`
* `archetypeSnapped` (true/false)

Also, `aiLogging.ts` already augments metadata with an archetype score distribution helper (`withArchetypeDistribution(...)`) before persisting. ([GitHub][4])
So the UI can (and should) render a consistent “5-bar distribution” visualization even when `primary=null`.

---

## What’s missing today (the gap)

Your admin pages already have the *containers* and *filters*, but they likely don’t yet have:

1. A **standard parser** for “new metadata keys” (so components don’t crash on missing keys / shape drift).
2. UI affordances to **render rerank breakdown** (it’s numbers/arrays, not something you can eyeball in a generic JSON blob).
3. Visualizations for archetype confidence: **winner/runner-up/margin/snapped** + distribution trend over time.
4. Trend aggregations that explicitly answer “did this tuning change help?” (e.g., snapped rate, low-margin rate, rerank-enabled rate, score deltas).

---

# CODEX TASK CARD PASS

## 1) Section ID + Objective

**Section 7 — PGPT Insights UI: expose rerank + archetype confidence diagnostics and add visualization for tuning**

Objective: Upgrade `/admin/pgpt-insights` and `/admin/pgpt-insights/session/[sessionId]` so you can **read and visually interpret** the new tuning metadata we’re logging (rerank breakdown + archetype confidence gating), without digging through raw JSON.

## 2) Repo touchpoints

From the pages you provided, the relevant UI + data layer touchpoints are:

**Pages**

* `src/app/admin/pgpt-insights/page.tsx` (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/app/admin/pgpt-insights/page.tsx)
* `src/app/admin/pgpt-insights/session/[sessionId]/page.tsx` (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/app/admin/pgpt-insights/session/%5BsessionId%5D/page.tsx)

**Key components referenced by those pages**

* `src/components/pgpt-insights/sections/LogsSection.tsx` (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/components/pgpt-insights/sections/LogsSection.tsx)
* `src/components/pgpt-insights/sections/MetricsSection.tsx` (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/components/pgpt-insights/sections/MetricsSection.tsx)
* `src/components/pgpt-insights/sections/TrendsSection.tsx` (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/components/pgpt-insights/sections/TrendsSection.tsx)
* `src/components/pgpt-insights/LogsTableWithDrawer.tsx` (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/components/pgpt-insights/LogsTableWithDrawer.tsx)
* `src/components/pgpt-insights/session/SessionArchetypeTimeline.tsx` (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/components/pgpt-insights/session/SessionArchetypeTimeline.tsx)
* `src/components/pgpt-insights/session/SessionSummarySection.tsx` (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/components/pgpt-insights/session/SessionSummarySection.tsx)
* `src/components/pgpt-insights/FiltersBar.tsx` + `ArchetypeFiltersBar` + `SessionFiltersBar` (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/components/pgpt-insights/FiltersBar.tsx) (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/components/pgpt-insights/session/SessionFiltersBar.tsx) (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/components/pgpt-insights/archetype/ArchetypeFiltersBar.tsx)

**Query layer**

* `src/lib/pgpt-insights/queries` (imported by session page) (https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/lib/pgpt-insights/queries.ts)

**DB table being visualized**

* `public.perazzi_conversation_logs` with `metadata jsonb`, `intents text[]`, `topics text[]`, etc. ([GitHub][3])

## 3) Proposed Task Cards (do NOT write the full cards yet)

### Card count: **6** (with 1 optional “nice-to-have”)

---

### **Card #1 — Create a typed metadata “decoder” for PGPT Insights**

**Scope**

* Introduce a small helper that:

  * Takes `metadata: unknown`
  * Safely extracts (optional) fields for:

    * rerank metrics
    * archetype confidence metrics
  * Never throws on missing keys / unexpected shapes
* Centralize parsing so every UI component doesn’t reinvent “JSON shape guessing”

**Files to touch**

* Likely new: `src/lib/pgpt-insights/metadata.ts` (or similar)
* Possibly: `src/lib/pgpt-insights/types.ts` (if exists)

**Acceptance criteria**

* Any log row with `metadata=null` renders without crashing.
* If `metadata.rerankEnabled` exists, UI can read it via the helper.
* If fields are missing, helper returns `undefined` (not nonsense defaults).

**Test notes**

* Run admin insights page locally against a DB with a mix of older logs (no new keys) + newer logs.

**Dependencies**

* None.

---

### **Card #2 — Queries: ensure log rows + session timeline rows return metadata fields needed for new visuals**

**Scope**

* Update `fetchSessionLogsPreview`, `fetchSessionTimelineRows` (and whatever powers `LogsSection`) so the returned row objects include:

  * raw `metadata`
  * any already-computed columns used by filters (`winner_changed`, `margin_lt`, etc.)
* If filters are implemented in SQL, add JSONB extraction in-query for:

  * `archetypeSnapped`
  * `archetypeConfidenceMargin`
  * `rerankEnabled`

**Files to touch**

* `src/lib/pgpt-insights/queries.ts` (or equivalent file imported by session page) ([GitHub][2])

**Acceptance criteria**

* Logs list view has access to:

  * `metadata` (raw)
  * enough derived values to render new columns/badges
* Session timeline has access to:

  * archetype margin/snapped (for timeline viz)

**Test notes**

* Load session page and confirm timeline can show snapped vs mixed.
* Verify filters `margin_lt`, `winner_changed` still behave.

**Dependencies**

* Card #1 recommended (so UI doesn’t parse ad hoc).

---

### **Card #3 — Logs drawer: add “Tuning Diagnostics” panels (Rerank + Archetype Confidence)**

**Scope**

* In `LogsTableWithDrawer` (or the drawer content component it uses):

  * Add a compact “Archetype Confidence” panel:

    * winner, runner-up, margin, snapped/mixed
    * show distribution bars if available
  * Add a “Rerank Dyno” panel:

    * rerankEnabled + candidateLimit
    * mini table for topReturnedChunks scoring breakdown
  * Add “Copy JSON” buttons for these metric blobs
* Explicitly **do not** display any chunk/document body text (IDs + numeric scores only)

**Files to touch**

* `src/components/pgpt-insights/LogsTableWithDrawer.tsx` ([GitHub][2])
* (Possibly) a drawer subcomponent file if drawer is split out
* Uses helper from Card #1

**Acceptance criteria**

* Opening any log row shows:

  * archetype confidence panel (or “not available”)
  * rerank panel (or “not available”)
* No chunk text content is shown (only ids + numbers).
* UI does not crash on older logs missing keys.

**Test notes**

* Confirm one new log row (post-change) shows full panels.
* Confirm an older log row shows placeholders.

**Dependencies**

* Card #1 + Card #2.

---

### **Card #4 — Session timeline: visualize confidence over time (snapped vs mixed + margin)**

**Scope**

* Extend `SessionArchetypeTimeline` to show per-turn:

  * snapped vs mixed state (badge or color)
  * margin number
  * optional hover detail: winner/runner-up
* (Optional) Show mode transitions in the same timeline if available in metadata.

**Files to touch**

* `src/components/pgpt-insights/session/SessionArchetypeTimeline.tsx`
* Potentially `src/components/pgpt-insights/session/SessionSummarySection.tsx` to summarize snapped rate

**Acceptance criteria**

* Timeline visually distinguishes “mixed/balanced” turns from “snapped” turns.
* Margin displayed/available for each timeline row (when present).
* Works with session logs up to the current limit.

**Test notes**

* Open a session with varied prompts (some neutral, some strongly technical) and confirm timeline changes accordingly.

**Dependencies**

* Card #2 + Card #1.

---

### **Card #5 — Dashboard Metrics/Trends: add real tuning charts (snapped rate, margin histogram, rerank enabled rate)**

**Scope**

* In `MetricsSection` and/or `TrendsSection`, add lightweight visualizations:

  * % snapped vs mixed (overall + over time)
  * margin histogram (bucket counts)
  * rerankEnabled rate (overall + over time)
  * optional: avg candidateLimit (if logged)
* Keep it dependency-light: use simple bar charts built from divs if no chart lib.

**Files to touch**

* `src/components/pgpt-insights/sections/MetricsSection.tsx`
* `src/components/pgpt-insights/sections/TrendsSection.tsx`
* `src/lib/pgpt-insights/queries.ts` to add aggregation endpoints

**Acceptance criteria**

* Dashboard shows at least:

  * snapped vs mixed
  * margin distribution
  * rerank enabled ratio
* Charts respect existing filters (env/endpoint/days/etc.)

**Test notes**

* Adjust `days` and confirm chart totals change.
* Toggle rerank flag (by generating some requests with rerank disabled) and confirm chart responds.

**Dependencies**

* Card #2.

---

### **Card #6 — Filters UI: expose rerank + confidence toggles in the admin UI**

**Scope**

* Add filter controls for:

  * rerank enabled only / rerank disabled only
  * snapped only / mixed only
  * margin threshold shortcut (you already have `margin_lt`, just make it easy to use) ([GitHub][1])
* Wire filters into querystring in:

  * `FiltersBar` (dashboard)
  * `SessionFiltersBar` (session view)

**Files to touch**

* `src/components/pgpt-insights/FiltersBar.tsx` ([GitHub][1])
* `src/components/pgpt-insights/session/SessionFiltersBar.tsx` ([GitHub][2])
* Query layer to accept new params

**Acceptance criteria**

* Filter toggles update URL search params.
* Logs and charts update accordingly.
* No breaking changes to existing filters.

**Test notes**

* Flip toggles and confirm the SQL result set changes (visible via counts/rows).

**Dependencies**

* Card #2.

---

### Optional **Card #7 — Log “human-friendly chunk refs” for rerank metrics**

**Scope**

* If chunk IDs alone are too opaque for tuning:

  * log `documentPath` (or doc id) alongside each chunkId in `topReturnedChunks`
  * still **no chunk text**
* This makes the UI *dramatically* easier to interpret without having to join tables later.

**Files to touch**

* Backend (likely `src/lib/perazzi-retrieval.ts` / route metadata assembly)

**Acceptance criteria**

* Metadata contains doc path for each chunk in rerank metrics.
* No content bodies logged.

**Dependencies**

* None (but changes backend logging shape; UI should tolerate missing fields).

---

## 4) External / Manual Tasks (outside the repo)

* **Prod access toggle:** If you want to view insights in production, set `PGPT_INSIGHTS_ALLOW_PROD=true`. ([GitHub][1])
* **DB connectivity:** The admin pages/queries must be able to read `perazzi_conversation_logs` (same DB your logger writes to). `logAiInteraction` uses `DATABASE_URL`. ([GitHub][4])
* **Optional performance task:** If logs volume grows, consider adding a **GIN index on `perazzi_conversation_logs.metadata`** in Supabase for JSON filtering (manual SQL migration).

## 5) Risks & gotchas

* **Metadata shape drift:** Older rows won’t have the new keys; UI must be null-safe everywhere.
* **Performance:** JSONB filtering + 2000-row session loads can get sluggish without indexing. ([GitHub][2])
* **Privacy/ops:** Don’t accidentally display chunk text if some future metadata includes it. Keep “IDs + numbers only” as a UI rule.

## 6) Ready to write Task Cards checklist

Before we start generating Card #1:

* Confirm your DB already has new log rows with these metadata keys (run a quick Supabase query on a recent `perazzi_conversation_logs` row).
* Confirm `/admin/pgpt-insights` is reachable in your current environment (or set `PGPT_INSIGHTS_ALLOW_PROD=true` if you’re checking prod). ([GitHub][1])
* Confirm we’re aligned on **how visual** you want it:

  * “Good enough” charts (div-based bars + tables) vs bringing in a charting library.

---

Whenever you’re ready, tell me **“Create Task Card #1”** (or pick another card number), and I’ll write one full, Codex-executable task card with exact edits + acceptance tests.

[1]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/app/admin/pgpt-insights/page.tsx "raw.githubusercontent.com"
[2]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/app/admin/pgpt-insights/session/%5BsessionId%5D/page.tsx "raw.githubusercontent.com"
[3]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/docs/ARCHETYPE-ANALYSIS/SUPABASE/schema.sql "raw.githubusercontent.com"
[4]: https://raw.githubusercontent.com/DRadulovich/perazzi-site/refs/heads/feature/archetype-zr1-rerank/src/lib/aiLogging.ts "raw.githubusercontent.com"
