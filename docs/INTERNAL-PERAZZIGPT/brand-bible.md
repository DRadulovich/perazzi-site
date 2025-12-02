# Perazzi Brand Bible – AI Reference

## 0. Metadata
- Source: `docs/INTERNAL PERAZZIGPT/Perazzi Brand Bible.md`
- Version: v2.0 (AI-refactored)
- Last transformed by AI: 2025-12-01
- Intended use: AI knowledge base / RAG for PerazziGPT and related assistants.

---

## 1. High-Level Overview

This document is an AI-optimized reference on **Perazzi (Armi Perazzi S.p.A.)** – its history, product architecture, technical design, brand philosophy, customization process, pricing, community presence, and policies on parts and authenticity.

It is designed for retrieval-augmented generation (RAG) systems and internal assistants (e.g. PerazziGPT), with the goal that an AI can:

- Answer detailed questions about Perazzi’s history, ownership, and milestones.
- Explain platform and model differences (MX, High Tech, TM, DC, SHO, etc.).
- Describe technical design (action, barrels, triggers, springs, balance, manufacturing).
- Summarize the achievements of key athletes associated with Perazzi.
- Convey the brand philosophy, ethos, and narrative strategy (including The Champions Network / TCN).
- Explain customization and ordering options, including fitting at the factory.
- Provide information about parts, service, warranty, pricing structure, and value.
- Warn about grey-market, counterfeit parts, and unsafe component mixing.

The document prioritizes **factual completeness, structural clarity, and canonical terminology** over marketing prose.

---

## 2. Key Concepts & Glossary

### 2.1 Core Entities

- **Perazzi**  
  - Canonical name: **Perazzi**.  
  - Legal name: **Armi Perazzi S.p.A.**  
  - Description: Italian manufacturer of high-end competition and game shotguns, founded by Daniele Perazzi in 1957 in Brescia, Italy. Specializes in low-volume, high-quality, highly customizable guns.

- **Perazzi USA**  
  - Role: Official U.S. importer and service hub for Perazzi shotguns and parts. Headquartered in Azusa, California.  
  - Function: Import, distribution, service, parts, and customer support for the U.S. market.

- **CSG Group (Czechoslovak Group)**  
  - Canonical name: **CSG**.  
  - Role: Industrial holding company that acquired an 80% stake in Perazzi in 2023 while Mauro and Roberta retained 20% and operational control.[1]

- **The Champions Network (TCN)**  
  - Canonical name: **The Champions Network**.  
  - Aliases: **TCN**, **Perazzi Champions Network** (contextual).  
  - Description: Storytelling and content ecosystem focused on champions and aspirants using Perazzi shotguns. Used as a narrative and marketing vehicle (e.g., long-form proposals, phased campaigns, and potential events like the Perazzi Invitational).[53][58][65]

### 2.2 Platform Families & Model Prefixes

- **MX Platform**  
  - Canonical term: **MX platform**.  
  - Description: Core low-profile over/under (O/U) receiver design with a Boss-type locking system and monobloc barrels. Includes removable-trigger models (e.g. MX8) and fixed-trigger derivatives (e.g. MX12). Underpins most Perazzi competition guns.[16]

- **High Tech Platform**  
  - Canonical terms: **High Tech**, **HT**.  
  - Description: Modernized MX evolution with a wider, heavier receiver to shift weight between the hands and reduce muzzle flip. Retains removable trigger (High Tech), while **High Tech S (HTS)** is the fixed-trigger counterpart.[18][19]

- **TM Platform**  
  - Canonical term: **TM series**.  
  - Description: Single-barrel trap/live-bird guns derived from the MX-style action but configured as single-barrel guns for American trap and similar disciplines (e.g. TM1, TMX, TM9, TM9X).

- **DC Platform**  
  - Canonical term: **DC series**.  
  - Description: “Detachable coil” builds where the removable trigger group uses coil mainsprings; emphasizes rugged use and serviceability.

- **SHO Platform**  
  - Canonical term: **SHO series**.  
  - Description: Hand-built sidelock guns with distinct sidelock metalwork; still use a removable trigger group.

- **Model Name Prefixes / Suffixes**  
  - **MX**: Core O/U family (e.g. MX1–MX14, MX8, MX12, MX20, MX28, MX410, MX2000).[16]  
  - **HT / HTS**: High Tech platform, removable- vs fixed-trigger respectively.  
  - **TM**: Single-barrel trap/live-bird models.  
  - **SC2 / SC3 / SCO**: Wood and engraving **grades**, not model types.  
  - **Lusso**: Italian for “luxury”; indicates higher cosmetic grade.  
  - **RS**: Often indicates a rib/stock configuration (e.g. MX2000/RS unsingle named for Ray Stafford).[7]  
  - **S**: Often indicates fixed trigger on models otherwise similar to removable-trigger siblings (e.g. MX2000S, HTS).[16]

### 2.3 Disciplines & Organizations

- **Trap / ATA Trap**  
  - Governing body: ATA (Amateur Trapshooting Association).  
  - Typical Perazzi models: TM series, MX trap models, Grand America 1 & 2, High Tech trap combos.

- **Olympic Trap / Bunker Trap**  
  - Governing body: ISSF.  
  - Perazzi association: Major platform for Olympic success since 1964.

- **Skeet**  
  - Disciplines: Olympic skeet, national skeet variants.  
  - Typical models: MX and High Tech sporting/skeet configurations.

- **Sporting Clays / FITASC**  
  - Governing body: FITASC for international disciplines.  
  - Typical models: MX8, MX2000, MXS, High Tech sporting builds, small-gauge variants.

- **Live Pigeon / Helice (ZZ)**  
  - Use case: High-reliability competition requiring heavy, tight-choked O/Us.

### 2.4 Technical Concepts

- **Monobloc**: Solid breech block into which barrel tubes are fitted and soldered; contains locking bites and lugs. Key to Perazzi’s Boss-style low-profile action.[21]

