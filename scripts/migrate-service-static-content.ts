#!/usr/bin/env tsx
import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";
import { overview as overviewFixture } from "@/content/service/overview";
import { maintenanceGuides as guidesFixture } from "@/content/service/guides";
import { partsEditorial as partsFixture } from "@/content/service/parts";
import { faq as faqFixture } from "@/content/service/faq";
import { serviceData } from "@/content/service";

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2025-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

const listToHtml = (items: string[]) => `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;

async function main() {
  const serviceHome = await client.fetch<Record<string, any> | null>(`*[_type == "serviceHome"][0]`);
  if (!serviceHome?._id) {
    console.error("No serviceHome document found");
    process.exit(1);
  }

  const patch: Record<string, unknown> = {};
  const seeded: string[] = [];

  const applySection = (key: string, value: unknown) => {
    patch[key] = value;
    seeded.push(key);
  };

  const defaultOverviewChecks =
    serviceData.overviewSection.checks ??
    (overviewFixture.checksHtml ? Array.from(overviewFixture.checksHtml.matchAll(/<li>(.*?)<\/li>/gi)).map((m) => m[1]) : []);

  const overviewPatch: Record<string, unknown> = {};
  if (!serviceHome.overviewSection?.heading) overviewPatch.heading = serviceData.overviewSection.heading;
  if (!serviceHome.overviewSection?.subheading) overviewPatch.subheading = serviceData.overviewSection.subheading;
  if (!serviceHome.overviewSection?.introHtml) overviewPatch.introHtml = overviewFixture.introHtml;
  if (!serviceHome.overviewSection?.checksHeading) overviewPatch.checksHeading = serviceData.overviewSection.checksHeading;
  if (!serviceHome.overviewSection?.checks?.length && defaultOverviewChecks.length) overviewPatch.checks = defaultOverviewChecks;
  if (Object.keys(overviewPatch).length) {
    applySection("overviewSection", { ...(serviceHome.overviewSection ?? {}), ...overviewPatch });
  }

  const guidancePatch: Record<string, unknown> = {};
  if (!serviceHome.serviceGuidanceBlock?.eyebrow) guidancePatch.eyebrow = serviceData.serviceGuidanceBlock.eyebrow;
  if (!serviceHome.serviceGuidanceBlock?.body) guidancePatch.body = serviceData.serviceGuidanceBlock.body;
  if (!serviceHome.serviceGuidanceBlock?.chatLabel) guidancePatch.chatLabel = serviceData.serviceGuidanceBlock.chatLabel;
  if (!serviceHome.serviceGuidanceBlock?.chatPrompt) guidancePatch.chatPrompt = serviceData.serviceGuidanceBlock.chatPrompt;
  if (Object.keys(guidancePatch).length) {
    applySection("serviceGuidanceBlock", { ...(serviceHome.serviceGuidanceBlock ?? {}), ...guidancePatch });
  }

  const shippingPatch: Record<string, unknown> = {};
  if (!serviceHome.shippingPrepBlock?.eyebrow) shippingPatch.eyebrow = serviceData.shippingPrepBlock.eyebrow;
  if (!serviceHome.shippingPrepBlock?.body) shippingPatch.body = serviceData.shippingPrepBlock.body;
  if (!serviceHome.shippingPrepBlock?.chatLabel) shippingPatch.chatLabel = serviceData.shippingPrepBlock.chatLabel;
  if (!serviceHome.shippingPrepBlock?.chatPrompt) shippingPatch.chatPrompt = serviceData.shippingPrepBlock.chatPrompt;
  if (Object.keys(shippingPatch).length) {
    applySection("shippingPrepBlock", { ...(serviceHome.shippingPrepBlock ?? {}), ...shippingPatch });
  }

  const networkPatch: Record<string, unknown> = {};
  if (!serviceHome.networkFinderUi?.heading) networkPatch.heading = serviceData.networkFinderUi.heading;
  if (!serviceHome.networkFinderUi?.subheading) networkPatch.subheading = serviceData.networkFinderUi.subheading;
  if (!serviceHome.networkFinderUi?.primaryButtonLabel) networkPatch.primaryButtonLabel = serviceData.networkFinderUi.primaryButtonLabel;
  if (!serviceHome.networkFinderUi?.detailsButtonLabel) networkPatch.detailsButtonLabel = serviceData.networkFinderUi.detailsButtonLabel;
  if (!serviceHome.networkFinderUi?.directionsButtonLabel) networkPatch.directionsButtonLabel = serviceData.networkFinderUi.directionsButtonLabel;
  if (Object.keys(networkPatch).length) {
    applySection("networkFinderUi", { ...(serviceHome.networkFinderUi ?? {}), ...networkPatch });
  }

  const maintenancePatch: Record<string, unknown> = {};
  if (!serviceHome.maintenanceSection?.heading) maintenancePatch.heading = serviceData.maintenanceSection.heading;
  if (!serviceHome.maintenanceSection?.subheading) maintenancePatch.subheading = serviceData.maintenanceSection.subheading;
  if (!serviceHome.maintenanceSection?.overviewHtml) maintenancePatch.overviewHtml = serviceData.maintenanceSection.overviewHtml;
  if (!serviceHome.maintenanceSection?.columnLabels?.length && serviceData.maintenanceSection.columnLabels?.length) {
    maintenancePatch.columnLabels = serviceData.maintenanceSection.columnLabels;
  }
  if (Object.keys(maintenancePatch).length) {
    applySection("maintenanceSection", { ...(serviceHome.maintenanceSection ?? {}), ...maintenancePatch });
  }

  if (!serviceHome.partsEditorialSection?.heading || !serviceHome.partsEditorialSection?.intro || !serviceHome.partsEditorialSection?.parts?.length) {
    applySection("partsEditorialSection", {
      heading: serviceData.partsEditorialSection.heading,
      intro: serviceData.partsEditorialSection.intro,
      parts: (serviceHome.partsEditorialSection?.parts?.length ? serviceHome.partsEditorialSection.parts : partsFixture).map((part) => ({
        name: part.name,
        purpose: part.purpose,
        fitment: part.fitment,
        notesHtml: part.notesHtml,
      })),
    });
  }

  const integrityPatch: Record<string, unknown> = {};
  if (!serviceHome.integrityAdvisory?.heading) integrityPatch.heading = serviceData.integrityAdvisory.heading;
  if (!serviceHome.integrityAdvisory?.body) integrityPatch.body = serviceData.integrityAdvisory.body;
  if (Object.keys(integrityPatch).length) {
    applySection("integrityAdvisory", { ...(serviceHome.integrityAdvisory ?? {}), ...integrityPatch });
  }

  const serviceRequestPatch: Record<string, unknown> = {};
  if (!serviceHome.serviceRequestBlock?.title) serviceRequestPatch.title = serviceData.serviceRequestBlock.title;
  if (!serviceHome.serviceRequestBlock?.description) serviceRequestPatch.description = serviceData.serviceRequestBlock.description;
  if (!serviceHome.serviceRequestBlock?.buttonLabel) serviceRequestPatch.buttonLabel = serviceData.serviceRequestBlock.buttonLabel;
  if (!serviceHome.serviceRequestBlock?.embedUrl) serviceRequestPatch.embedUrl = serviceData.serviceRequestBlock.embedUrl;
  if (!serviceHome.serviceRequestBlock?.fallbackUrl) serviceRequestPatch.fallbackUrl = serviceData.serviceRequestBlock.fallbackUrl;
  if (Object.keys(serviceRequestPatch).length) {
    applySection("serviceRequestBlock", { ...(serviceHome.serviceRequestBlock ?? {}), ...serviceRequestPatch });
  }

  const partsRequestPatch: Record<string, unknown> = {};
  if (!serviceHome.partsRequestBlock?.title) partsRequestPatch.title = serviceData.partsRequestBlock.title;
  if (!serviceHome.partsRequestBlock?.description) partsRequestPatch.description = serviceData.partsRequestBlock.description;
  if (!serviceHome.partsRequestBlock?.primaryButtonLabel)
    partsRequestPatch.primaryButtonLabel = serviceData.partsRequestBlock.primaryButtonLabel;
  if (!serviceHome.partsRequestBlock?.secondaryButtonLabel && serviceData.partsRequestBlock.secondaryButtonLabel) {
    partsRequestPatch.secondaryButtonLabel = serviceData.partsRequestBlock.secondaryButtonLabel;
  }
  if (!serviceHome.partsRequestBlock?.embedUrl) partsRequestPatch.embedUrl = serviceData.partsRequestBlock.embedUrl;
  if (!serviceHome.partsRequestBlock?.fallbackUrl) partsRequestPatch.fallbackUrl = serviceData.partsRequestBlock.fallbackUrl;
  if (Object.keys(partsRequestPatch).length) {
    applySection("partsRequestBlock", { ...(serviceHome.partsRequestBlock ?? {}), ...partsRequestPatch });
  }

  const guidesPatch: Record<string, unknown> = {};
  if (!serviceHome.guidesSection?.heading) guidesPatch.heading = serviceData.guidesSection.heading;
  if (!serviceHome.guidesSection?.careGuidesLabel) guidesPatch.careGuidesLabel = serviceData.guidesSection.careGuidesLabel;
  if (!serviceHome.guidesSection?.downloadsLabel) guidesPatch.downloadsLabel = serviceData.guidesSection.downloadsLabel;
  if (!serviceHome.guidesSection?.downloadButtonLabel) guidesPatch.downloadButtonLabel = serviceData.guidesSection.downloadButtonLabel;
  if (!serviceHome.guidesSection?.guides?.length) {
    guidesPatch.guides = guidesFixture.map((guide) => ({
      _key: randomUUID(),
      title: guide.title,
      summaryHtml: guide.summaryHtml,
      fileUrl: guide.fileUrl,
      fileSize: guide.fileSize,
    }));
  }
  if (Object.keys(guidesPatch).length) {
    applySection("guidesSection", { ...(serviceHome.guidesSection ?? {}), ...guidesPatch });
  }

  const faqPatch: Record<string, unknown> = {};
  if (!serviceHome.faqSection?.heading) faqPatch.heading = serviceData.faqSection.heading ?? "FAQ";
  if (!serviceHome.faqSection?.intro && serviceData.faqSection.intro) faqPatch.intro = serviceData.faqSection.intro;
  if (!serviceHome.faqSection?.items?.length) {
    faqPatch.items = faqFixture.map((item) => ({
      _key: randomUUID(),
      question: item.q,
      answerHtml: item.aHtml,
    }));
  }
  if (Object.keys(faqPatch).length) {
    applySection("faqSection", { ...(serviceHome.faqSection ?? {}), ...faqPatch });
  }

  if (seeded.length === 0) {
    console.log("serviceHome already has overview, guidance, network, maintenance, parts, advisory, requests, guides, and FAQ populated. No changes written.");
    return;
  }

  const result = await client.patch(serviceHome._id).set(patch).commit();
  console.log(`Seeded sections: ${seeded.join(", ")}`);
  console.log("Patch applied:", JSON.stringify(patch, null, 2));
  console.log("New revision:", result._rev);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
