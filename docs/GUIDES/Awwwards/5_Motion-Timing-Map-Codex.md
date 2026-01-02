# Motion Timing Map (Codex)

## src/components/home/timeline-scroller.tsx

A) Summary table
| Component | Interaction | Phase (open/close/other) | Total time (ms/variable) | What determines it | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/components/home/timeline-scroller.tsx` | Timeline expand (collapsed -> expanded) | open | variable | Max of 2000ms reveal/layout transitions vs staggered body/header items | Only when `enableTitleReveal` true; header theme colors switch on next rAF |
| `src/components/home/timeline-scroller.tsx` | Timeline collapse (expanded -> collapsed) | close | 2000 | CSS focus fades + layout transitions (2s) dominate | Body exit 1050ms; header exit 820ms |
| `src/components/home/timeline-scroller.tsx` | Stage accordion expand (stacked list) | open | 300 | Tailwind `transition-all duration-300` on panel | Only when `enablePinned` false |
| `src/components/home/timeline-scroller.tsx` | Stage accordion collapse (stacked list) | close | 300 | Tailwind `transition-all duration-300` on panel | Only when `enablePinned` false |
| `src/components/home/timeline-scroller.tsx` | Stage change (pinned panel) | other | variable | Spring highlight + panel enter/exit + clipPath reveal | Only when `enablePinned` true |

B) Detailed timeline table (Interaction: Timeline expand (collapsed -> expanded) - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1.32 -> 1 | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:145; src/components/home/timeline-scroller.tsx:328 |
| 2 | Atmosphere overlays (scrims/film-grain/gradient, 4 layers) | opacity 0/20/100% -> focus values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:126; src/components/home/timeline-scroller.tsx:344 |
| 3 | Timeline shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:126; src/components/home/timeline-scroller.tsx:393 |
| 4 | Title/subtitle color | text color (white -> ink/ink-muted) | next rAF | n/a | 2000 | n/a | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = next animation frame after expand | src/components/home/timeline-scroller.tsx:128; src/components/home/timeline-scroller.tsx:154; src/components/home/timeline-scroller.tsx:430 |
| 5 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:133; src/components/home/timeline-scroller.tsx:419 |
| 6 | Header block | opacity 0 -> 1 | 200 | n/a | 2000 | 200 | n/a | 2200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:220; src/components/home/timeline-scroller.tsx:410 |
| 7 | Header text items (title + eyebrow) | opacity/y/blur | 280 | n/a | 550 | 280 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 200 + 80 + (i * 120) | src/components/home/timeline-scroller.tsx:249; src/components/home/timeline-scroller.tsx:418 |
| 8 | Body block | opacity/y | 360 | n/a | 2000 | 360 | n/a | 2360 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:234; src/components/home/timeline-scroller.tsx:541 |
| 9 | Body items (text/surfaces, list/columns) | opacity/y/blur | 440 | n/a | 550 | 440 | 100 | variable | cubic-bezier(0.16,1,0.3,1) | start = 360 + 80 + (i * 100) + nestedDelay(40-50) | src/components/home/timeline-scroller.tsx:249; src/components/home/timeline-scroller.tsx:259 |

Plain-English timing explanation: Header items start about 280ms after expand and then step forward every 120ms. Body items wait for the 360ms body delay, then cascade in; longer lists extend the tail.
Reduced motion / breakpoint differences: `enableTitleReveal` is only true on desktop (`min-width: 1024px`) and when `useReducedMotion` is false; otherwise the section renders expanded and `motionEnabled` disables variants/layout animations.

B) Detailed timeline table (Interaction: Timeline collapse (expanded -> collapsed) - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1 -> 1.32 | 0 | 0% | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:146; src/components/home/timeline-scroller.tsx:331 |
| 2 | Atmosphere overlays (scrims/film-grain/gradient) | opacity -> collapsed values | 0 | 0% | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:126; src/components/home/timeline-scroller.tsx:344 |
| 3 | Timeline shell surface | border/bg/shadow/backdrop-filter | 0 | 0% | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:126; src/components/home/timeline-scroller.tsx:393 |
| 4 | Title/subtitle color | text color (ink -> white) | 0 | 0% | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:128; src/components/home/timeline-scroller.tsx:165; src/components/home/timeline-scroller.tsx:430 |
| 5 | Title/subtitle layoutId | layout position/size | 0 | 0% | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:133; src/components/home/timeline-scroller.tsx:480 |
| 6 | Header block exit | opacity 1 -> 0 | 0 | 0% | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:231; src/components/home/timeline-scroller.tsx:410 |
| 7 | Body block exit | opacity/y -> hidden | 0 | 0% | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:246; src/components/home/timeline-scroller.tsx:541 |

B) Detailed timeline table (Interaction: Stage accordion expand (stacked list) - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Stage panel content | max-height 0 -> 999px; opacity 0 -> 1 | 0 | 0% | 300 | 0 | n/a | 300 | unknown (Tailwind default) | n/a | src/components/home/timeline-scroller.tsx:648 |

B) Detailed timeline table (Interaction: Stage accordion collapse (stacked list) - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Stage panel content | max-height 999px -> 0; opacity 1 -> 0 | 0 | 0% | 300 | 0 | n/a | 300 | unknown (Tailwind default) | n/a | src/components/home/timeline-scroller.tsx:648 |

B) Detailed timeline table (Interaction: Stage change (pinned panel) - other)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Active control highlight | layoutId highlight position/size | 0 | n/a | variable | 0 | n/a | variable | spring (stiffness 260, damping 30, mass 0.7) | n/a | src/components/home/timeline-scroller.tsx:727 |
| 2 | Outgoing panel | opacity/y/blur exit | 0 | n/a | 550 | 0 | n/a | 550 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:842 |
| 3 | Incoming panel | opacity/y/blur enter | 0 | n/a | 550 | 0 | n/a | 550 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:842 |
| 4 | Panel media | clipPath inset 100% -> 0% | 0 | n/a | 800 | 0 | n/a | 800 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/timeline-scroller.tsx:795 |
| 5 | Panel text items | opacity/y/blur | 0 | n/a | 550 | 0 | 80 | variable | cubic-bezier(0.16,1,0.3,1) | start = 0 + (i * 80) | src/components/home/timeline-scroller.tsx:775; src/components/home/timeline-scroller.tsx:783 |

Plain-English timing explanation: Text elements inside the panel arrive 80ms apart, so optional caption lines extend the end time. The active highlight uses a spring, so its timing varies with physics.
Reduced motion / breakpoint differences: `animationsEnabled` and `motionEnabled` are disabled when reduced motion is requested; the highlight becomes static and panel transitions are skipped.

## src/components/home/marquee-feature.tsx

A) Summary table
| Component | Interaction | Phase (open/close/other) | Total time (ms/variable) | What determines it | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/components/home/marquee-feature.tsx` | Marquee expand (collapsed -> expanded) | open | variable | Max of 2000ms reveal/layout transitions vs staggered header/body/items | Only when `enableTitleReveal` true; title colors switch on next rAF |
| `src/components/home/marquee-feature.tsx` | Marquee collapse (expanded -> collapsed) | close | variable | 2000ms focus fades/layout transitions plus staggered collapsed text | Collapsed view is always mounted when `enableTitleReveal` true |
| `src/components/home/marquee-feature.tsx` | Background parallax (collapsed state) | other | variable | Scroll progress mapping to `y` transform | Only when `parallaxEnabled` (collapsed on desktop) |

B) Detailed timeline table (Interaction: Marquee expand (collapsed -> expanded) - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1.32 -> 1 | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/marquee-feature.tsx:99; src/components/home/marquee-feature.tsx:260 |
| 2 | Atmosphere overlays (scrims/film-grain/gradient, 4 layers) | opacity -> focus values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/marquee-feature.tsx:82; src/components/home/marquee-feature.tsx:277 |
| 3 | Marquee shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/marquee-feature.tsx:81; src/components/home/marquee-feature.tsx:324 |
| 4 | Title/subtitle color | text color (white -> ink/ink-muted) | next rAF | n/a | 2000 | n/a | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = next animation frame after expand | src/components/home/marquee-feature.tsx:83; src/components/home/marquee-feature.tsx:108; src/components/home/marquee-feature.tsx:383 |
| 5 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/marquee-feature.tsx:87; src/components/home/marquee-feature.tsx:372 |
| 6 | Collapsed container | opacity/blur exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/marquee-feature.tsx:207; src/components/home/marquee-feature.tsx:454 |
| 7 | Expanded container | opacity 0 -> 1 | 0 | n/a | 550 | 0 | n/a | 550 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/marquee-feature.tsx:201; src/components/home/marquee-feature.tsx:336 |
| 8 | Header items (eyebrow/title/subtitle) | opacity/y/blur | 120 | n/a | 800 | 120 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 120 + (i * 120) | src/components/home/marquee-feature.tsx:161; src/components/home/marquee-feature.tsx:191; src/components/home/marquee-feature.tsx:366 |
| 9 | Body items (image card/quote/collapse button) | opacity/y/blur | 240 | n/a | 800 | 240 | 100 | variable | cubic-bezier(0.16,1,0.3,1) | start = 240 + (i * 100) | src/components/home/marquee-feature.tsx:171; src/components/home/marquee-feature.tsx:196; src/components/home/marquee-feature.tsx:346 |
| 10 | CTA link (if present) | opacity/y | 360 | n/a | 800 | 360 | 100 | variable | cubic-bezier(0.16,1,0.3,1) | start = 360 + (i * 100) | src/components/home/marquee-feature.tsx:181; src/components/home/marquee-feature.tsx:424 |

Plain-English timing explanation: Header text begins 120ms after expand and steps forward every 120ms. Body and CTA items cascade in after their own delays, so longer lists extend the tail.

B) Detailed timeline table (Interaction: Marquee collapse (expanded -> collapsed) - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1 -> 1.32 | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/marquee-feature.tsx:100; src/components/home/marquee-feature.tsx:260 |
| 2 | Atmosphere overlays (scrims/film-grain/gradient) | opacity -> collapsed values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/marquee-feature.tsx:82; src/components/home/marquee-feature.tsx:277 |
| 3 | Marquee shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/marquee-feature.tsx:81; src/components/home/marquee-feature.tsx:324 |
| 4 | Title/subtitle color | text color (ink -> white) | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/marquee-feature.tsx:83; src/components/home/marquee-feature.tsx:120; src/components/home/marquee-feature.tsx:383 |
| 5 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/marquee-feature.tsx:87; src/components/home/marquee-feature.tsx:464 |
| 6 | Expanded container | opacity exit | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/marquee-feature.tsx:204; src/components/home/marquee-feature.tsx:336 |
| 7 | Collapsed container | opacity/blur enter | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/home/marquee-feature.tsx:207; src/components/home/marquee-feature.tsx:454 |
| 8 | Collapsed header items | opacity/y/blur | 120 | n/a | 800 | 120 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 120 + (i * 120) | src/components/home/marquee-feature.tsx:161; src/components/home/marquee-feature.tsx:469 |
| 9 | Collapsed "Read more" text | opacity/y/blur | 360 | n/a | 800 | 360 | 100 | variable | cubic-bezier(0.16,1,0.3,1) | start = 360 + (i * 100) | src/components/home/marquee-feature.tsx:181; src/components/home/marquee-feature.tsx:505 |

Plain-English timing explanation: The collapsed title/subtitle and the "Read more" prompt animate in a short cascade, so the final end time depends on how many items render.

B) Detailed timeline table (Interaction: Background parallax (collapsed state) - other)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | y: 0% -> 16% (scroll-linked) | n/a | n/a | variable | n/a | n/a | variable | scroll progress | y = transform(scrollYProgress, [0,1], ["0%","16%"]) | src/components/home/marquee-feature.tsx:89; src/components/home/marquee-feature.tsx:262 |

