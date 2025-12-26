# CODEX SUPABASE

[-------------------------------------------------------------------------------------------------------------------]

# 1) Chunking & Text Cleaning

AUDIT ONLY (NO EDITING YET): You are helping me improve retrieval quality by fixing CHUNKING + TEXT CLEANING in my Perazzi assistant knowledge base.

**Your access (important constraints)**
- You have workspace access to this repo: `/Users/davidradulovich/perazzi-site`
- You have read-only Supabase DB access via MCP (current DB user: `supabase_read_only_user`)
- Assume network access is restricted unless I explicitly approve it (so don’t rely on OpenAI calls or installing new packages).

**What’s happening / why I’m asking**
- My Supabase table `public.chunks` contains “outlier” chunks that are far too large for good retrieval (one chunk is ~10.6k characters).
- The worst offenders appear to be list/index-style docs like:
  - `V2-PGPT/V2_PreBuild-Docs/V2_Gun-Info-Docs/V2_RAG_corpus-disciplines.md`
- Current chunk size stats (from DB):
  - `p50_chars ≈ 441`, `p90_chars ≈ 1163`, `max_chars ≈ 10601`
- This hurts retrieval because giant chunks are semantically “blurry”, dominate similarity, and waste context tokens.

**Where the chunking currently happens**
- Ingestion script: `scripts/ingest-v2.ts`
  - It chunks markdown-like docs by:
    - splitting into sections by headings
    - splitting each section into “paragraphs” using blank lines
    - buffering paragraphs until it hits token targets (`TARGET_TOKENS=1000`, `MAX_TOKENS=1600`, with a rough char→token estimate)
- Hypothesis: list/index docs often don’t have blank lines, so a whole list becomes one “paragraph” and produces a giant chunk.

**Goal (keep scope tight)**
Fix chunking/text-prep so list/index content is split into smaller, retrieval-friendly chunks, and ensure we cannot produce giant chunks going forward.

**Do NOT do these things**
- Do not change the retrieval runtime query logic, reranking, metadata schema, or Supabase schema in this task.
- Do not rework the entire ingest pipeline.
- Do not add new dependencies.
- Do not make network calls.
- Do not run a real ingest that writes to Supabase unless I explicitly ask (and only after explaining what it will do).

**What I want you to do (step-by-step)**
1) Inspect `scripts/ingest-v2.ts` and identify the specific mechanism that allows huge chunks (explain it in plain language).
2) Propose a minimal fix that targets list/index-style sections and any “single paragraph is too large” edge case.
   - I want a change that’s easy to reason about and low-risk.
3) Implement the fix with minimal code changes.
4) Add a “guardrail” so even if formatting is bad, chunk size stays bounded.
   - Guardrail can be based on estimated tokens and/or a hard character limit.
5) Add a simple way for me to verify chunk sizes WITHOUT writing to Supabase or calling OpenAI.
   - Prefer: a new CLI flag/mode in `scripts/ingest-v2.ts` like `--analyze-chunks` that:
     - reads the corpus files listed in the source-corpus doc
     - runs the chunker locally
     - prints a report: per-doc chunk counts + max chars/tokens, and a global histogram/outlier list
   - This should run with a single command I can copy/paste.

**Files you should review for context**
- `scripts/ingest-v2.ts` (the chunker you will change)
- Example problematic doc(s):
  - `V2-PGPT/V2_PreBuild-Docs/V2_Gun-Info-Docs/V2_RAG_corpus-disciplines.md`
  - `V2-PGPT/V2_PreBuild-Docs/V2_Gun-Info-Docs/V2_RAG_corpus-base-models.md`
- `package.json` scripts (how to run it). There is already:
  - `pnpm ingest:v2`
  - `pnpm ingest:v2:dry-run`

**Definition of “done” (acceptance criteria)**
- After your change, the analyzer output shows:
  - No chunks anywhere near 10k chars.
  - The “index/list” docs get split into smaller chunks.
  - Typical narrative docs still chunk sensibly (not exploding into dozens of tiny fragments).
- You provide one command I can run locally to see the chunking report (no DB write, no OpenAI call).
- You explain what changed and why in non-dev language.

**Questions to ask me only if truly needed**
- If you need a specific max chunk size target, propose a default (e.g. max ~1,200–1,800 tokens estimated) and ask me to confirm.
- If you want to treat certain doc types specially (e.g. discipline/base-model indexes), propose rules and ask me to confirm.

Start by summarizing what you see in `scripts/ingest-v2.ts` that leads to oversized chunks, then propose the minimal patch plan and implement it.


[-------------------------------------------------------------------------------------------------------------------]

# 2) Corpus Curation

You are helping me improve retrieval quality by curating my Perazzi assistant corpus (what gets embedded vs excluded).

## **Your access (important constraints)**
- You have workspace access to this repo: `/Users/davidradulovich/perazzi-site`
- You have read-only Supabase DB access via MCP (current DB user: `supabase_read_only_user`)
- Assume network access is restricted unless I explicitly approve it.

## **What this task is (scope)**
I want to decide which documents should:
- be embedded normally (`embed_mode = full`)
- be included for metadata only (`embed_mode = metadata-only`)
- be excluded from ingestion entirely (`embed_mode = ignore`)

This is about CORPUS SELECTION and STRUCTURE, not embeddings model choice, reranking, or DB schema.

## **Where the source of truth is**
- The canonical list of what should be ingested is here:
  - `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_source-corpus.md`
- My ingestion script reads that file and only ingests rows where:
  - `status = active` AND `embed_mode != ignore`
  - (See `scripts/ingest-v2.ts` for how it parses this table.)

## **Why I’m asking**
Some docs are “low-signal” for retrieval and can actively harm results:
- “Index” pages that list everything (e.g., huge bullet lists of models)
- Link dumps / bibliography / references pages
- Redundant or overly broad content that matches many queries but answers none well
These can crowd out better chunks and reduce precision.

