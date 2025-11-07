
# Journal – Landing (Hero, Featured, Hubs, Tags, Search)

## A. Journal Home Hero — “The Living Story” *(reuse `HeroBanner` with editorial imagery)*
**Purpose:** Set a contemplative editorial mood; introduce remit and categories.  
**Fields:** Title “Journal”; subheading (1–2 lines on Craft/Interviews/News); background still/loop; optional breadcrumb.  
**States & Interaction:** Static; optional scroll cue.  
**Motion/Perf/A11y:** Text fade (≈600ms); optional subtle parallax (off under reduced‑motion); LCP reserved; 4.5:1 contrast; background `alt=""`; breadcrumb `<nav aria-label="Breadcrumb">`.

## B. Featured Story (Hero Card) *(new)*
**Purpose:** Elevate one featured longform—set tone and invite deep reading.  
**Fields:** `articleRef` (title, dek/excerpt, author, dateISO, readingTime, hero, category), CTA “Read Story”.  
**States & Interaction:** Full‑tile `<a>`; keyboardable; hover underline; `<article>` semantics; heading hierarchy.  
**Motion/Perf/A11y:** Light fade/translate (200–300ms; off when reduced‑motion); reserve aspect‑ratio; caption via `figcaption` where needed; if below fold, lazy‑load image; no CLS.

## C. Category Hubs *(new; Craft / Interviews / News)*
**Purpose:** Curated previews per stream; reinforce taxonomy; invite browsing.  
**Fields:** Header (title + 1‑sentence explainer); curated list (4–8 article cards: title, excerpt, author, date, readingTime, hero, tags[]); “View All” link to category page.  
**States & Interaction:** Grid 2–4 columns; **no infinite scroll**; “Load more” button; cards are single‑link `<a>`; preserve filters/sort in query when navigating.  
**Motion/Perf/A11y:** Light stagger (75–100ms; off when reduced‑motion); reserve card images; section `<h2>`; card `<article>` with heading; dates in `<time>`; announce reading time.

## D. Explore by Topic *(Tag Cloud / Filter Chips; optional)*
**Purpose:** Encourage intentional wandering via topics.  
**Fields:** tags `[{ id, label, slug, count? }]`.  
**States & Interaction:** Button chips toggle filters; update URL (`?tags=`); or link to Tag page.  
**A11y:** Chips are `<button>` with `aria-pressed`; group in `<section aria-label="Explore by topic">`; visible focus ring.

## E. Journal Search *(Inline)*
**Purpose:** Find editorial by title, author, topic.  
**Fields:** `<input type="search">`, submit; optional advanced select/date range.  
**Interaction:** Debounced preview (optional) and SSR results page; preserve query in URL.  
**A11y:** `<form role="search">` with visible `<label>`; result counts announced politely; results list is semantic `<ul>`.
