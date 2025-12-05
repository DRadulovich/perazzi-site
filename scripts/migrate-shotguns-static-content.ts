#!/usr/bin/env tsx
import {randomUUID} from "node:crypto";
import {createClient} from "@sanity/client";

type WithBackground = { backgroundImage?: { path?: string | null; image?: unknown } | null };
type PartialWithNulls<T> = {
  [K in keyof T]?: (K extends "backgroundImage" ? WithBackground["backgroundImage"] : T[K]) | null;
};

type ShotgunsLandingDoc = {
  _id: string;
  platformGridUi?: {
    heading?: string | null;
    subheading?: string | null;
    backgroundImage?: { path?: string | null; image?: unknown } | null;
    chatLabelTemplate?: string | null;
    chatPayloadTemplate?: string | null;
    cardFooterTemplate?: string | null;
  } | null;
  triggerExplainer?: {
    title?: string | null;
    subheading?: string | null;
    backgroundImage?: { path?: string | null; image?: unknown } | null;
  } | null;
  disciplineFitAdvisory?: {
    eyebrow?: string | null;
    heading?: string | null;
    paragraphs?: string[] | null;
    chatPrompt?: string | null;
    bullets?: Array<{ _key?: string; code?: string | null; label?: string | null; description?: string | null }> | null;
  } | null;
  disciplineRailUi?: WithBackground & {
    heading?: string | null;
    subheading?: string | null;
  } | null;
  gaugeSelectionAdvisory?: {
    heading?: string | null;
    intro?: string | null;
    chatLabel?: string | null;
    chatPrompt?: string | null;
    linkLabel?: string | null;
    linkHref?: string | null;
    bullets?: string[] | null;
    closing?: string | null;
  } | null;
  triggerChoiceAdvisory?: {
    heading?: string | null;
    intro?: string | null;
    chatLabel?: string | null;
    chatPrompt?: string | null;
    linkLabel?: string | null;
    linkHref?: string | null;
    bullets?: string[] | null;
    closing?: string | null;
  } | null;
  engravingCarouselUi?: WithBackground & {
    heading?: string | null;
    subheading?: string | null;
    ctaLabel?: string | null;
    categoryLabels?: string[] | null;
  } | null;
};

