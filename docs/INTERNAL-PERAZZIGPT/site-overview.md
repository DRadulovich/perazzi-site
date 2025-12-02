# Perazzi USA Digital Platform – Site Overview (AI-Optimized Reference)

## 0. Metadata

- Source: `docs/INTERNAL PERAZZIGPT/site-overview.md`
- Original format: Email-style overview from David Radulovich to CSG and Perazzi teams
- Version: v1.0 (AI-refactored)
- Last transformed by AI: 2025-12-01
- Intended use: AI knowledge base / RAG; internal reference for architecture, intent, and scope of the new Perazzi USA digital platform

## 1. High-Level Overview

This document summarizes the concept, architecture, and current status of the new Perazzi USA website and digital platform.

It explains:

- What the new platform is intended to be (a long-term “digital atelier,” not a short-lived brochure site).
- How the architecture is structured (headless, modular, cloud-hosted, with a modern frontend, CMS, AI concierge, and media pipeline).
- How the main areas of the site behave and what they are designed to support (home narrative, shotguns, heritage, experience & service, bespoke, concierge, engravings, journal).
- How performance, accessibility, security, and reliability are addressed.
- Why this architecture was chosen instead of a quick, template-based approach (e.g., traditional WordPress).
- The current development status and next steps.

The intended audience is:

- CSG and Perazzi leadership.
- Perazzi’s internal teams, including IT and other technical stakeholders.
- Any AI assistant that needs to understand the system’s structure and purpose to answer questions or generate related documentation.

## 2. Key Concepts & Glossary

### 2.1 Core Platform Concepts

- **Perazzi USA Digital Platform (canonical)**  
  - **Also referred to as:** “new Perazzi USA website,” “site,” “platform,” “digital atelier.”  
  - **Definition:** The new long-term Perazzi USA website and related services, designed as a modular, headless digital platform rather than a short-lived campaign or brochure site.

- **Digital Atelier (canonical metaphor)**  
  - **Also referred to as:** “living digital atelier,” “digital home.”  
  - **Definition:** Conceptual framing of the site as a cinematic, evolving space that showcases craftsmanship, heritage, champions, and bespoke services rather than just listing products.

- **Headless Architecture**  
  - **Definition:** A system design where the presentation layer (frontend) is decoupled from the content, data, and commerce layers. The Perazzi platform uses this to keep content, knowledge, and UI flexible and modular.

### 2.2 Technical Stack Terms

- **Presentation Layer**  
  - **Definition:** The user-facing portion of the platform built with Next.js (React). Pages are server-rendered for speed but behave like an app in the browser (cinematic, smooth).

- **Content Layer**  
  - **Definition:** Structured content stored in Sanity CMS. Includes home hero, craftsmanship timeline, platforms, disciplines, grades, champions, heritage events, dealers, service centers, articles, configurator steps, and more.

- **Perazzi Concierge**  
  - **Definition:** The combined experience of:
    - A **rules-based build navigator** (logic tree: platform → discipline → trigger type → gauge → grade, etc.).  
    - An **AI assistant** (via OpenAI) connected to a Postgres + pgvector database of curated Perazzi knowledge and model information.  
  - **Purpose:** Guide customers through configuring or ordering a custom gun in a way similar to an in-person fitting, while respecting explicit guardrails (e.g., no pricing, gunsmithing, or legal advice).

- **Media Pipeline**  
  - **Definition:** The system for serving images via Cloudinary and `next/image`, automatically optimizing formats and sizes while preserving art direction and photographic quality.

- **Hosting & Delivery Platform**  
  - **Definition:** A modern cloud platform (e.g., Vercel) that provides global CDN caching, automatic scaling, fast page loads, and an isolated content studio (`/next-studio`), without Perazzi or CSG managing servers directly.

- **Design System**  
  - **Definition:** A system built with Tailwind CSS, Radix UI, and custom Perazzi tokens that enforces consistent typography, color, spacing, and accessibility across all pages and components.

### 2.3 Site Area Concepts

- **Home Narrative**  
  - **Definition:** The main home page flow, structured as a scroll-led story: cinematic hero → pinned craftsmanship timeline → concierge guidance → champions marquee → final call to action.

