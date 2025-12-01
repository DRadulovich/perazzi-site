#!/usr/bin/env tsx
import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";
import { HERITAGE_ERAS } from "../src/config/heritage-eras";
import { heritageData } from "../src/content/heritage";
import { factoryIntroHtml as factoryIntroFixture } from "../src/content/heritage/factoryIntro";
import { related as relatedFixture } from "../src/content/heritage/related";

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2025-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

async function main() {
  const heritageHome = await client.fetch<Record<string, any> | null>(`*[_type == "heritageHome"][0]`);
  if (!heritageHome?._id) {
    console.error("No heritageHome document found");
    process.exit(1);
  }

  const patch: Record<string, unknown> = {};
  const seeded: string[] = [];

  const applySection = (key: string, value: unknown) => {
    patch[key] = value;
    seeded.push(key);
  };

  const heritageIntroPatch: Record<string, unknown> = {};
  if (!heritageHome.heritageIntro?.eyebrow) heritageIntroPatch.eyebrow = heritageData.heritageIntro.eyebrow;
  if (!heritageHome.heritageIntro?.heading) heritageIntroPatch.heading = heritageData.heritageIntro.heading;
  if (!heritageHome.heritageIntro?.paragraphs?.length) heritageIntroPatch.paragraphs = heritageData.heritageIntro.paragraphs;
  if (Object.keys(heritageIntroPatch).length) {
    applySection("heritageIntro", { ...(heritageHome.heritageIntro ?? {}), ...heritageIntroPatch });
  }

  if (!heritageHome.erasConfig || heritageHome.erasConfig.length === 0) {
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

  const workshopPatch: Record<string, unknown> = {};
  if (!heritageHome.workshopCta?.heading) workshopPatch.heading = heritageData.workshopCta.heading;
  if (!heritageHome.workshopCta?.intro) workshopPatch.intro = heritageData.workshopCta.intro;
  if (!heritageHome.workshopCta?.bullets?.length) workshopPatch.bullets = heritageData.workshopCta.bullets;
  if (!heritageHome.workshopCta?.closing) workshopPatch.closing = heritageData.workshopCta.closing;
  if (!heritageHome.workshopCta?.primaryLabel) workshopPatch.primaryLabel = heritageData.workshopCta.primaryLabel;
  if (!heritageHome.workshopCta?.primaryHref) workshopPatch.primaryHref = heritageData.workshopCta.primaryHref;
  if (!heritageHome.workshopCta?.secondaryLabel) workshopPatch.secondaryLabel = heritageData.workshopCta.secondaryLabel;
  if (!heritageHome.workshopCta?.secondaryHref) workshopPatch.secondaryHref = heritageData.workshopCta.secondaryHref;
  if (Object.keys(workshopPatch).length) {
    applySection("workshopCta", { ...(heritageHome.workshopCta ?? {}), ...workshopPatch });
  }

  const serialPatch: Record<string, unknown> = {};
  if (!heritageHome.serialLookupUi?.heading) serialPatch.heading = heritageData.serialLookupUi.heading;
  if (!heritageHome.serialLookupUi?.subheading) serialPatch.subheading = heritageData.serialLookupUi.subheading;
  if (!heritageHome.serialLookupUi?.instructions) serialPatch.instructions = heritageData.serialLookupUi.instructions;
  if (!heritageHome.serialLookupUi?.primaryButtonLabel) serialPatch.primaryButtonLabel = heritageData.serialLookupUi.primaryButtonLabel;
  if (!heritageHome.serialLookupUi?.emptyStateText) serialPatch.emptyStateText = heritageData.serialLookupUi.emptyStateText;
  if (Object.keys(serialPatch).length) {
    applySection("serialLookupUi", { ...(heritageHome.serialLookupUi ?? {}), ...serialPatch });
  }

  const championsIntroPatch: Record<string, unknown> = {};
  if (!heritageHome.championsIntro?.heading) championsIntroPatch.heading = heritageData.championsIntro.heading;
  if (!heritageHome.championsIntro?.intro) championsIntroPatch.intro = heritageData.championsIntro.intro;
  if (!heritageHome.championsIntro?.bullets?.length) championsIntroPatch.bullets = heritageData.championsIntro.bullets;
  if (!heritageHome.championsIntro?.closing) championsIntroPatch.closing = heritageData.championsIntro.closing;
  if (!heritageHome.championsIntro?.chatLabel) championsIntroPatch.chatLabel = heritageData.championsIntro.chatLabel;
  if (!heritageHome.championsIntro?.chatPrompt) championsIntroPatch.chatPrompt = heritageData.championsIntro.chatPrompt;
  if (Object.keys(championsIntroPatch).length) {
    applySection("championsIntro", { ...(heritageHome.championsIntro ?? {}), ...championsIntroPatch });
  }

  const championsGalleryPatch: Record<string, unknown> = {};
  if (!heritageHome.championsGalleryUi?.heading) championsGalleryPatch.heading = heritageData.championsGalleryUi.heading;
  if (!heritageHome.championsGalleryUi?.subheading) championsGalleryPatch.subheading = heritageData.championsGalleryUi.subheading;
  if (!heritageHome.championsGalleryUi?.championsLabel) championsGalleryPatch.championsLabel = heritageData.championsGalleryUi.championsLabel;
  if (!heritageHome.championsGalleryUi?.cardCtaLabel) championsGalleryPatch.cardCtaLabel = heritageData.championsGalleryUi.cardCtaLabel;
  if (Object.keys(championsGalleryPatch).length) {
    applySection("championsGalleryUi", { ...(heritageHome.championsGalleryUi ?? {}), ...championsGalleryPatch });
  }

  const factoryIntroPatch: Record<string, unknown> = {};
  if (!heritageHome.factoryIntroBlock?.heading) factoryIntroPatch.heading = heritageData.factoryIntroBlock.heading;
  if (!heritageHome.factoryIntroBlock?.intro) factoryIntroPatch.intro = heritageData.factoryIntroBlock.intro;
  if (!heritageHome.factoryIntroBlock?.bullets?.length) factoryIntroPatch.bullets = heritageData.factoryIntroBlock.bullets;
  if (!heritageHome.factoryIntroBlock?.closing) factoryIntroPatch.closing = heritageData.factoryIntroBlock.closing;
  if (!heritageHome.factoryIntroBlock?.chatLabel) factoryIntroPatch.chatLabel = heritageData.factoryIntroBlock.chatLabel;
  if (!heritageHome.factoryIntroBlock?.chatPrompt) factoryIntroPatch.chatPrompt = heritageData.factoryIntroBlock.chatPrompt;
  if (Object.keys(factoryIntroPatch).length) {
    applySection("factoryIntroBlock", { ...(heritageHome.factoryIntroBlock ?? {}), ...factoryIntroPatch });
  }

  const factoryEssayUiPatch: Record<string, unknown> = {};
  if (!heritageHome.factoryEssayUi?.eyebrow) factoryEssayUiPatch.eyebrow = heritageData.factoryEssayUi.eyebrow;
  if (!heritageHome.factoryEssayUi?.heading) factoryEssayUiPatch.heading = heritageData.factoryEssayUi.heading;
  if (Object.keys(factoryEssayUiPatch).length) {
    applySection("factoryEssayUi", { ...(heritageHome.factoryEssayUi ?? {}), ...factoryEssayUiPatch });
  }

  if (!heritageHome.factoryIntroBody) {
    applySection("factoryIntroBody", factoryIntroFixture);
  }

  const oralHistoriesPatch: Record<string, unknown> = {};
  if (!heritageHome.oralHistoriesUi?.eyebrow) oralHistoriesPatch.eyebrow = heritageData.oralHistoriesUi.eyebrow;
  if (!heritageHome.oralHistoriesUi?.heading) oralHistoriesPatch.heading = heritageData.oralHistoriesUi.heading;
  if (!heritageHome.oralHistoriesUi?.readLabel) oralHistoriesPatch.readLabel = heritageData.oralHistoriesUi.readLabel;
  if (!heritageHome.oralHistoriesUi?.hideLabel) oralHistoriesPatch.hideLabel = heritageData.oralHistoriesUi.hideLabel;
  if (Object.keys(oralHistoriesPatch).length) {
    applySection("oralHistoriesUi", { ...(heritageHome.oralHistoriesUi ?? {}), ...oralHistoriesPatch });
  }

  const relatedPatch: Record<string, unknown> = {};
  if (!heritageHome.relatedSection?.heading) relatedPatch.heading = heritageData.relatedSection.heading;
  if (!heritageHome.relatedSection?.items?.length) {
    relatedPatch.items = relatedFixture.map((item) => ({
      _key: randomUUID(),
      title: item.title,
      slug: item.slug,
    }));
  }
  if (Object.keys(relatedPatch).length) {
    applySection("relatedSection", { ...(heritageHome.relatedSection ?? {}), ...relatedPatch });
  }

  if (seeded.length === 0) {
    console.log("heritageHome already has intro, eras, CTA, serial UI, champions, factory, oral histories, and related content populated. No changes written.");
    return;
  }

  const result = await client.patch(heritageHome._id).set(patch).commit();
  console.log(`Seeded sections: ${seeded.join(", ")}`);
  console.log("Patch applied:", JSON.stringify(patch, null, 2));
  console.log("New revision:", result._rev);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