const defaults = {
  platformGridUi: {
    heading: "Platforms & Lineages",
    subheading:
      "Explore the MX, HT, and TM Platforms and learn how each carry a different balance, design philosophy, and place on the line.",
    backgroundImage: { path: "/redesign-photos/shotguns/pweb-shotguns-platformgrid-bg.jpg" },
    chatLabelTemplate: "Ask about {platformName}",
    chatPayloadTemplate: "Help me understand the {platformName} platform and which model configurations I should start from.",
    cardFooterTemplate: "Explore the {platformName} lineage",
  },
  triggerExplainer: {
    subheading: "Removable or fixed—choose by confidence and feel.",
    backgroundImage: { path: "/redesign-photos/shotguns/pweb-shotguns-triggerexplainer-bg.jpg" },
  },
  disciplineFitAdvisory: {
    eyebrow: "Discipline fit",
    heading: "The geometry of rhythm",
    paragraphs: [
      "Most shooters feel it long before they can explain it — why one gun feels effortless on Sporting, but out of step on Trap.",
      "Perazzi can translate that feeling into geometry: rib height, stock line, point of impact, and the way a gun wants to move through space. Ask how your primary discipline — or the one you’re growing toward — should shape the way your Perazzi is built.",
    ],
    chatPrompt:
      "Translate my main clay discipline into Perazzi geometry—rib height, stock line, point of impact, and swing speed—for Trap, Skeet, or Sporting/FITASC. Suggest where I should start.",
    bullets: [
      {
        _key: "trap",
        code: "trap",
        label: "Trap",
        description:
          "steep, rising targets that reward an assertive, up-through-the-line move. Higher point of impact, more vertical bias, and a stock that lets you stay tall without lifting your head.",
      },
      {
        _key: "skeet",
        code: "skeet",
        label: "Skeet",
        description:
          "short, repeatable arcs where timing and pre-mount rhythm matter more than raw speed. Flatter rib, softer point of impact, and geometry that lets the gun glide instead of chase.",
      },
      {
        _key: "sporting",
        code: "sporting",
        label: "Sporting / FITASC",
        description:
          "unpredictable windows, long crossers, and targets that live above, below, and beyond your comfort zone. Neutral, balanced geometry that doesn’t fight you as the picture changes — it simply goes where you ask.",
      },
    ],
  },
  disciplineRailUi: {
    heading: "Disciplines at a Glance",
    subheading:
      "Every discipline demands something unique from your platform, whether it's precision, speed, or adaptability.",
    backgroundImage: { path: "/redesign-photos/shotguns/pweb-shotguns-disciplinerail2-bg.jpg" },
  },
  gaugeSelectionAdvisory: {
    heading: "Gauge selection",
    intro:
      "Decode how 12, 20, and 28 gauge choices shape recoil feel, swing speed, and payload — and how to pair them with your platform and disciplines.",
    chatLabel: "Ask about gauges",
    chatPrompt:
      "Help me choose between 12, 20, and 28 gauge for my Perazzi: recoil feel, payload options, swing speed, and how gauge pairs with MX vs HT platforms for my disciplines.",
    linkLabel: "Explore gauges",
    linkHref: "/shotguns/gauges",
    bullets: [
      "12 ga steadies sight picture for bunker targets.",
      "20/28 ga favor agility and quick recovery on skeet crosses.",
      ".410 trains touch and tempo for precision rounds.",
    ],
    closing:
      "We’ll tailor gauge choice to your primary discipline, preferred swing, and how you like a gun to absorb recoil.",
  },
  triggerChoiceAdvisory: {
    heading: "Trigger choice",
    intro:
      "Decide when to choose a fixed trigger group for simplicity, or a detachable set for quick swaps, varied pull weights, and service resilience.",
    chatLabel: "Choose my trigger",
    chatPrompt:
      "Help me decide between a fixed trigger and a removable trigger group on my Perazzi: reliability, service, pull-weight options, and what matters for travel or competition timelines.",
    linkLabel: "See trigger details",
    linkHref: "#trigger-explainer-heading",
    bullets: [
      "Fixed group – lighter, fewer parts to manage, set-and-forget confidence.",
      "Removable group – fast swaps for pull weight or service, keeps you running at events.",
      "Support & travel – how you compete, who services your gun, and what spares you carry.",
    ],
    closing:
      "We’ll align trigger choice to your platform, discipline rhythm, and how you like your release to feel under pressure.",
  },
  engravingCarouselUi: {
    heading: "Engraving Grades",
    subheading: "Commission tiers & engraving houses",
    backgroundImage: { path: "/redesign-photos/shotguns/pweb-shotguns-engravingsgradecarousel-bg.jpg" },
    ctaLabel: "View engraving",
    categoryLabels: ["The Benchmark", "SC3 Grade", "SCO Grade", "Extra Grade"],
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
  const landing = await client.fetch<ShotgunsLandingDoc | null>(`*[_type == "shotgunsLanding"][0]`);
  if (!landing?._id) {
    console.error("No shotgunsLanding document found to migrate.");
    return;
  }

  const patch: Record<string, unknown> = {};
  const changes: string[] = [];

  const platformGrid = mergeObjectWithBackground(defaults.platformGridUi, landing.platformGridUi);
  if (platformGrid.changed) {
    patch.platformGridUi = platformGrid.value;
    changes.push("platformGridUi");
  }

  const triggerExplainer = mergeTriggerExplainer(defaults.triggerExplainer, landing.triggerExplainer);
  if (triggerExplainer.changed) {
    patch.triggerExplainer = triggerExplainer.value;
    changes.push("triggerExplainer.subheading/background");
  }

  const disciplineFit = mergeDisciplineFit(defaults.disciplineFitAdvisory, landing.disciplineFitAdvisory);
  if (disciplineFit.changed) {
    patch.disciplineFitAdvisory = disciplineFit.value;
    changes.push("disciplineFitAdvisory");
  }

  const disciplineRail = mergeObjectWithBackground(defaults.disciplineRailUi, landing.disciplineRailUi);
  if (disciplineRail.changed) {
    patch.disciplineRailUi = disciplineRail.value;
    changes.push("disciplineRailUi");
  }

  const gaugeAdvisory = mergeGaugeAdvisory(defaults.gaugeSelectionAdvisory, landing.gaugeSelectionAdvisory);
  if (gaugeAdvisory.changed) {
    patch.gaugeSelectionAdvisory = gaugeAdvisory.value;
    changes.push("gaugeSelectionAdvisory");
  }

  const triggerChoice = mergeTriggerChoice(defaults.triggerChoiceAdvisory, landing.triggerChoiceAdvisory);
  if (triggerChoice.changed) {
    patch.triggerChoiceAdvisory = triggerChoice.value;
    changes.push("triggerChoiceAdvisory");
  }

  const engravingUi = mergeObjectWithBackground(defaults.engravingCarouselUi, landing.engravingCarouselUi);
  if (engravingUi.changed) {
    patch.engravingCarouselUi = engravingUi.value;
    changes.push("engravingCarouselUi");
  }

  if (changes.length === 0) {
    console.log("Shotguns landing already has platform grid, advisory, and carousel UI fields populated. No changes written.");
    return;
  }

  const result = await client.patch(landing._id).set(patch).commit();
  console.log(`Updated shotgunsLanding (${landing._id}): ${changes.join(", ")}`);
  console.log("Patch applied:", JSON.stringify(patch, null, 2));
  console.log("New revision:", result._rev);
}

function mergeObjectWithBackground<T extends WithBackground>(
  defaultsValue: T,
  existing?: PartialWithNulls<T> | null,
) {
  const hasBackground = Boolean(existing?.backgroundImage && (existing.backgroundImage.image || existing.backgroundImage.path));

  const merged: Record<string, unknown> = {};
  Object.keys(defaultsValue ?? {}).forEach((key) => {
    if (key === "backgroundImage") return;
    const existingVal = (existing as Record<string, unknown> | undefined)?.[key];
    merged[key] = existingVal === undefined || existingVal === null || existingVal === ""
      ? (defaultsValue as Record<string, unknown>)[key]
      : existingVal;
  });

  if (existing) {
    Object.entries(existing).forEach(([key, value]) => {
      if (key === "backgroundImage") return;
      if (merged[key] === undefined) merged[key] = value;
    });
  }

  const value = {
    ...(merged as T),
    backgroundImage: hasBackground ? existing?.backgroundImage : defaultsValue.backgroundImage,
  };

  const changed =
    !existing ||
    !existing.backgroundImage ||
    Object.keys(merged).some((key) => {
      const existingVal = (existing as Record<string, unknown> | undefined)?.[key];
      return existingVal === undefined || existingVal === null || existingVal === "";
    });

  return { value: value as T, changed };
}

function mergeTriggerExplainer(
  defaultsValue: ShotgunsLandingDoc["triggerExplainer"],
  existing?: ShotgunsLandingDoc["triggerExplainer"] | null,
) {
  const hasBackground = Boolean(existing?.backgroundImage && (existing.backgroundImage.image || existing.backgroundImage.path));
  const value = {
    ...(existing ?? {}),
    subheading: existing?.subheading || defaultsValue?.subheading,
    backgroundImage: hasBackground ? existing?.backgroundImage : defaultsValue?.backgroundImage,
  };
  const changed = !existing?.subheading || !hasBackground;
  return { value, changed };
}

function mergeDisciplineFit(
  defaultsValue: NonNullable<ShotgunsLandingDoc["disciplineFitAdvisory"]>,
  existing?: ShotgunsLandingDoc["disciplineFitAdvisory"] | null,
) {
  const value = {
    eyebrow: existing?.eyebrow || defaultsValue.eyebrow,
    heading: existing?.heading || defaultsValue.heading,
    paragraphs: existing?.paragraphs?.length ? existing.paragraphs : defaultsValue.paragraphs,
    chatPrompt: existing?.chatPrompt || defaultsValue.chatPrompt,
    bullets: normalizeBullets(existing?.bullets?.length ? existing.bullets : defaultsValue.bullets),
  };

  const changed =
    !existing?.eyebrow ||
    !existing?.heading ||
    !existing?.paragraphs?.length ||
    !existing?.chatPrompt ||
    !existing?.bullets?.length;

  return { value, changed };
}

function mergeGaugeAdvisory(
  defaultsValue: NonNullable<ShotgunsLandingDoc["gaugeSelectionAdvisory"]>,
  existing?: ShotgunsLandingDoc["gaugeSelectionAdvisory"] | null,
) {
  const value = {
    heading: existing?.heading || defaultsValue.heading,
    intro: existing?.intro || defaultsValue.intro,
    chatLabel: existing?.chatLabel || defaultsValue.chatLabel,
    chatPrompt: existing?.chatPrompt || defaultsValue.chatPrompt,
    linkLabel: existing?.linkLabel || defaultsValue.linkLabel,
    linkHref: existing?.linkHref || defaultsValue.linkHref,
    bullets: existing?.bullets?.length ? existing.bullets : defaultsValue.bullets,
    closing: existing?.closing || defaultsValue.closing,
  };

  const changed =
    !existing?.heading ||
    !existing?.intro ||
    !existing?.chatLabel ||
    !existing?.chatPrompt ||
    !existing?.linkLabel ||
    !existing?.linkHref ||
    !existing?.bullets?.length ||
    !existing?.closing;

  return { value, changed };
}

function mergeTriggerChoice(
  defaultsValue: NonNullable<ShotgunsLandingDoc["triggerChoiceAdvisory"]>,
  existing?: ShotgunsLandingDoc["triggerChoiceAdvisory"] | null,
) {
  const value = {
    heading: existing?.heading || defaultsValue.heading,
    intro: existing?.intro || defaultsValue.intro,
    chatLabel: existing?.chatLabel || defaultsValue.chatLabel,
    chatPrompt: existing?.chatPrompt || defaultsValue.chatPrompt,
    linkLabel: existing?.linkLabel || defaultsValue.linkLabel,
    linkHref: existing?.linkHref || defaultsValue.linkHref,
    bullets: existing?.bullets?.length ? existing.bullets : defaultsValue.bullets,
    closing: existing?.closing || defaultsValue.closing,
  };

  const changed =
    !existing?.heading ||
    !existing?.intro ||
    !existing?.chatLabel ||
    !existing?.chatPrompt ||
    !existing?.linkLabel ||
    !existing?.linkHref ||
    !existing?.bullets?.length ||
    !existing?.closing;

  return { value, changed };
}

function normalizeBullets(
  bullets?: Array<{ _key?: string; code?: string | null; label?: string | null; description?: string | null }> | null,
) {
  if (!bullets?.length) return undefined;
  return bullets.map((bullet) => ({
    _key: bullet._key ?? randomUUID(),
    code: bullet.code ?? undefined,
    label: bullet.label ?? undefined,
    description: bullet.description ?? undefined,
  }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