- **Drop-out (detachable) trigger group**: Self-contained trigger-plate unit removable from the bottom of the receiver for fast service or replacement (MX8-style action).[32]

- **Leaf springs vs. coil springs**: Alternative mainspring types driving the hammers. Leaf springs provide very fast lock times; coil springs emphasize durability and easier replacement.[33][36]

- **Point of impact (POI)**: Vertical distribution of pattern relative to point of aim (e.g. 50/50, 70/30, 80/20), tunable via rib height and stock geometry.

- **Try-gun**: Adjustable “fitting” gun used to measure and confirm ideal stock dimensions before building the customer’s final stock.[75]

---

## 3. Main Content

### 3.1 Company History and Ownership Timeline

#### 3.1.1 Origins

- **1957** – Daniele Perazzi founds **Armi Perazzi** in Brescia, Italy, after working as a teenage apprentice gunsmith. His goal: build the world’s finest competition shotguns.[1][2]
- Early 1960s – Perazzi partners with ex-Fiat engineer **Ivo Fabbri** to modernize traditional designs.  
- Together they develop an O/U prototype for **Ennio Mattarelli**, who wins **1964 Olympic Trap gold** in Tokyo with a Perazzi. This victory establishes Perazzi on the world stage and validates the emerging MX architecture.[3]

#### 3.1.2 MX8 and Olympic Breakthrough

- **MX8**: Introduced for the **1968 Mexico City Olympics**, refined from the Mattarelli gun and named “MX8” for that Games.[4]  
- The MX8 becomes the **archetypal Perazzi competition gun** and the mechanical foundation for nearly all later platform families.  
- Through the late 1960s–1970s, MX8 variants are used by numerous Olympic and world champions, anchoring Perazzi’s reputation.

#### 3.1.3 Expansion into the U.S. and Discipline-Specific Models

- **1973** – U.S. importer **Ithaca Gun Co.** begins importing Perazzi shotguns, catalyzing Perazzi’s penetration into American trap and skeet.[5]  
- Perazzi develops **American-specific models**, including:  
  - **TM1** – Single-barrel trap gun optimized for ATA trap.  
  - Later TM- and MX-based trap guns tailored to U.S. preferences.  
- Collaborations with American champions drive further model evolution:  
  - **DB81** O/U (1981), developed with **Ray Stafford** and named for shooter **Dan Bonillas**.[6]  
  - **MX10** (1990), a high-rib top-single trap gun with adjustable rib and stock.[6]  
  - **MX2000/RS** unsingle (around 1999), with “RS” referencing Ray Stafford’s initials.[7]
- **Grand America 1 & 2** – Special TM-derived models for ATA shooters:  
  - Grand America 1: unsingle.  
  - Grand America 2: top single.  
  Both aimed at handicap trap performance.[8]

#### 3.1.4 Consolidation, Medals, and Modern Era

- 1970s–1990s – Perazzi keeps production intentionally limited (roughly **1,500 guns/year**) to preserve craftsmanship while expanding internationally.[9][10]
- Daniele’s children, **Mauro** and **Roberta Perazzi**, join the business and progressively assume leadership roles.
- **2012** – Daniele Perazzi dies at age 80, shortly after the **London 2012 Olympics**, where shooters using Perazzi shotguns win **12 of 15 shotgun medals**.[11]
  - Mauro becomes company president, and the family continues to lead the company.[3][15]
- **2023** – **CSG Group** acquires an **80% stake** in Perazzi; Mauro and Roberta retain **20% ownership** and operational control. The partnership is framed as securing Perazzi’s long-term future while preserving its family-led philosophy.[12][13][14]

#### 3.1.5 Key Milestones (Chronological Summary)

- **1957** – Company founded in Brescia.[2]
- **1964** – Ennio Mattarelli wins Olympic Trap gold with a Perazzi prototype.[3]
- **1968** – MX8 introduced for Mexico City Olympics.[4]
- **1973** – U.S. market entry via Ithaca; American Trap-specific models follow.[5]
- **1981** – DB81 O/U developed with Ray Stafford and Dan Bonillas.[6]
- **1990** – MX10 adjustable-rib trap model launched.[6]
- **1999–2000** – MX2000 series and MX2000/RS unsingle introduced.[7]
- **2012** – Daniele Perazzi passes away; Perazzi guns dominate London Olympics.[3][15]
- **2023** – CSG majority acquisition with family retaining control.[12][13]

---

### 3.2 Product Platform Architecture

#### 3.2.1 Platform Overview

All Perazzi shotguns derive from the **MX-style low-profile O/U action**, extended into several families:[16][18]

- **MX Platform (O/U)**  
  - Low-profile receiver; Boss-derived locking; monobloc barrels; interchangeable O/U barrel sets.  
  - Removable-trigger models (e.g. MX8) and fixed-trigger derivatives (e.g. MX12, MX2000S).  
  - Basis for most trap, skeet, sporting, and live-pigeon builds.

- **High Tech Platform (HT / HTS)**  
  - Widened receiver adds 3–4 ounces between the hands for improved balance and recoil management.[18][19]  
  - **High Tech (HT)**: removable trigger; **High Tech S (HTS)**: fixed trigger.  
  - Offered in 12 gauge and scaled small-gauge frames (20/28/.410).

- **TM Platform (Single Barrel)**  
  - Single-barrel trap guns (TM1, TMX, TM9, TM9X).  
  - Designed for ATA singles/handicap and similar disciplines.  
  - Typically fixed triggers with high combs and specialized ribs.

- **DC Platform**  
  - Emphasizes detachable trigger groups using coil mainsprings for rugged, high-volume use.

- **SHO Platform (Sidelock)**  
  - Sidelock designs with removable triggers; more aligned with traditional high-art gunmaking.

The core philosophy: **one fundamental action geometry**, many configurations tuned to discipline, gauge, balance, and aesthetic preferences.

