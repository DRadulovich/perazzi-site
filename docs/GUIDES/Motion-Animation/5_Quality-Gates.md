## E) Quality Gates

### Reduced motion checklist

* [ ] Parallax disabled (e.g. marquee-feature scroll-linked y `:89`, `:262` must be gated).
* [ ] Letter-by-letter disabled entirely.
* [ ] Large blur/translate effects replaced with opacity-only or minimal motion.
* [ ] Expand/collapse still works with keyboard and click; no “render expanded by default” unless explicitly desired.

### Performance checklist

* [ ] No per-letter animation on paragraphs or long lists (node count stays sane).
* [ ] Avoid layout thrash: prefer `layout` transitions on a small number of containers.
* [ ] Keep the number of simultaneously animated layers low (especially with blur/backdrop-filter).
* [ ] Don’t re-animate huge lists unnecessarily on every small state change (watch TravelNetwork/ChampionsGallery).

### UX checklist

* [ ] Expand is click/tap (hover only teases).
* [ ] Collapse via Close control + Escape works everywhere.
* [ ] Collapse is faster (~2x) but not abrupt.
* [ ] No scroll-jump: expanding keeps the section anchored (scrollIntoView only if needed).
* [ ] “Read More” is visible immediately in collapsed state (remove 2s delayed CTA outliers).

### Definition of Done (entire migration)

* [ ] All 12 sections use the shared motion config file for timings/easing/staggers.
* [ ] All 12 sections adhere to the standardized slot variants + shared timeline phases (prezoom + closingHold).
* [ ] All 12 sections respect prefers-reduced-motion without disabling the interaction model.
* [ ] No known height:auto animation pitfalls remain in the expandable system (and any remaining internal ones are documented or fixed where relevant).
* [ ] Visual regression sweep: no component loses non-motion behavior (tabs, accordions, modals, pinned panels) unless it conflicted with the spec contract.

---