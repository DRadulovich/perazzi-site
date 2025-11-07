import type { OralHistory } from "@/types/heritage";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

const image = (id: string, source: string, alt: string, aspectRatio = 1) => ({
  id,
  kind: "image" as const,
  url: `${fetchBase}/${encodeURIComponent(source)}`,
  alt,
  aspectRatio,
});

export const oralHistories: OralHistory[] = [
  {
    id: "oral-giovanni",
    title: "Giovanni Perazzi on the MX8 Breakthrough",
    quote:
      "We were sketching on tracing paper at midnight, chasing a trigger that could change with the shooter, not the other way around.",
    attribution: "Giovanni Perazzi, Master gunsmith",
    audioSrc: "https://res.cloudinary.com/pwebsite/video/upload/v1720000000/perazzi/audio-mx8.mp3",
    transcriptHtml:
      "<p>Giovanni recounts the sprint to prepare the MX8 for Mexico City. He describes machining prototype trigger groups overnight and testing at first light in the Botticino tunnel.</p>",
    image: image(
      "oral-giovanni-image",
      "https://images.unsplash.com/photo-1529946825183-d7cf59806e22",
      "Portrait of Giovanni Perazzi in the workshop",
    ),
  },
  {
    id: "oral-rossi",
    title: "Sofia Rossi on Tunnel Rituals",
    quote: "The tunnel isn’t about perfection—it’s about learning how the gun breathes with you.",
    attribution: "Sofia Rossi, Olympic Trap Champion",
    transcriptHtml:
      "<p>Sofia explains how every major championship begins with a Botticino tunnel session, walking through balance adjustments and visual routines that calm the mind.</p>",
    image: image(
      "oral-rossi-image",
      "https://images.unsplash.com/photo-1530026405186-ed1f139313f8",
      "Sofia Rossi listening to audio cues during a practice session",
    ),
  },
];
