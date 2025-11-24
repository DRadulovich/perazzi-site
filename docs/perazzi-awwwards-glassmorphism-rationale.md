# Perazzi Awwwards Glassmorphism Rationale

## What changed versus the current site (the “1/10” baseline)
- The existing canvas is neutral and product-forward; this page darkens the environment and uses deep vignettes with radial glow so imagery feels lit from within.
- Glass panels, chips, and plaques replace standard cards—every block floats with blur, soft borders, and long shadows to create a vitrined, museum tone.
- Motion is now part of the storytelling: parallaxed hero backdrop, gentle lifts on hover, and staggered section entrances that mirror light shifting across glass.

## How glassmorphism carries Perazzi’s craft and luxury
- Frosted panels reveal the atelier beneath them—blur lets the Perazzi red and bronze neutrals bleed through without sacrificing legibility.
- Large “museum case” frames treat the shotgun as a sculpture, while annotation chips hover like labels in a gallery.
- CTA buttons use glass, internal highlights, and ringed focus states to read like machined metal, keeping interactivity refined rather than loud.

## Where the spec stretches—and why
- Introduced radial glow fields in Perazzi red and warm brass to push cinematic depth behind glass; kept them page-local to avoid changing global tokens.
- Added bespoke glass button styles (primary and secondary) and a GlassPanel recipe to avoid duplicating long Tailwind strings elsewhere.
- Leaned into heavier blurs, deeper shadows, and darker gradients than production pages to reach an Awwwards-level dramatic mood while keeping typography consistent with the brand.
- Built a three-style gallery (Obsidian Corridor, Gilded Mist, Minimal Cabinet) to showcase how glassmorphism can shift palette, blur weight, and chip styling without touching the global system.
