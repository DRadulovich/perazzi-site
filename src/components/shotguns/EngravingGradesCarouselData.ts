import type { GradeSeries, ShotgunsLandingData } from "@/types/catalog";

export type EngravingCategory = {
  label: string;
  grades: GradeSeries[];
};

export type EngravingCarouselBackground = NonNullable<
  NonNullable<ShotgunsLandingData["engravingCarouselUi"]>["background"]
>;

export const GRADE_TABS = [
  {
    label: "The Benchmark",
    order: ["Standard", "Lusso", "SC2"],
  },
  {
    label: "SC3",
    order: ["SC3", "SC3 Sideplates"],
  },
  {
    label: "SCO",
    order: ["SCO", "SCO Gold", "SCO Sideplates", "SCO Gold Sideplates"],
  },
  {
    label: "Extra",
    order: ["Extra", "Extra Gold", "Extra Super"],
  },
] as const;