#### 3.2.2 MX Series – General O/U Family

- **MX designation**: Covers most O/U competition guns from MX1 upwards.[16][17]
- **MX8** – Archetypal removable-trigger 12-gauge O/U introduced in the 1960s, still a major benchmark.  
- Small-gauge variants: **MX20** (20ga), **MX28** (28ga), **MX410** (.410).  
- Variants like **MX3**, **MX3 Special**, **MX5**, **MX7**, and **MX9** represent different stock and barrel configurations, economy/fixed-trigger options, or era-specific tweaks.
- **MX12** – Fixed-trigger derivative of MX8 using coil springs; marketed as simpler and slightly lighter while maintaining the same handling.[16]  
  - **MX2000S**: MX2000 styling with fixed trigger; often used in skeet and sporting.

Naming patterns are not strictly sequential. Some numbers (e.g. MX14, MX16) correspond to specific gauges or limited runs rather than a linear progression.

#### 3.2.3 High Tech Series (HT / HTS)

- First introduced around **2015** as a modern evolution of MX8.[18]
- Key features:  
  - Wider receiver for increased central mass and altered balance.  
  - Designed to keep more weight between the hands, reducing muzzle flip and perceived recoil.[18][19]  
  - Highly customizable cosmetics: colored logos, engraved side panels, flag inlays, and special editions (e.g. HT 2020, HT 2024).[88]
- Variants include:  
  - **HT 12** – Standard 12-gauge sporting/trap O/U.  
  - **HT RS** – Trap builds with high or adjustable ribs.  
  - **HT 2020 / HT 2024** – Limited-edition configurations with unique finishes and sometimes revised ergonomics.  
  - **High Tech S (HTS)** – Fixed-trigger versions for those preferring non-removable triggers.[18][125]

#### 3.2.4 TM Series – Single-Barrel Trap Guns

- **TM1** – Classic single-barrel trap gun introduced for American trap in the late 1960s.  
- Subsequent TM models (TMX, TM9, TM9X) offer higher ribs, adjustable ribs, and refined barrel dynamics.[128][129]
- The TM series is iconic in ATA trap and has been widely used in the Grand American and other major events.
- **Grand America 1 & 2** – TM-based unsingle and top-single trap guns named after the Grand American tournament; optimized for handicap trap.[8]

#### 3.2.5 Other Notable Model Names

- **Mirage** – Historically, an MX8 variant marketed as the “Ithaca Perazzi Mirage” in some markets.[20]
- **Comp I (Competition I)** – Early O/U model name used before MX naming fully standardized.
- **MT6** – 1970s fixed-trigger O/U, associated with the 1976 Montreal Olympics, seen as a forerunner of MX12.[16]
- **MXS** – Modern fixed-trigger sporting model line, often positioned as a more accessible sporting clays gun.
- **Pigeon grade guns** – Configurations optimized for live-pigeon and helice shooting, usually heavier, tight-choked, and with no safety.

#### 3.2.6 Evolution Highlights

- The **MX8 action** remains the core architecture for over 50 years.  
- Innovations focus on:  
  - Adjustable ribs (3–5-position systems) for tunable POI.[29]  
  - Adjustable combs and buttplates.  
  - Alternate spring systems (leaf vs coil).  
  - Wider receivers (High Tech) for balance and recoil control.  
  - Cosmetic and ergonomic customization rather than wholesale mechanical redesign.
- Cross-compatibility: Many parts (e.g. triggers, barrels) are compatible across generations, though proper fitting is critical for safety.

---

### 3.3 Technical Design and Manufacturing

#### 3.3.1 Action and Locking Mechanism

- **Locking system**: Low-profile, Boss-type design:[21][22]  
  - Monobloc with locking bites and side lugs.  
  - Dual locking bolts emerging from the receiver engage the monobloc bites.  
  - Broad hinge pins and hook surfaces distribute stress.  
- Design goals:  
  - Exceptional durability under very high round counts.  
  - Low bore axis relative to the hands to minimize muzzle flip.  
  - Weight concentrated under the bore line to drive recoil straight into the shoulder.  
- **High Tech variant**: Adds 3–4 ounces of receiver mass directly in line with the chambers, further reducing muzzle rise and smoothing handling.[18]

#### 3.3.2 Barrels

- Material: Proprietary high-grade **chromoly steel**; exact composition is closely guarded.[24]
- Manufacturing philosophy:  
  - Perazzi rejects **cold hammer forging** for top-tier barrels, arguing it can over-harden steel and induce stress.[25]  
  - Barrels are machined, honed, and hand-lapped to achieve desired elasticity and harmonics.
- Bores:  
  - Polished, non-chrome-lined bores; this is a deliberate choice for pattern consistency and feel rather than ease of cleaning.[26]  
  - Available bore diameters (12 gauge) typically range from **18.3–18.9 mm**, often customer-specified.[27]
- Lengths & profiles:  
  - Common lengths: approx. **29.5"**, **30.75"**, **31.5"** (metric equivalents 75, 78, 80 cm).[28]  
  - Barrel weights can be ordered heavier or lighter to tune swing and balance.[37][38]
- Ribs:  
  - Flat, semi-high, high, and extra-high ribs, including adjustable designs with three to five POI positions.[29][72]  
  - High-rib and adjustable-rib designs are common on trap and bunker guns (e.g. MX10, MX2000/3, HT RS).  
  - Sporting models typically use lower ribs for a 50/50 POI.  
  - Rib widths and profiles (e.g. 11x7, 11x11, 7x7) are selectable.[72]
- Chokes and side ribs:  
  - Fixed chokes are standard; constrictions can be specified per barrel (e.g. Skeet/Improved Cylinder, IM/Full).[70][71]  
  - Screw-in multi-chokes available as an option, with sets of tubes.  
  - Side ribs can be solid, ventilated, or deleted (skeet or lightweight configurations).[30][74]
