#!/usr/bin/env tsx
import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";
import { HERITAGE_ERAS } from "../src/config/heritage-eras";
import { heritageData } from "../src/content/heritage";
import { factoryIntroHtml as factoryIntroFixture } from "../src/content/heritage/factoryIntro";
import { related as relatedFixture } from "../src/content/heritage/related";

type SectionConfig = {
  key: string;
  current: Record<string, unknown> | undefined;
  defaults: Record<string, unknown>;
  fields: string[];
};

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2025-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

const isMissing = (value: unknown) => {
  if (Array.isArray(value)) return value.length === 0;
  return value === undefined || value === null || value === "";
};

const mergeSection = (current: Record<string, unknown> | undefined, patch: Record<string, unknown>) => {
  return current ? { ...current, ...patch } : patch;
};

const collectPatch = (config: SectionConfig) => {
  const patch: Record<string, unknown> = {};
  config.fields.forEach((field) => {
    const currentValue = config.current?.[field];
    if (isMissing(currentValue)) {
      patch[field] = config.defaults[field];
    }
  });
  return patch;
};

const buildSectionConfigs = (heritageHome: Record<string, any>): SectionConfig[] => [
  {
    key: "heritageIntro",
    current: heritageHome.heritageIntro,
    defaults: heritageData.heritageIntro as Record<string, unknown>,
    fields: ["eyebrow", "heading", "paragraphs"],
  },
  {
    key: "workshopCta",
    current: heritageHome.workshopCta,
    defaults: heritageData.workshopCta as Record<string, unknown>,
    fields: ["heading", "intro", "bullets", "closing", "primaryLabel", "primaryHref", "secondaryLabel", "secondaryHref"],
  },
  {
    key: "serialLookupUi",
    current: heritageHome.serialLookupUi,
    defaults: heritageData.serialLookupUi as Record<string, unknown>,
    fields: ["heading", "subheading", "instructions", "primaryButtonLabel", "emptyStateText"],
  },
  {
    key: "championsIntro",
    current: heritageHome.championsIntro,
    defaults: heritageData.championsIntro as Record<string, unknown>,
    fields: ["heading", "intro", "bullets", "closing", "chatLabel", "chatPrompt"],
  },
  {
    key: "championsGalleryUi",
    current: heritageHome.championsGalleryUi,
    defaults: heritageData.championsGalleryUi as Record<string, unknown>,
    fields: ["heading", "subheading", "championsLabel", "cardCtaLabel"],
  },
  {
    key: "factoryIntroBlock",
    current: heritageHome.factoryIntroBlock,
    defaults: heritageData.factoryIntroBlock as Record<string, unknown>,
    fields: ["heading", "intro", "bullets", "closing", "chatLabel", "chatPrompt"],
  },
  {
    key: "factoryEssayUi",
    current: heritageHome.factoryEssayUi,
    defaults: heritageData.factoryEssayUi as Record<string, unknown>,
    fields: ["eyebrow", "heading"],
  },
  {
    key: "oralHistoriesUi",
    current: heritageHome.oralHistoriesUi,
    defaults: heritageData.oralHistoriesUi as Record<string, unknown>,
    fields: ["eyebrow", "heading", "readLabel", "hideLabel"],
  },
];

const applyStandardSections = (
  configs: SectionConfig[],
  applySection: (key: string, value: unknown) => void,
) => {
  configs.forEach((config) => {
    const patch = collectPatch(config);
    if (Object.keys(patch).length) {
      applySection(config.key, mergeSection(config.current, patch));
    }
  });
};

const seedErasConfig = (heritageHome: Record<string, any>, applySection: (key: string, value: unknown) => void) => {
  if (isMissing(heritageHome.erasConfig)) {
    applySection(
      "erasConfig",
      HERITAGE_ERAS.map((era) => ({
        _key: randomUUID(),
        id: era.id,
        label: era.label,
        yearRangeLabel: era.isOngoing ? `${era.startYear} – Today` : `${era.startYear} – ${era.endYear}`,
        startYear: era.startYear,
        endYear: era.endYear,
        overlayFrom: era.overlayColor,
        overlayTo: era.overlayColor,
      })),
    );
  }
};

const seedFactoryIntroBody = (
  heritageHome: Record<string, any>,
  applySection: (key: string, value: unknown) => void,
) => {
  if (isMissing(heritageHome.factoryIntroBody)) {
    applySection("factoryIntroBody", factoryIntroFixture);
  }
};

const buildRelatedItems = () =>
  relatedFixture.map((item) => ({
    _key: randomUUID(),
    title: item.title,
    slug: item.slug,
  }));

const seedRelatedSection = (heritageHome: Record<string, any>, applySection: (key: string, value: unknown) => void) => {
  const patch: Record<string, unknown> = {};
  if (isMissing(heritageHome.relatedSection?.heading)) {
    patch.heading = heritageData.relatedSection.heading;
  }
  if (isMissing(heritageHome.relatedSection?.items)) {
    patch.items = buildRelatedItems();
  }
  if (Object.keys(patch).length) {
    applySection("relatedSection", mergeSection(heritageHome.relatedSection, patch));
  }
};

const fetchHeritageHome = async () => {
  const heritageHome = await client.fetch<Record<string, any> | null>(`*[_type == "heritageHome"][0]`);
  if (!heritageHome?._id) {
    throw new Error("No heritageHome document found");
  }
  return heritageHome;
};

async function main() {
  const heritageHome = await fetchHeritageHome();
  const patch: Record<string, unknown> = {};
  const seeded: string[] = [];
  const applySection = (key: string, value: unknown) => {
    patch[key] = value;
    seeded.push(key);
  };

  applyStandardSections(buildSectionConfigs(heritageHome), applySection);
  seedErasConfig(heritageHome, applySection);
  seedFactoryIntroBody(heritageHome, applySection);
  seedRelatedSection(heritageHome, applySection);

  if (seeded.length === 0) {
    console.log("heritageHome already has intro, eras, CTA, serial UI, champions, factory, oral histories, and related content populated. No changes written.");
    return;
  }

  const result = await client.patch(heritageHome._id).set(patch).commit();
  console.log(`Seeded sections: ${seeded.join(", ")}`);
  console.log("Patch applied:", JSON.stringify(patch, null, 2));
  console.log("New revision:", result._rev);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
