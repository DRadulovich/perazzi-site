import type { JournalLandingData } from "@/types/journal";

const cloud = (path: string, alt: string, aspectRatio = 16 / 9) => ({
  id: path,
  kind: "image" as const,
  url: `https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto/${encodeURIComponent(path)}`,
  alt,
  aspectRatio,
});

export const landing: JournalLandingData = {
  hero: {
    title: "Journal",
    subheading: "Stories of craft, interviews with champions, and news from Botticino.",
    background: cloud(
      "https://images.unsplash.com/photo-1493020258366-be3ead1b3027",
      "Close-up of a craftsman engraving a shotgun receiver",
    ),
  },
  featured: {
    id: "mx8-lineage",
    title: "Inside the MX8 Lineage",
    slug: "mx8-lineage",
  },
  hubs: {
    craft: {
      headerHtml:
        "<p>Go inside the ateliers for stockmaking, engraving, and regulation.</p>",
      viewAllHref: "/journal/stories-of-craft",
      items: [
        {
          title: "Stockmakers on balance",
          excerptHtml: "<p>How Botticino artisans shape walnut to match a shooter’s rhythm.</p>",
          author: "Claudia Venturi",
          dateISO: "2024-04-02",
          readingTimeMins: 6,
          hero: cloud(
            "https://images.unsplash.com/photo-1489515217757-5fd1be406fef",
            "Hands planing a walnut shotgun stock",
            4 / 3,
          ),
          tags: [{ id: "materials", label: "Materials", slug: "materials" }],
          slug: "stockmakers-on-balance",
        },
      ],
    },
    interviews: {
      headerHtml:
        "<p>Champions on routine, pressure, and the fittings that keep them grounded.</p>",
      viewAllHref: "/journal/champion-interviews",
      items: [
        {
          title: "Sofia Rossi: The fitting ritual",
          excerptHtml:
            "<p>The Olympic Trap champion on how fittings anchor her season.</p>",
          author: "Journal Team",
          dateISO: "2024-03-18",
          readingTimeMins: 5,
          hero: cloud(
            "https://images.unsplash.com/photo-1508672019048-805c876b67e2",
            "Champion shooter posing with a shotgun outdoors",
            4 / 3,
          ),
          tags: [{ id: "trap", label: "Trap", slug: "trap" }],
          slug: "fitting-ritual",
        },
      ],
    },
    news: {
      headerHtml: "<p>Announcements from Botticino and the Perazzi community.</p>",
      viewAllHref: "/journal/news",
      items: [
        {
          title: "New service center partnership",
          excerptHtml:
            "<p>Perazzi adds a factory-authorized service center in Denver to support traveling shooters.</p>",
          author: "Perazzi Newsroom",
          dateISO: "2024-02-12",
          readingTimeMins: 4,
          hero: cloud(
            "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
            "Perazzi gunsmith bench with tools",
            4 / 3,
          ),
          tags: [{ id: "service", label: "Service", slug: "service" }],
          slug: "service-center-partnership",
        },
      ],
    },
  },
  tags: [
    { id: "materials", label: "Materials", slug: "materials", count: 3 },
    { id: "trap", label: "Trap", slug: "trap", count: 5 },
    { id: "service", label: "Service", slug: "service" },
  ],
};
