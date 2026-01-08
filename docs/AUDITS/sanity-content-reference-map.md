# Sanity Content Reference Map (Snapshot)

- Generated: 2026-01-08T04:35:02.428559+00:00
- Project ID: m42h56wl
- Dataset: production
- API version: 2023-10-01

## Document Counts by Type

| Type | Count |
| --- | ---: |
| sanity.imageAsset | 434 |
| configuratorSidebarCard | 193 |
| engravings | 175 |
| models | 80 |
| allModels | 79 |
| manufactureYear | 60 |
| grade | 23 |
| authorizedDealer | 16 |
| article | 12 |
| heritageEvent | 12 |
| recommendedServiceCenter | 12 |
| system.group | 9 |
| champion | 8 |
| discipline | 7 |
| gauge | 5 |
| platform | 5 |
| scheduledEvent | 5 |
| sanity.previewUrlSecret | 2 |
| author | 1 |
| bespokeHome | 1 |
| buildConfigurator | 1 |
| experienceHome | 1 |
| heritageHome | 1 |
| homeSingleton | 1 |
| journalLanding | 1 |
| serviceHome | 1 |
| shotgunsLanding | 1 |
| siteSettings | 1 |
| system.retention | 1 |

## Singleton Coverage (Page-Level Content)

### homeSingleton

- hero_background: yes
- hero_tagline: yes
- hero_subheading: yes
- hero_cta_primary: yes
- hero_cta_secondary: yes
- timeline_title: yes
- timeline_stages: 11
- guide_title: yes
- marquee_featuredChampion: yes
- marquee_inline: yes
- marquee_background: yes
- finale_text: no
- finale_cta_primary: no
- finale_cta_secondary: no

### experienceHome

- hero_background: yes
- picker_items: 3
- picker_background: yes
- faq_items: 3
- visit_planning_heading: yes
- fitting_guidance_heading: yes
- travel_guide_heading: yes
- visit_factory_background: yes
- booking_options: 3
- travel_network_background: yes
- mosaic_items: 6

### serviceHome

- hero_background: yes
- overview_heading: yes
- service_guidance_body: yes
- shipping_prep_body: yes
- network_finder_heading: yes
- maintenance_heading: yes
- parts_editorial_heading: yes
- integrity_heading: yes
- service_request_title: yes
- parts_request_title: yes
- guides_heading: yes
- faq_items: 4

### heritageHome

- hero_background: yes
- intro_heading: yes
- eras_count: 5
- serial_lookup_background: yes
- champions_gallery_background: yes
- factory_essay_heading: yes
- photo_essay_count: 26
- oral_histories_count: 0

### bespokeHome

- hero_media: yes
- steps_intro_heading: yes
- steps_count: 6
- bespoke_guide_heading: yes
- cinematic_count: 2
- cinematic_with_image: 2
- experts_count: 3
- booking_heading: yes
- assurance_image: yes
- assurance_heading: yes

### shotgunsLanding

- hero_background: yes
- platform_grid_background: yes
- discipline_rail_background: yes
- discipline_fit_heading: yes
- trigger_explainer_background: yes
- gauge_advisory_heading: yes
- engraving_carousel_background: yes
- teaser_engraving_image: yes
- teaser_wood_image: yes

### journalLanding

- hero_background: yes
- featured_article: yes

### siteSettings

- nav_items: 6
- footer_columns: 0
- social_instagram: no
- social_youtube: no
- social_facebook: no
- social_email: no
- seo_title: no
- seo_description: no
- seo_image: no

### buildConfigurator

- steps_with_cards: 35
- steps_total: 35
- total_cards_referenced: 193

## Collection Coverage (Key Fields)

| Type | Docs | Key fields present |
| --- | ---: | --- |
| platform | 5 | hero 5/5, highlights 5/5, champion 5/5, snippet 5/5, lineage 5/5 |
| discipline | 7 | overview 7/7, hero 7/7, championImage 7/7, recommendedPlatforms 7/7, popularModels 7/7 |
| grade | 23 | description 13/23, hero 23/23, engravingGallery 0/23, woodImages 0/23 |
| gauge | 5 | handlingNotes 5/5 |
| article | 12 | heroImage 12/12, body 12/12, excerpt 12/12, isBuildJourneyStep 11/12 |
| author | 1 | bioHtml 1/1, headshot 1/1 |
| champion | 8 | image 8/8, quote 8/8, bio 8/8, resume 8/8 |
| heritageEvent | 12 | title 12/12, date 12/12, body 12/12 |
| manufactureYear | 60 | proofCode 60/60, primaryRange 60/60 |
| scheduledEvent | 5 | eventName 5/5, startDate 5/5 |
| authorizedDealer | 16 | dealerName 16/16 |
| recommendedServiceCenter | 12 | centerName 12/12, phone 12/12 |
| allModels | 79 | name 79/79, image 79/79, imageFallbackUrl 79/79 |
| engravings | 175 | engraving_photo 175/175, engraving_grade 175/175, engraving_id 175/175 |
| configuratorSidebarCard | 193 | optionValue 193/193, description 160/193, image 193/193 |

## Notable Gaps / Alerts

- homeSingleton.finale appears empty (text + both CTAs).
- heritageHome.oralHistories is empty.
- grade.engravingGallery is empty across all 23 docs.
- grade.woodImages is empty across all 23 docs.
