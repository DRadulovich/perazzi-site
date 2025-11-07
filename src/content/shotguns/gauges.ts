import type { GaugeInfo } from "@/types/catalog";

export const gauges: GaugeInfo[] = [
  {
    id: "12ga",
    label: "12 ga",
    description:
      "The competition standard—dense shot columns with authority on long targets, balanced with Perazzi’s ballast system.",
    handlingNotes:
      "Carries deliberate momentum with ballast options to stay on plane through recoil, ideal for bunker and demanding sporting layouts.",
    commonBarrels: ['30"', '32"'],
    typicalDisciplines: ["Trap", "Sporting"],
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
    handlingNotes:
      "Quicker ignition with a lively finish—pairs well with High Tech frames for responsive skeet and on-your-toes sporting lines.",
    commonBarrels: ['30"', '31"'],
    typicalDisciplines: ["Skeet", "Sporting"],
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
    handlingNotes:
      "Feathery but centered—teaches economy of motion and tempo discipline for FITASC and refined sporting layouts.",
    commonBarrels: ['30"', '32"'],
    typicalDisciplines: ["Sporting", "FITASC"],
  },
  {
    id: "410",
    label: ".410",
    description:
      "The purest challenge with featherweight swing—best reserved for seasoned shooters seeking a new rhythm.",
    handlingNotes:
      "Ultra-fast start and finish with minimal inertia—demands precise inputs and is ideal for advanced skeet or exhibition training.",
    commonBarrels: ['28"', '30"'],
    typicalDisciplines: ["Skeet", "Training"],
  },
];
