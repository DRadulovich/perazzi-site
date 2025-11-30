import type { ShotgunsLandingData } from "@/types/catalog";
import type { FactoryAsset } from "@/types/content";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

const asset = (
  id: string,
  sourceUrl: string,
  alt: string,
  aspectRatio = 16 / 9,
  caption?: string,
): FactoryAsset => ({
  id,
  kind: "image",
  url: `${fetchBase}/${encodeURIComponent(sourceUrl)}`,
  alt,
  caption,
  aspectRatio,
});

const staticAsset = (id: string, path: string, alt: string, aspectRatio = 16 / 9): FactoryAsset => ({
  id,
  kind: "image",
  url: path,
  alt,
  aspectRatio,
});

const heroBackground = asset(
  "shotguns-landing-hero",
  "https://images.unsplash.com/photo-1600718370330-83c7fa23c6b4",
  "Perazzi MX and High Tech receivers displayed on a walnut bench",
  5 / 4,
  "Instrument-grade steel and walnut staged in the Botticino atelier.",
);

const highlightMedia = {
  mxTrigger: asset(
    "mx-highlight-trigger",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
    "A Perazzi drop-out trigger group being removed for service",
    4 / 3,
  ),
  mxReceiver: asset(
    "mx-highlight-receiver",
    "https://images.unsplash.com/photo-1517354153771-d19fbb86ba97",
    "Machined MX receiver resting on a walnut stock blank",
    4 / 3,
  ),
  htMonocoque: asset(
    "ht-highlight-monocoque",
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e",
    "High Tech monocoque action with sculpted sidewalls",
    4 / 3,
  ),
  htBalance: asset(
    "ht-highlight-balance",
    "https://images.unsplash.com/photo-1504274066651-8d31a536b11a",
    "Balance weights being installed beneath a High Tech fore-end",
    4 / 3,
  ),
  tmSingle: asset(
    "tm-highlight-single",
    "https://images.unsplash.com/photo-1579554348901-e7a704ff4215",
    "A TM single barrel with adjustable rib on the tuning bench",
    4 / 3,
  ),
  tmTrap: asset(
    "tm-highlight-trap",
    "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8",
    "Trap field view from behind a TM shooter",
    16 / 9,
  ),
  triggerDiagram: asset(
    "trigger-diagram",
    "https://images.unsplash.com/photo-1505731132164-cca90383e1af",
    "",
    16 / 9,
    "Diagram comparing removable and fixed trigger groups.",
  ),
};