- **Shotguns / Platforms**  
  - **Definition:** Section that introduces the range of Perazzi shotgun platforms (HT, MX, DC, SHO, TM, etc.), with at-a-glance specs, discipline mapping, and highlight stories.

- **Heritage**  
  - **Definition:** Section combining heritage events, champion records, factory imagery, and a serial-number lookup tool that returns approximate manufacture year and model hints.

- **Experience & Service**  
  - **Definition:** Section where shooters find events, dealers, service centers, and factory visits, powered by structured data and shared components such as the Experience Picker and network finder.

- **Bespoke**  
  - **Definition:** Guided storyline that explains the journey of commissioning a custom Perazzi, including fitting, decision points, and long-term support.

- **Engravings & Journal**  
  - **Engravings:** A catalog modeled as a searchable table in Sanity.  
  - **Journal:** Long-term storytelling space for “Stories of Craft,” “Champion Interviews,” and “News.”

### 2.4 Performance, Accessibility, and Resilience Terms

- **Fixture Fallbacks**  
  - **Definition:** Static JSON/TS data used as a backup if the CMS is temporarily unavailable, ensuring critical pages remain functional.

- **Reduced Motion Support**  
  - **Definition:** Behavior where animations (parallax, pinned sections, etc.) respect the visitor’s `prefers-reduced-motion` system setting and gracefully degrade when motion should be minimized.

- **Secure Environment Variables**  
  - **Definition:** Storage pattern where credentials (Sanity, Cloudinary, OpenAI, database) are kept server-side rather than exposed to the client.

## 3. Main Content

### 3.1 Project Intent and Scope

#### 3.1.1 Purpose of the Platform

The new Perazzi USA digital platform is intended to act as a **long-term digital home** and **living atelier**, not a short-lived marketing campaign or simple brochure site.

Key goals:

- Present Perazzi as a cinematic, aspirational, and craft-driven brand.  
- Support deep exploration of shotguns by platform, discipline, grade, and engraving.  
- Provide a robust Heritage and Experience layer to help shooters understand history, events, service, and travel.  
- Introduce a Bespoke & Concierge experience that mirrors the substance and care of an in-person custom fitting process.  
- Offer a foundation that can evolve for years without frequent “rip and replace” redesigns.

#### 3.1.2 Core Experiences Being Built

The platform is designed to behave “less like a traditional brochure website and more like a living digital atelier,” including:

- **Cinematic home experience**  
  - Film-like hero section.  
  - Pinned craftsmanship timeline.  
  - Champion stories.  
  - Clear path into the configurator and concierge.

- **Deep shotgun exploration**  
  - By platform, discipline, grade, and engraving.  
  - Content can evolve without redesigning the site.

- **Heritage area**  
  - Brand timeline.  
  - Champions and photo essays.  
  - Oral histories.  
  - Serial-number lookup for approximate manufacture year and model hints.

- **Experience & Service layer**  
  - Helps shooters find events, dealers, service centers, and factory visits.  
  - Driven by structured data rather than static pages.

- **Bespoke & Concierge experience**  
  - Rules-based build navigator plus AI assistant.  
  - Guides customers through ordering a custom gun in the spirit of an in-person fitting.

- **Engravings catalog and Journal**  
  - Engravings as a structured catalog that can grow over time.  
  - Journal for stories, champion interviews, and news that can expand for years without changing the underlying system.

Overall, the site is explicitly framed as **Perazzi’s long-term digital platform**, not just a one-off build.

---

### 3.2 High-Level Architecture and Tech Stack

#### 3.2.1 Headless Architecture Separation

The platform uses a modern headless architecture that cleanly separates:

- **Presentation layer** – How the site looks and behaves.  
- **Content layer** – Where structured content lives and how it is edited.  
- **Knowledge & AI layer** – Where curated Perazzi data is stored and how the AI concierge reasons about it.  
- **Media pipeline** – How images are processed and delivered.  
- **Hosting & delivery layer** – Where the site is deployed and how it is cached and scaled.

This separation is central to long-term maintainability and extensibility.

#### 3.2.2 Presentation Layer (Next.js + React)

- Built with **Next.js (React)**, a modern framework used by global brands.  
- Pages are **server-rendered** for speed and SEO but behave like a **smooth, cinematic application** in the browser.  
- Enables app-like transitions, pinned sections, and controlled animations while maintaining strong performance characteristics.

