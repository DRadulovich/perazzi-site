# Perazzi Dev — Combined Site Audit (v2)

This document reconciles the **original editorial audit** with the **targeted delta crawl**, merging them into a single, structured view of the current Perazzi Dev experience. Where the first audit flagged missing content (e.g., `/experience` beyond the hero), those gaps are now resolved with observations from the second audit. The result is a consolidated blueprint of information architecture, page-by-page content, component patterns, and practical recommendations—delivered in Perazzi’s voice of quiet authority and emotional clarity.  

---

## Executive summary

Perazzi’s website presents a **narrative-first, experience-led** brand world that invites visitors from intrigue to action: from a **hushed invitation** on the home page, through **craft and heritage**, to a confident **call to join the legacy** via fitting or concierge paths. The broader site map now meaningfully covers:

* **Experience hub** (factory visits, fitting sessions, demos, dealer paths; now fully audited)
* **Heritage timeline** (history, champions, photo essays, oral histories)
* **Service/concierge** (scope of service, authorized network, care guides, FAQs)
* **Platform pages** for SHO, DC, TM, MX, HT (consistent content spine per platform)
* **Model database** (search/filter the full catalog)
* **Engraving library** (search/filter engraved patterns)

Throughout, the site’s copy and flow align with Perazzi’s **emotional, reflective** brand voice—philosophical without bombast; **craftsmanship is reverently framed as art**; ownership is positioned as personal transformation rather than transaction.  

---

## Global navigation & route map

* **Home** (`/`) — Editorial landing (invitation → immersion in craft → legacy → CTA)
* **Shotguns** (`/shotguns`) — Category overview; links to platform pages and tools
* **Bespoke Journey** (`/bespoke`) — Six-step story + scheduling pathways
* **Experience** (`/experience`) — Visit Botticino, book fittings/demos, find dealers (now complete)
* **Heritage** (`/heritage`) — Timeline, champions, essays, oral histories
* **Service** (`/service`) — Care philosophy, network search, maintenance guides, parts advice
* **Store** (`/store`) — Linked; not analyzed for commerce flows in this pass
* **Utilities** — Theme toggle, header CTAs; placeholder footer persists on listing/library pages

Navigation within **Shotguns** is **content-driven** (platform links from overviews and grids), while the **database** and **engraving library** introduce their own search/filter UIs. (See component catalog.)  

---

## Page-type summary

| Page type             | Routes                                      | Summary                                                                                                                                                                |
| --------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Editorial landing** | `/`                                         | Hero invitation → craftsmanship timeline → champion marquee → “Join the Legacy” CTA. Designed to load fast with preloaded hero media and accessible motion defaults.   |
| **Product category**  | `/shotguns`                                 | Platforms & purpose, testimonials, trigger education, discipline/gauge primers, engraving tiers, fitting CTA.                                                          |
| **Bespoke journey**   | `/bespoke`                                  | Six stages with rich media; options to schedule at the atelier, roadshow, or remotely; FAQs; concierge scheduler; aftercare assurance.                                 |
| **Experience hub**    | `/experience`                               | Plan a visit, book a demo, book a fitting, find a dealer; Botticino details (address/hours, “What to expect,” map placeholder), demo stops, FAQs, fitting CTAs.        |
| **Heritage**          | `/heritage`                                 | Scroll timeline, evergreen champions, inside-the-atelier essay, oral histories (with transcripts), related reading, fitting CTA.                                       |
| **Service**           | `/service`                                  | Overview & standard checks, service center search, maintenance & prep guide (with downloads), parts guidance, contact forms, FAQs.                                     |
| **Platform detail**   | `/shotguns/sho`, `/dc`, `/tm`, `/mx`, `/ht` | Consistent spine: hero + specs; narrative; engineering highlights; discipline pairing; champion spotlight; related reading; fitting CTA.                               |
| **Product listing**   | `/shotguns/all`                             | Search + filters (platform, gauge, use); grid of model cards with “View details.”                                                                                      |
| **Engraving library** | `/engravings`                               | Search + filters (grade, side); grid of engraving cards with “Save”/“View details.”                                                                                    |

---

## Page-by-page details

### Home — `/`

**Intent**: invite, immerse, and convert—without noise.

* **Hero (Act I)** — Full-viewport hero with brand mantra, optimized as LCP; optional parallax reduces under prefers-reduced-motion. 
* **Craftsmanship timeline (Act II)** — Scroll-or pinned narrative of the bespoke build; mobile stacks; skip link and motion fallbacks ensure a11y. 
* **Champion marquee (Act III)** — Portrait, quote, optional “Read full story.” 
* **Finale CTA (Act IV)** — “Join the Legacy” prompt; single decisive action. 