Plain-English timing explanation: The background shifts downward as the user scrolls, spanning from 0% to 16% of its height over the section's scroll range.
Reduced motion / breakpoint differences: `enableTitleReveal` only runs on desktop (`min-width: 1024px`) and is disabled by `useReducedMotion`; when reduced motion is on, `motionEnabled` disables variants/layout transitions and parallax.

## src/components/shotguns/PlatformGrid.tsx

A) Summary table
| Component | Interaction | Phase (open/close/other) | Total time (ms/variable) | What determines it | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/components/shotguns/PlatformGrid.tsx` | Platform grid expand (collapsed -> expanded) | open | variable | 2000ms reveal/layout transitions + staggered header/body/tabs/cards | Only when `enableTitleReveal` true; title colors switch on next rAF |
| `src/components/shotguns/PlatformGrid.tsx` | Platform grid collapse (expanded -> collapsed) | close | variable | 2000ms focus fades/layout transitions + delayed "Read more" | `readMoreReveal` waits 2000ms then runs 500ms |
| `src/components/shotguns/PlatformGrid.tsx` | Platform selection change (tab click/scroll) | other | variable | Spring highlight + card swap + champion highlight delay | Desktop swaps card; tabs always move highlight |

B) Detailed timeline table (Interaction: Platform grid expand (collapsed -> expanded) - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1.32 -> 1 | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/PlatformGrid.tsx:456; src/components/shotguns/PlatformGrid.tsx:615 |
| 2 | Atmosphere overlays (scrims/film-grain/gradient, 4 layers) | opacity -> focus values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/PlatformGrid.tsx:436; src/components/shotguns/PlatformGrid.tsx:633 |
| 3 | Title/subtitle color | text color (white -> ink/ink-muted) | next rAF | n/a | 2000 | n/a | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = next animation frame after expand | src/components/shotguns/PlatformGrid.tsx:437; src/components/shotguns/PlatformGrid.tsx:530; src/components/shotguns/PlatformGrid.tsx:723 |
| 4 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/PlatformGrid.tsx:444; src/components/shotguns/PlatformGrid.tsx:713 |
| 5 | Collapsed container | opacity/blur exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/PlatformGrid.tsx:439; src/components/shotguns/PlatformGrid.tsx:764 |
| 6 | Header items (title/subtitle/collapse button) | opacity/y/blur | 240 | n/a | 800 | 240 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 240 + (groupIndex * 120) + (headingIndex * 100) | src/components/shotguns/PlatformGrid.tsx:478; src/components/shotguns/PlatformGrid.tsx:498; src/components/shotguns/PlatformGrid.tsx:713 |
| 7 | Body sections (tabs, carousel, grid) | opacity/y | 420 | n/a | 800 | 420 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 420 + (sectionIndex * 120) | src/components/shotguns/PlatformGrid.tsx:508; src/components/shotguns/PlatformGrid.tsx:519 |
| 8 | Tab pills | opacity/y | variable | n/a | 550 | 250 | 270 | variable | cubic-bezier(0.16,1,0.3,1) | start = bodyItemStart(0) + 250 + (i * 270) | src/components/shotguns/PlatformGrid.tsx:133; src/components/shotguns/PlatformGrid.tsx:143 |
| 9 | Mobile carousel cards | opacity/y | variable | n/a | 550 | 80 | 100 | variable | cubic-bezier(0.16,1,0.3,1) | start = bodyItemStart(1) + 80 + (i * 100) | src/components/shotguns/PlatformGrid.tsx:240; src/components/shotguns/PlatformGrid.tsx:250 |
| 10 | Desktop platform card | opacity/y/blur | variable | n/a | 550 | 0 | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = bodyItemStart(2) | src/components/shotguns/PlatformGrid.tsx:368; src/components/shotguns/PlatformGrid.tsx:374 |
| 11 | Champion highlight | opacity/y | variable | n/a | 1500 | 300 | n/a | variable | cubic-bezier(0.33,1,0.68,1) | start = bodyItemStart(2) + 300 | src/components/shotguns/PlatformGrid.tsx:300 |

Plain-English timing explanation: The body sections appear 120ms apart, and each section has its own stagger (tabs at 270ms, cards at 100ms). More tabs or carousel cards extend the tail beyond the base reveal.

B) Detailed timeline table (Interaction: Platform grid collapse (expanded -> collapsed) - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1 -> 1.32 | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/PlatformGrid.tsx:457; src/components/shotguns/PlatformGrid.tsx:615 |
| 2 | Atmosphere overlays | opacity -> collapsed values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/PlatformGrid.tsx:436; src/components/shotguns/PlatformGrid.tsx:633 |
| 3 | Title/subtitle color | text color (ink -> white) | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/PlatformGrid.tsx:437; src/components/shotguns/PlatformGrid.tsx:542; src/components/shotguns/PlatformGrid.tsx:723 |
| 4 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/PlatformGrid.tsx:444; src/components/shotguns/PlatformGrid.tsx:773 |
| 5 | Header block exit | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/PlatformGrid.tsx:706 |
| 6 | Body block exit | opacity exit | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/PlatformGrid.tsx:516 |
| 7 | Collapsed container | opacity/blur enter | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/PlatformGrid.tsx:764; src/components/shotguns/PlatformGrid.tsx:770 |
| 8 | "Read more" text | opacity/y | 2000 | n/a | 500 | 2000 | n/a | 2500 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/PlatformGrid.tsx:441; src/components/shotguns/PlatformGrid.tsx:810 |

Plain-English timing explanation: The collapsed "Read more" waits 2 seconds before fading in, so even though the panel collapse ends sooner, the text cue finishes last.

B) Detailed timeline table (Interaction: Platform selection change (tab click/scroll) - other)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Active tab highlight | layoutId highlight position/size | 0 | n/a | variable | 0 | n/a | variable | spring (stiffness 260, damping 30, mass 0.7) | n/a | src/components/shotguns/PlatformGrid.tsx:178 |
| 2 | Tab hover/tap feedback | y -1 on hover, y 0 on tap | 0 | n/a | 220 | 0 | n/a | 220 | easeOut | n/a | src/components/shotguns/PlatformGrid.tsx:173 |
| 3 | Platform card swap (desktop) | opacity/y/blur enter+exit | 0 | n/a | 550 | 0 | n/a | 550 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/PlatformGrid.tsx:371; src/components/shotguns/PlatformGrid.tsx:374 |
| 4 | Champion highlight | opacity/y | 300 | n/a | 1500 | 300 | n/a | 1800 | cubic-bezier(0.33,1,0.68,1) | n/a | src/components/shotguns/PlatformGrid.tsx:300 |

Plain-English timing explanation: The highlight follows a spring, so its timing flexes, while the desktop card swap is a fixed 550ms fade/slide. The champion callout waits 300ms before its longer 1.5s reveal.
Reduced motion / breakpoint differences: `enableTitleReveal` only runs on desktop and is disabled by `useReducedMotion`; `motionEnabled` turns off variants/layout transitions and the spring highlight, leaving static swaps.

## src/components/shotguns/DisciplineRail.tsx

A) Summary table
| Component | Interaction | Phase (open/close/other) | Total time (ms/variable) | What determines it | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/components/shotguns/DisciplineRail.tsx` | Discipline rail expand (collapsed -> expanded) | open | variable | 2000ms reveal/layout transitions + staggered lists and columns | Only when `enableTitleReveal` true; title colors switch on next rAF |
| `src/components/shotguns/DisciplineRail.tsx` | Discipline rail collapse (expanded -> collapsed) | close | variable | 2000ms focus fades/layout transitions + delayed "Read more" | "Read more" waits 2000ms then runs 500ms |
| `src/components/shotguns/DisciplineRail.tsx` | Category accordion toggle | open/close | variable | Nested list stagger + icon rotation | Nested list has no exit animation |
| `src/components/shotguns/DisciplineRail.tsx` | Discipline selection change | other | variable | Spring highlight + detail card swap | Detail card uses AnimatePresence |
| `src/components/shotguns/DisciplineRail.tsx` | Model modal open/close | open/close | 550 | Modal overlay + card tween | Only when model details are loaded |

