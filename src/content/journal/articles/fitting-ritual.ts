import type { ArticlePageData } from "@/types/journal";

const heroAsset = {
  id: "fitting-ritual-hero",
  kind: "image" as const,
  url: "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto/https://images.unsplash.com/photo-1519680773827-376c7d3c9fb1",
  alt: "Sofia Rossi working with a fitter in the tunnel",
  aspectRatio: 16 / 9,
};

export const article: ArticlePageData["article"] = {
  id: "fitting-ritual",
  slug: "fitting-ritual",
  title: "Sofia Rossi: The fitting ritual",
  dekHtml: "<p>How the Olympic Trap champion approaches fittings before every major event.</p>",
  hero: heroAsset,
  bodyPortableText: [
    { _type: "block", style: "normal", children: [{ text: "Sofia starts every season in Botticino." }] },
    { _type: "block", style: "normal", children: [{ text: "Tunnel sessions reset her sight picture before travel." }] },
  ],
  authorRef: { id: "journal-team", name: "Journal Team" },
  dateISO: "2024-03-18",
  readingTimeMins: 6,
  category: "interviews",
  tags: ["trap"],
};
