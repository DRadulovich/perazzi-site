import type { ServiceLocation } from "@/types/service";

export const locations: ServiceLocation[] = [
  {
    id: "factory-botticino",
    name: "Perazzi Botticino",
    type: "Factory",
    addressHtml:
      "<p>Via Daniele Perazzi 1<br/>25082 Botticino Mattina (BS)<br/>Italy</p>",
    phone: "+39 030 269 6922",
    email: "service@perazzi.it",
    notesHtml: "<p>Full mechanical rebuilds, engraving refresh, bespoke stock work.</p>",
  },
  {
    id: "service-usa",
    name: "Perazzi USA Service",
    type: "Service Center",
    addressHtml:
      "<p>101 Perazzi Way<br/>Azusa, CA 91702<br/>USA</p>",
    phone: "+1 626-334-1234",
    email: "service@perazziusa.com",
    website: "https://perazziusa.com/service",
    notesHtml: "<p>Trigger rebuilds, ejector timing, rapid parts fulfillment.</p>",
  },
  {
    id: "specialist-uk",
    name: "London Specialist Atelier",
    type: "Specialist",
    addressHtml:
      "<p>12 Cavendish Place<br/>London W1<br/>United Kingdom</p>",
    phone: "+44 20 7123 4567",
    notesHtml: "<p>Factory-authorized engraving touch-ups and sporting conversions.</p>",
  },
];