B) Detailed timeline table (Interaction: Discipline rail expand (collapsed -> expanded) - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1.32 -> 1 | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:404; src/components/shotguns/DisciplineRail.tsx:609 |
| 2 | Atmosphere overlays (scrims/film-grain/gradient) | opacity -> focus values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:383; src/components/shotguns/DisciplineRail.tsx:622 |
| 3 | Rail shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:382; src/components/shotguns/DisciplineRail.tsx:668 |
| 4 | Title/subtitle color | text color (white -> ink/ink-muted) | next rAF | n/a | 2000 | n/a | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = next animation frame after expand | src/components/shotguns/DisciplineRail.tsx:384; src/components/shotguns/DisciplineRail.tsx:413; src/components/shotguns/DisciplineRail.tsx:704 |
| 5 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:392; src/components/shotguns/DisciplineRail.tsx:694 |
| 6 | Collapsed container | opacity/blur exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:386; src/components/shotguns/DisciplineRail.tsx:745 |
| 7 | Header container | opacity 0 -> 1 | 280 | n/a | unknown | 280 | n/a | variable | unknown | n/a | src/components/shotguns/DisciplineRail.tsx:467 |
| 8 | Header items (title/subtitle/collapse button) | opacity/y/blur | 360 | n/a | 820 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 280 + 80 + (i * 120) | src/components/shotguns/DisciplineRail.tsx:485; src/components/shotguns/DisciplineRail.tsx:699 |
| 9 | Body container | opacity/blur | 440 | n/a | 2000 | 440 | n/a | 2440 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:490 |
| 10 | Body column items | opacity/y | 640 | n/a | 550 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 440 + 120 + 80 + (i * 120) | src/components/shotguns/DisciplineRail.tsx:500; src/components/shotguns/DisciplineRail.tsx:522 |
| 11 | Category list items | opacity/y | 700 | n/a | 550 | 60 | 100 | variable | cubic-bezier(0.16,1,0.3,1) | start = 440 + 120 + 80 + 60 + (i * 100) | src/components/shotguns/DisciplineRail.tsx:527; src/components/shotguns/DisciplineRail.tsx:537 |
| 12 | Nested discipline items (open category) | opacity/y | variable | n/a | 550 | 40 | 80 | variable | cubic-bezier(0.16,1,0.3,1) | start = listItemStart + 40 + (j * 80) | src/components/shotguns/DisciplineRail.tsx:542; src/components/shotguns/DisciplineRail.tsx:877 |
| 13 | Selected discipline card | opacity/y | variable | n/a | 550 | 0 | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = 440 + 120 + 80 | src/components/shotguns/DisciplineRail.tsx:930; src/components/shotguns/DisciplineRail.tsx:937 |

Plain-English timing explanation: The header waits ~280ms before its items stagger in. The body arrives later and then cascades its list items, so more categories or nested disciplines stretch the tail.

B) Detailed timeline table (Interaction: Discipline rail collapse (expanded -> collapsed) - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1 -> 1.32 | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:405; src/components/shotguns/DisciplineRail.tsx:609 |
| 2 | Atmosphere overlays | opacity -> collapsed values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:383; src/components/shotguns/DisciplineRail.tsx:622 |
| 3 | Rail shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:382; src/components/shotguns/DisciplineRail.tsx:668 |
| 4 | Title/subtitle color | text color (ink -> white) | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:384; src/components/shotguns/DisciplineRail.tsx:425; src/components/shotguns/DisciplineRail.tsx:704 |
| 5 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:392; src/components/shotguns/DisciplineRail.tsx:754 |
| 6 | Header block exit | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:477 |
| 7 | Body block exit | opacity/blur exit | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:497 |
| 8 | Collapsed container | opacity/blur enter | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:745 |
| 9 | "Read more" text | opacity/y | 2000 | n/a | 500 | 2000 | n/a | 2500 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:389; src/components/shotguns/DisciplineRail.tsx:791 |

Plain-English timing explanation: The collapse cue ("Read more") waits two seconds before fading in, so it finishes after the rest of the collapse finishes.

B) Detailed timeline table (Interaction: Category accordion toggle - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Plus icon | rotate 0 -> 45deg | 0 | n/a | unknown | 0 | n/a | unknown | unknown (Tailwind default) | n/a | src/components/shotguns/DisciplineRail.tsx:858 |
| 2 | Nested discipline list | opacity/y | 40 | n/a | 550 | 40 | 80 | variable | cubic-bezier(0.16,1,0.3,1) | start = 40 + (i * 80) | src/components/shotguns/DisciplineRail.tsx:542; src/components/shotguns/DisciplineRail.tsx:874 |

Plain-English timing explanation: Nested disciplines appear 80ms apart after a short 40ms delay, so longer lists take longer to finish.

B) Detailed timeline table (Interaction: Category accordion toggle - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Plus icon | rotate 45deg -> 0 | 0 | n/a | unknown | 0 | n/a | unknown | unknown (Tailwind default) | n/a | src/components/shotguns/DisciplineRail.tsx:858 |
| 2 | Nested discipline list | unmount (no exit animation) | 0 | n/a | n/a | n/a | n/a | n/a | n/a | n/a | src/components/shotguns/DisciplineRail.tsx:866 |

B) Detailed timeline table (Interaction: Discipline selection change - other)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Active highlight pill | layoutId highlight position/size | 0 | n/a | variable | 0 | n/a | variable | spring (stiffness 260, damping 30, mass 0.7) | n/a | src/components/shotguns/DisciplineRail.tsx:895 |
| 2 | Detail card swap | opacity/y enter+exit | 0 | n/a | 550 | 0 | n/a | 550 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:933; src/components/shotguns/DisciplineRail.tsx:937 |

Plain-English timing explanation: The highlight follows a spring so it settles at different speeds, while the discipline card swap always takes 550ms.

B) Detailed timeline table (Interaction: Model modal open - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Modal overlay | opacity 0 -> 1 | 0 | 0% | 550 | 0 | n/a | 550 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:255; src/components/shotguns/DisciplineRail.tsx:262 |
| 2 | Modal card | opacity/y/scale/blur to visible | 0 | 0% | 550 | 0 | n/a | 550 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:272; src/components/shotguns/DisciplineRail.tsx:281 |

B) Detailed timeline table (Interaction: Model modal close - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Modal overlay | opacity 1 -> 0 | 0 | 0% | 550 | 0 | n/a | 550 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:261; src/components/shotguns/DisciplineRail.tsx:262 |
| 2 | Modal card | opacity/y/scale/blur to hidden | 0 | 0% | 550 | 0 | n/a | 550 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/DisciplineRail.tsx:279; src/components/shotguns/DisciplineRail.tsx:280 |

Reduced motion / breakpoint differences: `enableTitleReveal` only runs on desktop (`min-width: 1024px`) and is disabled by `useReducedMotion`; `motionEnabled` removes variants/layout animations and the spring highlight, leaving static state changes.

## src/components/shotguns/TriggerExplainer.tsx

A) Summary table
| Component | Interaction | Phase (open/close/other) | Total time (ms/variable) | What determines it | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/components/shotguns/TriggerExplainer.tsx` | Trigger explainer expand (collapsed -> expanded) | open | variable | 2000ms reveal/layout transitions + staggered header/body items | Only when `enableTitleReveal` true; title colors switch on next rAF |
| `src/components/shotguns/TriggerExplainer.tsx` | Trigger explainer collapse (expanded -> collapsed) | close | variable | 2000ms focus fades/layout transitions + staggered collapsed text | Collapsed header uses the same `headerBlock` reveal |
| `src/components/shotguns/TriggerExplainer.tsx` | Details accordion toggle (mobile) | open/close | variable | 250-300ms container + 800ms staggered content | Only the mobile Collapsible renders on `lg:hidden` |

B) Detailed timeline table (Interaction: Trigger explainer expand (collapsed -> expanded) - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1.32 -> 1 | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/TriggerExplainer.tsx:105; src/components/shotguns/TriggerExplainer.tsx:364 |
| 2 | Atmosphere overlays (scrims/film-grain/gradient) | opacity -> focus values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/TriggerExplainer.tsx:87; src/components/shotguns/TriggerExplainer.tsx:381 |
| 3 | Explainer shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/TriggerExplainer.tsx:86; src/components/shotguns/TriggerExplainer.tsx:428 |
| 4 | Title/subtitle color | text color (white -> ink/ink-muted) | next rAF | n/a | 2000 | n/a | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = next animation frame after expand | src/components/shotguns/TriggerExplainer.tsx:88; src/components/shotguns/TriggerExplainer.tsx:300; src/components/shotguns/TriggerExplainer.tsx:471 |
| 5 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/TriggerExplainer.tsx:93; src/components/shotguns/TriggerExplainer.tsx:460 |
| 6 | Collapsed container | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/TriggerExplainer.tsx:172; src/components/shotguns/TriggerExplainer.tsx:531 |
| 7 | Header block | opacity 0 -> 1 | 200 | n/a | 2000 | 200 | n/a | 2200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/TriggerExplainer.tsx:161; src/components/shotguns/TriggerExplainer.tsx:441 |
| 8 | Header items (title/subtitle/trigger) | opacity/y/blur | 280 | n/a | 800 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 200 + 80 + (i * 120) | src/components/shotguns/TriggerExplainer.tsx:156; src/components/shotguns/TriggerExplainer.tsx:466 |
| 9 | Body block | opacity/y | 360 | n/a | 2000 | 360 | n/a | 2360 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/TriggerExplainer.tsx:175; src/components/shotguns/TriggerExplainer.tsx:604 |
| 10 | Body items (copy card, diagram, links) | opacity/y/blur | 440 | n/a | 800 | 80 | 100 | variable | cubic-bezier(0.16,1,0.3,1) | start = 360 + 80 + (i * 100) + nestedDelay(60-120) | src/components/shotguns/TriggerExplainer.tsx:190; src/components/shotguns/TriggerExplainer.tsx:210 |

Plain-English timing explanation: The header waits 200ms before its items cascade. The body starts later, then its content and links stagger in; longer content lists extend the tail.

B) Detailed timeline table (Interaction: Trigger explainer collapse (expanded -> collapsed) - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1 -> 1.32 | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/TriggerExplainer.tsx:106; src/components/shotguns/TriggerExplainer.tsx:364 |
| 2 | Atmosphere overlays | opacity -> collapsed values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/TriggerExplainer.tsx:87; src/components/shotguns/TriggerExplainer.tsx:381 |
| 3 | Explainer shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/TriggerExplainer.tsx:86; src/components/shotguns/TriggerExplainer.tsx:428 |
| 4 | Title/subtitle color | text color (ink -> white) | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/TriggerExplainer.tsx:88; src/components/shotguns/TriggerExplainer.tsx:312; src/components/shotguns/TriggerExplainer.tsx:471 |
| 5 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/TriggerExplainer.tsx:93; src/components/shotguns/TriggerExplainer.tsx:540 |
| 6 | Header block exit | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/TriggerExplainer.tsx:172; src/components/shotguns/TriggerExplainer.tsx:441 |
| 7 | Body block exit | opacity/y exit | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/TriggerExplainer.tsx:187; src/components/shotguns/TriggerExplainer.tsx:604 |
| 8 | Collapsed header items | opacity/y/blur | 200 | n/a | 2000 | 200 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 200 + (i * 120) | src/components/shotguns/TriggerExplainer.tsx:161; src/components/shotguns/TriggerExplainer.tsx:531 |

Plain-English timing explanation: The collapsed header uses the same 200ms delayed reveal and 120ms stagger as the expanded header, so the number of items affects the tail.

B) Detailed timeline table (Interaction: Details accordion toggle (mobile) - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Collapsible content wrapper | height 0 -> content height; opacity 0 -> 1 | 0 | n/a | 250 | 0 | n/a | 250 | ease-out | n/a | src/components/ui/collapsible.tsx:21; src/styles/site-theme.css:716 |
| 2 | Collapsible content wrapper | opacity transition (data-state) | 0 | n/a | 300 | 0 | n/a | 300 | unknown (CSS) | n/a | src/components/shotguns/TriggerExplainer.tsx:111 |
| 3 | Detail content items | opacity/y/blur | 60 | n/a | 800 | 60 | 100 | variable | cubic-bezier(0.16,1,0.3,1) | start = 60 + (i * 100) | src/components/shotguns/TriggerExplainer.tsx:190; src/components/shotguns/TriggerExplainer.tsx:513 |

Plain-English timing explanation: The panel opens quickly (250-300ms), then the content inside staggers in 100ms apart, so more items extend the tail.

B) Detailed timeline table (Interaction: Details accordion toggle (mobile) - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Collapsible content wrapper | height -> 0; opacity -> 0 | 0 | 0% | 250 | 0 | n/a | 250 | ease-out | n/a | src/components/ui/collapsible.tsx:21; src/styles/site-theme.css:727 |
| 2 | Collapsible content wrapper | opacity transition (data-state) | 0 | 0% | 300 | 0 | n/a | 300 | unknown (CSS) | n/a | src/components/shotguns/TriggerExplainer.tsx:111 |

Reduced motion / breakpoint differences: `enableTitleReveal` only runs on desktop (`min-width: 1024px`) and is disabled by `useReducedMotion`; `motionEnabled` disables variants/layout animations, and the mobile Collapsible is only rendered under `lg`.

## src/components/shotguns/EngravingGradesCarousel.tsx

A) Summary table
| Component | Interaction | Phase (open/close/other) | Total time (ms/variable) | What determines it | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/components/shotguns/EngravingGradesCarousel.tsx` | Engraving carousel expand (collapsed -> expanded) | open | variable | 2000ms reveal/layout transitions + staggered lists and card content | Only when `enableTitleReveal` true; title colors switch on next rAF |
| `src/components/shotguns/EngravingGradesCarousel.tsx` | Engraving carousel collapse (expanded -> collapsed) | close | variable | 2000ms focus fades/layout transitions + delayed "Read more" | "Read more" waits 2000ms then runs 500ms |
| `src/components/shotguns/EngravingGradesCarousel.tsx` | Category accordion toggle | open/close | variable | Nested list stagger + icon rotation | Nested list has no exit animation |
| `src/components/shotguns/EngravingGradesCarousel.tsx` | Grade selection change | other | variable | Spring highlight + grade card swap | Grade card content staggers internally |