- Regulation:  
  - Each O/U barrel set is soldered and regulated so both barrels shoot to the same POI.  
  - Regulation is verified on a pattern plate and in test tunnels at the factory.[43]

#### 3.3.3 Triggers and Lockwork

- **Detachable trigger groups (MX8-style)**:[32][33]  
  - Entire trigger-plate assembly removes from the bottom of the receiver via latch.  
  - Contains hammers, sears, springs, and safety/barrel selector (if present).  
  - Advantages: Quick serviceability, ability to carry a spare group, and compact receiver design.
- **Spring options**:  
  - **Leaf (flat) mainsprings** – extremely fast lock time and crisp feel; can eventually break from fatigue.[36]  
  - **Coil mainsprings** – slightly slower lock time but high durability and easier replacement.  
  - Many MX8 triggers can be ordered with either system; fixed-trigger guns (MX12, HTS) generally use coil mainsprings.[16][33]
- **Trigger characteristics**:  
  - Simple, robust design with relatively few parts.  
  - Emphasis on large working surfaces and minimal linkages for reliability.[32]  
  - Mechanical triggers (not inertia-dependent) are common in competition builds.  
  - Non-selective triggers (bottom barrel first) are typical for trap; selective triggers are standard or optional on skeet/sporting models.
- **Release triggers**:  
  - Not installed by the factory but often fitted by specialist gunsmiths for trap shooters.  
  - Factory stance: supported by design simplicity but not covered under warranty if modified.

#### 3.3.4 Springs and Service Intervals

- Perazzi uses a mix of **leaf and coil springs** depending on model and function:  
  - Main hammer springs: leaf or coil, customer-selectable on many MX8 triggers.[33]  
  - Ancillary functions (ejectors, top lever, sears): small coil springs.[36]
- Typical wear-and-service guidance:[35][36]  
  - Routine inspection recommended periodically for high-volume shooters.  
  - Major overhauls (springs, firing pins, etc.) often considered around **30,000–40,000 rounds** or as needed.  
  - There is **no mandated annual factory service**; the guns are designed for long intervals between major work.

#### 3.3.5 Balance and Handling

- Barrel weights, stock dimensions, and receiver mass are tuned to achieve a desired balance point.[37][38]  
- Customers can specify their preferred balance (e.g. slightly muzzle-heavy vs. neutral).  
- High Tech receivers place more mass between the hands for smoother, more "centered" swing characteristics.[18][39]
- Stocks may be hollowed or weighted to fine-tune balance; many are fitted with cast-off and palm swell for ergonomics.[40][41]

#### 3.3.6 Machining and Craftsmanship

- Factory in **Botticino, Italy** spans ~9,000 m² and uses modern **CNC machines** for high-precision fabrication of receivers, barrels, and internal parts.[40]
- Critical interfaces (barrel-to-action fit, stock inletting, trigger tuning) are hand-fitted by experienced craftsmen.[40][42]
- Every gun is test-fired, proofed, and checked for POI and pattern quality in an underground test tunnel before delivery.[43]
- Stock work:  
  - High-grade walnut, hand-shaped and checkered.  
  - Oil or lacquer finish; adjustable comb and other features available.[81][84][85]
- Overall philosophy: **Traditional gunsmithing + state-of-the-art technology** to deliver a repeatable yet bespoke product.[44]

---

### 3.4 Athletes and Competitive Record

Perazzi has an unmatched record in Olympic and world-level shotgun sports.

#### 3.4.1 Olympic and World Champions (Selected)

- **Ennio Mattarelli (Italy)**  
  - 1964 Olympic Trap Gold (Tokyo) with an early Perazzi prototype.  
  - Collaborated with Daniele Perazzi on the MX8’s development.[3]

- **Luciano Giovannetti (Italy)**  
  - Back-to-back Olympic Trap Gold medals (1980 Moscow, 1984 Los Angeles) with Perazzi guns.  
  - Cemented Perazzi’s dominance in international trap.

- **Kim Rhode (USA)**  
  - Six-time Olympic medalist; first gold at **Atlanta 1996** in Double Trap at age 17 with a Perazzi.[47]  
  - Continued to win medals in Skeet/Trap using customized Perazzi guns (MX12/MX8 variants).  
  - Famous for her long-term attachment to a single Perazzi gun, which was stolen and later recovered.[47][48]

- **Michael Diamond (Australia)**  
  - Two-time Olympic Trap Gold medalist (1996, 2000), multiple world titles with MX-series guns.

- **David Kostelecky (Czech Republic)**  
  - 2008 Olympic Trap Gold; long-term Perazzi partner.[49][50]

- **Giovanni Pellielo (Italy)**  
  - One of the most decorated trap shooters, with four Olympic medals (2000–2016) using Perazzi MX8 derivatives.

- **Jessica Rossi (Italy)**  
  - 2012 Olympic Trap Gold with a world-record score; used Perazzi.  
  - Italy’s London 2012 shotgun team, armed with Perazzis, contributed to **12 of 15 Olympic shotgun medals** that year.[51][11]

- **Diana Bacosi & Gabriele Rossetti (Italy)**  
  - 2016 Olympic Skeet Gold medalists (women’s and men’s) using Perazzi (Rossetti with MX2000S).

#### 3.4.2 Sporting Clays and FITASC

- **George Digweed (UK)**  
  - Over 25 world titles in Sporting Clays and FITASC.  
  - Won many major titles with Perazzi MX2000 and MX8 variants, reinforcing Perazzi’s status in sporting clays.[52]

- **Wendell Cherry (USA)**  
  - Top-level sporting clays champion and influential coach.  
  - Perazzi shooter and key figure in modern brand storytelling.

#### 3.4.3 Medals Summary