## **Context you can use**
- Current corpus size in Supabase (for reference only):
  - `public.documents`: 34
  - `public.chunks`: 1264
- Known problematic patterns:
  - “Index/list” docs (example: `V2_RAG_corpus-disciplines.md`) can produce giant chunks and also retrieve too often.
  - Some docs may have minimal summaries/metadata, making them harder to filter or prioritize.

## **What I want you to do (step-by-step)**
### 1) Open and review `V2_REDO_source-corpus.md`.
### 2) Identify “low-signal” or “high-noise” docs and group them into categories, for example:
   - Index/list-of-everything docs (good for structured lookup, bad for semantic chunk retrieval)
   - Link/reference/bibliography dumps
   - Duplicates / near-duplicates / overlapping sources
   - Operational/navigation docs that should only appear for Navigation mode
### 3) For each candidate doc, recommend one action:
   - Keep as `full`
   - Switch to `metadata-only`
   - Switch to `ignore`
   - Or “restructure needed” (but if restructure is needed, just flag it—do NOT do that work in this task)
### 4) Keep the recommendation set SMALL and HIGH-IMPACT:
   - Aim for the top 5–15 changes max.
   - Prioritize changes that reduce retrieval noise and reduce giant-chunk risk.
### 5) Implement ONLY the corpus list changes:
   - Edit `V2_REDO_source-corpus.md` accordingly.
   - Do not run ingestion.
   - Do not change the DB schema.
   - Do not edit other docs unless absolutely necessary.
### 6) Provide a clear “how to apply” section for a non-dev:
   - exactly which command I should run later to re-ingest after these corpus changes
   - and how I can sanity-check that excluded docs are no longer present in retrieval candidates (high-level steps, no DB writes required by you now).

## **Hard constraints (do not violate)**
- Do not change code in `scripts/ingest-v2.ts` in this task (unless there is a parsing bug that prevents corpus edits from working; if you find one, stop and ask me first).
- Do not change retrieval logic (`src/lib/perazzi-retrieval.ts`) in this task.
- Do not add new tooling or dependencies.
- No ingest run required.

## **Decision rules (how to judge “low-signal”)**
Flag docs as candidates for `metadata-only` or `ignore` if they:
- are mostly long lists of entities (models, dealers, parts) without explanatory text
- are mostly links or citations
- are so broad they match many questions but rarely provide the best answer
- duplicate information that exists in more authoritative/specific docs

## **Definition of “done”**
- You give me a prioritized list of recommended corpus changes with short reasons for each.
- You update `V2_REDO_source-corpus.md` to reflect those changes (only that file, if possible).
- You give me the exact command I should run later to re-ingest (e.g. `pnpm ingest:v2:full`) and a simple way to validate the effect.

Start by reading `V2_REDO_source-corpus.md`, then propose your top recommendations before you modify anything.

[------------------------------------------------------------------------------------------------------------------------------------------]

# 3) Metadata Coverage

You are helping me improve retrieval quality by fixing METADATA COVERAGE (what metadata gets written into Supabase for documents/chunks so reranking and filtering can work well).

## **Your access (important constraints)**
- You have workspace access to this repo: `/Users/davidradulovich/perazzi-site`
- You have read-only Supabase DB access via MCP (current DB user: `supabase_read_only_user`)
- Assume network access is restricted unless I explicitly approve it (so don’t rely on OpenAI calls or installing packages).
- You cannot write to the Supabase DB directly from here; I will run ingestion later.

## **Why I’m asking / current problem**
My runtime reranker expects metadata in these DB columns, but they’re currently mostly NULL:
- `documents.summary`, `documents.platforms`, `documents.disciplines`, `documents.audiences`, `documents.tags`, `documents.language`
- `chunks.disciplines`, `chunks.platforms`, `chunks.audiences`, `chunks.context_tags`, `chunks.related_entities`, `chunks.language`

This matters because my reranking code (`computeBoostV2` in `src/lib/perazzi-retrieval.ts`) looks at these fields to boost the right chunks for:
- Mode (Prospect / Owner / Navigation)
- Platform (e.g. “high-tech”)
- Discipline (e.g. “sporting”, “trap”)
- Entities (model slugs)
- Tags / topics / keywords

Right now those boosts can’t work well if the metadata columns are empty.

## **Where metadata should come from**
- The source files in `V2-PGPT/…` (many have a “Metadata” section).
- The corpus manifest:
  - `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_source-corpus.md`
- Known doc types (doc_type/category) where metadata can be inferred from headings or file path (e.g., platform docs, model-spec docs, dealer/service docs).

## **Where this logic lives**
- Ingestion script: `scripts/ingest-v2.ts`
  - It parses doc metadata (title/summary/etc) and upserts `public.documents`.
  - It chunks the doc and inserts rows into `public.chunks`.
  - It inserts embeddings into `public.embeddings`.

## **Important scope boundaries**
- This task is ONLY about populating metadata columns during ingestion.
- Do NOT change Supabase schema (no migrations).
- Do NOT change runtime retrieval/rerank logic in `src/lib/perazzi-retrieval.ts` in this task.
- Do NOT add new dependencies.
- Do NOT run ingestion or make OpenAI calls in this task.

## **What I want you to do (step-by-step)**
### 1) Inspect `scripts/ingest-v2.ts` and explain (plain language) why metadata is currently not getting populated.
   - Identify which columns exist in `public.documents` and `public.chunks` but aren’t being written by the script.
   - Identify any “accidental nulling” (example: inserting explicit `NULL` can override DB defaults).

