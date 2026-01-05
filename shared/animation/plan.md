# Choreo toolkit plan

- **Tokens**: durations `short 180ms`, `base 320ms`, `long 520ms`; stagger window `70–110ms`; easing `cubic-bezier(0.22, 1, 0.36, 1)`; respect `prefers-reduced-motion` via a shared guard helper.
- **Primitives**: `choreoFadeLift` (opacity + y-lift), `choreoSlide` (x/y slide), `choreoScaleParallax` (subtle scale/translate for media), `choreoMaskWipe` (clip/gradient reveal), and `ChoreoGroup` to wrap `RevealGroup`/`RevealItem` with auto-stagger and state classes.
- **Swaps**: keyed `presence` classes for selection/tab changes; exit fade + 8px down over 180ms, enter fade + 12px up over 260ms; avoid DOM remount where possible.
- **Performance**: stick to opacity/translate; pre-measure with `useRevealHeight`; set animation CSS vars on mount to avoid layout thrash; ensure pinned/scroll sections stay GPU-friendly.
