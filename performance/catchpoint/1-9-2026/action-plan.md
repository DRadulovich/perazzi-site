# Catchpoint Analysis and Action Plan

## Artifacts and parsing notes

- Parsed 6 route folders with HAR, JSON, and request CSV exports.
- HAR and CSV analysis uses Run 1 First View for each route to keep totals aligned.
- JSON metrics use Catchpoint median runs; LCP request timing uses the LCP median run from each HAR.
- Lighthouse audit details are not present in the JSON exports (only category scores), so per-audit opportunities are unknown without a full Lighthouse report.

## Key metrics (medians from JSON)

| Route | URL | Lighthouse Perf | TTFB | FCP | LCP | Speed Index | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| bespoke | https://perazzi-site.vercel.app/bespoke | 0.41 | 0.28s | 2.04s | 2.04s | 2.14s | 0.08s | 0.00008 |
| experience | https://perazzi-site.vercel.app/experience | 0.26 | 0.32s | 2.60s | 4.04s | 4.06s | 0.41s | 0.00008 |
| heritage | https://perazzi-site.vercel.app/heritage | 0.45 | 0.46s | 2.66s | 2.81s | 3.14s | 0.12s | 0.00008 |
| home | https://perazzi-site.vercel.app/ | 0.37 | 0.37s | 1.90s | 2.15s | 2.01s | 0.12s | 0.00008 |
| service | https://perazzi-site.vercel.app/service | 0.35 | 0.57s | 1.96s | 2.31s | 2.62s | 0.04s | 0.00008 |
| shotguns | https://perazzi-site.vercel.app/shotguns | 0.39 | 0.53s | 1.70s | 1.80s | 1.89s | 0.23s | 0.00007 |

## HAR vs CSV totals (Run 1 First View)

| Route | HAR requests | HAR bytes | CSV requests | CSV bytes | Delta (HAR-CSV) |
| --- | --- | --- | --- | --- | --- |
| bespoke | 69 | 1408913 | 69 | 1371303 | 37610 |
| experience | 68 | 5729367 | 68 | 5691577 | 37790 |
| heritage | 71 | 1488230 | 71 | 1449361 | 38869 |
| home | 67 | 1658611 | 67 | 1622067 | 36544 |
| service | 64 | 2628098 | 64 | 2592676 | 35422 |
| shotguns | 90 | 10332978 | 90 | 10280555 | 52423 |

## HAR request rankings

### Transfer size (top 10)

See `performance/catchpoint/1-9-2026/top-10-offenders.md`.

### Total load time (top 10)

- shotguns 2844ms html https://perazzi-site.vercel.app/shotguns
- experience 2467ms image https://cdn.sanity.io/images/m42h56wl/production/ccba2f0d6cbde65287721b9635ac599823434a4e-4672x7008.jpg
- experience 2307ms html https://perazzi-site.vercel.app/experience
- bespoke 2094ms html https://perazzi-site.vercel.app/bespoke
- shotguns 1771ms image https://cdn.sanity.io/images/m42h56wl/production/d735018c2ba66b61b1e65ff3e52cdc5bd4173eda-4205x2803.jpg
- shotguns 1766ms image https://cdn.sanity.io/images/m42h56wl/production/99f6d283451badbeae0e115ca019fd08be44ef54-4205x2365.jpg
- shotguns 1634ms image https://cdn.sanity.io/images/m42h56wl/production/cb08d114ca55b5bb58117b10991cde7c55cfd4a1-3738x2102.jpg
- home 1488ms html https://perazzi-site.vercel.app/
- heritage 1446ms html https://perazzi-site.vercel.app/heritage
- service 926ms html https://perazzi-site.vercel.app/service

### Earliest start (critical chain)

- shotguns 33ms html https://perazzi-site.vercel.app/shotguns
- home 36ms html https://perazzi-site.vercel.app/
- service 39ms html https://perazzi-site.vercel.app/service
- experience 40ms html https://perazzi-site.vercel.app/experience
- bespoke 44ms html https://perazzi-site.vercel.app/bespoke
- heritage 64ms html https://perazzi-site.vercel.app/heritage
- service 589ms css https://perazzi-site.vercel.app/_next/static/chunks/783fe1b4808cbb2e.css?dpl=dpl_92mxXNLyVFW46Tgwa8tYVp4JznTQ
- service 606ms image https://perazzi-site.vercel.app/_next/image?url=%2FPLW.png&w=128&q=75&dpl=dpl_92mxXNLyVFW46Tgwa8tYVp4JznTQ
- service 606ms image https://perazzi-site.vercel.app/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fm42h56wl%2Fproduction%2F0d8d1cb2614c03e39e168db7e6b03b9a513de426-4992x3328.jpg&w=1200&q=75
- service 654ms js https://perazzi-site.vercel.app/_next/static/chunks/c4ed55bd840082e0.js?dpl=dpl_92mxXNLyVFW46Tgwa8tYVp4JznTQ