### 2) Implement minimal, safe changes in `scripts/ingest-v2.ts` so metadata becomes populated for BOTH documents and chunks:
   A) Document-level metadata (write to `public.documents`)
   - Ensure `documents.language` is not left null by default.
     - If a doc doesn’t specify a language, default to `"en"` (or let the DB default apply by not inserting null).
   - Ensure `documents.summary` is populated where possible:
     - Prefer an explicit `Summary:` in the doc’s Metadata section if present.
     - Otherwise, generate a short summary fallback using only local rules (no AI): e.g., first non-empty paragraph after the title, capped to N chars.
   - Ensure `documents.disciplines/platforms/audiences/tags` are populated where possible:
     - Parse them from the Metadata section if present.
     - If missing, infer from doc type/path using simple deterministic rules (e.g., platform-guide headings, model docs, operational docs).
   - Store these fields as JSON arrays in jsonb (consistent casing/slugging).

   B) Chunk-level metadata (write to `public.chunks`)
   - Populate `chunks.language` (default to `"en"` unless specified).
   - Populate `chunks.disciplines/platforms/audiences`:
     - At minimum: inherit from the parent document’s values (so chunks get something useful immediately).
     - If you can cheaply infer better chunk-level values for some doc types (e.g., model chunks), do so, but keep it minimal.
   - Populate `chunks.context_tags` and `chunks.related_entities` where possible:
     - Use deterministic inference from:
       - doc_type/category
       - headings/heading_path
       - existing `section_labels` you already compute
     - For `related_entities`, store a simple JSON array of slugs/ids (e.g., `["mx8", "high-tech"]`) so my existing extractor can read it.

### 3) Keep everything consistent with how the runtime expects it:
   - Use stable, lowercase “slug” forms for platforms/disciplines/entities (e.g., `"high-tech"` not `"High Tech"`).
   - Make sure stored arrays match what the reranker compares against (it compares normalized strings).

### 4) Add a read-only SQL “audit query set” I can run AFTER I re-ingest to confirm coverage improved.
   - Provide a small list of `SELECT` queries I can paste into Supabase SQL editor to verify:
     - counts of null vs non-null for each metadata column
     - top docs/chunks still missing metadata
     - distribution of populated platforms/disciplines/tags
   - These queries must not write anything.

## **Optional but helpful (only if low effort)**
- Populate `chunks.token_count` (estimated) during ingestion so I can audit chunk sizes and cap context later.
  - Only do this if it’s simple and doesn’t add dependencies.

## **How I will run it later (for your instructions)**
- I can run ingestion locally with:
  - `pnpm ingest:v2:full`
- You should clearly warn me that this command will write to Supabase and call the embeddings provider (network required), and it may take time.

## **Definition of “done” (acceptance criteria)**
- `scripts/ingest-v2.ts` writes meaningful values for:
  - `documents.language` (default “en”), and `documents.summary` (explicit or deterministic fallback)
  - `documents.platforms/disciplines/audiences/tags` (from metadata section when present; otherwise inferred for key doc types)
  - `chunks.language` (default “en”) and chunk-level platforms/disciplines/audiences (at least inherited from the parent doc)
  - `chunks.related_entities` (at least for model/platform-related docs) and `chunks.context_tags` (simple deterministic tags)
- You provide a copy/paste SQL audit pack that proves the NULL rates drop after re-ingest.
- Changes are minimal and localized to ingestion (no unrelated refactors).

Start by reviewing `scripts/ingest-v2.ts` and summarizing what it currently writes vs what it leaves blank, then propose the smallest patch that gets us solid metadata coverage.

[---------------------------------------------------------------------------------------------------------------------------------------]

# 4) Filtering & Access Rules

You are helping me verify and tighten HARD FILTERS (“what is allowed to be retrieved at all”) for my Perazzi assistant retrieval pipeline.

This task is about safe, minimal changes to retrieval filtering so forbidden / low-trust content cannot appear in retrieved chunks, even if embeddings would otherwise match.

## **Your access (important constraints)**
- You have workspace access to this repo: `/Users/davidradulovich/perazzi-site`
- You have read-only Supabase DB access via MCP (current DB user: `supabase_read_only_user`)
- Assume network access is restricted unless I explicitly approve it.
- You cannot write to the DB from here; changes must be in code only.

## **Where retrieval filtering happens**
- The vector search SQL lives in: `src/lib/perazzi-retrieval.ts`
  - Specifically inside the SQL in `fetchV2Chunks(...)` where it queries:
    - `public.embeddings e`
    - joined to `public.chunks c`
    - joined to `public.documents d`
  - It currently applies some WHERE filters (status/visibility/confidentiality) and then orders by vector distance.

## **Current known behavior (context)**
- Current SQL WHERE includes these filters:
  - `d.status = 'active'`
  - `coalesce(c.visibility, 'public') = 'public'`
  - `coalesce(d.visibility, 'public') = 'public'`
  - `coalesce(d.confidentiality, 'normal') = 'normal'`
  - `coalesce(c.confidentiality, 'normal') = 'normal'`
- Spec expectations (from `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_validation.md`):
  - Retrieval must respect status/visibility/confidentiality.
  - Pricing content should not be surfaced for general questions (“no pricing list chunks”).
  - Reranking must never surface pricing/hidden/deprecated chunks.
  - Navigation queries should return navigation/dealer/service docs; prospect/owner queries shouldn’t get overwhelmed by navigation-only content.
- DB context I observed (may affect testing):
  - All current docs appear `active/public/normal` (so current filters don’t “prove” much in the current dataset).
  - There is a `documents.pricing_sensitive` column; currently all 34 docs have `pricing_sensitive = false`.
  - There is an `documents.embed_mode` column (e.g., full/metadata-only/ignore).
  - Many other metadata columns exist, but this task is NOT about populating them.

## **Goal**
Add/confirm the minimal set of HARD filters so “forbidden doc families” cannot appear in retrieval results, regardless of similarity.

## **Hard constraints (do not violate)**
- Keep changes small and safe (no large refactors).
- Do not change Supabase schema or migrations.
- Do not change ingestion in this task.
- Do not change reranking/scoring logic in this task unless it’s required to enforce a hard filter.
- Do not add new dependencies.
- Do not run ingestion.