#### 3.2.3 Content Layer (Sanity CMS)

All key content is stored in **Sanity CMS** as structured, typed data, including:

- Home hero content.  
- Craftsmanship timeline entries.  
- Platforms, disciplines, and grades.  
- Champions and heritage events.  
- Dealers and service centers.  
- Articles, configurator steps, engravings, and journal entries.

Editors can update content **without touching code**, and shared schemas ensure consistency across the site (e.g., the same platform definitions used in multiple sections).

#### 3.2.4 Perazzi Concierge (AI + Build Navigator)

- Uses a **Postgres + pgvector** database to store curated Perazzi knowledge and model information.  
- A **secure API route** connects this database to **OpenAI**, enabling an AI assistant to:
  - Answer customer questions about platforms, triggers, gauges, disciplines, and configurations.  
  - Work alongside a rules-based build navigator to guide custom builds.

Guardrails are explicitly built in so the concierge:

- Avoids topics such as pricing.  
- Avoids gunsmithing advice.  
- Avoids legal matters.

The intent is a **disciplined, Perazzi-specific assistant**, not a generic chatbot plugin.

#### 3.2.5 Media Pipeline (Cloudinary + `next/image`)

- Images are delivered via **Cloudinary** and **Next.js `next/image`**.  
- This combination:
  - Automatically optimizes formats and sizes.  
  - Preserves art direction (aspect ratios, crops).  
  - Is especially important for a brand where imagery must feel like **fine photography**, not compressed stock images.

#### 3.2.6 Hosting and Delivery (Cloud Platform + CDN)

- Designed to run on a modern cloud platform (such as **Vercel**).  
- Benefits include:
  - Global **CDN caching**.  
  - **Automatic scaling** for traffic spikes.  
  - Very fast page loads.  
  - Reduced operational overhead (no direct server management for Perazzi or CSG).

#### 3.2.7 Design System (Tailwind CSS, Radix UI, Perazzi Tokens)

- Utilizes **Tailwind CSS**, **Radix UI**, and **custom Perazzi tokens**.  
- Ensures:
  - Consistent typography, color, and spacing.  
  - Accessible components (focus states, keyboard use, ARIA semantics where applicable).  
  - A coherent Perazzi feel as the site grows and new features are added.

---

### 3.3 How the Main Site Areas Work

#### 3.3.1 Home (Scroll-Led Narrative)

The **Home** page is built as a **scroll-led story**:

- Cinematic hero section.  
- Pinned craftsmanship timeline (anchored in scroll).  
- Guidance into the concierge.  
- Champions marquee.  
- Final call to action.

All of this is powered by **structured entries in Sanity**, so:

- The narrative can be adjusted over time (e.g., highlight new champions or campaigns).  
- The layout remains stable while content evolves.

#### 3.3.2 Shotguns / Platforms

The **Shotguns / Platforms** area includes:

- A range introduction landing page.  
- Platform-specific pages (HT, MX, DC, SHO, TM, etc.) that present each family with:
  - “At a glance” specs.  
  - Discipline mapping.  
  - Highlight stories.

This section draws from shared schemas for **platforms**, **disciplines**, and **grades**, which:

- Keeps terminology and data consistent across the site.  
- Reduces the risk of contradictions (e.g., a platform described differently in multiple places).

#### 3.3.3 Heritage

The **Heritage** section is built as a combination of:

- Heritage events.  
- Champion records.  
- Factory imagery.

It also includes a **serial-number lookup** implemented as a **secure server action and API route** that:

- Cross-references manufacture-year ranges **stored in Sanity**.  
- Returns approximate manufacture year and model hints.  
- Keeps all relevant knowledge in one place and allows central updates.

#### 3.3.4 Experience & Service

The **Experience & Service** layer uses structured lists of:

- Scheduled events.  
- Authorized dealers.  
- Recommended service centers.

Key components:

- **Experience Picker** – helps visitors explore events and experiences.  
- **Network finder** – helps locate dealers and service centers.  
- **FAQ blocks** – reuse structured data for common questions.

Because all of this draws from a shared data model:

- Adding a new dealer or service center becomes straightforward.  
- Updates propagate to all relevant components automatically.

#### 3.3.5 Bespoke

The **Bespoke** area is designed as a **guided storyline** describing the journey of commissioning a custom Perazzi:

