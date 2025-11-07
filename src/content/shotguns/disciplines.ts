import type { DisciplineSummary } from "@/types/catalog";
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

export const disciplines: Record<string, DisciplineSummary> = {
  trap: {
    id: "trap",
    name: "Trap",
    overviewHtml:
      "<p>Trap shooters demand a sight picture that rises with the target but never jars the shoulder. Perazzi platforms favor calm ribs and recoil management to keep your focus intact.</p>",
    platforms: ["platform-mx", "platform-ht", "platform-tm"],
    recipe: {
      poiRange: "70/30–90/10",
      barrelLengths: '30"–34"',
      ribNotes:
        "Adjustable impact ribs and tapered ribs keep the bird floating in the bead.",
    },
    hero: asset(
      "trap-discipline-hero",
      "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8",
      "Trap field view with targets launching into the dusk",
      16 / 9,
    ),
    champion: {
      id: "champion-trap",
      quote:
        "Perazzi lets me watch the target, not recoil. The rib stays steady even when light shifts mid-round.",
      image: asset(
        "trap-champion",
        "https://images.unsplash.com/photo-1529682627026-5a0fd89a0f9b",
        "Champion standing on trap station three holding a Perazzi High Tech",
        3 / 4,
      ),
    },
    articles: [
      {
        id: "article-trap-tuning",
        title: "Setting point of impact for bunker finals",
        slug: "trap-poi-tuning",
      },
    ],
  },
  skeet: {
    id: "skeet",
    name: "Skeet",
    overviewHtml:
      "<p>Skeet favors neutral balance and quick transitions across the eighth station. Lightweight barrels and responsive triggers keep your swing connected.</p>",
    platforms: ["platform-mx"],
    recipe: {
      poiRange: "50/50–60/40",
      barrelLengths: '28"–30"',
      ribNotes: "Low tapered ribs keep the sight picture flat across crossers.",
    },
    hero: asset(
      "skeet-discipline-hero",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
      "Shooter tracking a crossing pair on the skeet field",
      16 / 9,
    ),
    champion: {
      id: "champion-skeet",
      quote:
        "The MX lets me move without thinking—neutral balance keeps the bead riding the bird across station four.",
      image: asset(
        "skeet-champion",
        "https://images.unsplash.com/photo-1529682627026-5a0fd89a0f9b",
        "Skeet shooter shouldering an MX shotgun mid-swing",
        3 / 4,
      ),
    },
    articles: [
      {
        id: "article-skeet-rhythm",
        title: "Maintaining skeet rhythm on double winds",
        slug: "skeet-rhythm",
      },
    ],
  },
  sporting: {
    id: "sporting",
    name: "Sporting",
    overviewHtml:
      "<p>Sporting and FITASC layouts call for adaptable ribs, modular ballast, and barrels that flow through complex chandelles.</p>",
    platforms: ["platform-ht"],
    recipe: {
      poiRange: "50/50–70/30",
      barrelLengths: '30"–32"',
      ribNotes:
        "Adjustable ribs and ballast let you bias toward loopers or driven targets.",
    },
    hero: asset(
      "sporting-discipline-hero",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
      "Sporting clays shooter following a chandelle through woodland course",
      16 / 9,
    ),
    champion: {
      id: "champion-sporting",
      quote:
        "High Tech ballast keeps my muzzle where I want it—whether it’s battues or looping chandelles.",
      image: asset(
        "sporting-champion",
        "https://images.unsplash.com/photo-1529688629625-1b6b2b62773d",
        "Sporting clays shooter mounting a High Tech on a woodland stand",
        3 / 4,
      ),
    },
    articles: [
      {
        id: "article-sporting-ballast",
        title: "Setting ballast for sporting clays tempo",
        slug: "sporting-ballast",
      },
    ],
  },
};
