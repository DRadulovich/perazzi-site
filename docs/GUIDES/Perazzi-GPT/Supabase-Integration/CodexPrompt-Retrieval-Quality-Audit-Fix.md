# CURRENT DOCS OPTIMIZED:

## Core Brand & Strategy Docs

* [x] `PGPT/V2/Brand-Strategy/Brand-Bible.md`
* [x] `PGPT/V2/Brand-Strategy/Brand-Ethos.md`
* [x] `PGPT/V2/Brand-Strategy/Audience-Psych-Archetypes.md`
* [x] `PGPT/V2/Brand-Strategy/Marketing-Plan.md`
* [ ] `PGPT/V2/Brand-Strategy/Writing-Tone.md`

## Company Info Docs

* [ ] `PGPT/V2/Company-Info/Athletes.md`
* [x] `PGPT/V2/Company-Info/Authorized-Dealers.md`
* [ ] `PGPT/V2/Company-Info/Consumer-Warning.md`
* [ ] `PGPT/V2/Company-Info/Event-Schedule.md`
* [ ] `PGPT/V2/Company-Info/Olympic-Medals.json`
* [ ] `PGPT/V2/Company-Info/Recommended-Service-Centers.md`

## Gun Info Docs

* [ ] `PGPT/V2/Gun-Info/Manufacture-Year.md`
* [ ] `PGPT/V2/Gun-Info/All-Models-Corpus.json`
* [ ] `PGPT/V2/Gun-Info/Models-SpecText-Corpus.md`
* [ ] `PGPT/V2/Gun-Info/Base-Models-Corpus.md`
* [ ] `PGPT/V2/Gun-Info/Disciplines-Corpus.md`
* [ ] `PGPT/V2/Gun-Info/Platforms-Corpus.md`
* [ ] `PGPT/V2/Gun-Info/Rib-Info.md`
* [ ] `PGPT/V2/Gun-Info/SanityData-Models-List.json`
* [ ] `PGPT/V2/Gun-Info/GunOrder-FlowChart.json`

## Making a Perazzi Docs

* [ ] `PGPT/V2/Making-A-Perazzi/1_Product-and-System-Overview.md`
* [ ] `PGPT/V2/Making-A-Perazzi/2-A_Roles-and-Stations_Design-and-Specification-Definition.md`
* [ ] `PGPT/V2/Making-A-Perazzi/2-B_Roles-and-Stations_Action-and-Receiver-Machining.md`
* [ ] `PGPT/V2/Making-A-Perazzi/2-C_Roles-and-Stations_Barrel-Fabrication-and-Regulation.md`
* [ ] `PGPT/V2/Making-A-Perazzi/2-D_Roles-and-Stations_Trigger-Group-Lockwork-Assembly.md`
* [ ] `PGPT/V2/Making-A-Perazzi/2-E_Roles-and-Stations_Stock-Blank-Selection-and-Rough-Shaping.md`
* [ ] `PGPT/V2/Making-A-Perazzi/2-F_Roles-and-Stations_Stock-Inletting-and-Final-Shaping.md`
* [ ] `PGPT/V2/Making-A-Perazzi/2-G_Roles-and-Stations_Checkering.md`
* [ ] `PGPT/V2/Making-A-Perazzi/2-H_Roles-and-Stations_Metal-Finishing-and-Bluing.md`
* [ ] `PGPT/V2/Making-A-Perazzi/2-I_Roles-and-Stations_Wood-Finishing.md`
* [ ] `PGPT/V2/Making-A-Perazzi/2-J_Roles-and-Stations_Assembly-and-Mechanical-Quality-Control.md`
* [ ] `PGPT/V2/Making-A-Perazzi/2-K_Roles-and-Stations_Patterning-and-Performance-Testing.md`
* [ ] `PGPT/V2/Making-A-Perazzi/2-L_Roles-and-Stations_Final-Fitting-and-Customer-Specific-Adjustments.md`
* [ ] `PGPT/V2/Making-A-Perazzi/2-M_Roles-and-Stations_Final-Inspection-ProofMarks-and-SignOff.md`
* [ ] `PGPT/V2/Making-A-Perazzi/3_CrossCutting-Systems.md`
* [ ] `PGPT/V2/Making-A-Perazzi/4_Perazzi-vs-General-Gunmaking.md`
* [ ] `PGPT/V2/Making-A-Perazzi/5_Learning-Map.md`

## Operational Docs

* [ ] `PGPT/V2/Operational/Build-Configurator-Flow.json`
* [ ] `PGPT/V2/Operational/Site-Overview.md`

---

[--------------------------------------------------------------------------]

---

# PROMPT USED:

## **IMPORTANT NOTE:**

*Find a way to modify prompt when refactoring `PGPT/V2/Making-A-Perazzi` documents -- it is important that they all have consistent changes to stay linked together.*

---

*(NOTE: Copy text only between blue line separators.)*