B) Detailed timeline table (Interaction: Engraving carousel expand (collapsed -> expanded) - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1.32 -> 1 | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:229; src/components/shotguns/EngravingGradesCarousel.tsx:426 |
| 2 | Atmosphere overlays (scrims/film-grain/gradient) | opacity -> focus values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:208; src/components/shotguns/EngravingGradesCarousel.tsx:440 |
| 3 | Carousel shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:207; src/components/shotguns/EngravingGradesCarousel.tsx:486 |
| 4 | Title/subtitle color | text color (white -> ink/ink-muted) | next rAF | n/a | 2000 | n/a | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = next animation frame after expand | src/components/shotguns/EngravingGradesCarousel.tsx:209; src/components/shotguns/EngravingGradesCarousel.tsx:238; src/components/shotguns/EngravingGradesCarousel.tsx:522 |
| 5 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:217; src/components/shotguns/EngravingGradesCarousel.tsx:511 |
| 6 | Collapsed container | opacity/blur exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:211; src/components/shotguns/EngravingGradesCarousel.tsx:562 |
| 7 | Header container | opacity 0 -> 1 | 280 | n/a | unknown | 280 | n/a | variable | unknown | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:292 |
| 8 | Header items (title/subtitle/collapse button) | opacity/y/blur | 360 | n/a | 820 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 280 + 80 + (i * 120) | src/components/shotguns/EngravingGradesCarousel.tsx:310; src/components/shotguns/EngravingGradesCarousel.tsx:516 |
| 9 | Body container | opacity/y | 440 | n/a | 2000 | 440 | n/a | 2440 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:315 |
| 10 | Body column items | opacity/y/blur | 640 | n/a | 550 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 440 + 120 + 80 + (i * 120) | src/components/shotguns/EngravingGradesCarousel.tsx:325; src/components/shotguns/EngravingGradesCarousel.tsx:347 |
| 11 | Category list items | opacity/y | 700 | n/a | 550 | 60 | 250 | variable | cubic-bezier(0.16,1,0.3,1) | start = 440 + 120 + 80 + 60 + (i * 250) | src/components/shotguns/EngravingGradesCarousel.tsx:352; src/components/shotguns/EngravingGradesCarousel.tsx:362 |
| 12 | Nested grade items (open category) | opacity/y | variable | n/a | 550 | 40 | 80 | variable | cubic-bezier(0.16,1,0.3,1) | start = listItemStart + 40 + (j * 80) | src/components/shotguns/EngravingGradesCarousel.tsx:367; src/components/shotguns/EngravingGradesCarousel.tsx:685 |
| 13 | Selected grade card | opacity/y | variable | n/a | 550 | 0 | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = 440 + 120 + 80 | src/components/shotguns/EngravingGradesCarousel.tsx:748; src/components/shotguns/EngravingGradesCarousel.tsx:754 |
| 14 | Grade card content (media + text items) | opacity/y/blur | variable | n/a | 550 | 80 | 100 | variable | cubic-bezier(0.16,1,0.3,1) | start = gradeCardStart + 80 + (i * 100) | src/components/shotguns/EngravingGradesCarousel.tsx:787; src/components/shotguns/EngravingGradesCarousel.tsx:811 |

Plain-English timing explanation: Categories appear 250ms apart, and the nested grade list adds an extra 80ms stagger inside the open category. The grade card itself then staggers its content, so longer content extends the tail.

B) Detailed timeline table (Interaction: Engraving carousel collapse (expanded -> collapsed) - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1 -> 1.32 | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:230; src/components/shotguns/EngravingGradesCarousel.tsx:426 |
| 2 | Atmosphere overlays | opacity -> collapsed values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:208; src/components/shotguns/EngravingGradesCarousel.tsx:440 |
| 3 | Carousel shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:207; src/components/shotguns/EngravingGradesCarousel.tsx:486 |
| 4 | Title/subtitle color | text color (ink -> white) | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:209; src/components/shotguns/EngravingGradesCarousel.tsx:250; src/components/shotguns/EngravingGradesCarousel.tsx:522 |
| 5 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:217; src/components/shotguns/EngravingGradesCarousel.tsx:571 |
| 6 | Header block exit | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:302 |
| 7 | Body block exit | opacity/y exit | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:322 |
| 8 | Collapsed container | opacity/blur enter | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:562 |
| 9 | "Read more" text | opacity/y | 2000 | n/a | 500 | 2000 | n/a | 2500 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:214; src/components/shotguns/EngravingGradesCarousel.tsx:607 |

Plain-English timing explanation: The collapse prompt is intentionally delayed by 2 seconds, so it finishes after the main fade/scale transitions.

B) Detailed timeline table (Interaction: Category accordion toggle - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Plus icon | rotate 0 -> 45deg | 0 | n/a | unknown | 0 | n/a | unknown | unknown (Tailwind default) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:674 |
| 2 | Nested grade list | opacity/y | 40 | n/a | 550 | 40 | 80 | variable | cubic-bezier(0.16,1,0.3,1) | start = 40 + (i * 80) | src/components/shotguns/EngravingGradesCarousel.tsx:367; src/components/shotguns/EngravingGradesCarousel.tsx:685 |

Plain-English timing explanation: Nested grades appear 80ms apart after a short 40ms delay, so the list length determines the total time.

B) Detailed timeline table (Interaction: Category accordion toggle - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Plus icon | rotate 45deg -> 0 | 0 | n/a | unknown | 0 | n/a | unknown | unknown (Tailwind default) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:674 |
| 2 | Nested grade list | unmount (no exit animation) | 0 | n/a | n/a | n/a | n/a | n/a | n/a | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:683 |

B) Detailed timeline table (Interaction: Grade selection change - other)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Active highlight pill | layoutId highlight position/size | 0 | n/a | variable | 0 | n/a | variable | spring (stiffness 260, damping 30, mass 0.7) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:712 |
| 2 | Grade card swap | opacity/y enter+exit | 0 | n/a | 550 | 0 | n/a | 550 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/shotguns/EngravingGradesCarousel.tsx:749; src/components/shotguns/EngravingGradesCarousel.tsx:754 |
| 3 | Grade card content (media + text items) | opacity/y/blur | 80 | n/a | 550 | 80 | 100 | variable | cubic-bezier(0.16,1,0.3,1) | start = 80 + (i * 100) | src/components/shotguns/EngravingGradesCarousel.tsx:801; src/components/shotguns/EngravingGradesCarousel.tsx:811 |