- Perazzi claims **62 Olympic medals at 11 Olympics** through 2021, including at least **14 gold medals** in trap and skeet events.[15]
- At multiple Olympics (e.g. 2012 London, 2016 Rio, 2020 Tokyo), a majority of shotgun medalists used Perazzi guns.

The competitive record supports the brand narrative that Perazzi is “the gun of champions,” and underpins much of the company’s prestige.

---

### 3.5 Brand Philosophy and Ethos

Perazzi’s brand identity extends beyond engineering into legacy, exclusivity, and transformation.

#### 3.5.1 Core Brand Values

1. **Exclusivity & Prestige**[56]
   - Low-volume, high-quality production (~1,500 guns/year).  
   - Each gun is effectively custom-built, positioning ownership as entry into a selective community.  
   - Marketing focuses on selective sponsorships and presence at prestige events rather than mass-market saturation.

2. **Craftsmanship as Art**[57]
   - Guns are presented as functional art pieces: hand-fitted mechanics, high-grade walnut, and deep engraving.  
   - Options range from simple scroll to full-coverage game scenes with gold inlay.  
   - Perazzi highlights its artisans and maintains continuity of traditional skills.

3. **Emotional Connection & Storytelling**[53][58][59]
   - Ownership is framed as the culmination of a dream and an emotional journey.  
   - Marketing showcases champions and aspirants whose lives and identities are intertwined with their Perazzi.  
   - **The Champions Network (TCN)** is a structured storytelling strategy featuring long-form narratives and interviews.

4. **Mastery & Transformation**[62][63]
   - Perazzi positions itself as a catalyst for personal transformation: choosing a Perazzi signifies commitment to excellence and legacy.  
   - Taglines emphasize that a Perazzi is something you **earn**, not simply buy.  
   - Owning a Perazzi is described as joining an enduring lineage of champions.

#### 3.5.2 Narrative Tone and Style

- Preferred tone: **quiet authority**, reverent but concrete, with minimal empty hype.[64]
- Key themes: legacy, identity, pursuit of mastery, lineage of champions, artisan craftsmanship.  
- Story arcs (used in TCN and proposals) often follow phases such as **initiation → immersion → revelation → culmination**.[65][66]

#### 3.5.3 The Champions Network (TCN)

- TCN is a narrative framework and content ecosystem built around real champions, aspirants, and their Perazzi shotguns.[58][59][60]
- Used to:  
  - Humanize the brand through intimate stories.  
  - Demonstrate how Perazzi supports athletes’ journeys.  
  - Lay groundwork for events such as the **Perazzi Invitational** (see §3.9.1).[140][141]

---

### 3.6 Customization and Ordering Process

#### 3.6.1 General Philosophy

- Perazzi offers **full customization at production-gun prices**.  
- Most buyers either:  
  - Purchase a gun from existing dealer inventory, or  
  - Place a bespoke order specifying virtually every parameter.[67]
- Lead times typically about **6 months** (longer for complex engraving or multiple barrel sets).[40][68][69]

#### 3.6.2 Configuration Steps (High-Level)

1. **Choose platform and discipline**
   - Decide between MX, High Tech, TM, DC, or SHO.  
   - Choose intended use: trap, skeet, sporting clays, live pigeon, game, etc.[16]

2. **Select gauge and frame**
   - Common: 12 gauge.  
   - Optional: 20, 28, .410 – either on a **scaled frame** or as sub-gauge barrels for a 12-gauge frame.[27][31]

