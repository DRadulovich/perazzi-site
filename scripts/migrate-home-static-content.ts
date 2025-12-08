#!/usr/bin/env tsx
import {randomUUID} from "node:crypto";
import {createClient} from "@sanity/client";

type GuidePlatformDoc = {
  _key?: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
};

type HomeSingletonDoc = {
  _id: string;
  heroCtas?: {
    primaryLabel?: string | null;
    primaryPrompt?: string | null;
    secondaryLabel?: string | null;
    secondaryHref?: string | null;
  } | null;
  timelineFraming?: {
    title?: string | null;
    eyebrow?: string | null;
    instructions?: string | null;
    alternateTitle?: string | null;
    backgroundImage?: {
      path?: string | null;
      image?: unknown;
    } | null;
  } | null;
  guideSection?: {
    title?: string | null;
    intro?: string | null;
    chatLabel?: string | null;
    chatPrompt?: string | null;
    linkLabel?: string | null;
    linkHref?: string | null;
    platforms?: Array<GuidePlatformDoc | null> | null;
    closing?: string | null;
  } | null;
  marqueeUi?: {
    eyebrow?: string | null;
    backgroundImage?: {
      path?: string | null;
      image?: unknown;
    } | null;
  } | null;
};

const timelineBackgroundPath = "/redesign-photos/homepage/timeline-scroller/pweb-home-timelinescroller-bg.jpg";
const marqueeBackgroundPath = "/redesign-photos/homepage/marquee-feature/pweb-home-marqueefeature-bg.jpg";

const defaults = {
  heroCtas: {
    primaryLabel: "Ask the concierge",
    primaryPrompt:
      "Introduce me to Perazzi's bespoke philosophy and help me choose where to begin if I'm exploring my first build.",
    secondaryLabel: "Explore shotguns",
    secondaryHref: "/shotguns",
  },
  timelineFraming: {
    title: "Craftsmanship Journey",
    eyebrow: "Three rituals that define a bespoke Perazzi build",
    instructions:
      "Scroll through each stage to see how measurement, tunnel testing, and finishing combine into a legacy piece.",
    alternateTitle: "Fitting Timeline",
    backgroundImage: {path: timelineBackgroundPath},
  },
  guideSection: {
    title: "Need a guide?",
    intro:
      "Ask how Perazzi links heritage, champions, and today’s platforms, then step into the catalog with a clearer sense of where you belong – whether that’s HT, MX, TM or beyond.",
    chatLabel: "Ask about platforms",
    chatPrompt:
      "Connect Perazzi's heritage stories and champions to current platforms like High Tech and MX, and suggest the next pages I should explore on the site.",
    linkLabel: "Explore shotguns",
    linkHref: "/shotguns",
    platforms: [
      {
        _key: "ht",
        code: "ht",
        name: "HT",
        description: "modern competition geometry for demanding sporting layouts.",
      },
      {
        _key: "mx",
        code: "mx",
        name: "MX",
        description: "the classic lineage: balanced, adaptable, and endlessly configurable.",
      },
      {
        _key: "tm",
        code: "tm",
        name: "TM",
        description: "purpose-built for American trap with a dedicated silhouette.",
      },
    ],
    closing:
      "The concierge can map your disciplines, preferences, and ambitions to a starting platform and the right next pages to visit.",
  },
  marqueeUi: {
    eyebrow: "Champion spotlight",
    backgroundImage: {path: marqueeBackgroundPath},
  },
};

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET,
  apiVersion: process.env.SANITY_API_VERSION || "2023-10-01",
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN || process.env.SANITY_TOKEN,
});

async function main() {
  const home = await client.fetch<HomeSingletonDoc | null>(`*[_type == "homeSingleton"][0]`);
  if (!home?._id) {
    console.error("No homeSingleton document found to migrate.");
    return;
  }

  const patch: Record<string, unknown> = {};
  const changes: string[] = [];

  const heroCtas = mergeHeroCtas(home.heroCtas);
  if (heroCtas.changed) {
    patch.heroCtas = heroCtas.value;
    changes.push("heroCtas");
  }

  const timelineFraming = mergeTimelineFraming(home.timelineFraming);
  if (timelineFraming.changed) {
    patch.timelineFraming = timelineFraming.value;
    changes.push("timelineFraming");
  }

  const guideSection = mergeGuideSection(home.guideSection);
  if (guideSection.changed) {
    patch.guideSection = guideSection.value;
    changes.push("guideSection");
  }

  const marqueeUi = mergeMarqueeUi(home.marqueeUi);
  if (marqueeUi.changed) {
    patch.marqueeUi = marqueeUi.value;
    changes.push("marqueeUi");
  }

  if (changes.length === 0) {
    console.log("Home singleton already has concierge CTA, timeline framing, guide section, and marquee UI populated. No changes written.");
    return;
  }

  const result = await client.patch(home._id).set(patch).commit();
  console.log(`Updated homeSingleton (${home._id}): ${changes.join(", ")}`);
  console.log("Patch applied:", JSON.stringify(patch, null, 2));
  console.log("New revision:", result._rev);
}