## **What I want you to do (step-by-step)**
### 1) Inspect the retrieval SQL in `src/lib/perazzi-retrieval.ts` and list, in plain language, exactly what the current WHERE clause allows and blocks.
### 2) Compare current filters against the spec/guardrails:
   - Read and summarize the relevant parts of:
     - `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_validation.md`
     - (If needed) `V2_REDO_non-negotiable-guardrails.md` or other guardrail docs referenced there.
### 3) Identify filter gaps that could allow forbidden content:
   - Pricing-related content:
     - Should `documents.pricing_sensitive = true` ever be eligible for retrieval? If not, propose a hard exclusion.
   - Embed-mode:
     - Should `documents.embed_mode` of `metadata-only` or `ignore` be excluded from retrieval? (Likely yes.)
   - Mode constraints:
     - Should `chunks.primary_modes` be used as a hard filter (e.g., if user is in Prospect mode, only retrieve chunks that list Prospect in `primary_modes`), at least for the Operational category?
     - Propose the safest minimal version of this if you think it’s needed.
   - Guardrail flags:
     - If docs/chunks have `guardrail_flags`, should any flags hard-exclude content? If yes, propose a minimal rule (only if clearly supported by the spec).
### 4) Implement minimal code changes to enforce the agreed hard filters in the SQL WHERE clause.
   - Prefer changes that:
     - are obviously correct,
     - won’t break retrieval when fields are NULL (use `coalesce` carefully),
     - don’t require new DB indexes.
### 5) Add a safe way for me (non-dev) to validate behavior without a DB write:
   - Option A (preferred): add a small unit test in the existing test framework (`vitest`) that asserts the SQL string includes the required filters (simple string/regex checks).
   - Option B: add a retrieval “debug mode” log entry that prints the effective filter settings (but never logs embeddings or sensitive content).
### 6) Provide a read-only SQL “audit query set” I can run in Supabase after I re-ingest / change doc flags in the future, to confirm filters are effective (examples):
   - count of docs with `pricing_sensitive=true`
   - show any chunks tied to non-public or non-normal docs
   - sanity-check that excluded categories are present in DB but should never be retrieved (future-proof)

## **Definition of “done” (acceptance criteria)**
- You confirm whether current filters fully meet the spec; if not, you add the minimal missing filters.
- You implement changes only in retrieval code (and small tests if needed).
- You explain the changes in plain language and tell me how to validate.
- The end result ensures that:
  - non-active docs never appear
  - non-public / non-normal docs/chunks never appear
  - pricing-sensitive and ignored/metadata-only docs cannot appear (if we decide that’s required)
  - navigation-only content doesn’t leak into other modes (if we decide that’s required), using the safest minimal rule.

Start by showing me the current retrieval WHERE clause behavior and the exact gaps versus `V2_REDO_validation.md`, then propose the smallest safe patch.

[----------------------------------------------------------------------------------------------------------------------------------------]

# 5) Vector Search Configuration

You are helping me validate and (if needed) minimally improve my VECTOR SEARCH CONFIGURATION (pgvector) for retrieval quality + performance.

This task is about correctness and efficiency of the vector query itself (casts, distance metric, index usage, candidate limits), not about chunking, corpus selection, metadata population, reranking features, or DB schema migrations.

## **Your access (important constraints)**
- You have workspace access to this repo: `/Users/davidradulovich/perazzi-site`
- You have read-only Supabase DB access via MCP (current DB user: `supabase_read_only_user`)
- Assume network access is restricted unless I explicitly approve it.
- You cannot create indexes or change schema in Supabase from here (read-only).

## **Current known DB / pgvector setup (context you can trust)**
- `vector` extension installed (pgvector) and in use.
- Embeddings:
  - Stored in `public.embeddings.embedding` as a `vector` column
  - Model: `text-embedding-3-large`
  - Dimensionality: `3072` for all rows (verified)
- Index:
  - `public.embeddings` has an HNSW cosine index:
    - `idx_embeddings_hnsw_cosine`
    - `CREATE INDEX ... USING hnsw (((embedding)::halfvec(3072)) halfvec_cosine_ops)`
- Runtime vector query (in code) uses a halfvec cosine distance expression.

## **Where to look in code**
- Retrieval code: `src/lib/perazzi-retrieval.ts`
  - Look for the SQL inside `fetchV2Chunks(...)`
  - Key expression today:
    - `(e.embedding::halfvec(3072) <=> $1::halfvec(3072)) as distance`
  - It orders by `distance asc` and limits to `candidateLimit`.

## **What I want you to do (step-by-step)**
### 1) Confirm correctness:
   - Verify the query is using cosine distance (and not accidentally L2 / inner product).
   - Verify the query matches the index expression closely enough that Postgres can use the HNSW index.
   - Verify the cast and parameter typing are correct:
     - The query param is currently passed as JSON text (stringified embedding array).
     - Confirm that `$1::halfvec(3072)` works reliably with that input (or identify safer alternatives).
### 2) Confirm performance characteristics (using only read-only tools):
   - Run/inspect `EXPLAIN` plans (read-only) for the exact retrieval query shape and see whether the HNSW index is being used.
   - If `EXPLAIN` does not show index usage, identify why (casting, ordering, join order, CTE behavior, parameter typing).
### 3) Suggest minimal improvements (no DB writes) that improve correctness/perf:
   - Candidate limits:
     - Validate whether `PERAZZI_RERANK_CANDIDATE_LIMIT` defaults make sense relative to corpus size.
   - Query structure:
     - If join order prevents index usage, suggest a safer query pattern (e.g., select top K chunk_ids from embeddings first, then join to chunks/documents).
     - Avoid changes that require new indexes.
   - Score transform:
     - Right now code converts distance to `score = 1.0 - distance`.
     - Confirm whether that’s meaningful for cosine distance (and note any edge cases like negative similarity or distances outside expected range).
