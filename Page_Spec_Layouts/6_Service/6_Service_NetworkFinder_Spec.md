# Service & Parts – Authorized Service Network Finder

## C. Authorized Service Network Finder *(new; location finder)*
**Purpose:** Guarantee quality—locate factory, service centers, and approved specialists only.

**Fields:**
- **Search controls:** country/region select; optional text search.  
- **Results list:** `{ id, name, type: "Factory"|"Service Center"|"Specialist", addressHtml, phone?, email?, website?, notesHtml? }`  
- **Contact CTA:** “Request Service” → service request route.

**States & Interaction:**
- Filter updates results instantly; list‑first UX (no map required).  
- Optional map embed: click‑to‑load titled `<iframe>`; static map fallback (`FactoryAsset`) + “Open in Maps” link.

**Motion Grammar:** Filters may fade results (150–200ms); reduced‑motion = instant.

**Performance:** Client‑side filter only; debounce text search; lazy‑load optional map; maintain **CLS ≤ 0.05**; no long tasks.

**A11y:**  
- Controls correctly labeled; `<form role="search">` with accessible `<label>`s.  
- Results render as a semantic `<ul>`; each item includes contact links.  
- If map shown, `<iframe title="Map of …">`; static image has alt; external link present.  
- Keyboard focus order: controls → results → CTA; visible focus rings.
