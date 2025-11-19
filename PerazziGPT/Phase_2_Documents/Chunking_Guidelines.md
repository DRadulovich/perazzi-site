# Phase 2 — Chunking & Linting Guidelines

These rules govern how source documents should be split before embedding. Apply them consistently so retrieval quality stays predictable across narrative copy, structured tables, and JSON exports.

## 1. Default Settings
- **Target size:** 300–800 words (approx. 450–1,200 tokens). Use 250 words for tightly scoped reference entries; allow up to 1,000 words when a story or process must stay intact.
- **Hard limits:** Fail chunk generation if a chunk exceeds **1,200 tokens** or **1,200 words** unless the file’s rule explicitly sets `allow_overflow=true`.
- **Overlap:** 50–80 words between consecutive narrative chunks; no overlap for structured data where entries already repeat context.
- **Boundaries:** Prefer splitting at level-2+ headings, bullet groups, or paragraph breaks. Never break mid-sentence or mid-list item.

## 2. Content-Specific Rules

### Prompt & Voice Documents
- Files: `docs/assistant-spec.md`, `PerazziGPT/Phase_1_Documents/*`.
- Keep entire sections (Purpose, Guardrails, Voice, Execution Rules) together even if they exceed the default target. Maximum chunk length: 1,200 words.
- Tag with `audience=internal`, `visibility=concierge_only`.

### Narrative Pages (Brand, Live Site Narratives, Heritage)
- Use headings as anchors; each chunk should cover a single thematic block (e.g., “Hero Promise,” “Step Modules”).
- Maintain story flow; if a narrative metaphor spans paragraphs, keep them together.
- Apply 60-word overlaps to preserve continuity between sections.
- Reference `chunking.config.json` for target sizes/overlap per glob.

### Company Info Lists (Dealers, Service Centers, Events, Athletes)
- Chunk by logical grouping (e.g., 3–5 dealers per chunk) and include the header (“Perazzi USA Authorized Dealers”) in each chunk to preserve context.
- Ensure city/state/contact stays within the same chunk as the dealer name.
- No overlap needed; entries are already discrete.

### Structured References (Manufacture Years, Rib Info, JSON exports)
- For Markdown tables/lists, chunk by 5–10 rows while repeating table headers in each chunk.
- For JSON arrays (e.g., `Sanity_Model_Database.json`), chunk per object or small batches (1–3 models) and keep the raw keys intact so parsers can recreate context.
- Validate that each chunk remains under ~2,000 characters to avoid token spikes.
- Use `objects_per_chunk` or `target_rows` from `chunking.config.json` when available.

### Pricing CSVs
- Do **not** include numeric price columns. Extract descriptive columns into synthetic Markdown (e.g., “Accessory: Custom Titanium Trigger Shoe — Description: …”).
- Chunk by category so that guardrail logic can filter them easily.

## 3. Linting & Validation
- **Sentence boundary check:** Run a simple heuristic (regex or library) to ensure chunks start/end at sentence boundaries. `--lint` should exit non-zero if more than 5% of chunks trip the rule.
- **Heading containment:** Verify every heading (`#`, `##`, etc.) appears in at least one chunk; treat missing headings as warnings unless `--strict` is passed (then fail).
- **Token estimator:** Use a tokenizer (e.g., tiktoken) to compute `token_count`. Hard fail if a chunk exceeds the configured `max_tokens`.
- **Overlap sanity:** Ensure calculated overlaps fall within ±10 words of the configured value; warn otherwise.
- **Chunk count drift:** Compare `chunk_count` between runs and alert if it changes by >20% for a given doc without a source checksum change; `--strict` elevates the alert to a failure.
- **Config parity:** Validate that every processed file matched a rule in `chunking.config.json`; fail if no rule applies (prevents silent defaults).

## 4. Special Handling
- **Quotes & Citations:** Keep quote blocks with their attribution lines to preserve tone/context.
- **Tables:** Convert to Markdown text with clear labels before chunking; avoid embedding raw CSV unless necessary.
- **Images/media descriptions:** Include alt text or caption in the same chunk as the narrative describing it.
- **Off-limits data:** If a document mixes public and restricted content, split into separate pre-chunked files first.

## 5. Implementation Notes
- Store chunk metadata from `Metadata_Schema.md` alongside the text; populate `chunk_index`, `chunk_count`, `token_count`, and `embedding_norm` during ingestion.
- CLI requirements:
  - `--dry-run` — output chunk summaries (word count, tokens, headings) without writing embeddings.
  - `--doc <path>` — re-chunk a single file.
  - `--lint` / `--strict` — run linting checks; `--strict` upgrades warnings to failures.
  - `--emit-metadata` — print the metadata JSON for each chunk (useful for diffing in CI).
  - `--sanity-export <groq>` — reserved for future automation to fetch Sanity content pre-chunk.
- Record any exceptions (e.g., chunks beyond the size limit) in commit messages and reference the rule override used.

## 6. Automation Config
- Machine-readable parameters live in `PerazziGPT/Phase_2_Documents/chunking.config.json`. The ingestion CLI should load this file (or accept `--config <path>`) to apply per-glob overrides.
- Each rule can specify `target_words`, `max_words`, `overlap_words`, `target_rows`, `objects_per_chunk`, `describe_columns`, `exclude_columns`, and `allow_overflow`. Extend the schema as needed but reflect changes back in this document.

Treat these guidelines as the baseline; adjust per source if real-world testing shows retrieval gaps, but record any deviations back in this file.
