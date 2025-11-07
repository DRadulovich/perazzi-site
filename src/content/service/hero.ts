import type { ServiceHero } from "@/types/service";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

export const hero: ServiceHero = {
  title: "Service & Parts",
  subheading: "Factory-level care, wherever you shoot.",
  background: {
    id: "service-hero",
    kind: "image",
    url: `${fetchBase}/${encodeURIComponent(
      "https://images.unsplash.com/photo-1508057198894-247b23fe5ade",
    )}`,
    alt: "Perazzi technician inspecting a shotgun receiver on a bench",
    aspectRatio: 16 / 9,
  },
};
