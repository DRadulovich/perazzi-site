files["3_Bespoke_Spec.md"] = textwrap.dedent("""\
# Bespoke Build – Section Spec (Section 3)

## Purpose & Emotional Arc
**From Vision to Instrument.** This page is the lived moment an aspirant becomes a Perazzi owner—*transformation over transaction* made tangible. It promises clarity, calm, and craft‑first guidance: the journey from first conversation to the first shot with *your* Perazzi. The voice is the brand’s “quiet confidence,” inviting rather than selling, celebrating the rite of passage into a lineage.

---

## Section‑wide Data Bindings (recap)
- **BuildHero:** `{ eyebrow, title, introHtml, media: FactoryAsset }`
- **FittingStage[] (ordered):** `{ id, title, bodyHtml, media: FactoryAsset, captionHtml?, ctaLabel?, ctaHref? }`
- **Expert[]:** `{ id, name, role, bioShort, headshot: FactoryAsset, quote?, profileHref? }`
- **BookingOption[]:** `{ id, title, durationMins, descriptionHtml, href }`
- **FactoryAsset:** `{ id, kind: "image"|"video", url, alt, captionHtml?, aspectRatio? }`
- **Service/Location refs:** Optional links to Factory Tour / Fitting Service entries
- **Article[] (optional):** related longform content for deeper reading

---

## Section‑wide State & Variation
- **Responsive:** Pinned step‑scroller at ≥ lg; stacked sections on mobile; collapsibles default open on desktop, closed on mobile.
- **Reduced‑motion:** Disable pinning/parallax; replace transitions with instant state changes or minimal opacity fades.
- **Locales:** All editorial copy from localized CMS fields/`next-intl`; no text baked into images.
- **Dark/Light:** Tokenized color system; maintain ≥ 4.5:1 contrast; ensure captions and buttons meet contrast in both themes.

---

## Tech Notes & Fallbacks
- **Primary stack:** Next 15 (App Router / RSC / TypeScript), Tailwind + Radix (Collapsible/Dialog), Sanity (read‑only via CDN), `next/image` + Cloudinary (unsigned delivery), CSS/WAAPI for core motion; Framer Motion only for pinned step transitions (guarded by `prefers-reduced-motion` + lg breakpoint), Vercel Analytics.
- **Performance:** Preload hero media; lazy‑load below‑fold assets; reserve `aspect-ratio` on all imagery; maintain **LCP ≤ 2.5 s**, **CLS ≤ 0.05**; pinned scroller ≥ 60 FPS on mid‑tier laptops; pause offscreen videos.
- **Fallbacks:** If JS disabled → render all steps as a static, semantic sequence with images and copy; collapsibles default open; booking embed replaced by a link to scheduler; pinned behavior skipped on small screens/by preference.

---

## No‑Regrets Checklist (section)
- **Performance:** LCP met on Hero; all media optimized; no layout shifts; step animation never hinders readability.  
- **A11y:** Keyboard traversal across steps, collapsibles, dialogs, and CTAs; skip link to bypass long scroller; ARIA for stepper/collapsibles/dialog; 44px touch targets; 4.5:1 contrast; alt text or `aria-hidden` for imagery.  
- **Content discipline:** Invitation‑led CTAs; no speculative dates or pricing tables; safety‑conscious imagery; maintain “transformation > transaction” tone.  
- **Observability:** Intersection events for Hero/Steps/Booking/Final CTA; verify analytics events fire in dev.
""")