export const landing: ShotgunsLandingData = {
  hero: {
    title: "Platforms shaped for podium calm",
    subheading:
      "Each Perazzi frame is a family of balance, trigger geometry, and rib architecture tuned for specific disciplines.",
    background: heroBackground,
  },
  platformGridUi: {
    heading: "Platforms & Lineages",
    subheading:
      "Explore the MX, HT, and TM Platforms and learn how each carry a different balance, design philosophy, and place on the line.",
    background: staticAsset(
      "platform-grid-bg",
      "/redesign-photos/shotguns/pweb-shotguns-platformgrid-bg.jpg",
      "Perazzi workshop background for platform section",
    ),
    chatLabelTemplate: "Ask about {platformName}",
    chatPayloadTemplate:
      "Help me understand the {platformName} platform and which model configurations I should start from.",
    cardFooterTemplate: "Explore the {platformName} lineage",
  },
  platforms: [
    {
      id: "platform-mx",
      slug: "mx",
      name: "MX",
      kind: "MX",
      tagline: "Bunker-proven drop-out trigger heritage.",
      lineageHtml:
        "<p>The MX lineage was born under Olympic lights in 1968 and continues to define bunker and skeet poise. Every receiver is hand-fitted so the drop-out trigger can be serviced in minutes without disturbing balance.</p>",
      hero: highlightMedia.mxReceiver,
      hallmark: "Drop-out trigger for fast service between events.",
      weightDistribution: "Neutral balance with quick between-station swing.",
      typicalDisciplines: ["Trap", "Skeet"],
      fixedCounterpart: {
        id: "platform-mx12",
        slug: "mx",
        name: "MX12",
      },
      highlights: [
        {
          title: "Drop-out trigger intelligence",
          body: "The MX trigger unit swaps in seconds, keeping you in the rotation even under championship pressure.",
          media: highlightMedia.mxTrigger,
        },
        {
          title: "Hand-fitted receiver and bolts",
          body: "Receivers are hand-blued and mated to barrels for decades of repeatable lock-up.",
          media: highlightMedia.mxReceiver,
        },
      ],
    },
    {
      id: "platform-ht",
      slug: "ht",
      name: "High Tech",
      kind: "HT",
      tagline: "Monocoque stability and adjustable ballast.",
      lineageHtml:
        "<p>High Tech carries the MX soul forward with a wider monocoque action that soaks recoil and keeps the rib calm under pressure. Modular ballast lets you bias swing weight for bunker doubles or looping sporting presentations.</p>",
      hero: highlightMedia.htMonocoque,
      hallmark: "Wider action walls soak recoil and keep sight plane stable.",
      weightDistribution:
        "Bias toward the hinge pin with modular ballast to trim swing weight.",
      typicalDisciplines: ["Trap", "Sporting"],
      fixedCounterpart: {
        id: "platform-hts",
        slug: "ht",
        name: "HTS",
      },
      highlights: [
        {
          title: "Monocoque action",
          body: "The High Tech’s single-piece action stiffens the sight picture while delivering refined recoil feel.",
          media: highlightMedia.htMonocoque,
        },
        {
          title: "Adjustable ballast kit",
          body: "Fore-end and stock weights dial swing dynamics to your rhythm, even between layouts.",
          media: highlightMedia.htBalance,
        },
      ],
    },
    {
      id: "platform-tm",
      slug: "tm",
      name: "TM",
      kind: "TM",
      tagline: "Single-barrel focus for American trap clarity.",
      lineageHtml:
        "<p>TM is Perazzi’s answer for American trap shooters who demanded MX feel with a dedicated single barrel. A fixed trigger and adjustable rib pair with forward bias to keep you on target from the 16-yard line to handicap.</p>",
      hero: highlightMedia.tmSingle,
      hallmark: "Fixed trigger simplicity with point-of-impact precision.",
      weightDistribution:
        "Forward-biased barrel keeps the rib steady through follow-through.",
      typicalDisciplines: ["Trap"],
      highlights: [
        {
          title: "Adjustable impact ribs",
          body: "Fine-tune point of impact across ATA handicap yardages without disturbing sight picture.",
          media: highlightMedia.tmSingle,
        },
        {
          title: "Trap-line resonance",
          body: "Balanced to stay calm through a full 100-target line, even when the light shifts.",
          media: highlightMedia.tmTrap,
        },
      ],
    },
  ],
  triggerExplainer: {
    title: "Triggers, simply",
    subheading: "Removable or fixed—choose by confidence and feel.",
    copyHtml:
      "<p>Perazzi's drop-out (MX / High Tech) is trusted for speed and serviceability in competition. Fixed triggers (MX12 / HTS) embody serene simplicity for shooters who value continuity.</p><p>Both share the same soul—choose by confidence and feel.</p>",
    diagram: highlightMedia.triggerDiagram,
    background: staticAsset(
      "trigger-explainer-bg",
      "/redesign-photos/shotguns/pweb-shotguns-triggerexplainer-bg.jpg",
      "Perazzi trigger workshop background",
    ),
    links: [
      { label: "Explore MX12 (fixed)", href: "/shotguns/mx#fixed" },
      { label: "Explore HTS (fixed)", href: "/shotguns/ht#fixed" },
    ],
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
        code: "trap",
        label: "Trap",
        description:
          "steep, rising targets that reward an assertive, up-through-the-line move. Higher point of impact, more vertical bias, and a stock that lets you stay tall without lifting your head.",
      },
      {
        code: "skeet",
        label: "Skeet",
        description:
          "short, repeatable arcs where timing and pre-mount rhythm matter more than raw speed. Flatter rib, softer point of impact, and geometry that lets the gun glide instead of chase.",
      },
      {
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
    background: staticAsset(
      "discipline-rail-bg",
      "/redesign-photos/shotguns/pweb-shotguns-disciplinerail2-bg.jpg",
      "Perazzi discipline background",
    ),
  },
  disciplines: [
    {
      id: "trap",
      name: "Trap",
      overviewHtml:
        "<p>Fast, vertical sight pictures where controlled recoil and point-of-impact adjustability reign.</p>",
      recommendedPlatforms: ["platform-mx", "platform-ht", "platform-tm"],
      champion: {
        name: "Silvana Rossi",
        title: "Olympic Trap Champion",
        quote:
          "The MX lets me watch the target, not recoil. The rib stays calm even when the light shifts.",
        image: asset(
          "trap-rail-champion",
          "https://images.unsplash.com/photo-1529688530647-93a450b72156",
          "Silvana Rossi on the trap line with her MX shotgun",
          3 / 4,
        ),
        id: "champion-trap",
      },
    },
    {
      id: "skeet",
      name: "Skeet",
      overviewHtml:
        "<p>Follow-through finesse for crossers—lighter barrels and neutral balance keep the rhythm.</p>",
      recommendedPlatforms: ["platform-mx"],
      champion: {
        name: "Elena Conti",
        title: "World Skeet Finalist",
        quote:
          "Neutral balance keeps the bead floating—my MX8 moves exactly with the target line.",
        image: asset(
          "skeet-rail-champion",
          "https://images.unsplash.com/photo-1529682627026-5a0fd89a0f9b",
          "Elena Conti tracking a crossing skeet pair",
          3 / 4,
        ),
        id: "champion-skeet",
      },
    },
    {
      id: "sporting",
      name: "Sporting",
      overviewHtml:
        "<p>Versatility for course setters—modular ballast and rib geometry tame rolling presentations.</p>",
      recommendedPlatforms: ["platform-ht"],
      champion: {
        name: "Luca Marin",
        title: "FITASC World Cup Medalist",
        quote:
          "High Tech ballast keeps my muzzle where I want it—whether it\u2019s battues or looping chandelles.",
        image: asset(
          "sporting-rail-champion",
          "https://images.unsplash.com/photo-1529688629625-1b6b2b62773d",
          "Luca Marin mounting a High Tech on a woodland sporting stand",
          3 / 4,
        ),
        id: "champion-sporting",
      },
    },
  ],
  gaugesTeaser: {
    href: "/shotguns/gauges",
    copy: "Feel the difference between 12, 20, 28, and .410—balance, swing, and shot column all change the story.",
    bullets: [
      "12 ga steadies sight picture for bunker targets.",
      "20/28 ga favor agility and quick recovery on skeet crosses.",
      ".410 trains touch and tempo for precision rounds.",
    ],
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
  gradesTeaser: {
    href: "/shotguns/grades",
    copy: "Explore engraving series and bespoke wood provenance from SC2 through SCO.",
    engravingTile: asset(
      "grades-engraving-tile",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
      "Engraver shading English scroll on a receiver plate",
      4 / 3,
    ),
    woodTile: asset(
      "grades-wood-tile",
      "https://images.unsplash.com/photo-1514996937319-344454492b37",
      "Perazzi walnut blanks with rich figure awaiting carving",
      4 / 3,
    ),
  },
  engravingCarouselUi: {
    heading: "Engraving Grades",
    subheading: "Commission tiers & engraving houses",
    background: staticAsset(
      "engraving-carousel-bg",
      "/redesign-photos/shotguns/pweb-shotguns-engravingsgradecarousel-bg.jpg",
      "Perazzi engraving workshop background",
    ),
    ctaLabel: "View engraving",
    categoryLabels: ["The Benchmark", "SC3 Grade", "SCO Grade", "Extra Grade"],
  },
};
