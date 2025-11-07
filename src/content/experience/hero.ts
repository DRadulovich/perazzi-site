import type { ExperienceHero } from "@/types/experience";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

export const hero: ExperienceHero = {
  title: "Experience Perazzi",
  subheading:
    "Walk the Botticino atelier, shape your fitting, and demo the gun that will travel with you.",
  background: {
    id: "experience-hero",
    kind: "image",
    url: `${fetchBase}/${encodeURIComponent(
      "https://images.unsplash.com/photo-1516637090014-cb1ab0d08fc7",
    )}`,
    alt: "Guests entering the Perazzi factory lobby",
    aspectRatio: 16 / 9,
  },
};
