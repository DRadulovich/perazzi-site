"use client";

import * as React from "react";
import { PerazziHeritageEras } from "@/components/heritage/PerazziHeritageEras";
import type { HeritageEraWithEvents } from "@/types/heritage";

const mockEras: HeritageEraWithEvents[] = [
  {
    id: "founding",
    label: "Workshop Origins",
    startYear: 1957,
    endYear: 1963,
    backgroundSrc: "/redesign-photos/heritage/pweb-heritage-era-1-founding.jpg",
    overlayColor: "rgba(15, 10, 8, 0.65)",
    events: [
      {
        id: "single-event-1",
        date: "1957",
        title: "Opening the Botticino Workshop",
        summaryHtml:
          "<p>A modest space focused on fit and balance becomes the seed of a new competitive language.</p>",
      },
    ],
  },
  {
    id: "awakening",
    label: "Olympic Awakening",
    startYear: 1964,
    endYear: 1979,
    backgroundSrc: "/redesign-photos/heritage/pweb-heritage-era-2-olympic.jpg",
    overlayColor: "rgba(8, 16, 24, 0.7)",
    events: [
      {
        id: "era2-event1",
        date: "1964",
        title: "First Olympic Podium",
        summaryHtml:
          "<p>The MX platform begins proving itself under pressure.</p>",
        media: {
          url: "https://images.unsplash.com/photo-1509718443690-d8e2fb3474b7",
          alt: "Early workshop exterior",
        },
      },
      {
        id: "era2-event2",
        date: "1968",
        title: "MX8 Innovations",
        summaryHtml:
          "<p>Removable trigger groups bring fast serviceability to the field.</p>",
      },
      {
        id: "era2-event3",
        date: "1976",
        title: "Expanding for Women’s Trap",
        summaryHtml:
          "<p>Stock geometry adapts for new champions, keeping stability and elegance intact.</p>",
        media: {
          url: "https://images.unsplash.com/photo-1529257414771-1960ab1df990",
          alt: "Competition team celebrating",
        },
      },
    ],
  },
  {
    id: "age-of-champions",
    label: "Age of Champions",
    startYear: 1980,
    endYear: 1999,
    backgroundSrc: "/redesign-photos/heritage/pweb-heritage-era-3-champions.jpg",
    overlayColor: "rgba(9, 9, 11, 0.7)",
    events: [
      {
        id: "era3-event1",
        date: "1984",
        title: "Los Angeles Sweep",
        summaryHtml:
          "<p>Multiple podiums reinforce Perazzi as the competitive default.</p>",
        media: {
          url: "https://images.unsplash.com/photo-1603791452906-bf92c8fef56c",
          alt: "Podium celebration",
        },
      },
      {
        id: "era3-event2",
        date: "1990",
        title: "Heritage Archive Expansion",
        summaryHtml:
          "<p>Decades of engravings and bespoke builds are cataloged for future collectors.</p>",
      },
      {
        id: "era3-event3",
        date: "1992",
        title: "Custom Fittings Go Global",
        summaryHtml:
          "<p>International ateliers begin offering fittings with factory craftsmen on hand.</p>",
        media: {
          url: "https://images.unsplash.com/photo-1548783307-f63adc6a9986",
          alt: "Walnut forest in golden light",
        },
      },
      {
        id: "era3-event4",
        date: "1996",
        title: "New Balance of Steel & Walnut",
        summaryHtml:
          "<p>Material studies refine how dense actions meet lighter, resilient woods.</p>",
      },
      {
        id: "era3-event5",
        date: "1999",
        title: "Champions Mentor Future Shooters",
        summaryHtml:
          "<p>Veterans share fit philosophy directly with bespoke clients.</p>",
      },
    ],
  },
];

export default function HeritageDevPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <PerazziHeritageEras eras={mockEras} />
    </main>
  );
}
