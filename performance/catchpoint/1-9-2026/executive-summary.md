# Executive Summary

- Artifacts parsed for 6 routes (home, shotguns, bespoke, heritage, experience, service); HAR/CSV analysis uses Run 1 First View, JSON metrics use median runs.
- Lighthouse performance scores are 0.26 to 0.45; LCP ranges 1.80s to 4.04s, TTFB 0.28s to 0.57s, TBT 0.04s to 0.41s, CLS is very low (~0.00007 to 0.00008).
- Images dominate transfer: 18.1MB of 25.1MB total across these runs, with `cdn.sanity.io` at 15.6MB; the experience hero image is 4.6MB and drives a 4.04s LCP.
- LCP is an image on every route; experience, service, and heritage use DIV background images from `cdn.sanity.io` (not Next Image), which blocks responsive sizing and priority loading.
- Each route triggers 14 `_rsc` prefetch requests to other pages; total requests per route are 64 to 90, with 29 to 31 JS chunks (~430 to 447KB transfer) and 5 render-blocking resources flagged.
- HTML responses are `Cache-Control: private, no-cache, no-store` (no edge caching); some `_next/image` responses use `max-age=0`, and Typekit fonts load with `font-display: auto`.
- Highest-impact fixes: resize/convert Sanity images (especially LCP), prioritize LCP fetch (priority/preload or use `<Image>` instead of background images), reduce route prefetching and client JS, optimize fonts, and enable caching for static HTML where safe.
