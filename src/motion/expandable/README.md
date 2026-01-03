# Expandable Section Motion System (ESMS)

ESMS is the shared motion choreography for expandable sections. It is slot-based, phase-driven, and tuned by a single spec.

## Slot Contract

Required `data-es` slots:

- `bg` — background media layer
- `scrim-top` — top gradient overlay
- `scrim-bottom` — bottom gradient overlay
- `header-collapsed` — collapsed title/subtitle/CTA group
- `header-expanded` — expanded title/subtitle/eyebrow group
- `cta` — expanded CTA row
- `close` — close button

Optional `data-es` slots:

- `glass` — glass surface container
- `main` — primary visual/card/carousel
- `meta` — metadata cluster
- `body` — paragraphs / rich text block
- `list` — list container
- `item` — list items
- `char` — char spans for short-title reveal

Missing optional slots are safe. If a required slot does not exist, the animator will no-op but the section should still render.

## Phases

Each section is in one of:

- `collapsed`
- `expanding`
- `expanded`
- `collapsing`

`ExpandableSection` writes `data-es-phase` on the root and guards against double-trigger bugs.

## Usage (Quick Start)

1. Wrap your section in `ExpandableSection`.
2. Add `data-es="..."` to the slots above.
3. Use `getTriggerProps()` on the collapsed header and Read More button.
4. Use `getCloseProps()` on the Close button.
5. Render expanded content only when `contentVisible` is true.

```tsx
<ExpandableSection sectionId="home.example" defaultExpanded={false}>
  {({ getTriggerProps, getCloseProps, layoutProps, contentVisible, isExpanded, bodyId }) => (
    <>
      <div data-es="bg" />
      <div data-es="scrim-top" />
      <div data-es="scrim-bottom" />

      <motion.div {...layoutProps} className="relative">
        <div data-es="glass" className="rounded-3xl border p-6">
          {contentVisible ? (
            <>
              <div data-es="header-expanded">...</div>
              <button data-es="close" {...getCloseProps()}>Close</button>
              <div data-es="main">...</div>
              <div data-es="body" id={bodyId}>...</div>
              <div data-es="cta">...</div>
            </>
          ) : null}
        </div>

        <div data-es="header-collapsed" aria-hidden={isExpanded}>
          <button {...getTriggerProps({ kind: "header" })}>Read more</button>
        </div>
      </motion.div>
    </>
  )}
</ExpandableSection>
```

Use `kind: "header"` for header group triggers and `kind: "cta"` for explicit Read More CTAs so registry interaction policies are respected.

## Adding a New Section

1. Add a stable `sectionId` in `src/motion/expandable/expandable-section-registry.ts`.
2. Wrap the component in `ExpandableSection` and add the slot attributes.
3. Ensure the Close button and triggers use the ESMS helpers.
4. Set any interaction overrides (hover, header click) in the registry.
5. Only add a spec override if required to preserve the section's feel.

## Spec Overrides

Overrides are merged in this order:

1. `DEFAULT_ESMS_SPEC`
2. Route theme override (via provider)
3. Registry override (by `sectionId`)
4. Runtime override (playground)

Add overrides in `expandable-section-registry.ts`:

```ts
const SECTION_OVERRIDES = {
  "home.example": {
    timeScale: { expand: 0.95 },
    distance: { contentY: 12 },
  },
};
```

## Common Pitfalls

- Do not place Tailwind `transform` utilities on elements animated by ESMS. Use a wrapper.
- Keep expanded content mounted only when `contentVisible` is true to allow clean layout collapse.
- Use `data-es="item"` on list items for staggered reveals.
- Reduced motion disables pre-zoom and char splitting; avoid relying on those effects.
- Ensure Close and collapsed header triggers exist so collapse is always reversible.