### 4) Implement only the smallest safe code changes in `src/lib/perazzi-retrieval.ts` that:
   - Maintain output behavior (same returned fields), but
   - Improve correctness and/or allow index usage more reliably.
   - If you propose changes, gate them behind env flags when appropriate so it’s easy to roll back.

## **Hard constraints (do not violate)**
- No Supabase schema/index changes (read-only).
- Do not change ingestion.
- Do not add dependencies.
- Do not rely on network calls.
- Keep code changes small and localized.

## **Helpful info you can use**
- The corpus is currently moderate size (`public.embeddings` ~1264 rows), so even seq scans “work”, but I want this to be correct and scalable.
- We already saw an `EXPLAIN` of a generic distance query can show a seq scan if the query shape doesn’t match the index; I want you to test the real query shape used in `fetchV2Chunks`.

## **What “done” looks like**
- You tell me (plain language) whether the current query is correct and whether it’s likely using the HNSW index.
- You provide an `EXPLAIN` result or analysis for the real query shape.
- If there are issues, you implement a minimal patch that improves reliability/perf without DB writes.
- You provide a small checklist of “how to validate”:
  - what to log / what `EXPLAIN` should show
  - what env vars matter (`PERAZZI_ENABLE_RERANK`, `PERAZZI_RERANK_CANDIDATE_LIMIT`, `PERAZZI_RETRIEVAL_LIMIT`, etc.)

Start by inspecting the current SQL vector expression in `src/lib/perazzi-retrieval.ts` and then run the most representative read-only `EXPLAIN` to evaluate whether the HNSW index is used.

[----------------------------------------------------------------------------------------------------------------------------------------]

# 6) Reranking & Scoring

You are helping me tune RERANKING + SCORING (how retrieved candidates are reordered) for my Perazzi assistant.

This task is about improving ordering robustness and safety of boosts, not about chunking, corpus selection, DB schema, or embedding generation.

## **Your access (important constraints)**
- You have workspace access to this repo: `/Users/davidradulovich/perazzi-site`
- You have read-only Supabase DB access via MCP (current DB user: `supabase_read_only_user`)
- Assume network access is restricted unless I explicitly approve it (so don’t rely on OpenAI calls or installing packages).
- You cannot write to the DB from here.

## **Where reranking/scoring happens**
- File: `src/lib/perazzi-retrieval.ts`
- Candidate retrieval: SQL pulls `candidateLimit` nearest neighbors by vector distance.
- Base score: computed as `(1.0 - distance)` (distance comes from pgvector cosine distance using halfvec).
- Rerank (when enabled):
  - Computes `boost = computeBoostV2(row, context, hints)`
  - Computes `archetypeBoost = computeArchetypeBoost(userVector, row.chunk_archetype_bias, margin)`
  - Final score = `baseScore + boost + archetypeBoost`
  - Sorts by final score desc (ties by baseScore, then chunk_id)

## **Important context about my current data**
- Many metadata columns that `computeBoostV2()` tries to use are currently NULL in the DB, including:
  - doc/chunk platforms, disciplines, audiences, tags, language, context_tags, related_entities
- This means reranking currently relies more heavily on:
  - `primary_modes` (present)
  - `section_labels` (present)
  - keyword matching against title/path/heading_path/summary (summary is often null)
  - archetype bias (present)

## **Goal**
Make reranking more robust and less “spiky”:
- Avoid double-counting signals that come from the same underlying information.
- Ensure boosts stay “nudges” and do not swamp the semantic similarity.
- Improve keyword matching so it helps but doesn’t introduce noise.
- Keep changes minimal and reversible (prefer env flags).

## **Hard constraints (do not violate)**
- Do not change the DB schema.
- Do not change ingestion in this task.
- Do not change the vector search SQL shape except where needed for scoring correctness (but prefer not).
- Do not add dependencies.
- Keep changes small, localized, and easy to disable.

## **What I want you to do (step-by-step)**
### 1) Review current scoring logic in `src/lib/perazzi-retrieval.ts`, focusing on:
   - `computeBoostV2(...)`
   - `computeArchetypeBoost(...)`
   - How `baseScore` is derived and used
   - How hints/topics/keywords are interpreted
### 2) Identify potential issues and explain them in plain language, for example:
   - Double-counting (e.g., platform signal counted via topics + doc platforms + section labels)
   - Boost magnitudes too strong relative to base similarity
   - Keyword matching too naive (substring matches, very short tokens, common tokens)
   - Missing metadata causing boosts to behave inconsistently
### 3) Propose a minimal tuning pass:
   - Suggest specific, small changes (2–6 max), each with rationale and expected effect.
   - Prefer changes that are safe even when metadata is missing.
   - Examples of acceptable minimal changes:
     - cap certain boost components tighter
     - switch some boosts to “max-of” instead of additive stacking
     - improve keyword normalization/stop-word filtering
     - add a “minimum base similarity” gate before applying large boosts (if needed)
### 4) Implement the changes behind env flags (so I can turn them on/off), for example:
   - `PERAZZI_RERANK_TUNING_V2=true`
   - or smaller flags like `PERAZZI_RERANK_KEYWORD_MODE=strict`
   - Default should preserve current behavior unless the flag is enabled (unless you strongly recommend a safe default).
### 5) Add a simple way to validate the effect without DB writes:
   - Option A: a small unit test suite (vitest) that feeds fake rows into `computeBoostV2` and asserts boosts are bounded and stable.
   - Option B: enhance existing retrieval debug logging to include a breakdown of boost components (but never log chunk content).

## **Definition of “done” (acceptance criteria)**
- You provide a short list of tuning changes with reasons.
- You implement them in `src/lib/perazzi-retrieval.ts` behind env flags (or a single flag).
- You add a small validation method (test or debug breakdown) so I can see what changed.
- You keep it minimal and reversible.

