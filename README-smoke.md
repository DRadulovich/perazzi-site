# Section Reveal Smoke Tuning Guide

This README documents every tweakable variable that affects the cinematic smoke
effect, where it lives, what it does, and practical ranges. All values are safe
to adjust without changing the surrounding reveal motif.

Files referenced:
- `src/components/ui/section-reveal.tsx` (component-level wiring and pointer behavior)
- `src/lib/fluid-smoke.ts` (WebGL fluid simulation core)
- `src/styles/site-theme.css` (visual presentation)

## Component-level controls

These live in `SectionRevealSmoke` where `createFluidSmoke` is called.

1) `baseColor: [r, g, b]` (each channel 0 to 1)
- Location (current override): `src/components/ui/section-reveal.tsx:455-457`
- Location (default fallback): `src/lib/fluid-smoke.ts:237`
- What it does: Sets the base tint for smoke.
- Lower values: darker smoke.
- Higher values: lighter/whiter smoke.
- Typical range: `0.7` to `0.95`.

2) `colorJitter` (0 to ~0.2)
- Location (current override): `src/components/ui/section-reveal.tsx:457`
- Location (default fallback): `src/lib/fluid-smoke.ts:238`
- What it does: Adds subtle color variation per splat.
- Lower values: more uniform tone.
- Higher values: more variation/flicker.
- Typical range: `0` to `0.12`.

3) Pointer energy multiplier (the `* 4` on `dx/dy`)
- Location: `src/components/ui/section-reveal.tsx:486-487`
- What it does: Scales the velocity injected into the fluid.
- Lower values: calmer, slower trails.
- Higher values: stronger, more reactive smoke.
- Typical range: `4` to `16`.

4) Stop delay (the `5000` ms timeout)
- Location: `src/components/ui/section-reveal.tsx:516-518`
- What it does: How long the simulation keeps running after pointer leave.
- Lower values: stops faster.
- Higher values: lingers longer.
- Typical range: `200` to `5000` ms.

5) DPR cap (`Math.min(devicePixelRatio, 2)`)
- Location: `src/components/ui/section-reveal.tsx:462`
- What it does: Limits render resolution for performance.
- Lower cap: softer effect, faster.
- Higher cap: crisper effect, heavier.
- Typical range: `1` to `2`.

## Simulation controls (core WebGL)

These live in the `config` object in `src/lib/fluid-smoke.ts`.

1) `TEXTURE_DOWNSAMPLE` (0 to 2+)
- Location: `src/lib/fluid-smoke.ts:241`
- What it does: Reduces internal sim resolution.
- Lower values: sharper detail, higher GPU cost.
- Higher values: blurrier, faster.
- Typical range: `0` to `2`.

2) `DENSITY_DISSIPATION` (0.95 to 0.999)
- Location: `src/lib/fluid-smoke.ts:242`
- What it does: Controls how fast smoke fades.
- Lower values: smoke fades quickly.
- Higher values: smoke lingers longer.
- Typical range: `0.97` to `0.995`.

3) `VELOCITY_DISSIPATION` (0.95 to 0.999)
- Location: `src/lib/fluid-smoke.ts:243`
- What it does: Controls how long motion persists.
- Lower values: motion settles faster.
- Higher values: motion stays energetic longer.
- Typical range: `0.97` to `0.995`.

4) `PRESSURE_DISSIPATION` (0.6 to 0.95)
- Location: `src/lib/fluid-smoke.ts:244`
- What it does: Dampens pressure each frame.
- Lower values: tighter, more turbulent flow.
- Higher values: smoother, more damped flow.
- Typical range: `0.7` to `0.9`.

5) `PRESSURE_ITERATIONS` (10 to 40)
- Location: `src/lib/fluid-smoke.ts:245`
- What it does: Quality of pressure solve.
- Lower values: faster, more artifacts.
- Higher values: smoother and more stable, heavier.
- Typical range: `16` to `32`.

6) `CURL` (0 to 50+)
- Location: `src/lib/fluid-smoke.ts:246`
- What it does: Adds swirling/vorticity.
- Lower values: calmer flow.
- Higher values: more swirling smoke.
- Typical range: `10` to `40`.

7) `SPLAT_RADIUS` (0.001 to 0.01)
- Location: `src/lib/fluid-smoke.ts:247`
- What it does: Size of each injected plume.
- Lower values: tighter, sharper trails.
- Higher values: broader, softer clouds.
- Typical range: `0.002` to `0.006`.

8) `COLOR_SCALE` (0.15 to 0.7)
- Location: `src/lib/fluid-smoke.ts:248`
- What it does: Overall density/brightness of splats.
- Lower values: subtle smoke.
- Higher values: stronger, brighter smoke.
- Typical range: `0.25` to `0.55`.

## Presentation controls (CSS)

These live in `src/styles/site-theme.css`.

1) `.section-reveal-smoke { opacity: 0.6; }`
- Location: `src/styles/site-theme.css:341`
- Lower values: more subtle.
- Higher values: more visible.
- Typical range: `0.4` to `0.85`.

2) `.section-reveal-smoke { mix-blend-mode: screen; }`
- Location: `src/styles/site-theme.css:342`
- What it does: How smoke blends with the background.
- Alternatives: `normal`, `soft-light`, `overlay`.
- `screen`: brighter, airy.
- `soft-light` or `overlay`: darker, moodier.

## Shader alpha clamp (advanced)

In `src/lib/fluid-smoke.ts`, the display shader clamps alpha with:
- `float alpha = clamp(..., 0.0, 1.0);` (location: `src/lib/fluid-smoke.ts:297`)

Adjust the upper clamp (here `0.7`) to:
- Lower values: more transparent smoke.
- Higher values: more opaque smoke.
- Typical range: `0.5` to `1`.

## Practical tuning tips

- For more presence: raise `COLOR_SCALE`, lower `DENSITY_DISSIPATION`, and raise
  `CURL` slightly.
- For softer, dreamy smoke: increase `TEXTURE_DOWNSAMPLE` and lower the pointer
  multiplier.
- For better performance: increase `TEXTURE_DOWNSAMPLE` and lower
  `PRESSURE_ITERATIONS`.
