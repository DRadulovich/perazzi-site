import type { ServiceLocation } from "@/types/service";

export const locations: ServiceLocation[] = [
  {
    id: "factory-botticino",
    name: "Perazzi Botticino",
    type: "Factory",
    addressHtml:
      "<p>Via Daniele Perazzi 1<br/>25082 Botticino Mattina (BS)<br/>Italy</p>",
    city: "Botticino Mattina (BS)",
    phone: "+39 030 269 6922",
    email: "service@perazzi.it",
    notesHtml: "<p>Full mechanical rebuilds, engraving refresh, bespoke stock work.</p>",
    mapQuery: "Perazzi, Via Daniele Perazzi 1, 25082 Botticino Mattina BS, Italy",
  },
  {
    id: "service-usa",
    name: "Perazzi USA Service",
    type: "Service Center",
    addressHtml:
      "<p>101 Perazzi Way<br/>Azusa, CA 91702<br/>USA</p>",
    city: "Azusa, CA",
    state: "CA",
    phone: "+1 626-334-1234",
    email: "service@perazziusa.com",
    website: "https://perazziusa.com/service",
    notesHtml: "<p>Trigger rebuilds, ejector timing, rapid parts fulfillment.</p>",
    mapQuery: "101 Perazzi Way, Azusa, CA 91702",
  },
  {
    id: "specialist-uk",
    name: "London Specialist Atelier",
    type: "Specialist",
    addressHtml:
      "<p>12 Cavendish Place<br/>London W1<br/>United Kingdom</p>",
    city: "London",
    phone: "+44 20 7123 4567",
    notesHtml: "<p>Factory-authorized engraving touch-ups and sporting conversions.</p>",
    mapQuery: "12 Cavendish Place, London W1, United Kingdom",
  },
];
