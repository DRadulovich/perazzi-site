You are helping me convert a **refactored Markdown knowledge document** into **RAG-ready chunks** suitable for storage in a vector database and retrieval by an AI assistant.

The refactored Markdown document will be provided to you in this same conversation. Use **only that refactored Markdown** as your source of truth.

---

# Markdown → RAG Chunking Meta-Prompt

## Overall Goal

Turn the refactored Markdown document into a set of **small, coherent, self-contained chunks** with useful metadata, so that:

- Each chunk can stand on its own when retrieved.
- The AI can reconstruct context from section paths, titles, and summaries.
- Overlap is minimal but sufficient for context continuity.

## Chunking Rules

When creating chunks:

- Use the refactored Markdown as the **only source**.
- Aim for **roughly 200–500 words per chunk** (flexible as needed for coherence).
- Keep each chunk **semantically coherent**:
  - Avoid cutting a concept mid-explanation if you can reasonably avoid it.
  - Prefer to cut **between** subsections, bullet lists, or paragraphs.
- Avoid long multi-topic chunks:
  - If one section covers multiple distinct ideas, split it into multiple chunks.
- Do **not** invent new content:
  - You may lightly rephrase for clarity where needed.
  - Preserve meaning, facts, and intent.

> Note: If a section is very short but tightly coupled to a neighboring section (e.g. a heading with just one defining sentence), it is acceptable to combine them into a single chunk.

## Metadata Requirements

Create structured chunks with the following fields:

- `id`: a unique machine-friendly ID, e.g. `"chunk-001"`, `"chunk-002"`, etc.
- `title`: a short, human-friendly title summarizing the chunk.
- `section_path`: a breadcrumb-like path of headings from the original doc, for example:  
  `"Document Title > 2. Service Overview > 2.1 Standard Checks"`.
- `summary`: 1–3 sentence summary of what this chunk contains.
- `keywords`: 5–12 important keywords/phrases (no need to be perfect).
- `content`: the actual chunk content in Markdown.

### Content Field Rules

- Preserve Markdown formatting inside `content`:
  - Headings, bullet lists, emphasis, etc.
  - Code samples, prompts, or configs should stay inside fenced code blocks.
- In the final JSONL output:
  - Represent `content` as a **single-line JSON string**.
  - Escape internal newlines as `\n`.
  - Escape internal double quotes as needed for valid JSON.

## Output Format

Your response must have **three parts**, in this order:

1. **Chunking Plan** (Markdown)
2. **Chunks JSONL Block**
3. **Chunking QA Notes** (Markdown)

### 1. Chunking Plan

First, skim the refactored Markdown and list the main top-level sections and how many chunks you expect from each.

- Output this plan as a short Markdown list so I can see the structure.
- Include:
  - Section name
  - Approximate number of chunks you expect from that section.

### 2. Chunks JSONL Block

After the plan, generate the full set of chunks as **JSONL** inside a single fenced code block.

- Use `jsonl` as the language for the fenced code block.
- Each line must be a **valid JSON object** with the following fields:

  ```jsonl
  {"id":"chunk-001","title":"...","section_path":"...","summary":"...","keywords":["...","..."],"content":"..."}
  {"id":"chunk-002","title":"...","section_path":"...","summary":"...","keywords":["...","..."],"content":"..."}
  ```

- Requirements:
  - Use **one JSON object per line**.
  - Ensure each line is syntactically valid JSON.
  - Escape internal newlines in `content` as `\n`.
  - Do not break the JSONL block with extra commentary inside the fenced block.

### 3. Chunking QA Notes

After the JSONL block, add a small Markdown section:

```md
## Chunking QA Notes
```

In this section, briefly mention:

- Any tradeoffs you had to make (e.g. slightly long or short chunks to keep a concept intact).
- Any areas where **cross-chunk context** is especially important.
- Any sections of the source document that were already “atomic” and therefore map 1:1 to chunks.

---

## Step-by-Step Process (For the Assistant)

1. **Read the Refactored Markdown**
   - Read the entire refactored Markdown document once before chunking.
   - Identify major sections, subsections, and conceptual groupings.

2. **Build the Chunking Plan**
   - List the top-level sections and estimate how many chunks each will produce.
   - Output this as the **Chunking Plan** in Markdown.

3. **Generate Chunks**
   - Create chunk objects in an order that follows the document structure.
   - Ensure:
     - Related content stays together.
     - Section paths accurately reflect the original heading hierarchy.
     - No important information is dropped.

4. **Quality Check**
   - Verify chunk boundaries are sensible (no mid-sentence splits, no mixed unrelated topics).
   - Confirm JSONL validity (each line parseable as JSON).
   - Add **Chunking QA Notes** describing any notable decisions or tradeoffs.

Use clear, consistent naming and keep the structure predictable so that downstream systems can easily map chunks back to the original document and its logical sections.