```md
[---------------]
[---------------]
[---------------]

You’re helping me improve retrieval quality for my PerazziGPT RAG corpus.

Before reviewing the document I link, please:
1) Read how chunking + metadata work in this repo:
   - scripts/ingest-v2/chunking/index.ts
   - scripts/ingest-v2/metadata.ts
   - scripts/ingest-v2/corpus.ts
   - scripts/ingest-v2/utils.ts
   - PGPT/V2/AI-Docs/P2/Chunking-Guidelines.md
   - PGPT/V2/AI-Docs/P2/Metadata-Schema.md
   - PGPT/V2/AI-Docs/P2/Source-Corpus.md
2) Read how retrieval + rerank works:
   - src/lib/perazzi-retrieval.ts
   - scripts/perazzi-eval/retrieval-suite.ts
3) Use the Supabase MCP server if needed to inspect current metadata distributions or confirm how fields land in public.documents/chunks/embeddings.

Then review this single document:
`PGPT/V2/Making-A-Perazzi/4_Perazzi-vs-General-Gunmaking.md`

Task:
- Assess the document as a whole for retrieval quality.
- Propose concrete edits (metadata block, headings, synonyms, structure, query-shaped phrases).
- List suggested edits first, grouped by priority, each with: 
  - What to change (exact section)
  - Why it helps retrieval
  - Impact scope (low/med/high)
- Do NOT edit files yet. Ask for my approval before applying any changes.

If you need clarification (intent, target queries, etc.), ask short questions.

[---------------]
[---------------]
[---------------]
```

---

[--------------------------------------------------------------------------]


---

# RESPONSE FORMAT:

*(NOTE: Copy text only between blue line separators.)*

```md
[---------------]
[---------------]
[---------------]

Okay, below is each suggestion that you made, and then my response on whether or not I approve the change, you can go ahead and implement all suggested marked "APPROVE":

---

# HIGH PRIORITY

## YOUR SUGGESTION:

* What: Add a ## 0. Metadata block at the top of Authorized-Dealers.md (right after the title) with keyed fields like title, summary, audiences (include navigation), and optionally tags: dealers, service, network. Why: the current doc summary falls back to the title because the content is bullet-heavy, and explicit audiences help doc-level filtering; tags align with rerank topics. Impact: medium.

### MY RESPONSE:

* APPROVE

## YOUR SUGGESTION:

* What: Replace the single flat list under # Perazzi USA Authorized Dealers with region/state headings (for example ## United States -> ### South -> #### Texas (TX)), keeping one dealer block per state or per region. Why: chunking is heading-driven, so this creates smaller, location-specific chunks that retrieve better for "dealer in X" queries. Impact: high.

### MY RESPONSE:

* APPROVE
* **IMPORTANT:** The only thing that I want to make sure that we do is not wait any specific dealer to have a better chance of retrieval if there are multiple options for a specific state or region. I need to make sure that I'm sensitive to the fact that these are other people's businesses, and I don't want to unintentionally divert people from knowing about specific dealers. 
    - So, I would agree with the reformatting, but I want to make sure that we do so in a way that we're not selectively advantaging any one specific dealer. 
    - If it's impossible to do that, then I would say let's not worry about this suggestion. 

## YOUR SUGGESTION:

* What: Split/clarify the TX-AT entry into a clear distribution region and physical location (e.g., an ## International or ## Mexico (Distribution) section plus a "US office" note). Why: removes ambiguity between Mexico vs Texas and improves location-specific retrieval. Impact: medium.

### MY RESPONSE:

* APPROVE

---

# MEDIUM PRIORITY

## YOUR SUGGESTION:

* What: Insert a short ## How to use this list section after metadata with query-shaped phrases and synonyms (authorized dealer, stockist, retailer, dealer locator, where to buy/try, demo, fitting). Why: broadens semantic coverage for common user phrasing. Impact: medium.

### MY RESPONSE:

* APPROVE

## YOUR SUGGESTION:

* What: Standardize each dealer block to a consistent field order and include state abbreviations in headings or the State: line (e.g., Texas (TX)). Why: improves matches for abbreviation-heavy queries and reduces embedding noise. Impact: low/med.

### MY RESPONSE:

* APPROVE

## YOUR SUGGESTION:

* What: Add a one-line disambiguation pointing service-only requests to Recommended-Service-Centers.md. Why: reduces confusion between dealer vs service queries in answers. Impact: low.

### MY RESPONSE:

* APPROVE

---

# LOW PRIORITY

## YOUR SUGGESTION:

* What: Add a Last updated: line in metadata or near the list. Why: recency signal for user trust. Impact: low.

### MY RESPONSE:

* APPROVE

## YOUR SUGGESTION:

* What: If you have it, add phone/website fields per dealer. Why: improves usefulness and recall for "contact" queries. Impact: low/med.

### MY RESPONSE:

* NOT APPROVED

    - Currently don't have that information
---

# QUESTIONS

## Chunking granularity preference: 1) state-level headings, 2) region-level headings?

* I would say let's preference region-level headings, but somehow make it to where if a user says, "I live in Arkansas," it would be able to reference all of the dealers within the region that Arkansas would be in, if that makes sense. 

## Should TX-AT be listed under an International/Mexico section with a separate US office note?

* Yes, if possible. 

## Do you want phone/website fields added if available?

* Not right now. 

[---------------]
[---------------]
[---------------]
```