- Explains what to expect at each stage.  
- Describes how fitting works.  
- Clarifies what decisions are made when.  
- Shows how Perazzi supports the owner over time.

All content here is **modeled for evolution**, so Perazzi can refine and update the bespoke process without redefining the entire site structure.

#### 3.3.6 Perazzi Concierge

The **Perazzi Concierge** section combines:

- **Rules-based build navigator** – uses a structured model tree (e.g., platform → discipline → trigger type → gauge → grade).  
- **AI assistant** – explains options, answers free-form questions, and can generate a **dealer-ready brief** summarizing the client’s build.

The concierge is explicitly designed:

- With guardrails (no pricing, gunsmithing, or legal advice).  
- To align with how Perazzi actually builds guns.

#### 3.3.7 Engravings & Journal

- **Engravings**  
  - Stored as a **searchable table** in Sanity.  
  - Can be explored by grade or ID.  
  - Designed to expand as Perazzi’s engraving library grows.

- **Journal**  
  - Uses reusable layouts for:  
    - “Stories of Craft.”  
    - “Champion Interviews.”  
    - “News.”  
  - Intended as a **long-term storytelling channel** for Perazzi.

---

### 3.4 Performance, Accessibility, and Reliability

#### 3.4.1 Performance

From the outset, performance is treated as **non-negotiable**:

- Images use optimized formats and known aspect ratios to minimize load times and layout shift, especially on image-heavy pages (home and shotguns).  
- Server-rendered pages and caching help deliver fast time-to-first-byte and overall load performance.

#### 3.4.2 Accessibility

Accessibility considerations include:

- Respecting **system preferences** for reduced motion (animations gracefully degrade when motion is disabled by the user).  
- Clear **heading structure** and **skip links**.  
- Visible and usable **focus states**.  
- **Keyboard-friendly controls** throughout the experience.  
- Overall design intended to work with assistive technologies.

#### 3.4.3 Reliability and Fallbacks

Reliability is supported by:

- **Fixture fallbacks** (static JSON/TS data) for critical pages:
  - If the CMS is temporarily unavailable, the site can still serve essential content using these fixtures.  
  - This keeps the site online and functional during external service issues.

- Cloud hosting and CDN-based delivery (see 3.2.6), which improve resilience and availability.

#### 3.4.4 Security Practices

Security practices explicitly include:

- Storing all sensitive credentials (Sanity, Cloudinary, OpenAI, database) as **server-side environment variables**.  
- Ensuring **no keys are embedded in the client** or exposed to visitors.

---

### 3.5 Rationale vs. a “Quick WordPress Site”

#### 3.5.1 Limitations of a Traditional WordPress Build

A conventional WordPress site:

- Could be produced faster in the short term.  
- But would **limit Perazzi** in areas that matter most over the next decade:
  - Storytelling depth.  
  - Configurator logic.  
  - Performance and accessibility.  
  - Integration with future services (e.g., e-commerce, owner accounts, multi-language support).

#### 3.5.2 Advantages of the Chosen Architecture

Concrete advantages described in the source:

1. **Headless, Modular Foundation**  
   - Content, commerce, knowledge, and presentation are cleanly separated.  
   - New services (e.g., e-commerce, owner accounts, saved builds, additional languages) can be added without discarding existing work.

2. **Structured Content, Not One-Off Pages**  
   - Platforms, disciplines, grades, heritage events, service centers, and configurator steps are modeled as **reusable data structures**, not one-off WYSIWYG pages.  
   - This drastically reduces inconsistency and makes long-term maintenance manageable.

3. **Cinematic but Controlled Experiences**  
   - The home page and key sections use tools like Framer Motion and modern layout patterns.  
   - These experiences are:
     - Measured and deliberate.  
     - Respectful of performance and accessibility.  
   - Such implementations are difficult to do well and maintain in a typical template-based WordPress theme.

4. **AI-Assisted Concierge Built Specifically for Perazzi**  
   - Uses OpenAI + pgvector over hand-curated Perazzi content.  
   - Can reason about platforms, triggers, gauges, disciplines, and build paths in a way aligned with how Perazzi actually builds guns.  
   - This is **far more capable** and brand-specific than a generic chatbot plugin.