Plain-English timing explanation: The active highlight uses a spring (variable), while the grade card itself fades in over 550ms and its internal text lines stagger 100ms apart.
Reduced motion / breakpoint differences: `enableTitleReveal` only runs on desktop (`min-width: 1024px`) and is disabled by `useReducedMotion`; `motionEnabled` removes variants/layout transitions and the spring highlight.

## src/components/bespoke/BuildStepsScroller.tsx

A) Summary table
| Component | Interaction | Phase (open/close/other) | Total time (ms/variable) | What determines it | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/components/bespoke/BuildStepsScroller.tsx` | Build steps expand (collapsed -> expanded) | open | variable | 2000ms reveal/layout transitions + staggered header/body/steps | Only when `enableTitleReveal` true; title colors switch on next rAF |
| `src/components/bespoke/BuildStepsScroller.tsx` | Build steps collapse (expanded -> collapsed) | close | variable | 2000ms focus fades/layout transitions + collapsed header stagger | Collapsed view uses same header variants |
| `src/components/bespoke/BuildStepsScroller.tsx` | Step detail accordion toggle | open/close | 250 | Height/opacity tween | Per-step detail panel only |
| `src/components/bespoke/BuildStepsScroller.tsx` | Active step change (rail click/scroll) | other | variable | Spring highlight + micro hover/tap | Rail highlight uses layoutId |

B) Detailed timeline table (Interaction: Build steps expand (collapsed -> expanded) - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1.32 -> 1 | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:173; src/components/bespoke/BuildStepsScroller.tsx:491 |
| 2 | Atmosphere overlays (scrims/film-grain/gradient) | opacity -> focus values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:146; src/components/bespoke/BuildStepsScroller.tsx:506 |
| 3 | Build steps shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:144; src/components/bespoke/BuildStepsScroller.tsx:548 |
| 4 | Title/subtitle color | text color (white -> ink/ink-muted) | next rAF | n/a | 2000 | n/a | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = next animation frame after expand | src/components/bespoke/BuildStepsScroller.tsx:149; src/components/bespoke/BuildStepsScroller.tsx:309; src/components/bespoke/BuildStepsScroller.tsx:580 |
| 5 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:153; src/components/bespoke/BuildStepsScroller.tsx:571 |
| 6 | Collapsed container | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:221; src/components/bespoke/BuildStepsScroller.tsx:645 |
| 7 | Header container | opacity 0 -> 1 | 120 | n/a | 820 | 120 | n/a | 940 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:209; src/components/bespoke/BuildStepsScroller.tsx:560 |
| 8 | Header items (title/subtitle/cta text) | opacity/y/blur | 200 | n/a | 820 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 120 + 80 + (i * 120) | src/components/bespoke/BuildStepsScroller.tsx:229; src/components/bespoke/BuildStepsScroller.tsx:568 |
| 9 | Body container | opacity/y | 280 | n/a | 820 | 280 | n/a | 1100 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:234; src/components/bespoke/BuildStepsScroller.tsx:714 |
| 10 | Body items | opacity/y | 400 | n/a | 550 | 120 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 280 + 120 + (i * 120) | src/components/bespoke/BuildStepsScroller.tsx:255; src/components/bespoke/BuildStepsScroller.tsx:723 |
| 11 | Steps carousel cards | opacity/y | variable | n/a | 550 | 120 | 100 | variable | cubic-bezier(0.16,1,0.3,1) | start = bodyItemStart + 120 + (i * 100) | src/components/bespoke/BuildStepsScroller.tsx:260; src/components/bespoke/BuildStepsScroller.tsx:274 |
| 12 | Rail items (prev/steps/next) | opacity/y | variable | n/a | 550 | 40 | 60 | variable | cubic-bezier(0.16,1,0.3,1) | start = bodyItemStart + 40 + (i * 60) | src/components/bespoke/BuildStepsScroller.tsx:279; src/components/bespoke/BuildStepsScroller.tsx:298 |

Plain-English timing explanation: The rail and carousel items stagger independently, so more steps extend the tail even though the base header/body reveal is fixed.

B) Detailed timeline table (Interaction: Build steps collapse (expanded -> collapsed) - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1 -> 1.32 | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:174; src/components/bespoke/BuildStepsScroller.tsx:491 |
| 2 | Atmosphere overlays | opacity -> collapsed values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:147; src/components/bespoke/BuildStepsScroller.tsx:506 |
| 3 | Build steps shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:144; src/components/bespoke/BuildStepsScroller.tsx:548 |
| 4 | Title/subtitle color | text color (ink -> white) | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:149; src/components/bespoke/BuildStepsScroller.tsx:321; src/components/bespoke/BuildStepsScroller.tsx:580 |
| 5 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:153; src/components/bespoke/BuildStepsScroller.tsx:656 |
| 6 | Header block exit | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:221 |
| 7 | Body block exit | opacity/y exit | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:247 |
| 8 | Collapsed header items | opacity/y/blur | 300 | n/a | 820 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 220 + 80 + (i * 120) | src/components/bespoke/BuildStepsScroller.tsx:224; src/components/bespoke/BuildStepsScroller.tsx:653 |
| 9 | Collapsed "Read more" | opacity/y | 420 | n/a | 550 | 0 | n/a | 970 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/bespoke/BuildStepsScroller.tsx:696 |

Plain-English timing explanation: The collapsed header uses the same stagger as the expanded header, so the number of items affects the tail.

B) Detailed timeline table (Interaction: Step detail accordion toggle - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Step detail panel | height 0 -> auto; opacity 0 -> 1 | 0 | 0% | 250 | 0 | n/a | 250 | easeOut | n/a | src/components/bespoke/BuildStepsScroller.tsx:883; src/components/bespoke/BuildStepsScroller.tsx:890 |

B) Detailed timeline table (Interaction: Step detail accordion toggle - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Step detail panel | height -> 0; opacity -> 0 | 0 | 0% | 250 | 0 | n/a | 250 | easeOut | n/a | src/components/bespoke/BuildStepsScroller.tsx:887; src/components/bespoke/BuildStepsScroller.tsx:890 |

B) Detailed timeline table (Interaction: Active step change (rail click/scroll) - other)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Rail highlight | layoutId highlight position/size | 0 | n/a | variable | 0 | n/a | variable | spring (stiffness 260, damping 30, mass 0.7) | n/a | src/components/bespoke/BuildStepsScroller.tsx:774 |
| 2 | Rail button hover/tap | y -1 on hover, y 0 on tap | 0 | n/a | 220 | 0 | n/a | 220 | easeOut | n/a | src/components/bespoke/BuildStepsScroller.tsx:769 |

Plain-English timing explanation: The highlight uses a spring so its timing varies, while the hover/tap feedback is a short 220ms micro animation.
Reduced motion / breakpoint differences: `enableTitleReveal` only runs on desktop (`min-width: 1024px`) and is disabled by reduced motion (`reduceMotion` or `useReducedMotion`); `motionEnabled` disables variants/layout transitions and the spring highlight.

## src/components/experience/ExperiencePicker.tsx

A) Summary table
| Component | Interaction | Phase (open/close/other) | Total time (ms/variable) | What determines it | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/components/experience/ExperiencePicker.tsx` | Experience picker expand (collapsed -> expanded) | open | variable | 2000ms reveal/layout transitions + card/FAQ staggers | FAQ delays depend on card count |
| `src/components/experience/ExperiencePicker.tsx` | Experience picker collapse (expanded -> collapsed) | close | variable | 2000ms focus fades/layout transitions + collapsed header stagger | Collapsed view has no delayed "Read more" |
| `src/components/experience/ExperiencePicker.tsx` | FAQ item accordion toggle | open/close | 250 | Collapsible keyframes (250ms) | Applies per FAQ item |

