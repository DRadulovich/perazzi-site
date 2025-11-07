import type { JournalCategoryData } from "@/types/journal";

const hero = (source: string, alt: string, aspectRatio = 16 / 9) => ({
  id: source,
  kind: "image" as const,
  url: `https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto/${encodeURIComponent(source)}`,
  alt,
  aspectRatio,
});

export const craft: JournalCategoryData = {
  header: {
    title: "Stories of Craft",
    subtitleHtml: "<p>The atelier in motion—engraving, stockmaking, and tunnel precision.</p>",
    featured: { id: "mx8-lineage", title: "Inside the MX8 Lineage", slug: "mx8-lineage" },
  },
  items: [
    {
      title: "Walnut vaults and balance",
      excerptHtml: "<p>Choosing slabs for bunker stability vs. sporting sweep.</p>",
      author: "Claudia Venturi",
      dateISO: "2024-04-02",
      readingTimeMins: 6,
      hero: hero("https://images.unsplash.com/photo-1519681393784-d120267933ba", "Walnut blanks stacked in a workshop", 4 / 3),
      tags: [{ id: "materials", label: "Materials", slug: "materials" }],
      slug: "walnut-vaults",
    },
    {
      title: "Tunnel regulation diaries",
      excerptHtml: "<p>How Perazzi documents POI across disciplines.</p>",
      author: "Journal Team",
      dateISO: "2024-03-15",
      readingTimeMins: 5,
      hero: hero("https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a", "Shooter testing in an indoor tunnel", 4 / 3),
      tags: [{ id: "trap", label: "Trap", slug: "trap" }],
      slug: "tunnel-regulation",
    },
  ],
  filters: {
    tags: [
      { id: "materials", label: "Materials", slug: "materials", count: 2 },
      { id: "tunnel", label: "Tunnel", slug: "tunnel" },
    ],
    authors: ["Claudia Venturi", "Journal Team"],
  },
  pagination: { page: 1, pageCount: 2 },
};
