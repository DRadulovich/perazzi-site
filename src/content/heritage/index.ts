import type { HeritagePageData } from "@/types/heritage";
import { HERITAGE_ERAS } from "@/config/heritage-eras";
import { hero } from "./hero";
import { timeline } from "./timeline";
import { champions } from "./champions";
import { factoryEssay } from "./factoryEssay";
import { factoryIntroHtml } from "./factoryIntro";
import { oralHistories } from "./oralHistories";
import { related } from "./related";
import { finalCta } from "./finalCta";

const makeAsset = (url: string, alt: string) => ({
  id: url,
  kind: "image" as const,
  url,
  alt,
});

const heritageIntro = {
  eyebrow: "Perazzi heritage",
  heading: "A living lineage of craft",
  paragraphs: [
    "Every Perazzi era begins with a handful of engineers, engravers, and fitters gathered around the bench. As disciplines evolve - from Olympic trap to modern sporting - our makers redraw receivers, stocks, and lockwork to meet the next generation of champions.",
    "Use the eras below to trace the silhouettes, medals, and workshop milestones that shaped today's guns. Each chapter links back to Botticino, where the same hands still test, measure, and sign every build that leaves the atelier.",
  ],
  backgroundImage: makeAsset(
    "/redesign-photos/heritage/perazzi-legacy-lives-on.jpg",
    "Perazzi artisans and heritage imagery",
  ),
};

const workshopCta = {
  heading: "Ask the workshop",
  intro:
    "Trace provenance, decode proof marks, or understand where your gun sits in Perazzi lineage before you dive into the archives.",
  bullets: [
    "Serial lineage - match your serial to proof codes, production year, and model family.",
    "Proof marks & provenance - interpret stamps, engravings, and ownership clues for collectors.",
    "Era context - connect your shotgun's year to champions, medals, and the right heritage stories.",
  ],
  closing:
    "Share your serial, photos, and any history you know; we'll pull from the archives and point you to the best next pages to explore.",
  primaryLabel: "Immerse in the Perazzi Timeline",
  primaryHref: "#perazzi-heritage",
  secondaryLabel: "Check serial record",
  secondaryHref: "#heritage-serial-lookup",
};

const serialLookupUi = {
  heading: "Heritage Record",
  subheading: "Discover when your story began",
  instructions:
    "Enter the serial number engraved on your receiver. We'll consult the Perazzi archives and reveal the year your shotgun was born and the proof mark that sealed its place in history.",
  primaryButtonLabel: "Reveal Record",
  emptyStateText:
    "Your Perazzi's origin story will appear here when its number is entered.",
  backgroundImage: makeAsset(
    "/cinematic_background_photos/p-web-2.jpg",
    "Perazzi champions background",
  ),
};

const championsIntro = {
  heading: "Champions past and present",
  intro:
    "From Olympic podiums to modern sporting clays, Perazzi champions carry the same lineage you see in the gallery below - engraved receivers, bespoke stocks, and quiet routines that still shape the workshop today.",
  bullets: [
    "Generations on the line - medalists and contemporaries linked by the same Botticino craft.",
    "Discipline stories - trap, skeet, and sporting specialists whose routines feed our fittings.",
    "Design fingerprints - stock lines, rib profiles, and engraving styles that connect eras.",
  ],
  closing:
    "Browse the champions, then step into the timeline or serial lookup to place your own gun in their company.",
  chatLabel: "Ask about Perazzi champions",
  chatPrompt:
    "Tell the history of Perazzi's most famous champions - from Olympic legends to modern sporting icons - and how their routines and feedback shaped the guns in the gallery.",
};

const championsGalleryUi = {
  heading: "Perazzi Champions",
  subheading: "The athletes who shaped our lineage",
  backgroundImage: makeAsset(
    "/redesign-photos/heritage/pweb-heritage-era-5-atelier.jpg",
    "Perazzi champions background",
  ),
  championsLabel: "Champions",
  cardCtaLabel: "Read full interview",
};

const factoryIntroBlock = {
  heading: "Inside the Botticino atelier",
  intro:
    "The Factory Essay below walks through the benches where blanks become stocks, receivers are hand-fit, and engravers finish the metal that champions and collectors carry.",
  bullets: [
    "Stock and fitting benches - selecting blanks, shaping try-guns, and measuring for bespoke builds.",
    "Receivers and lockwork - machining, hand-fitting, and proofing the heart of each gun.",
    "Engraving and finish - scrollwork, checkering, and oil finishes that tie heritage to the present.",
  ],
  closing:
    "Scroll the essay to trace how Botticino craft shapes every Perazzi before it reaches a champion or collector.",
  chatLabel: "Ask about the workshop",
  chatPrompt:
    "Guide me through the Botticino factory steps: selecting and seasoning wood, machining and fitting receivers, hand-finishing, engraving, proofing, and how those processes shaped notable Perazzi builds.",
};

const factoryEssayUi = {
  eyebrow: "Factory essay",
  heading: "Inside the Botticino atelier",
};

const oralHistoriesUi = {
  eyebrow: "Oral histories",
  heading: "Voices from Botticino",
  readLabel: "Read transcript",
  hideLabel: "Hide transcript",
};

const relatedSection = {
  heading: "Related reading",
  items: related,
};

export const heritageData: HeritagePageData = {
  hero,
  heritageIntro,
  erasConfig: HERITAGE_ERAS,
  workshopCta,
  serialLookupUi,
  championsIntro,
  championsGalleryUi,
  factoryIntroBlock,
  factoryEssayUi,
  factoryIntroBody: factoryIntroHtml,
  timeline,
  champions,
  factoryEssay,
  oralHistories,
  oralHistoriesUi,
  relatedSection,
  finalCta,
};

export { hero } from "./hero";
export { timeline } from "./timeline";
export { champions } from "./champions";
export { factoryEssay } from "./factoryEssay";
export { factoryIntroHtml } from "./factoryIntro";
export { oralHistories } from "./oralHistories";
export { related } from "./related";
export { finalCta } from "./finalCta";