B) Detailed timeline table (Interaction: Experience picker expand (collapsed -> expanded) - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1.32 -> 1 | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/ExperiencePicker.tsx:171; src/components/experience/ExperiencePicker.tsx:334 |
| 2 | Atmosphere overlays (scrims/film-grain/gradient) | opacity -> focus values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/ExperiencePicker.tsx:152; src/components/experience/ExperiencePicker.tsx:348 |
| 3 | Picker shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/ExperiencePicker.tsx:150; src/components/experience/ExperiencePicker.tsx:390 |
| 4 | Title/subtitle color | text color (white -> ink/ink-muted) | next rAF | n/a | 2000 | n/a | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = next animation frame after expand | src/components/experience/ExperiencePicker.tsx:154; src/components/experience/ExperiencePicker.tsx:273; src/components/experience/ExperiencePicker.tsx:427 |
| 5 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/ExperiencePicker.tsx:159; src/components/experience/ExperiencePicker.tsx:418 |
| 6 | Collapsed container | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/ExperiencePicker.tsx:228; src/components/experience/ExperiencePicker.tsx:470 |
| 7 | Header items (title/subtitle/collapse button) | opacity/y/blur | 240 | n/a | 820 | 240 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 240 + (i * 120) | src/components/experience/ExperiencePicker.tsx:218; src/components/experience/ExperiencePicker.tsx:236 |
| 8 | Body items (cards section + FAQ section) | opacity/y | 680 | n/a | 550 | 120 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 560 + 120 + (i * 120) | src/components/experience/ExperiencePicker.tsx:246; src/components/experience/ExperiencePicker.tsx:241 |
| 9 | Picker cards | opacity/y | 800 | n/a | 550 | 120 | 250 | variable | cubic-bezier(0.16,1,0.3,1) | start = 560 + 120 + 120 + (i * 250) | src/components/experience/ExperiencePicker.tsx:258; src/components/experience/ExperiencePicker.tsx:606 |
| 10 | FAQ heading | opacity/y/blur | variable | n/a | 550 | n/a | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = (560 + 120 + 120 + (250 * (cards - 1)) + 150) | src/components/experience/ExperiencePicker.tsx:182; src/components/experience/FAQList.tsx:68 |
| 11 | FAQ list items | opacity/y/blur | variable | n/a | 550 | n/a | 150 | variable | cubic-bezier(0.16,1,0.3,1) | start = faqHeadingDelay + 150 + (i * 150) | src/components/experience/ExperiencePicker.tsx:186; src/components/experience/FAQList.tsx:53 |

Plain-English timing explanation: FAQ timing is computed from the card count: the FAQ heading waits for the last card to finish, then the list items stagger 150ms apart. More cards or FAQ items extend the total time.

B) Detailed timeline table (Interaction: Experience picker collapse (expanded -> collapsed) - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1 -> 1.32 | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/ExperiencePicker.tsx:172; src/components/experience/ExperiencePicker.tsx:334 |
| 2 | Atmosphere overlays | opacity -> collapsed values | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/ExperiencePicker.tsx:152; src/components/experience/ExperiencePicker.tsx:348 |
| 3 | Picker shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/ExperiencePicker.tsx:150; src/components/experience/ExperiencePicker.tsx:390 |
| 4 | Title/subtitle color | text color (ink -> white) | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/ExperiencePicker.tsx:154; src/components/experience/ExperiencePicker.tsx:286; src/components/experience/ExperiencePicker.tsx:427 |
| 5 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/ExperiencePicker.tsx:159; src/components/experience/ExperiencePicker.tsx:483 |
| 6 | Header block exit | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/ExperiencePicker.tsx:228 |
| 7 | Body block exit | opacity/y exit | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/ExperiencePicker.tsx:255 |
| 8 | Collapsed header items | opacity/y/blur | 240 | n/a | 820 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 240 + 80 + (i * 120) | src/components/experience/ExperiencePicker.tsx:236; src/components/experience/ExperiencePicker.tsx:478 |
| 9 | Collapsed "Read more" | opacity/y | 240 | n/a | 550 | 0 | n/a | 790 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/ExperiencePicker.tsx:525 |

Plain-English timing explanation: The collapsed header uses the same stagger as the expanded header, so the number of items affects the tail.

B) Detailed timeline table (Interaction: FAQ item accordion toggle - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Collapsible content wrapper | height 0 -> content height; opacity 0 -> 1 | 0 | 0% | 250 | 0 | n/a | 250 | ease-out | n/a | src/components/ui/collapsible.tsx:21; src/styles/site-theme.css:716 |
| 2 | Plus icon | rotate 0 -> 45deg | 0 | 0% | unknown | 0 | n/a | unknown | unknown (Tailwind default) | n/a | src/components/experience/FAQList.tsx:233 |

B) Detailed timeline table (Interaction: FAQ item accordion toggle - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Collapsible content wrapper | height -> 0; opacity -> 0 | 0 | 0% | 250 | 0 | n/a | 250 | ease-out | n/a | src/components/ui/collapsible.tsx:21; src/styles/site-theme.css:727 |
| 2 | Plus icon | rotate 45deg -> 0 | 0 | 0% | unknown | 0 | n/a | unknown | unknown (Tailwind default) | n/a | src/components/experience/FAQList.tsx:233 |

Reduced motion / breakpoint differences: `enableTitleReveal` only runs on desktop (`min-width: 1024px`) and is disabled by `useReducedMotion`; `motionEnabled` disables variants/layout transitions, and FAQ motion uses the parent delays only when `motionOverrides.mode` is `parent`.

## src/components/experience/VisitFactory.tsx

A) Summary table
| Component | Interaction | Phase (open/close/other) | Total time (ms/variable) | What determines it | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/components/experience/VisitFactory.tsx` | Visit factory expand (collapsed -> expanded) | open | variable | 2000ms reveal/layout transitions + staggered details list | Scrim layers have delayed focus fades |
| `src/components/experience/VisitFactory.tsx` | Visit factory collapse (expanded -> collapsed) | close | variable | 2000ms focus fades/layout transitions + collapsed header stagger | Scrim delays still apply |
| `src/components/experience/VisitFactory.tsx` | "What to expect" accordion toggle | open/close | 250 | Collapsible keyframes | Accordion only renders when content exists |

B) Detailed timeline table (Interaction: Visit factory expand (collapsed -> expanded) - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1.32 -> 1 | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:113; src/components/experience/VisitFactory.tsx:310 |
| 2 | Scrim fade layer | opacity 1 -> 0 | 360 | n/a | 1200 | 360 | n/a | 1560 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:125; src/components/experience/VisitFactory.tsx:325 |
| 3 | Scrim focus layer | opacity 0 -> 1 | 240 | n/a | 1200 | 240 | n/a | 1440 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:124; src/components/experience/VisitFactory.tsx:333 |
| 4 | Film grain | opacity 0 -> 0.2 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:152; src/components/experience/VisitFactory.tsx:339 |
| 5 | Overlay gradient | opacity 0 -> 1 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:152; src/components/experience/VisitFactory.tsx:346 |
| 6 | Visit shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:94; src/components/experience/VisitFactory.tsx:359 |
| 7 | Title/subtitle color | text color (white -> ink/ink-muted) | next rAF | n/a | 2000 | n/a | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = next animation frame after expand | src/components/experience/VisitFactory.tsx:96; src/components/experience/VisitFactory.tsx:250; src/components/experience/VisitFactory.tsx:395 |
| 8 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:101; src/components/experience/VisitFactory.tsx:385 |
| 9 | Collapsed container | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:196; src/components/experience/VisitFactory.tsx:443 |
| 10 | Header container | opacity 0 -> 1 | 120 | n/a | 820 | 120 | n/a | 940 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:184; src/components/experience/VisitFactory.tsx:371 |
| 11 | Header items (title/subtitle/intro) | opacity/y/blur | 200 | n/a | 820 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 120 + 80 + (i * 120) | src/components/experience/VisitFactory.tsx:204; src/components/experience/VisitFactory.tsx:383 |
| 12 | Body container | opacity | 240 | n/a | 820 | 240 | n/a | 1060 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:214; src/components/experience/VisitFactory.tsx:512 |
| 13 | Detail blocks | opacity/y | 360 | n/a | 550 | 120 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 240 + 120 + (i * 120) | src/components/experience/VisitFactory.tsx:229; src/components/experience/VisitFactory.tsx:239 |

Plain-English timing explanation: The header leads by ~120ms, then the details cascade 120ms apart. The scrim layers fade with their own delays, making the background feel staged.

B) Detailed timeline table (Interaction: Visit factory collapse (expanded -> collapsed) - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1 -> 1.32 | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:114; src/components/experience/VisitFactory.tsx:310 |
| 2 | Scrim fade layer | opacity 0 -> 1 | 360 | n/a | 1200 | 360 | n/a | 1560 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:125; src/components/experience/VisitFactory.tsx:325 |
| 3 | Scrim focus layer | opacity 1 -> 0 | 240 | n/a | 1200 | 240 | n/a | 1440 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:124; src/components/experience/VisitFactory.tsx:333 |
| 4 | Film grain | opacity 0.2 -> 0 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:152; src/components/experience/VisitFactory.tsx:339 |
| 5 | Overlay gradient | opacity 1 -> 0 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:152; src/components/experience/VisitFactory.tsx:346 |
| 6 | Visit shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:94; src/components/experience/VisitFactory.tsx:359 |
| 7 | Title/subtitle color | text color (ink -> white) | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:96; src/components/experience/VisitFactory.tsx:262; src/components/experience/VisitFactory.tsx:395 |
| 8 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:101; src/components/experience/VisitFactory.tsx:454 |
| 9 | Header block exit | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:196 |
| 10 | Body block exit | opacity/y exit | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:226 |
| 11 | Collapsed header items | opacity/y/blur | 300 | n/a | 820 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 220 + 80 + (i * 120) | src/components/experience/VisitFactory.tsx:204; src/components/experience/VisitFactory.tsx:451 |
| 12 | Collapsed "Read more" | opacity/y | 300 | n/a | 550 | 0 | n/a | 850 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/VisitFactory.tsx:494 |

Plain-English timing explanation: The collapsed header still staggers its items, while the scrim layers continue their delayed fades for a staged atmosphere shift.

B) Detailed timeline table (Interaction: "What to expect" accordion toggle - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Collapsible content wrapper | height 0 -> content height; opacity 0 -> 1 | 0 | 0% | 250 | 0 | n/a | 250 | ease-out | n/a | src/components/ui/collapsible.tsx:21; src/styles/site-theme.css:716 |
| 2 | Plus icon | rotate 0 -> 45deg | 0 | 0% | unknown | 0 | n/a | unknown | unknown (Tailwind default) | n/a | src/components/experience/VisitFactory.tsx:606 |

B) Detailed timeline table (Interaction: "What to expect" accordion toggle - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Collapsible content wrapper | height -> 0; opacity -> 0 | 0 | 0% | 250 | 0 | n/a | 250 | ease-out | n/a | src/components/ui/collapsible.tsx:21; src/styles/site-theme.css:727 |
| 2 | Plus icon | rotate 45deg -> 0 | 0 | 0% | unknown | 0 | n/a | unknown | unknown (Tailwind default) | n/a | src/components/experience/VisitFactory.tsx:606 |

Reduced motion / breakpoint differences: `enableTitleReveal` only runs on desktop (`min-width: 1024px`) and is disabled by `useReducedMotion`; `motionEnabled` disables variants/layout transitions and scrim animations fall back to static opacity.

## src/components/experience/BookingOptions.tsx

A) Summary table
| Component | Interaction | Phase (open/close/other) | Total time (ms/variable) | What determines it | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/components/experience/BookingOptions.tsx` | Booking options expand (collapsed -> expanded) | open | variable | 2000ms reveal/layout transitions + staggered option cards | Scrim layers have delayed focus fades |
| `src/components/experience/BookingOptions.tsx` | Booking options collapse (expanded -> collapsed) | close | variable | 2000ms focus fades/layout transitions + collapsed header stagger | Scrim delays still apply |
| `src/components/experience/BookingOptions.tsx` | Scheduler panel toggle | open/close | 550 | Height/opacity/blur tween | Only when scheduler is loaded |