## Domain and type breakdown (all routes, Run 1 First View)

### Domains by bytes

- cdn.sanity.io: 23 requests, 15560113 bytes
- perazzi-site.vercel.app: 348 requests, 6704044 bytes
- use.typekit.net: 45 requests, 975144 bytes
- m42h56wl.api.sanity.io: 6 requests, 3174 bytes
- p.typekit.net: 6 requests, 1902 bytes
- www.google.com: 1 request, 1820 bytes

### Types by bytes

- image: 73 requests, 18131848 bytes
- js: 184 requests, 2631804 bytes
- html: 7 requests, 1226140 bytes
- font: 39 requests, 966174 bytes
- css: 18 requests, 191688 bytes
- other-text: 84 requests, 81647 bytes
- json: 18 requests, 13722 bytes
- other: 6 requests, 3174 bytes

## LCP analysis

### LCP elements (from JSON medians)

| Route | LCP (s) | LCP element type | Node | LCP URL |
| --- | --- | --- | --- | --- |
| bespoke | 2.04s | image | IMG | https://perazzi-site.vercel.app/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fm42h56wl%2Fproduction%2F8520a478aedcfb4e8a70bec6a278648f96bb4724-3092x4428.jpg&w=1200&q=75 |
| experience | 4.04s | image | DIV | https://cdn.sanity.io/images/m42h56wl/production/ccba2f0d6cbde65287721b9635ac599823434a4e-4672x7008.jpg |
| heritage | 2.81s | image | DIV | https://cdn.sanity.io/images/m42h56wl/production/666c0aaaf05d0a4a5216b5dbe9825a35eac067b1-1600x1200.jpg |
| home | 2.15s | image | IMG | https://perazzi-site.vercel.app/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fm42h56wl%2Fproduction%2F53beff5dcaeba3a0f28b10d2b50227df8ecafad4-4950x3300.jpg&w=1920&q=75 |
| service | 2.31s | image | DIV | https://cdn.sanity.io/images/m42h56wl/production/0d8d1cb2614c03e39e168db7e6b03b9a513de426-4992x3328.jpg |
| shotguns | 1.80s | image | IMG | https://perazzi-site.vercel.app/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fm42h56wl%2Fproduction%2F06f16d81d3e8b1df2fc705e9b6bd48cc230fbb81-6016x4016.jpg&w=1920&q=75 |

### LCP request timing (from HAR, LCP median run)

| Route | LCP request start (ms) | LCP request duration (ms) | LCP transfer bytes |
| --- | --- | --- | --- |
| bespoke | 330 | 68 | 141715 |
| experience | 640 | 1390 | 4607395 |
| heritage | 793 | 58 | 154709 |
| home | 458 | 302 | 160130 |
| service | 945 | 269 | 1765464 |
| shotguns | 737 | 158 | 168852 |

## Symptoms -> likely causes

- Low Lighthouse performance scores are driven primarily by large hero imagery (experience, service, shotguns) and delayed LCP fetches (LCP requests start 640ms to 945ms in the median runs).
- TBT is highest on experience (0.41s) and shotguns (0.23s) with 29 to 31 JS chunks on every route and 5 render-blocking resources flagged.
- High request counts (64 to 90) are inflated by 14 `_rsc` prefetch requests to other routes on every page.
- Font loading is likely blocking or FOIT-prone due to Typekit CSS and `font-display: auto`.
- HTML is never cached at the edge due to `Cache-Control: private, no-cache, no-store`.

## Prioritized recommendations

[x] 1) Right-size and reformat Sanity images (especially LCP heroes)
- Why this matters: images are 72% of total bytes and directly determine LCP and Speed Index.
- Evidence: `performance/catchpoint/1-9-2026/experience/422511.har` shows a 4.6MB `cdn.sanity.io` image as the top transfer offender; LCP on experience is 4.04s in `performance/catchpoint/1-9-2026/experience/422511.json`.
- Implementation guidance: use the Sanity image builder to request exact dimensions for the rendered slot, and set `auto=format` or `format=webp`/`avif` with a tuned `q` value (60 to 75). Ensure `sizes` is set on all `<Image>` components so the smallest valid size is served per breakpoint. For background images, switch to `<Image>` or use `image-set()` with width-specific URLs.
- Effort: M
- Validate: LCP and Speed Index should improve, total bytes and image bytes should drop in HAR/CSV.

