import type { ShotgunsLandingData } from "@/types/catalog";

export type DisciplineCard = ShotgunsLandingData["disciplines"][number];

export type ModelDetail = {
  id: string;
  name: string;
  version?: string;
  platform?: string;
  use?: string;
  grade?: string;
  gaugeNames?: string[];
  triggerTypes?: string[];
  triggerSprings?: string[];
  ribTypes?: string[];
  ribStyles?: string[];
  imageUrl?: string;
  imageAlt?: string;
};

export type DisciplineCategory = {
  label: string;
  disciplines: DisciplineCard[];
};

export type DisciplineRailBackground = NonNullable<
  NonNullable<ShotgunsLandingData["disciplineRailUi"]>["background"]
>;

export const DISCIPLINE_TABS = [
  {
    label: "American Disciplines",
    items: [
      ["sporting-disciplines", "sporting"],
      ["american-trap", "trap"],
      ["american-skeet", "skeet"],
    ],
  },
  {
    label: "Olympic Disciplines",
    items: [
      ["olympic-skeet"],
      ["olympic-trap"],
    ],
  },
  {
    label: "Live Game",
    items: [
      ["pigeons-helice"],
      ["game", "game-shooting"],
    ],
  },
] as const;