Start by summarizing how scoring currently works (baseScore + boosts) and then list the top issues you see before making code changes.

[----------------------------------------------------------------------------------------------------------------------------------------]

# 7) Observability & Debugging

You are helping me improve OBSERVABILITY + DEBUGGING for retrieval so I can quickly diagnose “why did it retrieve the wrong thing?” without leaking sensitive info.

## **Your access (important constraints)**
- You have workspace access to this repo: `/Users/davidradulovich/perazzi-site`
- You have read-only Supabase DB access via MCP (current DB user: `supabase_read_only_user`)
- Assume network access is restricted unless I explicitly approve it.
- You cannot write to Supabase from here directly; but the app itself logs to Supabase when it runs (via `DATABASE_URL`).

## **What I want to be able to do (plain language)**
When I look at an interaction in `/admin/pgpt-insights`, I want to see:
- Which chunks were retrieved (doc path + heading path)
- Their base similarity score
- Any rerank adjustments (boost + archetypeBoost)
- The final score/order and whether rerank was on
So I can spot issues like:
- “Wrong doc family”
- “Keyword boost overpowering semantics”
- “Mode/platform boost not working”
- “Rerank candidate limit too small”

## **Where logs currently go / where the UI reads from**
- Logs are stored in Supabase table: `perazzi_conversation_logs`
- Logging code: `src/lib/aiLogging.ts` (`logAiInteraction(...)`)
- Insights UI: `/admin/pgpt-insights`
  - Query logic: `src/lib/pgpt-insights/queries.ts` (reads fields from `perazzi_conversation_logs.metadata`)
- The assistant route that builds the metadata is: `src/app/api/perazzi-assistant/route.ts`
- There is ALSO console logging:
  - `src/lib/perazzi-retrieval.ts` can print `perazzi-retrieval-debug` when `PERAZZI_ENABLE_RETRIEVAL_DEBUG=true`
  - `src/app/api/perazzi-assistant/route.ts` prints `perazzi-assistant-log` to console (includes retrieved refs info)
  - But console logs are NOT what I want—I want the important pieces to show up in `/admin/pgpt-insights`.

## **What exists today (baseline)**
- The DB log metadata already includes some retrieval info (example patterns):
  - `metadata.maxScore`
  - `metadata.retrievedChunks[]` (currently includes chunkId/title/sourcePath/score/rank and trimming flags)
  - rerank flags like `metadata.rerankEnabled`, and `metadata.topReturnedChunks[]` (score breakdown by chunkId only)
- Current limitation: I can’t easily see doc path + heading path + baseScore + boost breakdown together in the Insights UI.

## **Goal of this task**
Make a minimal, safe improvement so `/admin/pgpt-insights` shows enough retrieval detail to debug ranking issues, without logging any chunk content or sensitive prompt content.

## **Hard constraints (do not violate)**
- Do not log chunk text/content or embeddings.
- Do not log any internal system prompts or secret tokens.
- Do not expand logging in a way that breaks existing Insights queries (new fields must be optional).
- Keep changes small and reversible (prefer env flags).
- Do not change Supabase schema.

## **What I want you to do (step-by-step)**
### 1) Inspect what retrieval/debug info is currently logged into `perazzi_conversation_logs.metadata` and what is only in console logs.
   - Key files to review:
     - `src/app/api/perazzi-assistant/route.ts` (look for `logAiInteraction(...)` and how metadata is built)
     - `src/lib/aiLogging.ts` (what is persisted)
     - `src/lib/perazzi-retrieval.ts` (what scores/boosts are available)
     - `src/lib/pgpt-insights/queries.ts` and relevant UI components under `src/app/admin/pgpt-insights` / `src/components/pgpt-insights`
### 2) Propose a minimal “retrieval debug payload” that is safe to store in metadata, for the TOP returned chunks only (cap at 12).
   - Required fields per returned chunk:
     - `chunkId`
     - `documentPath` (or `sourcePath`)
     - `headingPath` (if available)
     - `baseScore`
     - `boost`
     - `archetypeBoost`
     - `finalScore`
     - `rank`
   - Also include overall fields:
     - `rerankEnabled`, `candidateLimit`, `finalLimit`, `maxScore`
### 3) Implement it in the smallest place that already constructs metadata for logging.
   - Preferred approach:
     - In `src/app/api/perazzi-assistant/route.ts`, add a `metadata.retrievalDebug = {...}` object that is derived from the already-returned `retrieval.chunks` + `retrieval.rerankMetrics`.
     - Keep the array size bounded (max 12).
     - Ensure it works whether rerank is ON or OFF (missing fields should be null/0, but stable).
   - Put it behind an env flag, for example:
     - `PERAZZI_LOG_RETRIEVAL_DEBUG=true` (default false)
### 4) Ensure it shows up in `/admin/pgpt-insights`:
   - Either:
     - Update the existing Logs table “details” view to render this new `retrievalDebug` payload in a small table (doc path, heading, scores).
     - Or, if the UI already shows raw metadata, clearly indicate where it appears and ensure it’s readable.
### 5) Show me exactly where I can view it:
   - “Go to `/admin/pgpt-insights` → Logs → open a row → look for ‘Retrieval Debug’ section”
   - If it’s on a detail route, specify that route too (e.g., `/admin/pgpt-insights/log/<id>` if applicable).

## **How to keep it safe**
- Never include chunk content or excerpts in the new debug payload.
- Use only doc path + heading path + numeric scores.
- Respect existing logging controls:
  - `PERAZZI_AI_LOGGING_ENABLED=true` is required for DB logging at all.
  - `PERAZZI_LOG_TEXT_MODE=omitted|truncate|full` controls prompt/response storage; this task should work even when text is omitted.