5. **Modern Delivery and Resilience**  
   - Hosting on a platform like Vercel, with CDN support and a separate content studio at `/next-studio`, provides:
     - Robust performance.  
     - Better isolation of content and operations.  
     - A more future-proof setup than a single PHP server running a monolithic CMS.

#### 3.5.3 “Over-Built” Analogy

The architecture is deliberately described as **“over-built” in the same way a Perazzi shotgun is**:

- Not for show.  
- Built to handle decades of use, change, and refinement.  
- Designed so it does not need to be replaced every few years.

---

### 3.6 Current Status and Next Steps

#### 3.6.1 Current Development Status

At the time of this overview, the platform is **in active development**:

- The **core architecture**, page structure, and integrations are in place.  
- Several key experiences are implemented at a functional level, including:
  - Home narrative.  
  - Shotguns.  
  - Heritage.  
  - Experience.  
  - Bespoke.  
  - Service.  
  - Concierge.  
  - Engravings.  
  - Journal.  
- Some areas still use **placeholder or partial content**.

#### 3.6.2 Remaining Work

Remaining tasks include:

- Content entry and editing.  
- Visual refinement and polish.  
- QA across devices and viewports.  
- Any additional features that Perazzi and CSG decide to prioritize for launch.

#### 3.6.3 Offered Collaboration

The author offers to provide:

- A more detailed technical appendix.  
- A live walkthrough of the system.  
- Access for internal teams (including IT) to review the implementation from their perspective.

The closing intent is to **build something worthy of the Perazzi name** and to create a platform that will serve **not just the next campaign, but the next generation of shooters** who may discover Perazzi through this digital experience.

---

## 4. Edge Cases, Exceptions, and Caveats

- The document is an architectural and conceptual overview, **not** a full technical specification or schema reference.  
- No explicit pricing, legal, or gunsmithing behavior is defined in this overview; those topics are intentionally excluded from the concierge’s scope.  
- References to “platforms like Vercel” and animation tools (such as Framer Motion) describe current intent, not a locked-in vendor list or exhaustive implementation detail.  
- Specific page names (e.g., `/next-studio`) are included as described but may change as the system evolves.  
- The description of “fixtures” and CMS fallbacks is high-level; it does not enumerate all fallback files or exact data structures.

## 5. References & Cross-Links

- **Internal system references (implied only, not enumerated):**
  - Next.js app codebase (presentation layer).  
  - Sanity schemas and content studio configuration (content layer).  
  - Postgres + pgvector database schema for Perazzi knowledge and models.  
  - Cloudinary configuration for media.  
  - Hosting/deployment configuration (e.g., Vercel project settings).  

- **Related internal documents (as mentioned or implied in the email):**
  - A potential **technical appendix** with more implementation detail.  
  - Additional documentation or walkthroughs provided to Perazzi and CSG teams.

> Note (from AI): The original source references a “more detailed technical appendix” and “live walkthrough” as offerings but does not provide them inline. They are noted here for cross-linking only.

---

## Appendix A. Section Index

- **1. High-Level Overview** – Purpose of the document, audience, and what it covers.  
- **2. Key Concepts & Glossary** – Canonical names and definitions for core concepts (platform, architecture, concierge, site areas, performance/accessibility/resilience terms).  
- **3.1 Project Intent and Scope** – Describes the overarching purpose and core experiences of the digital platform.  
- **3.2 High-Level Architecture and Tech Stack** – Details the headless architecture, presentation layer, content layer, AI concierge, media pipeline, hosting, and design system.  
- **3.3 How the Main Site Areas Work** – Breaks down the behavior of Home, Shotguns/Platforms, Heritage, Experience & Service, Bespoke, Perazzi Concierge, and Engravings & Journal.  
- **3.4 Performance, Accessibility, and Reliability** – Outlines performance considerations, accessibility features, reliability strategies, and security practices.  
- **3.5 Rationale vs. a “Quick WordPress Site”** – Explains why a traditional WordPress build was not chosen, and the advantages of the current architecture.  
- **3.6 Current Status and Next Steps** – Summarizes development status, remaining work, and how internal teams can engage with the project.  
- **4. Edge Cases, Exceptions, and Caveats** – Notes limitations, exclusions, and evolving aspects of the overview.  
- **5. References & Cross-Links** – Points to related internal systems and documents that complement this overview.