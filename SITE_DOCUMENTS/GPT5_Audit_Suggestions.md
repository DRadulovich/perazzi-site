# Dev List Change Roadmap

> Everything below is pulled directly from the combined Dev report and translated into concrete, actionable items.

## Platform/Hosting & Stability

* Replace the ngrok tunnel with a stable preview environment and set up automatic retry/error states for transient failures (e.g., graceful 502 handling).
* Add uptime/error monitoring on all critical routes (`/experience`, `/service`, platform pages, databases).

## Performance (Core Web Vitals)

* Preload/optimize hero media on all hero-heavy pages (Home, platform pages, Experience, Heritage); serve modern formats (WebP/AVIF) and responsive sizes; keep **LCP ≤ 2.5s**.
* Lazy-load non-critical images and large card grids (champions, engineering highlights, database/library results).
* Add motion-safe fallbacks and reduce heavy parallax/pinning for `prefers-reduced-motion`.

## Accessibility (A11y)

* Add skip links and reduced-motion fallbacks to scroll/pinned timelines (Home, Heritage, Bespoke).
* Ensure all tabs and accordions are keyboard navigable and reflect proper ARIA (`aria-selected`, `aria-controls`, `aria-expanded`).
* Provide visual labels + `aria-label` for **all** inputs (CTA form fields, Experience/Service forms, database/library search and filter chips).
* Ensure card grids (platform highlights, champions, database models, engravings) are semantically lists with focus states, alt text, and clear button labels.
* Verify sufficient color contrast across dark CTAs and hero overlays.

## Information Architecture & UX

* Add **sticky or inline CTAs** on long pages (MX, HT, Experience) so conversion is always within reach.
* Introduce **section anchors** and a page-level jump menu for deep pages (Experience, MX/HT platform pages, Heritage).
* Consolidate duplicate CTAs on Bespoke into a single decisive funnel per screen.

## Content & Pages

* **Footer**: Replace placeholder footers (databases, library) with legal/privacy/contact/social links and global nav aids.
* **Experience**:

  * Finalize “Visit Botticino” map embed and ensure accessible fallback.
  * Add labels to **scheduling forms**; verify field validation and error messaging.
  * Keep “Demo stops” current; expose request-a-demo form.
* **Service**:

  * Implement the authorized service center **map embed** + accessible fallback.
  * Fill out **Service FAQs**; add “Before you send your gun” accordion copy and downloadable packing guides.
  * Confirm **request service** and **request parts advice** forms (labels, validation, success states).
* **Heritage**:

  * Improve progressive loading for the **champion grid**; ensure the timeline is reachable via keyboard and skip links.
  * Verify transcripts and controls on **oral histories**.
* **Shotgun Platform Pages** (SHO, DC, TM, MX, HT):

  * Maintain the consistent content spine (hero → specs → story → engineering → discipline pairing → champion → CTA).
  * **DC parity**: add more engineering highlight cards **or** consolidate to remove dead space.
  * Add anchor links to sections; surface a sticky CTA.
* **Shotgun Database** (`/shotguns/all`) & **Engraving Library** (`/engravings`):

  * Add **sorting** (A-Z, new, by gauge/platform/grade) and **pagination** or “Load more”.
  * Consider a **preview modal** for engravings to reduce full navigations.
  * Ensure filters and chips are keyboard accessible and announced to screen readers.

## Forms, Filters & Maps

* Label all inputs in Experience and Service flows; add `aria-live` for filter result counts in databases/libraries.
* Ensure map components have keyboard-accessible controls and provide a non-map fallback list.

## Copy/Voice & Brand Alignment

* Keep all hero intros, champion quotes, and CTAs aligned to Perazzi’s reflective, reverent voice; avoid transactional tone.
* Use narrative intros on platform pages; keep discipline pairing text concise and sport-specific.

## QA & Governance

* Add automated a11y checks (Axe/Lighthouse), image budget checks, and CWV thresholds to CI.
* Create content QA checklists for: hero weights, alt text, ARIA states, labels, and CTA presence per page.

---

# Suggested Implementations

> Additional opportunities not explicitly listed in the Dev report but recommended based on the full audit and Perazzi’s story-first brand.

## Experience & Conversion

* **End-to-end fitting flow**: embed a first-party calendar with timezone handling, reminder emails, and CRM tagging (source, platform page visited, discipline interest).
* **Dealer finder**: ship a dedicated, first-party finder with map clustering, distance filter, and dealer profiles (hours, services, contact, languages).
* **Sticky booking panel**: on platform pages, provide a mini selector (Discipline → Fitting type → Location) that writes into the booking flow.

## Content System & Search

* **Search relevance tuning** for `shotguns/all` and `engravings`: synonyms (e.g., “sidelock” ↔ “SHO”), weighted fields (model name > platform > rib), and saved searches (recent/history).
* **Comparison view**: allow side-by-side compare for 2–3 models (key specs, rib/trigger, discipline recommendations).
* **Saved lists**: authenticated users can save models/engravings and export/share with a fitter.

## Editorial & Heritage

* **Champion profiles**: full editorial pages (bio, highlights, favorite setups) with structured data and cross-links to the models they use.
* **“Inside the Atelier” series**: short, focused essays (barrel regulation, leaf-spring triggers, hand-built ribs) with photo essays and glossary items (SEO and shareability).

## Design System & Engineering

* Ship a **design token system** (color/typography/spacing/motion) and a unified **component library** (Hero, CardGrid, FeatureList, Accordion, Tabs, Form, Map, CTA) with documented accessibility patterns.
* Add **story-based unit tests** for components (tabs, accordions, filter chips, card CTA buttons).
* **Image CDN** with on-the-fly transforms; define per-component image constraints to prevent regressions.

## Analytics & Personalization

* Map **micro-conversions** (scroll depth, tab/accordion interactions, CTA clicks, filter usage, card detail opens) and tie to funnel (view → shortlist → book).
* Content hints: personalize platform CTAs based on the user’s viewed disciplines or geography.

## SEO & Structured Data

* Add structured data for **Product** (model cards), **Collection** (database pages), and **Article** (Heritage/Champion essays); ensure canonical URLs and sitemap coverage.
* Validate OpenGraph/Twitter meta for all hero pages and major articles.

## Internationalization & Accessibility at Scale

* Prepare for **i18n** (locales, currency/metric toggles, date/time zones for bookings).
* Add keyboard testing to CI and maintain an **a11y gate** for new components (no merges if rules fail).

## Performance Engineering

* Apply **route-level performance budgets** and RUM (real user monitoring) for CWVs; log by route (platform pages vs. listing pages) to target largest offenders.
* Inline critical CSS per route and split non-critical JS by page type.

## Reliability & Ops

* Create **staging + preview** environments with seeded content; add **rollbacks** and **smoke tests** (open every top-level route, expand tabs/accordions, exercise filters).
* Implement 404/500 pages that speak in brand voice and offer “Return to…/Book a fitting” affordances.

## Legal/Trust

* Sitewide **privacy/legal** pages with last-updated dates; surface cookie and data policies near forms (subtle, on-brand).

---

## How to action this (suggested order)

1. **Platform/hosting**, **footer**, **form labels/ARIA**, **LCP optimizations** (P0).
2. **Maps + Service FAQs + Experience forms**; **sticky CTAs/anchors** on long pages (P1).
3. **Database/engraving sorting & pagination**, **preview modal**, **DC parity** (P1).
4. **Design tokens + component library a11y patterns**, **CI a11y/performance gates** (P2).
5. **Dealer finder**, **comparison/saved lists**, **champion profile deep-dives** (P3).
