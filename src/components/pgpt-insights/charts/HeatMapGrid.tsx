import { HeatmapMatrix } from "./HeatmapMatrix";

export type HeatMapColumn = {
  key: string;
  label: string;
  tooltip?: string;
};

export type HeatMapRow = {
  archetype: string;
  total: number;
  cells: Array<{ key: string; hits: number }>;
};

type HeatMapGridProps = {
  title: string;
  subtitle?: string;
  columns: HeatMapColumn[];
  rows: HeatMapRow[];
  density?: "comfortable" | "compact";
  className?: string;
};

export function HeatMapGrid({ title, subtitle, columns, rows, density, className }: HeatMapGridProps) {
  return (
    <HeatmapMatrix
      title={title}
      subtitle={subtitle}
      columns={columns}
      rows={rows}
      density={density}
      className={className}
    />
  );
}