function mergeHeroCtas(existing: HomeSingletonDoc["heroCtas"]) {
  const value = {
    primaryLabel: existing?.primaryLabel || defaults.heroCtas.primaryLabel,
    primaryPrompt: existing?.primaryPrompt || defaults.heroCtas.primaryPrompt,
    secondaryLabel: existing?.secondaryLabel || defaults.heroCtas.secondaryLabel,
    secondaryHref: existing?.secondaryHref || defaults.heroCtas.secondaryHref,
  };
  const changed =
    !existing?.primaryLabel ||
    !existing?.primaryPrompt ||
    !existing?.secondaryLabel ||
    !existing?.secondaryHref;
  return {value, changed};
}

function mergeTimelineFraming(existing: HomeSingletonDoc["timelineFraming"]) {
  const backgroundImage = existing?.backgroundImage;
  const hasBackground = Boolean(backgroundImage?.image || backgroundImage?.path);
  const value = {
    title: existing?.title || defaults.timelineFraming.title,
    eyebrow: existing?.eyebrow || defaults.timelineFraming.eyebrow,
    instructions: existing?.instructions || defaults.timelineFraming.instructions,
    alternateTitle: existing?.alternateTitle || defaults.timelineFraming.alternateTitle,
    backgroundImage: hasBackground ? backgroundImage : defaults.timelineFraming.backgroundImage,
  };
  const changed =
    !existing?.title ||
    !existing?.eyebrow ||
    !existing?.instructions ||
    !existing?.alternateTitle ||
    !hasBackground;
  return {value, changed};
}

function mergeGuideSection(existing: HomeSingletonDoc["guideSection"]) {
  const platforms = mergeGuidePlatforms(existing?.platforms ?? []);
  const value = {
    title: existing?.title || defaults.guideSection.title,
    intro: existing?.intro || defaults.guideSection.intro,
    chatLabel: existing?.chatLabel || defaults.guideSection.chatLabel,
    chatPrompt: existing?.chatPrompt || defaults.guideSection.chatPrompt,
    linkLabel: existing?.linkLabel || defaults.guideSection.linkLabel,
    linkHref: existing?.linkHref || defaults.guideSection.linkHref,
    platforms: platforms.value,
    closing: existing?.closing || defaults.guideSection.closing,
  };
  const changed =
    !existing?.title ||
    !existing?.intro ||
    !existing?.chatLabel ||
    !existing?.chatPrompt ||
    !existing?.linkLabel ||
    !existing?.linkHref ||
    platforms.changed ||
    !existing?.closing;

  return {value, changed};
}

function mergeGuidePlatforms(existing: Array<GuidePlatformDoc | null>) {
  const sanitized = existing.filter((item): item is GuidePlatformDoc => Boolean(item?.code));
  const defaultsByCode = new Map(defaults.guideSection.platforms.map((platform) => [platform.code, platform]));

  const mergedDefaults = defaults.guideSection.platforms.map((platform) => {
    const match = sanitized.find((item) => item.code === platform.code);
    return {
      _key: match?._key || platform._key || randomUUID(),
      code: platform.code,
      name: match?.name || platform.name,
      description: match?.description || platform.description,
    };
  });

  const extras = sanitized
    .filter((item) => item.code && !defaultsByCode.has(item.code))
    .map((item) => ({
      _key: item._key || randomUUID(),
      code: item.code,
      name: item.name || item.code,
      description: item.description || "",
    }));

  const merged = [...mergedDefaults, ...extras];
  const changed = JSON.stringify(merged) !== JSON.stringify(sanitized);
  return {value: merged, changed};
}

function mergeMarqueeUi(existing: HomeSingletonDoc["marqueeUi"]) {
  const backgroundImage = existing?.backgroundImage;
  const hasBackground = Boolean(backgroundImage?.image || backgroundImage?.path);
  const value = {
    eyebrow: existing?.eyebrow || defaults.marqueeUi.eyebrow,
    backgroundImage: hasBackground ? backgroundImage : defaults.marqueeUi.backgroundImage,
  };
  const changed = !existing?.eyebrow || !hasBackground;
  return {value, changed};
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