3. **Specify barrels**[27][28][70][71][72]
   - Length (e.g. 75, 78, 80 cm / 29.5", 30.75", 31.5").  
   - Barrel weight and profile (for desired balance).  
   - Chamber length (70mm or 76mm).  
   - Chokes: fixed constrictions or multi-choke system.  
   - Rib style: flat, semi-high, high, extra-high; adjustable vs fixed; rib width and surface; bead options.  
   - Side ribs: solid, ventilated, or deleted.

4. **Define stock and forend**[75][76][77][78][79][80]
   - Stock dimensions: drop at comb/heel, length of pull, cast, toe, pitch.  
   - Stock style: Monte Carlo, parallel comb, field-style, or game-specific shapes.  
   - Adjustable comb: optional hardware for vertical adjustment and fine tuning.  
   - Grip type: standard pistol, palm swell, or **glove grip** sculpted to the shooter’s hand.  
   - Forend style: slim beavertail, wide beavertail (trap), Schnabel, or rounded field forend.

5. **Choose wood grade and finish**[81][82][83][84][85]
   - Wood grades: standard (Grade 1), **SC2**, **SC3**, **SCO** (exhibition).  
   - Higher grades add visually striking figure and cost.  
   - Finish: oil, lacquer, or unfinished (for local finishing).  
   - Butt treatment: rubber recoil pad, leather-covered pad, or checkered wood butt.

6. **Select aesthetics and personalization**[86][87][88][89][90]
   - Receiver finish: blued or nickel/coin.  
   - Engraving pattern: from minimal scroll to SC3/SCO and custom commissions.  
   - Gold inlays, sideplates, personal monograms or crests.  
   - Colored logo lettering, flag inlays on High Tech receivers.  
   - Trigger blade shape and finish.

7. **Finalize and submit order**
   - Typically through an authorized dealer who helps optimize the configuration.[91]
   - Factory builds the gun to spec, then (optionally) the customer visits for fitting.

#### 3.6.3 Factory Fitting and Perazzi Experience

- Customers can visit the Botticino factory for **stock fitting and pattern testing**:[92][93][94][95]
  - Measured on a try-gun to dial in exact stock dimensions.  
  - Allowed to choose their own walnut blank from the stock room.[82][83]  
  - Fire test patterns in the underground tunnel to verify POI.  
  - Stock may be adjusted or remade to achieve precise fit.
- The process often takes place mid-build (after metalwork, before final finishing).  
- Experience is positioned as a “pilgrimage” and key component of the Perazzi ownership story.[43][96]

#### 3.6.4 Delivery and Lifecycle

- Typical end-to-end timeline: **6–9 months**, sometimes up to a year for complex orders.[68]
- Completed guns are shipped with a Perazzi case; customers may choose case styles and colors (e.g., traditional red ABS).[96]
- Many guns serve as **multi-decade competition tools and family heirlooms**, supported by long-term parts availability.[97]

---

### 3.7 Parts, Accessories, and Service

#### 3.7.1 Parts Catalog and Modularity

- Perazzi publishes detailed **parts schematics and lists** for actions, triggers, ejectors, and other assemblies.[98][99]
- Owners and gunsmiths reference **part numbers** and serial numbers when ordering to ensure compatibility.[100]
- Common spare parts for competitive shooters:  
  - Firing pins and firing pin springs.  
  - Hammer mainsprings (leaf or coil).  
  - Ejector springs and small coil springs for controls.  
  - Top lever springs and locking bolts.

- Representative prices (approximate, from 2025 retail lists):[101][102][103][104]  
  - Firing pin (top or bottom): ~US$77.  
  - Main leaf spring: ~US$62.  
  - Small springs: ~US$8–15.  
  - Ejectors: ~US$247 each.  
  - Trigger blades: ~US$192–384 depending on model.  

- Parts kits (e.g. with firing pins, springs, tools) are popular among high-volume trap shooters.[105]

#### 3.7.2 Accessories

- Functional accessories:  
  - Comb hardware kits for adjustable comb retrofits.  
  - Choke-wrench tools (~US$53).[107]  
  - Factory recoil pads (~US$53).[108]  
  - Trigger tools and stock-bolt wrenches.  
- Branded accessories:  
  - Hard cases, leather cases, soft covers.  
  - Shooting vests, jackets, and merchandise.[146][147]

#### 3.7.3 Service and Maintenance Practices

- Basic guidance:[35][110]  
  - Keep action surfaces clean and lightly lubricated (oil on pivots, grease on locking surfaces).  
  - Clean barrels regularly; avoid corrosion and moisture.  
  - Use snap caps if dry-firing to protect firing pins.  
  - Do not store with top lever or springs excessively tensioned; relax tension where practical (e.g. leaving removable triggers in fired state during long-term storage).

- Service intervals:  
  - Routine inspection annually or as usage dictates.  
  - Major overhaul (springs, pins, locking bolt) only after high round counts (often 30,000–100,000+ shells), depending on wear.[35][36][112]

- Service network:  
  - **Perazzi USA** gunsmiths in Azusa.  
  - Factory-trained specialists (e.g. Giacomo Sporting, Whiz White in the U.S.).[111]  
  - Factory refurbishment options: rebluing, wood refinishing, checkering recut, and general mechanical refresh.

#### 3.7.4 Warranty

- Standard warranty: typically **two years** for the original owner on new guns.[113]
- Scope: manufacturing defects in materials or workmanship.  
- Exclusions: normal wear parts (springs, firing pins) and issues arising from third-party modifications.

---

### 3.8 Pricing Structure and Value

#### 3.8.1 General Positioning

- Perazzi occupies the **upper tier** of the shotgun market.  
- Pricing reflects craftsmanship, customization, and competition pedigree, but is generally below ultra-boutique makers (e.g. Fabbri, high-end British “best guns”).[138]

#### 3.8.2 Representative Base Prices (Approximate, 2025 Retail)[115][116][119][121][123][125][128][129][130]

- **MX8 O/U**  
  - Basic 12-ga single (trap configuration): ~US$13,800.  
  - Standard 12-ga O/U: ~US$20,700.  

- **MX12 O/U (fixed trigger)**  
  - Base 12-ga sporting: ~US$22,420.  

- **MX2000 Series**  
  - MX2000/8 base: ~US$16,640.  
  - MX2000S (fixed trigger): ~US$23,000.

- **High Tech (HT)**  
  - Base 12-ga: ~US$15,750.  
  - HT SC3: ~US$26,700.  
  - HT SCO Gold: up to ~US$49,260.

- **High Tech S (HTS)**  
  - Base 12-ga: ~US$16,080.  
  - HTS SCO Gold: up to ~US$49,260.[126][127]

- **TM Series**  
  - TM9 base: ~US$12,600.  
  - TM9X (higher rib): ~US$14,680.

- **Trap Combos**  
  - High Tech trap combo (unsingle + O/U): up to ~US$27,000 or more depending on grade.[130][136][137]

Prices above are **ex-factory suggested retail**; local dealer pricing and taxes may vary.[139]

#### 3.8.3 Upgrades and Cost Drivers

- **Wood grade**:[81]
  - Standard Grade 1: included.  
  - SC2: ~US$1,000–1,500 upgrade.  
  - SC3: ~US$2,000–3,000 upgrade.  
  - SCO: ~US$5,000+ upgrade, depending on blank quality.  

- **Engraving**:[117][118][131][134][135]
  - SC3 scroll: ~US$8,000–12,000 over base.  
  - SCO full-coverage: ~US$20,000+ over base.  
  - SCO Gold and sideplate designs can raise total gun prices into the **US$70k–80k** range.  

- **Barrels & sub-gauges**:[31]  
  - Extra small-gauge barrel set: ~US$1,680 (on 12-ga frame).  
  - Scaled-frame 28/.410 action: ~US$4,380 premium.  

- **Other options**:[132][133]  
  - Multi-choke systems, special ribs, glove grips, adjustable buttplates, and barrel porting may add additional cost.

#### 3.8.4 Value and Resale

- A basic competition-grade Perazzi (~US$12k–20k) performs identically, in functional terms, to a heavily engraved US$70k+ Perazzi; upgrades primarily affect aesthetics and personal expression.[138]
- Used Perazzis retain strong **resale value**, especially popular configurations and small-gauge models.  
- Limited editions and high-grade engraving can appreciate, but most buyers view Perazzi primarily as a **long-term use tool** that can be rebuilt indefinitely.

---

### 3.9 Events, Community, and Legacy

#### 3.9.1 Perazzi Invitational (Concept)

- Envisioned as a **prestige event or series** centered purely on Perazzi and its champions.[140][141]
- Key characteristics (conceptual):  
  - Highly curated field; participation based on merit and alignment with brand ethos.  
  - Minimal competing logos; the event itself becomes a brand statement.  
  - Integrated with TCN storytelling and long-form coverage.

*(Note: As of the referenced documents, the Perazzi Invitational is a strategic concept and narrative device; operational details may evolve.)*

#### 3.9.2 American Trap – Grand American & ATA

- Historically strong presence at the **Grand American** and ATA major events.  
- **Perazzi Classic** (1998–2005): special handicap event at the Grand American, often awarding a new Perazzi shotgun as the top prize.[142]
- Perazzi continues to sponsor specific events (e.g. President’s Handicap) and maintain a high-profile vendor presence.[143]
- Daniele Perazzi was inducted into the **Trapshooting Hall of Fame** in 2019 for his contributions to ATA trap.[144][11]

#### 3.9.3 International Competitions and FITASC

- Widely used in ISSF World Cups, World Championships, and Continental championships.  
- Popular in FITASC Sporting and Compak; numerous world champions (e.g. George Digweed) attribute part of their success to Perazzi guns.[52]

#### 3.9.4 Factory Visits and Owner Community

- Factory showroom functions as a **mini-museum** with extensive displays of models and engraving examples.[146][147]
- Customers often describe visits as a key emotional milestone in their Perazzi journey.  
- Perazzi hosts or supports gatherings at major shoots, reinforcing a sense of **family and community** among owners.
- Online owner communities (forums, social media groups) actively discuss fitting, maintenance, and configuration choices.

#### 3.9.5 Sponsored Shooters and Ambassadors

- Perazzi supports top athletes primarily via guns, custom configurations, and priority service rather than large cash stipends.  
- Sponsored shooters across trap, skeet, sporting, and live-pigeon disciplines serve as **brand ambassadors**, bridging elite performance and aspirant shooters.

---

### 3.10 Counterfeits, Grey Market, and Service Integrity

#### 3.10.1 Authentic Parts and Aftermarket Risk

- Perazzi warns against **counterfeit or non-genuine parts**, especially springs and firing pins.[148]  
- Third-party parts may be cheaper but can cause:  
  - Inconsistent trigger feel.  
  - Premature breakage.  
  - Safety issues.  
- Use of non-genuine parts can **void warranty** if failures are linked to such components.

#### 3.10.2 Grey-Market Guns and Import Channels

- **Perazzi USA** is the sole official importer for the U.S.; other countries have analogous official agents.[149]
- Guns imported or assembled outside official channels may:  
  - Lack warranty and factory support.  
  - Have unknown histories or questionable parts.  
- Very low prices on “new” Perazzis from unofficial sources are a red flag for grey-market or stolen guns.

#### 3.10.3 Mixing Components and “Parts Guns”

- Because Perazzi actions and barrels share similar geometry, some gunsmiths or owners assemble **“parts guns”** from mismatched receivers, barrels, and forends.  
- Risks of mismatching serialized components without factory fitting:[21]  
  - Incorrect headspace.  
  - Improper locking-bolt engagement.  
  - Ejector timing issues.  
  - Potential safety hazards.
- Factory policy: barrels, receivers, and forends with different serials should only be paired when properly fitted and verified by the factory or authorized experts.  
- Using mismatched components may void manufacturer responsibility.

#### 3.10.4 Trigger Group Interchangeability

- Any Perazzi drop-out trigger group will **physically fit** into any compatible receiver, but:[32]  
  - Triggers “wear in” with their original receivers; swapping can accelerate wear.  
  - Trigger pull characteristics may change in a different receiver.  
  - Minor generational differences can affect safety and reliability.
- Perazzi’s stance:  
  - Swapping triggers for an **emergency backup** in competition is fine.  
  - Regular use should rely on a trigger tuned to that specific receiver.

#### 3.10.5 Aftermarket Modifications and Factory Service

- Common third-party modifications: barrel porting, forcing-cone lengthening, aftermarket adjustable combs, recoil reducers, and release-trigger conversions.  
- Factory disclaimers:  
  - Such modifications are at the owner’s risk.  
  - Perazzi may decline warranty or certain services on heavily modified barrels or actions.  
  - If necessary, the factory may charge to replace non-factory parts back to original spec.

#### 3.10.6 Serial Number Integrity and Authentication

- Every Perazzi receiver and barrel set is **serialized and proofed**.  
- Italian proof-house markings (Gardone) and serials can be used to authenticate guns.  
- Perazzi and Perazzi USA can often confirm import history and configuration by serial number.  
- Buyers are encouraged to verify serial authenticity, especially for used or unusually cheap guns.

---

## 4. Edge Cases, Exceptions, and Caveats

- **Non-factory barrels on existing receivers**  
  - Always require expert fitting and POI verification.  
  - Unsafe combinations can appear to lock correctly but have poor headspace or regulation.

- **Release triggers**  
  - Widely used in trap but not installed by Perazzi at the factory.  
  - Quality and safety depend on the gunsmith’s expertise; issues may not be covered under warranty.

- **Extremely high round-count guns**  
  - Locking bolts, hinge pins, and monobloc surfaces can wear over 100k+ shells.  
  - Oversized locking bolts and other parts are designed for refurbishment.  

- **Owner-applied modifications**  
  - Cosmetic or ergonomic changes (pads, comb hardware, etc.) usually benign if properly installed.  
  - Structural changes (porting, cone changes, re-chambering) should be entrusted only to experts familiar with Perazzi tolerances.

- **Ambiguities in model naming**  
  - Some historical model names (Comp I, Mirage, MT6) have overlapping or region-specific usage.  
  - When in doubt, resolve by **platform (MX/TM/HT)** and mechanical configuration rather than name alone.

---

## 5. References & Cross-Links

### 5.1 Internal Cross-Links

- **History & Ownership** – see §3.1.  
- **Platform architecture & model differences** – see §3.2.  
- **Technical design (action, barrels, triggers)** – see §3.3.  
- **Athletes and medals** – see §3.4.  
- **Brand philosophy & TCN** – see §3.5 and §3.9.1.  
- **Customization & ordering** – see §3.6.  
- **Parts & service** – see §3.7 and §3.10.  
- **Pricing & value** – see §3.8.  
- **Events & community** – see §3.9.

### 5.2 External References (Numbered Sources)

[1] [9] [10] [12] [13] [14] [15] [40] [41] [42] [49] [50] [149] perazzi & csg announcement.pdf  
https://www.dropbox.com/preview/perazzi/blank%20forms%20%26%20price%20lists/perazzi%20%26%20csg%20announcement.pdf

[2] [3] [4] [5] [6] [7] [8] [11] [17] [43] [44] [142] [144] Inductees  
https://traphof.org/inductees/details/1/184-perazzi-daniele

[16] [27] [28] [30] [37] [38] [51] [52] [67] [68] [69] [70] [71] [72] [73] [74] [75] [76] [77] [81] [82] [83] [84] [85] [86] [87] [89] [91] [92] [93] [94] [95] [96] [97] [114] [132] [133] [145] [146] [147]  What To Consider When Buying a Perazzi | By Driven Sporting  
https://www.drivensporting.co.uk/blogs/news/buying-a-perazzi

[18] Perazzi High Tech S Game 12-bore - Shooting UK  
https://www.shootinguk.co.uk/news/perazzi-high-tech-s-game-12-bore/

[19] My Perazzi High Tech - DRadulovich  
https://www.dradulovich.com/perazzi-high-tech/

[20] Ithaca Perazzis | Shotgun Report(R)  
https://shotgunreport.com/2012/02/20/ithaca-perazzis/

[21] [22] [23] [24] [25] [26] [29] [32] [33] [35] [36] [78] [79] [80] [110] Website Timeline.docx  
file://file-VjbDjKfKKcVW5Sq4EN61RL

[31] [88] [115] [116] [117] [118] [119] [120] [121] [122] [123] [124] [125] [126] [127] [128] [129] [130] [131] [134] [135] [136] [137] [139] 2025 perazzi retail price list.pdf  
https://www.dropbox.com/preview/perazzi/2025%20perazzi%20documents/2025%20perazzi%20retail%20price%20list.pdf

[34] Don Rackley's Gun Parts - Online Store  
https://donrackleygunparts.com/

[39] HIGH TECH 10 TRAP COMBO - AVAILABLE FOR CUSTOM ORDER  
https://giacomosportingusa.com/products/high-tech-10-trap-combo-available-for-custom-order?srsltid=AfmBOooN5GOYxa2Fuis5zBKFclroCg4dHQ9dDsrP3-I_nLqt3kZOqFiD

[45] The gun I always wish I had - the Perazzi MX12 Pro Sport  
https://www.shootinguk.co.uk/gear/perazzi-mx12-pro-sport/

[46] Perazzi semantics question MX8/MX12/MX2000S  
https://www.doublegunshop.com/forums/ubbthreads.php?ubb=showflat&Number=575171

[47] Olympian Kim Rhode Recovers Medal-Winning Perazzi  
https://bulletin.accurateshooter.com/2009/01/olympian-kim-rhode-recovers-shotgu/

[48] Kim Rhode's a sure shot--and she benefits from a long shot  
https://www.latimes.com/archives/blogs/sports-now/story/2009-01-28/kim-rhodes-a-sure-shot-and-she-benefits-from-a-long-shot

[53] [54] [55] [56] [57] [58] [59] [60] [61] [62] [63] [64] [65] [66] [140] [141] perazzi long form proposal.pdf  
https://www.dropbox.com/preview/marketing%20materials/perazzi/perazzi%20long%20form%2

[98] [99] [100] [101] [102] [103] [104] [105] [107] [108] [109] [111] [112] [113] [148] Website Timeline.docx (and related Perazzi USA parts documentation)

[138] [139] Blue Book of Gun Values and Perazzi price list references (summary-level, not full text).

[143] [145] Grand American and ATA program references; Perazzi USA communications.

---

## Appendix A. Section Index

- **1. High-Level Overview** – Purpose of this document and its scope.  
- **2. Key Concepts & Glossary** – Canonical terms, platforms, and technical vocabulary.  
- **3.1 Company History and Ownership Timeline** – Founding, Olympic breakthrough, U.S. expansion, CSG acquisition.  
- **3.2 Product Platform Architecture** – MX, High Tech, TM, DC, SHO, model naming, and evolution.  
- **3.3 Technical Design and Manufacturing** – Action, barrels, triggers, springs, balance, and production methods.  
- **3.4 Athletes and Competitive Record** – Key champions and medal statistics.  
- **3.5 Brand Philosophy and Ethos** – Core values, tone, TCN storytelling framework.  
- **3.6 Customization and Ordering Process** – Configuration options, factory fitting, and lifecycle.  
- **3.7 Parts, Accessories, and Service** – Parts catalog, accessories, maintenance practices, and warranty.  
- **3.8 Pricing Structure and Value** – Model pricing, upgrade costs, and resale value.  
- **3.9 Events, Community, and Legacy** – Perazzi Invitational concept, major events, factory visits, and owner community.  
- **3.10 Counterfeits, Grey Market, and Service Integrity** – Warnings, policies, and best practices around authenticity and safety.  
- **4. Edge Cases, Exceptions, and Caveats** – Non-standard scenarios, modifications, and naming ambiguities.  
- **5. References & Cross-Links** – Internal navigation and external source references.