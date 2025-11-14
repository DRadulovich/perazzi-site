## Dev List Change Roadmap

1. **Stabilize hosting/preview pipeline** to eliminate intermittent 502 errors and add graceful retry/error states inside the app.  
2. **Audit and fix accessibility gaps** globally: ensure scroll-driven sections have skip links, accordions/tabs expose correct `aria-*` attributes, keyboard focus is managed, and motion fallbacks exist.  
3. **Reduce long-scroll fatigue** on Experience and platform pages with section anchors, sticky/inline CTAs, and collapsible content blocks.  
4. **Ship the placeholder maps** (Experience visit map, Service network map) with accessible embeds plus non-JS fallbacks.  
5. **Fill placeholder content** (Service FAQs, map copy, footer links, “coming soon” areas) so every route feels finished.  
6. **Enhance database UX** with sort controls (newest, A–Z, platform) and pagination/“load more” for models and engravings.  
7. **Populate global footers** on listing/library pages with legal, privacy, contact, and social/news links.  
8. **Preload hero media** across key routes to keep LCP ≤ 2.5 s and monitor hero asset weights/lazy-loading.  
9. **Ensure every form/filter field is labeled** (visual + `aria-label`), including CTA inputs and filter chips.  
10. **Introduce sticky CTA patterns** on long editorial pages so primary conversions stay in view.  
11. **Build the dealer finder experience** linked from Experience to close the loop between interest and purchase.  
12. **Expand Service FAQs and guides** with real answers/downloads to reduce support friction.  
13. **Bring DC platform content to parity** (engineering cards, narrative depth) with the other platform pages.  
14. **Continue enriching Heritage content** (champions, essays, oral histories) to reinforce authenticity and craft stories.

---

## Suggested Implementations

1. **Champion & Heritage depth**: add short video clips or audio pull quotes per champion to amplify emotional storytelling.  
2. **Journey-aware CTAs**: tailor CTA modules based on user context (e.g., “Schedule a fitting near Chicago” after viewing demo stops).  
3. **Progressive personalization**: surface related champions/engravings tied to platform filters using Sanity tags.  
4. **Performance budgets**: define route-level budgets (image weight, JS) and enforce them via CI to catch regressions early.  
5. **Analytics enhancers**: instrument key interactions (timeline reveals, engraving saves, model comparisons) with a unified tracking scheme.  
6. **Content governance checklist**: create a CMS checklist (image alt text, captions, CTA voice) to keep new entries aligned with the quiet, authoritative tone without relying on dev review.