## **Definition of “done” (acceptance criteria)**
- I can open `/admin/pgpt-insights` and, for each interaction, see a compact breakdown of:
  - top retrieved doc paths + heading paths
  - baseScore + boost + archetypeBoost + finalScore
  - rerankEnabled + candidateLimit
- No chunk text is logged.
- The feature is guarded by an env flag so I can turn it on/off.
- Existing insights pages still work even for older logs without the new field.

Start by summarizing what retrieval info is already persisted vs only in console logs, then propose the minimal safe “retrievalDebug” structure before implementing anything.

[----------------------------------------------------------------------------------------------------------------------------------------]

# 8) Evaluation & Regression Tests

You are helping me build a small, repeatable RETRIEVAL EVALUATION + REGRESSION HARNESS for my Perazzi assistant.

## **Your access (important constraints)**
- You have workspace access to this repo: `/Users/davidradulovich/perazzi-site`
- You have read-only Supabase DB access via MCP (current DB user: `supabase_read_only_user`)
- You may need network access ONLY if you generate embeddings (OpenAI). If network is not available, you must offer a no-network fallback.
- Do not write to Supabase (no schema changes, no inserts/updates/deletes). Read-only evaluation only.

## **What I’m trying to achieve (plain language)**
I want a simple tool I can run locally that answers:
- “When I ask my canonical questions, does retrieval return the right document families?”
- “Did a recent change (chunking, corpus list, metadata) make retrieval worse?”

This should act like a regression test: run it after changes and see PASS/FAIL + a clear report.

## **Canonical source of truth for test cases**
- Use this doc as the canonical query set and expectations:
  - `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_validation.md`
- That file contains example queries and “Expected doc families” (by document path).

## **Existing related tooling (so you don’t duplicate work)**
- There is already a smoke script that calls the full API route:
  - `scripts/perazzi-eval/smoke.ts` (runs `/api/perazzi-assistant`)
- But for this task I specifically want a RETRIEVAL-ONLY harness that:
  - embeds the query
  - runs the vector search (and optionally rerank)
  - prints the top `documents.path` + `chunks.heading_path` + scores
  - without needing the full assistant answer generation

## **Where retrieval logic lives**
- Retrieval code: `src/lib/perazzi-retrieval.ts`
  - `retrievePerazziContext(...)` generates embeddings and fetches chunks from Supabase via SQL.
- The DB tables involved:
  - `public.documents`, `public.chunks`, `public.embeddings`

## **What I want you to build (deliverables)**
### 1) A runnable script (preferred) or a test that:
   - runs the retrieval step for each canonical query
   - prints, for each query:
     - top N results with `documents.path`, `chunks.heading_path`, `baseScore` and `finalScore` (if rerank enabled)
     - whether rerank was enabled and what candidate limit was used
   - outputs a machine-readable report file (JSON) so I can compare runs later.

### 2) Simple pass/fail expectations per query:
   - “Expected doc families” should be defined as path prefixes (or explicit paths) from `V2_REDO_validation.md`
   - A minimal scoring rule, for example:
     - PASS if at least X of top K results are in expected families
     - FAIL if any forbidden family appears in top K (optional, but include if validation doc says “Never: …”)
   - Keep the rules deterministic and easy to adjust.

### 3) Keep it runnable locally with one command:
   - Add a `package.json` script like:
     - `pnpm perazzi:eval:retrieval`
   - Script should accept options like:
     - `--k 12` (top results)
     - `--candidate-limit 60` (if rerank)
     - `--rerank on|off`
     - `--json out.json`

## **Network / embeddings requirements (be explicit)**
- If you generate embeddings, you will need network access and these env vars in `.env.local`:
  - `OPENAI_API_KEY` (or whatever `src/lib/aiClient.ts` uses)
  - `PERAZZI_EMBED_MODEL` (default is `text-embedding-3-large`)
- If network is unavailable, offer a fallback mode:
  - read precomputed embeddings from a local JSON file (`--embedding-cache <path>`) OR
  - allow running with a provided embedding vector for each query (less ideal, but acceptable)

## **DB connection requirements**
- The script should query Supabase via Postgres using `DATABASE_URL` (read-only usage).
- It must not require any DB writes.
- It should fail fast with a clear message if `DATABASE_URL` is missing.

## **Implementation guidance (keep it minimal)**
- Prefer creating a new script file under:
  - `scripts/perazzi-eval/retrieval-suite.ts` (or similar)
- Reuse existing code where possible:
  - For embeddings: reuse `createEmbeddings` from `src/lib/aiClient.ts` if feasible
  - For DB retrieval: reuse the SQL logic or call into `retrievePerazziContext` / `fetchV2Chunks` if you can do it cleanly without side effects
- Do not add new dependencies.

## **Output format (for non-dev use)**
For each query, print something like:
- Query name + text
- PASS/FAIL + short reason
- Top 12 results with:
  - rank
  - `documents.path`
  - `chunks.heading_path` (or “(none)”)
  - baseScore
  - boost/archetypeBoost/finalScore (when rerank is on)
Also save a JSON report including the same data.

## **Definition of “done” (acceptance criteria)**
- I can run one command locally and get:
  - console output that is understandable
  - a JSON report file
- The script uses `V2_REDO_validation.md` as its canonical source of test cases (or extracts them into a small structured map in code if parsing the markdown is too brittle—if you do that, keep it clearly tied to the validation doc).
- The script includes simple pass/fail rules based on “expected doc families”.
- No Supabase writes, no schema changes.

Start by reading `V2_REDO_validation.md` and listing the test cases you will implement (name, query text, expected families). Then implement the script + `package.json` command.

[----------------------------------------------------------------------------------------------------------------------------------------]

# 9) Maintenance Workflow

You are helping me harden the INGESTION / MAINTENANCE WORKFLOW for PerazziGPT v2 so reruns are safe, idempotent, and recover cleanly from failures.

