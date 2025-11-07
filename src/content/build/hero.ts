import type { BuildPageData } from "@/types/build";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

export const hero: BuildPageData["hero"] = {
  eyebrow: "The Bespoke Journey",
  title: "From Vision to Instrument",
  introHtml:
    "<p>Commissioning a Perazzi is a rite of belonging. From the first conversation to the tunnel proof, our artisans turn how you move and focus into an instrument that answers only to you.</p>",
  media: {
    id: "build-hero-media",
    kind: "image",
    url: `${fetchBase}/${encodeURIComponent(
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
    )}`,
    alt: "Perazzi fitter steadying a customer's shoulder during a fitting session",
    caption: "Botticino atelier fittings capture the way you move before metal is ever machined.",
    aspectRatio: 16 / 9,
  },
};
