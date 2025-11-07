import type { ChampionEvergreen } from "@/types/heritage";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

const portrait = (id: string, source: string, alt: string, aspectRatio = 3 / 4) => ({
  id,
  kind: "image" as const,
  url: `${fetchBase}/${encodeURIComponent(source)}`,
  alt,
  aspectRatio,
});

export const champions: ChampionEvergreen[] = [
  {
    id: "sofia-rossi",
    name: "Sofia Rossi",
    title: "Olympic Trap Gold, London 2012",
    quote: "A Perazzi stays composed when the crowd fades and only the target remains.",
    image: portrait(
      "champion-rossi",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
      "Sofia Rossi holding her Perazzi shotgun on the range",
    ),
    article: {
      id: "stories-sofia-rossi",
      title: "Sofia Rossi on Ritual and Rhythm",
      slug: "journal/champion-interviews/sofia-rossi",
    },
    disciplines: ["Trap"],
  },
  {
    id: "marco-de-santis",
    name: "Marco De Santis",
    title: "World Skeet Champion",
    quote: "Balance is the word—Perazzi tunes every ounce so the gun finishes the shot with you.",
    image: portrait(
      "champion-de-santis",
      "https://images.unsplash.com/photo-1517649763962-0c623066013b",
      "Marco De Santis smiling with his shotgun over the shoulder",
    ),
    disciplines: ["Skeet", "Sporting"],
  },
  {
    id: "lee-matthews",
    name: "Lee Matthews",
    title: "US Sporting Clays Champion",
    quote: "The atelier translated my field instincts into a clay gun that swings like a compass needle.",
    image: portrait(
      "champion-matthews",
      "https://images.unsplash.com/photo-1531386151435-3c953d7f9a01",
      "Lee Matthews aiming at a clay target with trees in background",
    ),
    article: {
      id: "clays-matthews",
      title: "Designing a Sporting Perazzi",
      slug: "journal/stories-of-craft/sporting-perazzi",
    },
    disciplines: ["Sporting"],
  },
  {
    id: "giulia-bianchi",
    name: "Giulia Bianchi",
    title: "Trap Mixed Team Champion",
    quote: "Every season I return to Botticino; the tunnel sessions keep my sight picture honest.",
    image: portrait(
      "champion-bianchi",
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
      "Giulia Bianchi preparing to shoot with earmuffs on",
    ),
    disciplines: ["Trap"],
  },
];