[x] 2) Stop loading full-size background hero images outside Next Image
- Why this matters: LCP images on experience, service, and heritage are DIV backgrounds from `cdn.sanity.io`, which bypass Next.js optimization and preload priority.
- Evidence: LCP element node is DIV for these routes in `performance/catchpoint/1-9-2026/experience/422511.json`, `performance/catchpoint/1-9-2026/service/422513.json`, and `performance/catchpoint/1-9-2026/heritage/422512.json`.
- Implementation guidance: replace background-image heroes with `<Image>` (or `<picture>` with `srcset`) and set `priority` and `fetchPriority="high"`. If a background is required, add a `<link rel="preload" as="image">` with `imagesrcset` and `imagesizes` matching the layout.
- Effort: M
- Validate: LCP request start should shift earlier and LCP should drop, especially on experience and service.

[x] 3) Reduce route prefetching of RSC requests
- Why this matters: 14 `_rsc` prefetch requests are issued on every page, inflating request count and bytes with no immediate user benefit.
- Evidence: `_rsc` requests appear on every route in `performance/catchpoint/1-9-2026/home/422505.har` and peers (14 per page).
- Implementation guidance: for navigation links that are offscreen or low-priority, set `<Link prefetch={false}>` or add prefetch on hover only. Consider deferring prefetch for below-the-fold sections.
- Effort: S
- Validate: total request count and bytes should drop in HAR and CSV; no regression in navigation latency for key routes.]

[x] 4) Reduce client JS and chunk count on initial render
- Why this matters: 29 to 31 JS chunks per page (430 to 447KB transfer) and render-blocking resources add to TBT and delay LCP.
- Evidence: render-blocking requests list includes 4 JS chunks across all routes in `performance/catchpoint/1-9-2026/*/*.json`, and TBT peaks at 0.41s on experience.
- Implementation guidance: audit `use client` usage, move non-interactive components to server components, and dynamically import non-critical features. Use `next/script` with `strategy="afterInteractive"` or `lazyOnload` for non-critical scripts.
- Effort: M
- Validate: TBT should drop and the number of JS requests should shrink in HAR.

[x] 5) Improve font loading strategy (Typekit)
- Why this matters: font loading can block text rendering and contributes to render-blocking CSS.
- Evidence: Typekit CSS is a top third-party domain by bytes, and fonts in JSON show `display: auto` in `performance/catchpoint/1-9-2026/home/422505.json`.
- Implementation guidance: migrate to `next/font` or self-hosted fonts with `font-display: swap` (or `optional`). If staying on Typekit, add `preconnect` to `https://use.typekit.net` and `https://p.typekit.net` and preload critical font files if allowed by your license.
- Effort: M
- Validate: FCP should improve and the render-blocking CSS count should drop.

6) Enable edge caching for HTML where content is static or revalidatable
- Why this matters: HTML responses are not cached at the edge, keeping TTFB higher than necessary.
- Evidence: base HTML uses `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` in `performance/catchpoint/1-9-2026/*/*.har`.
- Implementation guidance: for static or semi-static pages, use ISR (e.g., `export const revalidate = 3600`) or configure headers to allow caching. Example safe header: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- Effort: M
- Validate: TTFB should drop and repeat view should be faster.

7) Increase cache TTL for `_next/image` responses with `max-age=0`
- Why this matters: some optimized images are not cached at the edge, causing re-fetch on navigation.
- Evidence: multiple `_next/image` responses use `Cache-Control: public, max-age=0, must-revalidate` in `performance/catchpoint/1-9-2026/*/*.har`.
- Implementation guidance: set `images.minimumCacheTTL` in `next.config.js` and ensure remote image hosts return cacheable headers so the optimizer can cache results.
- Effort: S
- Validate: `_next/image` responses should show non-zero `max-age` and repeat view bytes should drop.

[x] 8) Preconnect to `cdn.sanity.io` for hero images
- Why this matters: LCP hero images are on a third-party domain and benefit from earlier DNS/TLS setup.
- Evidence: LCP URLs on experience, service, and heritage are `cdn.sanity.io` images in `performance/catchpoint/1-9-2026/*/*.json`.
- Implementation guidance: add `<link rel="preconnect" href="https://cdn.sanity.io" crossorigin>` in the document head.
- Effort: S
- Validate: LCP request start should move earlier and LCP should improve on those routes.
