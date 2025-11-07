import type { VisitFactoryData } from "@/types/experience";

const fetchBase =
  "https://res.cloudinary.com/pwebsite/image/fetch/f_auto,q_auto";

const mapImage = (source: string, alt: string) => ({
  id: "visit-map",
  kind: "image" as const,
  url: `${fetchBase}/${encodeURIComponent(source)}`,
  alt,
  aspectRatio: 4 / 3,
});

export const visit: VisitFactoryData = {
  introHtml:
    "<p>Walk through the production floor, meet the engraving atelier, and watch fittings live from the tunnel gallery. Every visit is a small group so you can ask questions and feel the rhythm of the factory.</p>",
  location: {
    name: "Perazzi Botticino",
    addressHtml:
      "<p>Via Daniele Perazzi 1<br/>25082 Botticino Mattina (BS)<br/>Italy</p>",
    mapEmbedSrc:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44746.87813164304!2d10.2902568!3d45.5199988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47817776ebf93163%3A0x7b1471b5b8b3b944!2sPerazzi!5e0!3m2!1sen!2sit!4v1720000000000!5m2!1sen!2sit",
    staticMap: mapImage(
      "https://maps.googleapis.com/maps/api/staticmap?center=Botticino+Italy&zoom=13&size=600x400&maptype=roadmap&markers=color:red%7C45.5199988,10.2902568",
      "Map showing the Perazzi factory location in Botticino",
    ),
    mapLinkHref: "https://maps.google.com/?q=Perazzi+Botticino",
    hoursHtml: "<p>Monday–Friday · 9:00–17:00 CET</p>",
    notesHtml:
      "<p>Factory holidays vary by season. Concierge will confirm available dates before booking travel.</p>",
  },
  whatToExpectHtml:
    "<ul><li>Guided tour of machining, stockmaking, engraving, and tunnel.</li><li>Live fitting observation with Q&A.</li><li>Espresso and light lunch in the guest salon.</li></ul>",
  cta: { label: "Request a factory visit", href: "/experience/visit" },
};
