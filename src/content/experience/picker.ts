import type { PickerItem } from "@/types/experience";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

const cardMedia = (
  id: string,
  source: string,
  alt: string,
  aspectRatio = 4 / 3,
) => ({
  id,
  kind: "image" as const,
  url: `${fetchBase}/${encodeURIComponent(source)}`,
  alt,
  aspectRatio,
});

export const picker: PickerItem[] = [
  {
    id: "visit",
    title: "Visit Botticino",
    summary:
      "Tour the factory, watch fittings live, and see how every receiver and stock is finished by hand.",
    media: cardMedia(
      "picker-visit",
      "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70",
      "Guests walking through the Perazzi factory hall",
    ),
    ctaLabel: "Plan a visit",
    href: "/experience/visit",
  },
  {
    id: "fitting",
    title: "Book a Fitting",
    summary:
      "Reserve time with our master fitters for try-gun sessions, tunnel patterning, and wood selection.",
    media: cardMedia(
      "picker-fitting",
      "https://images.unsplash.com/photo-1520694478166-daaaaec95b69",
      "Fitter adjusting a try-gun during a session",
    ),
    ctaLabel: "Book fitting",
    href: "/experience/fitting",
  },
  {
    id: "demo",
    title: "Demo Program",
    summary:
      "Meet us on the road to handle current builds, test trigger groups, and reserve a bespoke slot.",
    media: cardMedia(
      "picker-demo",
      "https://images.unsplash.com/photo-1504609813442-a8924e83f76e",
      "Shooter shouldering a shotgun outdoors",
    ),
    ctaLabel: "Find a demo",
    href: "/experience/demo",
  },
];
