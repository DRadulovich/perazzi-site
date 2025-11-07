import type { Author } from "@/types/journal";

const headshot = (source: string, alt: string, aspectRatio = 1) => ({
  id: source,
  kind: "image" as const,
  url: `https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto/${encodeURIComponent(source)}`,
  alt,
  aspectRatio,
});

export const authors: Author[] = [
  {
    id: "claudia-venturi",
    name: "Claudia Venturi",
    bioHtml: "<p>Perazzi workshop archivist and writer covering the craft lineage.</p>",
    headshot: headshot(
      "https://images.unsplash.com/photo-1504593811423-6dd665756598",
      "Portrait of Claudia Venturi",
    ),
    links: [{ label: "Instagram", href: "https://instagram.com/perazzi" }],
  },
  {
    id: "journal-team",
    name: "Journal Team",
    bioHtml: "<p>Perazzi editorial team sharing news from Botticino.</p>",
  },
];