B) Detailed timeline table (Interaction: Booking options expand (collapsed -> expanded) - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1.32 -> 1 | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:101; src/components/experience/BookingOptions.tsx:299 |
| 2 | Scrim fade layer | opacity 1 -> 0 | 360 | n/a | 1200 | 360 | n/a | 1560 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:113; src/components/experience/BookingOptions.tsx:313 |
| 3 | Scrim focus layer | opacity 0 -> 1 | 240 | n/a | 1200 | 240 | n/a | 1440 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:112; src/components/experience/BookingOptions.tsx:320 |
| 4 | Film grain | opacity 0 -> 0.2 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:140; src/components/experience/BookingOptions.tsx:326 |
| 5 | Overlay gradient | opacity 0 -> 1 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:140; src/components/experience/BookingOptions.tsx:333 |
| 6 | Booking shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:82; src/components/experience/BookingOptions.tsx:346 |
| 7 | Title/subtitle color | text color (white -> ink/ink-muted) | next rAF | n/a | 2000 | n/a | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = next animation frame after expand | src/components/experience/BookingOptions.tsx:84; src/components/experience/BookingOptions.tsx:237; src/components/experience/BookingOptions.tsx:384 |
| 8 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:89; src/components/experience/BookingOptions.tsx:374 |
| 9 | Collapsed container | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:184; src/components/experience/BookingOptions.tsx:426 |
| 10 | Header container | opacity 0 -> 1 | 120 | n/a | 820 | 120 | n/a | 940 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:172; src/components/experience/BookingOptions.tsx:358 |
| 11 | Header items (title/subtitle/collapse button) | opacity/y/blur | 200 | n/a | 820 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 120 + 80 + (i * 120) | src/components/experience/BookingOptions.tsx:192; src/components/experience/BookingOptions.tsx:370 |
| 12 | Body container | opacity | 240 | n/a | 820 | 240 | n/a | 1060 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:202; src/components/experience/BookingOptions.tsx:495 |
| 13 | Option cards | opacity/y/blur | 460 | n/a | 550 | 100 | 100 | variable | cubic-bezier(0.16,1,0.3,1) | start = 240 + 120 + 100 + (i * 100) | src/components/experience/BookingOptions.tsx:217; src/components/experience/BookingOptions.tsx:227 |

Plain-English timing explanation: Option cards appear 100ms apart after the body starts, so the number of options controls the tail of the sequence. Scrim layers fade with their own delays on top of the main reveal.

B) Detailed timeline table (Interaction: Booking options collapse (expanded -> collapsed) - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1 -> 1.32 | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:102; src/components/experience/BookingOptions.tsx:299 |
| 2 | Scrim fade layer | opacity 0 -> 1 | 360 | n/a | 1200 | 360 | n/a | 1560 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:113; src/components/experience/BookingOptions.tsx:313 |
| 3 | Scrim focus layer | opacity 1 -> 0 | 240 | n/a | 1200 | 240 | n/a | 1440 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:112; src/components/experience/BookingOptions.tsx:320 |
| 4 | Film grain | opacity 0.2 -> 0 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:140; src/components/experience/BookingOptions.tsx:326 |
| 5 | Overlay gradient | opacity 1 -> 0 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:140; src/components/experience/BookingOptions.tsx:333 |
| 6 | Booking shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:82; src/components/experience/BookingOptions.tsx:346 |
| 7 | Title/subtitle color | text color (ink -> white) | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:84; src/components/experience/BookingOptions.tsx:250; src/components/experience/BookingOptions.tsx:384 |
| 8 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:89; src/components/experience/BookingOptions.tsx:437 |
| 9 | Header block exit | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:184 |
| 10 | Body block exit | opacity/y exit | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:214 |
| 11 | Collapsed header items | opacity/y/blur | 300 | n/a | 820 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 220 + 80 + (i * 120) | src/components/experience/BookingOptions.tsx:192; src/components/experience/BookingOptions.tsx:434 |
| 12 | Collapsed "Read more" | opacity/y | 300 | n/a | 550 | 0 | n/a | 850 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:477 |

Plain-English timing explanation: The collapsed header still staggers its items, while the scrim layers continue their delayed fades for the background shift.

B) Detailed timeline table (Interaction: Scheduler panel toggle - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Scheduler iframe wrapper | height 0 -> auto; opacity 0 -> 1; blur 10px -> 0 | 0 | 0% | 550 | 0 | n/a | 550 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:587; src/components/experience/BookingOptions.tsx:591 |

B) Detailed timeline table (Interaction: Scheduler panel toggle - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Scheduler iframe wrapper | height -> 0; opacity -> 0; blur -> 10px | 0 | 0% | 550 | 0 | n/a | 550 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/BookingOptions.tsx:589; src/components/experience/BookingOptions.tsx:591 |

Reduced motion / breakpoint differences: `enableTitleReveal` only runs on desktop (`min-width: 1024px`) and is disabled by `useReducedMotion`; `motionEnabled` disables variants/layout transitions and scrim animations fall back to static opacity.

## src/components/experience/TravelNetwork.tsx

A) Summary table
| Component | Interaction | Phase (open/close/other) | Total time (ms/variable) | What determines it | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/components/experience/TravelNetwork.tsx` | Travel network expand (collapsed -> expanded) | open | variable | 2000ms reveal/layout transitions + listReady gating + list stagger | List waits for body animation to complete |
| `src/components/experience/TravelNetwork.tsx` | Travel network collapse (expanded -> collapsed) | close | variable | 2000ms focus fades/layout transitions + collapsed header stagger | Scrim delays still apply |
| `src/components/experience/TravelNetwork.tsx` | Tab change (schedule/dealers) | other | variable | Spring highlight + content swap + list stagger | List items re-animate per tab | 

B) Detailed timeline table (Interaction: Travel network expand (collapsed -> expanded) - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1.32 -> 1 | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:146; src/components/experience/TravelNetwork.tsx:345 |
| 2 | Scrim fade layer | opacity 1 -> 0 | 360 | n/a | 1200 | 360 | n/a | 1560 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:159; src/components/experience/TravelNetwork.tsx:360 |
| 3 | Scrim focus layer | opacity 0 -> 1 | 240 | n/a | 1200 | 240 | n/a | 1440 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:158; src/components/experience/TravelNetwork.tsx:367 |
| 4 | Film grain | opacity 0 -> 0.2 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:186; src/components/experience/TravelNetwork.tsx:374 |
| 5 | Overlay gradient | opacity 0 -> 1 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:186; src/components/experience/TravelNetwork.tsx:381 |
| 6 | Network shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:127; src/components/experience/TravelNetwork.tsx:393 |
| 7 | Title/subtitle color | text color (white -> ink/ink-muted) | next rAF | n/a | 2000 | n/a | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = next animation frame after expand | src/components/experience/TravelNetwork.tsx:129; src/components/experience/TravelNetwork.tsx:283; src/components/experience/TravelNetwork.tsx:429 |
| 8 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:134; src/components/experience/TravelNetwork.tsx:419 |
| 9 | Collapsed container | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:235; src/components/experience/TravelNetwork.tsx:474 |
| 10 | Header container | opacity 0 -> 1 | 120 | n/a | 820 | 120 | n/a | 940 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:223; src/components/experience/TravelNetwork.tsx:405 |
| 11 | Header items (title/subtitle/supporting) | opacity/y/blur | 200 | n/a | 820 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 120 + 80 + (i * 120) | src/components/experience/TravelNetwork.tsx:243; src/components/experience/TravelNetwork.tsx:417 |
| 12 | Body items (tabs + list wrapper) | opacity/y | 360 | n/a | 550 | 120 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 240 + 120 + (i * 120) | src/components/experience/TravelNetwork.tsx:253; src/components/experience/TravelNetwork.tsx:552 |
| 13 | List items (schedule/dealers) | opacity/y | variable | n/a | 550 | 100 | 200 | variable | cubic-bezier(0.16,1,0.3,1) | start = bodyItemStart(1) + 550 + 100 + (i * 200) | src/components/experience/TravelNetwork.tsx:604; src/components/experience/TravelNetwork.tsx:654 |

Plain-English timing explanation: The list doesn't animate until the list wrapper finishes (550ms), then items appear 200ms apart. More items extend the tail beyond the main reveal.

B) Detailed timeline table (Interaction: Travel network collapse (expanded -> collapsed) - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1 -> 1.32 | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:147; src/components/experience/TravelNetwork.tsx:345 |
| 2 | Scrim fade layer | opacity 0 -> 1 | 360 | n/a | 1200 | 360 | n/a | 1560 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:159; src/components/experience/TravelNetwork.tsx:360 |
| 3 | Scrim focus layer | opacity 1 -> 0 | 240 | n/a | 1200 | 240 | n/a | 1440 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:158; src/components/experience/TravelNetwork.tsx:367 |
| 4 | Film grain | opacity 0.2 -> 0 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:186; src/components/experience/TravelNetwork.tsx:374 |
| 5 | Overlay gradient | opacity 1 -> 0 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:186; src/components/experience/TravelNetwork.tsx:381 |
| 6 | Network shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:127; src/components/experience/TravelNetwork.tsx:393 |
| 7 | Title/subtitle color | text color (ink -> white) | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:129; src/components/experience/TravelNetwork.tsx:295; src/components/experience/TravelNetwork.tsx:429 |
| 8 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:134; src/components/experience/TravelNetwork.tsx:485 |
| 9 | Header block exit | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:235 |
| 10 | Body block exit | opacity/y exit | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:265 |
| 11 | Collapsed header items | opacity/y/blur | 300 | n/a | 820 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 220 + 80 + (i * 120) | src/components/experience/TravelNetwork.tsx:243; src/components/experience/TravelNetwork.tsx:482 |
| 12 | Collapsed "Read more" | opacity/y | 300 | n/a | 550 | 0 | n/a | 850 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:525 |

Plain-English timing explanation: The collapsed header still staggers its items, while the scrim layers continue their delayed fades for the background shift.

B) Detailed timeline table (Interaction: Tab change (schedule/dealers) - other)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Active tab highlight | layoutId highlight position/size | 0 | n/a | variable | 0 | n/a | variable | spring (stiffness 260, damping 30, mass 0.7) | n/a | src/components/experience/TravelNetwork.tsx:576 |
| 2 | Tab hover/tap feedback | x 2 on hover, x 0 on tap | 0 | n/a | 220 | 0 | n/a | 220 | easeOut | n/a | src/components/experience/TravelNetwork.tsx:573 |
| 3 | Tab content swap | opacity/y enter+exit | 0 | n/a | 550 | 0 | n/a | 550 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/experience/TravelNetwork.tsx:612; src/components/experience/TravelNetwork.tsx:618 |
| 4 | List items (schedule/dealers) | opacity/y | 100 | n/a | 550 | 100 | 200 | variable | cubic-bezier(0.16,1,0.3,1) | start = 100 + (i * 200) | src/components/experience/TravelNetwork.tsx:654; src/components/experience/TravelNetwork.tsx:712 |

Plain-English timing explanation: Each tab swap fades in over 550ms, then the list items cascade 200ms apart. The spring highlight timing varies.
Reduced motion / breakpoint differences: `enableTitleReveal` only runs on desktop (`min-width: 1024px`) and is disabled by `useReducedMotion`; `motionEnabled` disables variants/layout transitions and the spring highlight.

## src/components/heritage/ChampionsGallery.tsx

A) Summary table
| Component | Interaction | Phase (open/close/other) | Total time (ms/variable) | What determines it | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/components/heritage/ChampionsGallery.tsx` | Champions gallery expand (collapsed -> expanded) | open | variable | 2000ms reveal/layout transitions + list and filter staggers | Scrim layers have delayed focus fades |
| `src/components/heritage/ChampionsGallery.tsx` | Champions gallery collapse (expanded -> collapsed) | close | variable | 2000ms focus fades/layout transitions + collapsed header stagger | Scrim delays still apply |
| `src/components/heritage/ChampionsGallery.tsx` | Discipline filter change | other | variable | Spring highlight + micro tap | Filter highlight uses layoutId |
| `src/components/heritage/ChampionsGallery.tsx` | Champion selection change | other | 220 | Detail panel swap + list hover/tap micro | Detail swap uses homeMotion.micro |