> Architecture and motion grammar for these acts are defined in the Home spec and interaction notes.   

---

### Shotguns (category) — `/shotguns`

Hero (“Instruments of Mastery”), **Platforms & Purpose** (tabbed), **testimonials**, **trigger primer** (fixed vs drop-out), **disciplines**, **gauge primer**, **commission tiers & engraving**, and a **fitting CTA**. Built on card grids/tabs with accessible states. (See component catalog.)

---

### Bespoke Journey — `/bespoke`

Six **moments** (Consultation, Measurement & Fit, Barrel Regulation, Stock Selection, Engraving, Proofing & Delivery) with **media-rich storytelling**, **three booking paths**, **What to Expect** accordion, **concierge scheduling**, **aftercare**, and a unified **request-a-visit CTA**.

---

### Experience — `/experience`

**Now complete** (supersedes the prior 502 note):

* **Hero**; **Choose your path** (Visit, Demo, Fitting, Dealer)
* **Visit Botticino** (address/hours, **What to expect** accordion, map placeholder, “Request a factory visit”)
* **Fitting sessions** (Atelier comprehensive, roadshow, remote consult) + **scheduling form**
* **Demo program** (stops + “Request a demo stop”)
* **Atelier mosaic** and **FAQs**; final **Begin your fitting** CTA

Form fields and maps need final a11y/implementation polish.

---

### Heritage — `/heritage`

**Timeline scroller** (left index, right reveal); **Evergreen Champions** (cards with highlights, platform tags, profile links); **Inside the Botticino atelier** (expandable photo essay); **Voices** (audio + transcripts); related reading; final fitting CTA. Dense galleries benefit from progressive loading.

---

### Service — `/service`

**Overview** (factory-level care; standard checks), **service network search** (with “Load map” and “Open in maps”), **maintenance & repairs** (downloadable **Trigger Service Checklist**; **Before you send your gun** accordion), **parts guidance** (fitment levels: factory/authorized/user), **contact forms** for **request service** and **request parts advice**, **care guides** (PDFs), **service FAQs**, and a closing **Begin your fitting** CTA.

---

### Platform pages — SHO, DC, TM, MX, HT

Each platform follows a proven spine:

* **Hero + spec summary** (trigger, rib, balance hints, disciplines)
* **Narrative description** (why it exists; what it feels like)
* **Engineering highlights** (card grid)
* **Discipline pairing** (how it should be shot)
* **Champion spotlight** (quote + “Meet the champions”)
* **Related reading + Fitting CTA**

**SHO** (sidelock best-gun), **DC** (side-by-side heritage), **TM** (single-barrel trap + TM9X), **MX** (MX8 lineage to MX2000), **HT/HTS** (modern evolution with center-weighted receiver, reverse-taper rib option). This framing echoes Perazzi’s product evolution—MX core, HT mass distribution, TM for ATA trap—so the onsite narrative mirrors reality.  

---

### Shotgun database — `/shotguns/all`

**Search** + filters (**platform**, **gauge**, **use**) and a **model grid** (category, GA, platform, trigger, springs, rib style, grade; “View details”). Progressive loading keeps performance steady; add sorting/pagination next.

---

### Engraving library — `/engravings`

**Search** + filters (**grade**, **side**) and a grid of **engraving cards** (image, **ID**, **side**, **Save**, **View details**). Consider a lightweight preview modal to avoid deep navigations on every card.

---

## Component catalog (merged)

* **HeroBanner** — Full-viewport LCP hero; preload media; parallax drift optional; AA contrast; heading as `<h1>`. 
* **ScrollIndicator** — Decorative/interactive scroll cue with motion-safe fallbacks. 
* **TimelineScroller / TimelineItem** — Scroll/pinned narrative; mobile stacks; skip-link; IO+Framer sequencing; DOM-order content; reduced-motion fallback.  
* **CardGrid / CardList** — Reusable grid for platform highlights, champions, service centers, model/engraving listings, demo stops, fitting options. 
* **FeatureList** — Specs bullets and “at-a-glance” summaries (e.g., standard checks, discipline boxes). 
* **MarqueeFeature** — Champion spotlight with quote and optional “Read full story.” 
* **Accordion** — FAQs & prep guides; keyboard operable; ARIA states required. 
* **Form & FilterList** — Search bars, filter chips (Service network, Database, Engravings). Ensure labels/ARIA states across inputs. 
* **LocatorMap (placeholder)** — Experience/Service maps; to be implemented with accessible map embeds and server-side fallbacks. 
* **CTASection** — Decisive, single-action closers; button prefetch; strong a11y focus/contrast. 

