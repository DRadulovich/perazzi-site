import type { ShotgunsSectionData } from "@/types/catalog";
import { landing } from "./landing";
import { series as mxSeries } from "./series.mx";
import { series as htSeries } from "./series.ht";
import { series as tmSeries } from "./series.tm";
import { disciplines } from "./disciplines";
import { gauges } from "./gauges";
import { grades } from "./grades";

export const shotgunsData: ShotgunsSectionData = {
  landing,
  series: {
    mx: mxSeries,
    ht: htSeries,
    tm: tmSeries,
  },
  disciplines,
  gauges,
  grades,
};

export { landing } from "./landing";
export { disciplines } from "./disciplines";
export { gauges } from "./gauges";
export { grades } from "./grades";
