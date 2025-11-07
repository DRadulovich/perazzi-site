
# Journal – Article Template (`/journal/[slug]`)

## H. Article Hero *(new)*
**Purpose:** Establish the piece and context.  
**Fields:** Title (H1), dek/excerpt?, hero `FactoryAsset`, authorRef, `dateISO`, `readingTimeMins`, category link, tags[].  
**Motion/Perf:** Hero image is **LCP**; `preload`; reserve aspect‑ratio; **CLS ≤ 0.05**.  
**A11y:** `<h1>`; date in `<time datetime="…">`; category as link; tags as `<ul>`; image alt or `alt=""` with caption.

## I. Byline & Meta Bar *(sticky optional)*
**Purpose:** Keep author/date/readingTime visible; optional reading progress.  
**Fields:** author (name; optional headshot), locale‑formatted date, reading time; share controls (“Copy link”).  
**States & Interaction:** Sticky on `lg↑`; progress bar CSS‑driven; “Copy link” writes to clipboard.  
**A11y:** `<aside aria-label="Article meta">`; share buttons labeled; keyboardable; visible focus.  
**Motion/Perf:** Light opacity transitions; progress throttled; disabled under reduced‑motion.

## J. Body Content *(Portable Text)*
**Purpose:** Render longform with proper editorial semantics.  
**Fields:** `bodyPortableText[]` (H2/H3, paragraphs, figures, pull quotes, callouts, endnotes).  
**States & Interaction:**  
- **Table of Contents (optional):** generated from H2/H3; anchored jump links; provide **“Skip ToC”** link before ToC.  
- **Footnotes/Endnotes:** anchor links jump to notes section; “back to reference” links.  
**A11y & Perf:** Strict heading hierarchy; ToC as `<nav aria-label="Table of contents">`; figures reserve space + `figcaption`; no auto‑play audio/video with sound; any audio has transcript; long code/figures can horiz‑scroll with visible focus.

## K. Inline Modules *(optional)*
- **Pull Quote:** `<blockquote><cite>`; ensure contrast.  
- **Callout Note:** role=`note`.  
- **Image Gallery:** Radix Dialog lightbox; ESC closes; announce “Photo X of Y”; Next/Prev with `aria-label`.

## L. Author Box *(end‑of‑article)*
**Purpose:** Provide author context & credibility.  
**Fields:** name, bioHtml, headshot (optional), links.  
**A11y:** `<section aria-labelledby="about-the-author">`; headshot alt descriptive or `alt=""` if decorative.

## M. Related Reading *(reuse `RelatedList`)*
**Purpose:** Encourage deeper reading via topics graph.  
**Fields:** 3–6 related articles; prefetch links.

## N. Newsletter / Follow *(optional)*
**Purpose:** Sustain readership gently.  
**Fields:** Email input (double opt‑in), “Subscribe to the Journal”; social links.  
**A11y:** Labeled input; error messages via `aria-live`; privacy link.
