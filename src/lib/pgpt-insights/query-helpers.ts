export type PgQueryParam = string | number | boolean;

type AppendDaysFilterArgs = {
  conditions: string[];
  params: PgQueryParam[];
  idx: number;
  days?: number;
  column?: string;
};

export function appendDaysFilter({
  conditions,
  params,
  idx,
  days,
  column = "created_at",
}: AppendDaysFilterArgs): number {
  const daysValue = typeof days === "number" && Number.isFinite(days) ? days : null;
  if (!daysValue) return idx;

  conditions.push(`${column} >= now() - ($${idx} || ' days')::interval`);
  params.push(daysValue);
  return idx + 1;
}