## **Your access (important constraints)**
- You have workspace access to this repo: `/Users/davidradulovich/perazzi-site`
- You have read-only Supabase DB access via MCP (current DB user: `supabase_read_only_user`)
  - You can inspect schema/data via SQL, but you cannot write to Supabase directly from your tools in this chat.
  - Any changes must be implemented in code/scripts; I will run them later.
- Network access may be available for embeddings during ingestion, but this task should NOT require running ingestion or making real OpenAI calls.

## **What this task is (scope)**
- Review and improve the safety of `scripts/ingest-v2.ts`:
  - rerun/change detection (checksum logic)
  - deletes/inserts ordering
  - partial updates if the process crashes or embedding calls fail
  - concurrency risks (two runs at once)
  - long run risks (timeouts, rate limits, partial batches)
- Implement minimal improvements in the script only.
- Do NOT add new infrastructure (no new services, no queues).
- Prefer not to change database schema/migrations in this task.

## **How ingestion runs today (context you should verify in code)**
- Script: `scripts/ingest-v2.ts`
- It reads the canonical corpus list from:
  - `V2-PGPT/V2_PreBuild-Docs/V2_REDO_Docs/V2_REDO_Phase-2/V2_REDO_source-corpus.md`
- It uses a file checksum (sha256 of the raw file content) to decide whether to update.
- It upserts into `public.documents`, then for changed docs it replaces chunks + embeddings:
  - deletes embeddings for that doc’s chunks
  - deletes chunks for that doc
  - inserts new chunks (with new random UUIDs)
  - then generates embeddings and inserts into `public.embeddings`

## **Known risks I’m worried about (please confirm and address)**
### 1) **Partial ingestion risk (crash/failure mid-doc):**
   - If we delete old chunks/embeddings and then embedding generation fails, we can be left with:
     - new chunks but missing embeddings, OR
     - no chunks/embeddings at all for that doc
### 2) **Rerun skip risk (can’t self-heal):**
   - If a doc’s checksum hasn’t changed, the script may skip it, even if its chunks/embeddings in DB are incomplete due to a past failure.
### 3) **Non-atomic updates:**
   - The DB can temporarily be in an inconsistent state during a run.
### 4) **Concurrency:**
   - Two ingest runs at once could fight (delete each other’s work), or create confusing states.
### 5) **Long runs / rate limiting:**
   - Embedding batches can fail halfway. If the script retries poorly, it can get stuck or partially complete.
### 6) **Observability:**
   - The script should output a clear, non-dev-friendly summary of what it did and what failed, and how to safely resume.

## **What I want you to do (step-by-step)**
### 1) Review `scripts/ingest-v2.ts` and explain (plain language) how reruns currently work:
   - What determines “changed” vs “skipped”
   - Exactly when deletes happen vs inserts
   - When embeddings are generated relative to DB writes
### 2) Identify the top 5–10 concrete failure modes and their consequences.
   - Especially: crash after delete, crash after chunk insert, crash during embedding batches, network failure, OpenAI error, DB disconnect.
### 3) Propose minimal, high-impact changes (keep it small and safe) to make reruns robust:
   #### A) **Idempotency / self-healing**
   - Add a “verify-and-repair” behavior:
     - If checksum is unchanged but DB is missing chunks or embeddings, automatically re-process that doc.
     - Example checks (read-only SQL inside the script):
       - `count(chunks where document_id=...)` vs expected `chunk_count`
       - `count(embeddings join chunks ...)` equals number of chunks
   #### B) **Atomicity / two-phase safety**
   - Make per-document updates atomic or effectively atomic:
     - Prefer: compute embeddings in memory first (with pre-generated chunk IDs), then open a single DB transaction that:
       - deletes old rows
       - inserts new chunks
       - inserts new embeddings
       - commits only if everything is ready
     - If full atomicity is not feasible, implement the safest minimal alternative and explain tradeoffs.
   #### C) **Concurrency protection**
   - Add a simple DB advisory lock so only one ingest run can execute at a time (no schema change required).
   #### D) **Retries and resilience**
   - Add bounded retry/backoff for embedding calls (minimal, avoid new deps).
   - Ensure failures don’t leave the DB worse than before.
   #### E) **Better dry-run / operational UX**
   - Improve `--dry-run` output so a non-dev can understand:
     - which docs would be NEW/UPDATED/SKIPPED and why
     - which docs would be “REPAIRED” due to missing DB rows
     - estimated chunk counts and biggest chunk sizes (optional)
   - Add an “audit-only” mode (read-only) if helpful:
     - `--audit` prints inconsistencies (docs with missing chunks/embeddings) without writing.

### 4) Implement the changes in `scripts/ingest-v2.ts` only (no other refactors unless required).
### 5) Provide exact copy/paste commands for me to run later:
   - Audit-only:
     - `pnpm ingest:v2 -- --audit`
   - Dry-run:
     - `pnpm ingest:v2:dry-run`
   - Full run (writes to Supabase + calls embeddings):
     - `pnpm ingest:v2:full`
   - If you add new flags, document them in the script’s help output (or at the top of the file) in plain language.

## **Hard constraints (do not violate)**
- No new external infrastructure.
- Avoid DB schema changes for this task (if you believe a schema change is essential, stop and ask me before doing it).
- Do not add new npm dependencies.
- Keep changes minimal and localized.

## **Definition of “done” (acceptance criteria)**
- If ingestion fails mid-run, re-running the script can safely recover without manual DB cleanup.
- “Skipped” docs are still repaired if their DB rows are incomplete.
- Only one ingest run can operate at a time (simple lock).
- `--dry-run` is clearer, and there is a read-only audit option to find problems before writing.
- You explain the new workflow in simple steps a non-dev can follow.

Start by analyzing `scripts/ingest-v2.ts` and listing the exact failure modes and the smallest safe changes you’ll make before you modify any code.

[----------------------------------------------------------------------------------------------------------------------------------------]
