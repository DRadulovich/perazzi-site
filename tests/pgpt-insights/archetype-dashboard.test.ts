import { describe, expect, it } from "vitest";

import { buildTrendPoints, gradeMargin } from "@/app/admin/pgpt-insights/archetype/page";
import { buildHeatmap } from "@/app/admin/pgpt-insights/templates/page";
import { buildStackedAreaDataset } from "@/components/pgpt-insights/charts/StackedAreaChart";
import type { ArchetypeDailyRow, TemplateUsageRow } from "@/lib/pgpt-insights/types";

describe("gradeMargin", () => {
  it("classifies margin bands", () => {
    expect(gradeMargin(null).tone).toBe("default");
    expect(gradeMargin(0.15).tone).toBe("positive");
    expect(gradeMargin(0.09).tone).toBe("warning");
    expect(gradeMargin(0.02).tone).toBe("critical");
  });
});

describe("buildTrendPoints", () => {
  const rows: ArchetypeDailyRow[] = [
    { day: "2025-01-01", archetype: "Loyalist", cnt: 3, avg_margin: 0.1 },
    { day: "2025-01-01", archetype: "Prestige", cnt: 2, avg_margin: 0.05 },
    { day: "2025-01-02", archetype: "Loyalist", cnt: 1, avg_margin: 0.2 },
  ];

  it("aggregates rows by day", () => {
    const points = buildTrendPoints(rows, ["Loyalist", "Prestige"]);
    expect(points).toHaveLength(2);
    expect(points[0].segments.Loyalist).toBe(3);
    expect(points[0].segments.Prestige).toBe(2);
    // weighted margin: (3*0.1 + 2*0.05) / 5
    expect(points[0].line).toBeCloseTo(0.08, 2);
  });

  it("feeds stacked area dataset", () => {
    const dataset = buildStackedAreaDataset(
      buildTrendPoints(rows, ["Loyalist", "Prestige"]),
      ["Loyalist", "Prestige"],
    );
    expect(dataset.maxTotal).toBe(5);
    expect(dataset.maxMargin).toBeGreaterThan(0.1);
  });
});

describe("buildHeatmap", () => {
  const rows: TemplateUsageRow[] = Array.from({ length: 12 }).map((_, idx) => ({
    archetype: "Loyalist",
    intent: "models",
    template: `tmpl-${idx}`,
    hits: idx + 1,
  }));

  it("caps templates and rolls remaining into Other", () => {
    const dataset = buildHeatmap(rows);
    expect(dataset.columns.length).toBeGreaterThan(0);
    expect(dataset.columns.some((c) => c.key === "__other__")).toBe(true);
    expect(dataset.rows[0]?.cells.some((c) => c.key === "__other__")).toBe(true);
  });
});
