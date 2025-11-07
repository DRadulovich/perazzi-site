import type { JournalCategoryData } from "@/types/journal";

const hero = (source: string, alt: string, aspectRatio = 16 / 9) => ({
  id: source,
  kind: "image" as const,
  url: `https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto/${encodeURIComponent(source)}`,
  alt,
  aspectRatio,
});

export const interviews: JournalCategoryData = {
  header: {
    title: "Champion Interviews",
    subtitleHtml: "<p>Champions on fittings, pressure, and staying present under lights.</p>",
    featured: { id: "fitting-ritual", title: "Sofia Rossi: The fitting ritual", slug: "fitting-ritual" },
  },
  items: [
    {
      title: "Marco De Santis on dynamic balance",
      excerptHtml: "<p>The High Tech shooter on why inertia matters in skeet doubles.</p>",
      author: "Journal Team",
      dateISO: "2024-05-08",
      readingTimeMins: 7,
      hero: hero("https://images.unsplash.com/photo-1485827404703-89b55fcc595e", "Marco De Santis smiling after a shoot", 4 / 3),
      tags: [{ id: "skeet", label: "Skeet", slug: "skeet" }],
      slug: "marco-dynamic-balance",
    },
    {
      title: "Giulia Bianchi’s training loop",
      excerptHtml: "<p>Why weekly tunnel sessions keep her Trap sight picture honest.</p>",
      author: "Journal Team",
      dateISO: "2024-05-01",
      readingTimeMins: 6,
      hero: hero("https://images.unsplash.com/photo-1477959858617-67f85cf4f1df", "Giulia Bianchi preparing to shoot", 4 / 3),
      tags: [{ id: "trap", label: "Trap", slug: "trap" }],
      slug: "giulia-training-loop",
    },
  ],
  filters: {
    tags: [
      { id: "trap", label: "Trap", slug: "trap", count: 3 },
      { id: "skeet", label: "Skeet", slug: "skeet" },
    ],
    authors: ["Journal Team"],
  },
  pagination: { page: 1, pageCount: 1 },
};
