import type { HeritageEvent } from "@/types/heritage";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

const image = (
  id: string,
  source: string,
  alt: string,
  aspectRatio = 16 / 9,
) => ({
  id,
  kind: "image" as const,
  url: `${fetchBase}/${encodeURIComponent(source)}`,
  alt,
  aspectRatio,
});

export const timeline: HeritageEvent[] = [
  {
    id: "founding-1957",
    date: "1957",
    title: "Workshop Founded in Botticino",
    summaryHtml:
      "<p>Daniele Perazzi opens a small workshop outside Brescia, blending competitive insight with artisan stockmaking to pursue a new Italian shotgun language.</p>",
    media: image(
      "timeline-1957",
      "https://images.unsplash.com/photo-1509718443690-d8e2fb3474b7",
      "Vintage exterior of an Italian gunmaking workshop",
      4 / 3,
    ),
  },
  {
    id: "first-olympics-1964",
    date: "1964-10-23",
    title: "First Olympic Gold with Mattarelli",
    summaryHtml:
      "<p>Ennio Mattarelli wins Trap gold in Tokyo with an early Perazzi, validating the workshop’s obsession with fit and mechanical calm under pressure.</p>",
    referenceLinks: {
      champions: [{ id: "mattarelli", name: "Ennio Mattarelli" }],
    },
  },
  {
    id: "mx8-1968",
    date: "1968",
    title: "Birth of the MX8 Platform",
    summaryHtml:
      "<p>The MX8 debuts for Mexico City, introducing the removable trigger group that becomes the brand’s competitive hallmark.</p>",
    media: image(
      "timeline-mx8",
      "https://images.unsplash.com/photo-1603791452906-bf92c8fef56c",
      "Close-up of a removable shotgun trigger group being tuned",
    ),
    referenceLinks: {
      platforms: [
        { id: "platform-mx8", slug: "mx", title: "MX Platform" },
      ],
    },
  },
  {
    id: "women-trap-1976",
    date: "1976",
    title: "Expanding the Craft to Women’s Trap",
    summaryHtml:
      "<p>Perazzi refines bespoke ergonomics for the first wave of women’s Trap champions, pioneering lighter dynamics without losing stability.</p>",
  },
  {
    id: "usa-team-1984",
    date: "1984",
    title: "Los Angeles Team Sweep",
    summaryHtml:
      "<p>Perazzi athletes capture multiple podiums in Los Angeles, cementing the house as the default choice for Olympic Trap and Skeet teams.</p>",
    media: image(
      "timeline-1984",
      "https://images.unsplash.com/photo-1529257414771-1960ab1df990",
      "Olympic shooting team celebrating on the podium",
      3 / 2,
    ),
  },
  {
    id: "sco-artistry-1998",
    date: "1998",
    title: "SCO Engraving Atelier Opens",
    summaryHtml:
      "<p>Launch of the SCO engraving program pairs Botticino mechanics with master Italian engravers, enabling bespoke storytelling on every receiver face.</p>",
    referenceLinks: {
      articles: [
        {
          id: "engraving-house",
          title: "Inside the SCO Atelier",
          slug: "journal/engraving-atelier",
        },
      ],
    },
  },
  {
    id: "london-2012",
    date: "2012-08-05",
    title: "London Legacy & Tunnel Modernization",
    summaryHtml:
      "<p>To support the London Olympiad, Perazzi renovates the Botticino tunnel with live digital telemetry, ensuring future champions can pattern with millimeter accuracy.</p>",
    media: image(
      "timeline-2012",
      "https://images.unsplash.com/photo-1517511620798-cec17d428bc0",
      "Modern indoor shooting tunnel with telemetry screens",
    ),
  },
  {
    id: "champion-mentorship-2016",
    date: "2016",
    title: "Champion Mentorship Program",
    summaryHtml:
      "<p>Evergreen champions begin mentoring bespoke clients directly, pairing technical insight with lived experience on the world circuit.</p>",
    referenceLinks: {
      champions: [
        { id: "sofia-rossi", name: "Sofia Rossi" },
        { id: "marco-de-santis", name: "Marco De Santis" },
      ],
    },
  },
  {
    id: "partnership-2023",
    date: "2023",
    title: "Sustainable Walnut Partnership",
    summaryHtml:
      "<p>Perazzi partners with European foresters to secure traceable walnut, ensuring every bespoke blank balances sustainability with performance grain.</p>",
    media: image(
      "timeline-2023",
      "https://images.unsplash.com/photo-1548783307-f63adc6a9986",
      "Walnut forest in golden evening light",
    ),
  },
  {
    id: "future-lab-2024",
    date: "2024",
    title: "Future Lab for Adaptive Fit",
    summaryHtml:
      "<p>The atelier launches Future Lab sessions exploring adaptive stocks and sensor-assisted fittings, keeping bespoke craft aligned with contemporary shooters.</p>",
  },
];
