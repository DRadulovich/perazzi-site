import type { JournalCategoryData } from "@/types/journal";

const hero = (source: string, alt: string, aspectRatio = 16 / 9) => ({
  id: source,
  kind: "image" as const,
  url: `https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto/${encodeURIComponent(source)}`,
  alt,
  aspectRatio,
});

export const news: JournalCategoryData = {
  header: {
    title: "News",
    subtitleHtml: "<p>Announcements from Botticino and our global partners.</p>",
    featured: null,
  },
  items: [
    {
      title: "Service center partnership",
      excerptHtml: "<p>Denver joins the authorized network, offering same-week trigger rebuilds.</p>",
      author: "Perazzi Newsroom",
      dateISO: "2024-02-12",
      readingTimeMins: 4,
      hero: hero("https://images.unsplash.com/photo-1516168399571-26661d7f33a0", "Service center bench with tools", 4 / 3),
      tags: [{ id: "service", label: "Service", slug: "service" }],
      slug: "service-center-partnership",
    },
    {
      title: "Roadshow calendar",
      excerptHtml: "<p>Traveling fitting team dates for North America and Europe.</p>",
      author: "Perazzi Newsroom",
      dateISO: "2024-01-20",
      readingTimeMins: 3,
      hero: hero("https://images.unsplash.com/photo-1516826957135-700dedea698c", "Perazzi roadshow trailer and crew", 4 / 3),
      tags: [{ id: "demo", label: "Demo", slug: "demo" }],
      slug: "roadshow-calendar",
    },
  ],
  filters: {
    tags: [
      { id: "service", label: "Service", slug: "service", count: 2 },
      { id: "demo", label: "Demo", slug: "demo" },
    ],
    authors: ["Perazzi Newsroom"],
  },
  pagination: { page: 1, pageCount: 1 },
};
