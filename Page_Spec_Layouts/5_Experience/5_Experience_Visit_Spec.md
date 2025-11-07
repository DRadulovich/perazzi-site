files["5_Experience_Visit_Spec.md"] = textwrap.dedent("""\
# Experience Perazzi – Visit the Factory (Botticino)

## C. Visit the Factory — Botticino *(new composite with map/itinerary)*
**Purpose:** Explain the pilgrimage—what you’ll see (atelier, proof tunnel), how to arrange, travel tips.

**Fields:**
- **Intro Copy (editorial)**
- **Location Block:** `{ name, addressHtml, mapEmbedSrc?, staticMap: FactoryAsset, hoursHtml?, notesHtml? }`
- **What to Expect:** 3–5 bullets or collapsibles (e.g., check‑in, safety, etiquette, photography policy)
- **CTA:** `{ label: "Request a Visit", href }`

**States & Interaction:**
- Map is **click‑to‑load**: render static map image + “Open map” button; on click, lazy‑inject titled `<iframe>`. Provide “Open in Maps” link as fallback.
- “What to Expect” uses Radix Collapsible (keyboard‑ and screen reader‑friendly); content is reachable by tab.

**Motion Grammar:** Section fade‑in; collapsible height/opacity transitions; reduced‑motion = instant open/close; map iframe appears without animation.

**Image/Video:** Static map image sized for device; `alt="Map to Perazzi Botticino"`.

**Performance:** Defer map iframe until user action; pre‑size map container to avoid CLS; lazy‑load any additional images in this block.

**A11y:** Map iframe has descriptive title; static map has alt + “Open in Maps” link; collapsible triggers announce `aria-expanded` and reference content via `aria-controls`; focus order is logical: header → address → map button → external link → collapsibles → CTA.
""")