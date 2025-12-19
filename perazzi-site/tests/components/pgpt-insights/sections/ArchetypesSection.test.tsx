import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { ArchetypesSection } from "@/components/pgpt-insights/sections/ArchetypesSection";

vi.mock("@/lib/pgpt-insights/cached", () => ({
  getArchetypeIntentStats: vi.fn().mockResolvedValue([
    { archetype: "Builder", intent: "ship", hits: 12 },
    { archetype: "Skeptic", intent: "evaluate", hits: 4 },
  ]),
  getArchetypeSummary: vi.fn().mockResolvedValue([
    {
      archetype: "Builder",
      avg_max_score: 0.87,
      guardrail_block_rate: 0.03,
      low_confidence_rate: 0.05,
      total: 16,
    },
  ]),
}));

describe("ArchetypesSection", () => {
  it("renders archetype analytics with mocked data", async () => {
    const html = renderToStaticMarkup(
      await ArchetypesSection({ envFilter: "prod", daysFilter: 7, tableDensityClass: "table-dense" }),
    );

    expect(html).toContain("Archetype &amp; Intent Analytics");
    expect(html).toContain("Builder");
    expect(html).toContain("ship");
  });
});
