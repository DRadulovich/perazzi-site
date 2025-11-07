import type { ArticlePageData } from "@/types/journal";

const heroAsset = {
  id: "mx8-lineage-hero",
  kind: "image" as const,
  url: "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1441986300917-64674bd600d8",
  alt: "Close-up of a Perazzi MX8 receiver on a bench",
  aspectRatio: 16 / 9,
};

export const article: ArticlePageData["article"] = {
  id: "mx8-lineage",
  slug: "mx8-lineage",
  title: "Inside the MX8 Lineage",
  dekHtml:
    "<p>A look at how the removable trigger and adjustable balance changed competition shotguns forever.</p>",
  hero: heroAsset,
  bodyPortableText: [
    { _type: "block", style: "normal", children: [{ text: "The MX8 was born for Mexico City 1968." }] },
    { _type: "block", style: "normal", children: [{ text: "Its removable trigger gave shooters field-serviceable reliability." }] },
  ],
  authorRef: { id: "claudia-venturi", name: "Claudia Venturi" },
  dateISO: "2024-03-01",
  readingTimeMins: 8,
  category: "craft",
  tags: ["materials", "trap"],
};