> The component architecture, motion grammar, performance targets (LCP ≤ 2.5s; CLS ≤ 0.05), and a11y checklists are already codified for Home and can be applied across page types for consistency.   

---

## Voice & style alignment

Copy across the site should consistently reflect Perazzi’s **deeply emotional, reflective** voice—**quiet confidence**, **philosophical reverence**, and **narrative intimacy**—so every page reads like an invitation into legacy rather than a spec sheet. This tone is explicitly defined in the brand’s writing and ethos guides and should frame page intros, champion quotes, and all CTAs (“Begin Your Journey” vs. transactional phrasing).    

---

## Risks & opportunities (consolidated)

**Top issues**

1. **Hosting instability (intermittent 502s)**
   Replace the tunnel with a stable preview environment; implement automatic retries and error states in-app.

2. **Accessibility gaps**
   Scroll-driven sections and accordions must include **skip links**, **ARIA states**, keyboard focus, high-contrast text, motion fallbacks.  

3. **Long-scrolling pages**
   MX/HT pages and Experience are rich but lengthy—consider **section anchors**, **sticky/inline CTAs**, and **collapsible groups** to reduce fatigue.

4. **Placeholder content**
   Service map, Experience map, some FAQ answers, and several footers remain placeholders—ship MVPs with progressive enhancement.

5. **Database UX**
   Add **sort controls** (e.g., newest, A–Z, platform) and pagination or “Load more” to the model and engraving libraries.

**Quick wins**

* Populate footers with **legal/privacy/contact**; add social and newsroom links where appropriate.
* Preload hero assets; maintain **LCP ≤ 2.5 s** on Home and platform pages. 
* Label all input fields (visual labels + `aria-label`), especially in CTA blocks and filters.
* Ensure tabs/accordions reflect `aria-selected`, `aria-controls`, and keyboard navigation patterns.
* Introduce **sticky CTA** on long pages to keep conversion visible.

**Content gaps**

* **Dealer finder**: Link path is present; a first-party dealer experience would complete the Experience funnel.
* **Service FAQs**: Populate answers to reduce support friction.
* **Platform parity**: DC has fewer engineering cards—consider adding or consolidating for balance.
* **Editorial depth**: Continue surfacing brand history and champions in Heritage to reinforce authenticity and craft. (This aligns with product lineage realities—MX → HT, TM single-barrel, and sidelock SHO heritage.) 

---

## Appendix

**Crawling method & coverage**
Desktop viewport (1440×900), dark mode enabled. Pages loaded to **network idle**, then scrolled slowly to trigger lazy content. Tabs/accordions expanded. Previously audited routes were not repeated except for navigation context. **ngrok 502s** were mitigated with refresh/backoff; no pages remained permanently broken.

**Home architecture notes**
Implementation details for **HeroBanner**, **TimelineScroller/Item**, **MarqueeFeature**, and **CTASection**—including motion grammar, accessibility, performance targets, and content bindings—are documented and should be treated as single sources of truth for page builds and QA.      

---

### Brand alignment footnotes (context)

* **Writing style & tone**: emotional, reflective storytelling; quiet confidence; reverent language; premium vocabulary.  
* **Ethos & personality**: transformation over transaction; craftsmanship as sacred art; legacy & belonging as the core narrative.  
* **Product lineage & reality check**: MX core, High Tech mass distribution, TM single-barrel for ATA trap; SHO/DC heritage—reflected across platform pages to keep story and specs aligned.  

---

### Implementation references (selected)

* **Home component summaries** and **interaction specs** (Acts I–IV, motion grammar, a11y, performance):  
* **Architecture & bindings** (Sanity schemas, media, analytics, i18n, motion fallbacks):    

---

## One-page takeaway

Perazzi Dev now coherently **tells the story, shows the craft, proves the lineage, and invites the visitor to belong**—with clear paths to *visit*, *fit*, *demo*, or *consult*. Focus the next sprint on **shipping the map/footers**, **polishing a11y**, and **shortening the long scroll** with anchors/sticky CTAs. Keep the language **intimate and reverent**, letting the brand’s truth be **felt** before it’s **explained**. 