B) Detailed timeline table (Interaction: Champions gallery expand (collapsed -> expanded) - open)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1.32 -> 1 | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:149; src/components/heritage/ChampionsGallery.tsx:384 |
| 2 | Scrim fade layer | opacity 1 -> 0 | 360 | n/a | 1200 | 360 | n/a | 1560 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:162; src/components/heritage/ChampionsGallery.tsx:399 |
| 3 | Scrim focus layer | opacity 0 -> 1 | 240 | n/a | 1200 | 240 | n/a | 1440 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:161; src/components/heritage/ChampionsGallery.tsx:406 |
| 4 | Film grain | opacity 0 -> 0.2 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:189; src/components/heritage/ChampionsGallery.tsx:413 |
| 5 | Overlay gradient | opacity 0 -> 1 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:189; src/components/heritage/ChampionsGallery.tsx:420 |
| 6 | Gallery shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:130; src/components/heritage/ChampionsGallery.tsx:432 |
| 7 | Title/subtitle color | text color (white -> ink/ink-muted) | next rAF | n/a | 2000 | n/a | n/a | variable | cubic-bezier(0.16,1,0.3,1) | start = next animation frame after expand | src/components/heritage/ChampionsGallery.tsx:133; src/components/heritage/ChampionsGallery.tsx:318; src/components/heritage/ChampionsGallery.tsx:468 |
| 8 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:137; src/components/heritage/ChampionsGallery.tsx:458 |
| 9 | Collapsed container | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:233; src/components/heritage/ChampionsGallery.tsx:507 |
| 10 | Header container | opacity 0 -> 1 | 160 | n/a | 820 | 160 | n/a | 980 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:221; src/components/heritage/ChampionsGallery.tsx:444 |
| 11 | Header items (title/subtitle/collapse button) | opacity/y/blur | 240 | n/a | 820 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 160 + 80 + (i * 120) | src/components/heritage/ChampionsGallery.tsx:241; src/components/heritage/ChampionsGallery.tsx:456 |
| 12 | Body items (filters + grid) | opacity/y | 400 | n/a | 550 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 320 + 80 + (i * 120) | src/components/heritage/ChampionsGallery.tsx:246; src/components/heritage/ChampionsGallery.tsx:585 |
| 13 | Filter pills | opacity/y | variable | n/a | 550 | 40 | 100 | variable | cubic-bezier(0.16,1,0.3,1) | start = bodyItemStart + 40 + (i * 100) | src/components/heritage/ChampionsGallery.tsx:266; src/components/heritage/ChampionsGallery.tsx:607 |
| 14 | Champion list items | opacity/y | variable | n/a | 550 | 80 | 100 | variable | cubic-bezier(0.16,1,0.3,1) | start = bodyItemStart + 80 + (i * 100) | src/components/heritage/ChampionsGallery.tsx:302; src/components/heritage/ChampionsGallery.tsx:27 |
| 15 | Champion detail panel (initial) | opacity/y/blur | variable | n/a | 220 | 0 | n/a | variable | easeOut | n/a | src/components/heritage/ChampionsGallery.tsx:704; src/components/heritage/ChampionsGallery.tsx:709 |

Plain-English timing explanation: Filters and list items each have their own stagger, so the total time grows with the number of disciplines or champions. The background scrims fade with their own delays for a staged reveal.

B) Detailed timeline table (Interaction: Champions gallery collapse (expanded -> collapsed) - close)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Background image | scale 1 -> 1.32 | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:150; src/components/heritage/ChampionsGallery.tsx:384 |
| 2 | Scrim fade layer | opacity 0 -> 1 | 360 | n/a | 1200 | 360 | n/a | 1560 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:162; src/components/heritage/ChampionsGallery.tsx:399 |
| 3 | Scrim focus layer | opacity 1 -> 0 | 240 | n/a | 1200 | 240 | n/a | 1440 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:161; src/components/heritage/ChampionsGallery.tsx:406 |
| 4 | Film grain | opacity 0.2 -> 0 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:189; src/components/heritage/ChampionsGallery.tsx:413 |
| 5 | Overlay gradient | opacity 1 -> 0 | 0 | n/a | 1200 | 0 | n/a | 1200 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:189; src/components/heritage/ChampionsGallery.tsx:420 |
| 6 | Gallery shell surface | border/bg/shadow/backdrop-filter | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:130; src/components/heritage/ChampionsGallery.tsx:432 |
| 7 | Title/subtitle color | text color (ink -> white) | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:133; src/components/heritage/ChampionsGallery.tsx:330; src/components/heritage/ChampionsGallery.tsx:468 |
| 8 | Title/subtitle layoutId | layout position/size | 0 | n/a | 2000 | 0 | n/a | 2000 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:137; src/components/heritage/ChampionsGallery.tsx:518 |
| 9 | Header block exit | opacity exit | 0 | n/a | 820 | 0 | n/a | 820 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:233 |
| 10 | Body block exit | opacity/y exit | 0 | n/a | 1050 | 0 | n/a | 1050 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:258 |
| 11 | Collapsed header items | opacity/y/blur | 320 | n/a | 820 | 80 | 120 | variable | cubic-bezier(0.16,1,0.3,1) | start = 240 + 80 + (i * 120) | src/components/heritage/ChampionsGallery.tsx:241; src/components/heritage/ChampionsGallery.tsx:515 |
| 12 | Collapsed "Read more" | opacity/y | 320 | n/a | 550 | 0 | n/a | 870 | cubic-bezier(0.16,1,0.3,1) | n/a | src/components/heritage/ChampionsGallery.tsx:558 |

Plain-English timing explanation: The collapsed header still staggers its items, while the scrim layers continue their delayed fades for the background shift.

B) Detailed timeline table (Interaction: Discipline filter change - other)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Active filter highlight | layoutId highlight position/size | 0 | n/a | variable | 0 | n/a | variable | spring (stiffness 260, damping 30, mass 0.7) | n/a | src/components/heritage/ChampionsGallery.tsx:610 |
| 2 | Filter button tap feedback | scale 1 -> 0.98 | 0 | n/a | 220 | 0 | n/a | 220 | easeOut | n/a | src/components/heritage/ChampionsGallery.tsx:605 |

Plain-English timing explanation: The highlight uses a spring so it settles at different speeds, while tap feedback is a fixed 220ms micro animation.

B) Detailed timeline table (Interaction: Champion selection change - other)
| Step | Piece (element/part) | What changes (prop/CSS) | Start (ms) | Start (% of total)* | Duration (ms/variable) | Delay (ms) | Stagger (ms) | End (ms/variable) | Easing/timing-fn | Formula (if any) | Source (file:line) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Detail panel swap | opacity/y/blur enter+exit | 0 | 0% | 220 | 0 | n/a | 220 | easeOut | n/a | src/components/heritage/ChampionsGallery.tsx:704; src/components/heritage/ChampionsGallery.tsx:709 |
| 2 | List item hover/tap | x 4 on hover; scale 0.99 on tap | 0 | 0% | 220 | 0 | n/a | 220 | easeOut | n/a | src/components/heritage/ChampionsGallery.tsx:767 |

Reduced motion / breakpoint differences: `enableTitleReveal` only runs on desktop (`min-width: 1024px`) and is disabled by `useReducedMotion`; `motionEnabled` disables variants/layout transitions and the spring highlight.
