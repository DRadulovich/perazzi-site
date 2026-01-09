# Performance Checklist

- [ ] Replace direct `cdn.sanity.io` hero/background images with optimized `<Image>` (or `image-set`) and right-size via Sanity image builder.
- [ ] Add `priority` and `fetchPriority="high"` (or preload) for the LCP image on each route.
- [ ] Set accurate `sizes` on all `<Image>` components to reduce oversized downloads.
- [ ] Disable or scope down `_rsc` prefetching for low-priority links (`prefetch={false}` where appropriate).
- [ ] Reduce client JS by auditing `use client`, using server components, and dynamically importing non-critical UI.
- [ ] Optimize fonts (self-host or `next/font` with `font-display: swap`); add preconnects to Typekit if retained.
- [ ] Enable HTML caching for static routes (ISR or `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`).
- [ ] Set `images.minimumCacheTTL` to avoid `max-age=0` on `_next/image` responses.
- [ ] Add `preconnect` to `https://cdn.sanity.io` for routes with hero images.
- [ ] Re-test with Catchpoint and compare LCP, Speed Index, TBT, total bytes, and request counts.
