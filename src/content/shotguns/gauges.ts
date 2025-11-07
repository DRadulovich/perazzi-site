import type { GaugeInfo } from "@/types/catalog";

export const gauges: GaugeInfo[] = [
  {
    id: "12ga",
    label: "12 ga",
    description:
      "The competition standard—dense shot columns with authority on long targets, balanced with Perazzi’s ballast system.",
    commonBarrels: ['30"', '32"'],
    faq: [
      {
        q: "Why do most trap shooters stay with 12 gauge?",
        a: "It delivers the most consistent pellet energy at bunker distances while keeping recoil manageable with proper stock fit.",
      },
      {
        q: "Can I order a 12 gauge with sub-gauge tubes?",
        a: "Yes. The atelier fits Briley or Perazzi tubes to extend sporting versatility without changing frames.",
      },
    ],
  },
  {
    id: "20ga",
    label: "20 ga",
    description:
      "A lighter swing for skeet and sporting—ideal where speed and low recoil matter more than extreme range.",
    commonBarrels: ['30"', '31"'],
    faq: [
      {
        q: "How does 20 gauge feel compared to 12 gauge?",
        a: "Expect a quicker start and finish with reduced rotational inertia—perfect for fast crossers.",
      },
    ],
  },
  {
    id: "28ga",
    label: "28 ga",
    description:
      "Elegant and precise—often paired with High Tech frames for FITASC and sub-gauge sporting events.",
    commonBarrels: ['30"', '32"'],
  },
  {
    id: "410",
    label: ".410",
    description:
      "The purest challenge with featherweight swing—best reserved for seasoned shooters seeking a new rhythm.",
    commonBarrels: ['28"', '30"'],
  },
];
