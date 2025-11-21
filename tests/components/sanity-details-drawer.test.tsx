import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { SanityDetailsDrawer } from "@/components/concierge/SanityDetailsDrawer";

describe("SanityDetailsDrawer", () => {
  const cards = [
    {
      id: "1",
      title: "High Tech",
      description: "Stability and balance with modern geometry.",
      imageUrl: null,
      platform: "HT",
      grade: "SC2",
      gauges: ["12"],
    },
  ];

  it("renders cards when open", () => {
    const html = renderToString(
      <SanityDetailsDrawer open cards={cards} onClose={() => {}} />
    );
    expect(html).toContain("High Tech");
    expect(html).toContain("Stability and balance with modern geometry.");
  });

  it("omits content when no cards and not loading/error", () => {
    const html = renderToString(
      <SanityDetailsDrawer open cards={[]} onClose={() => {}} />
    );
    expect(html).toContain("No details available.");
  });
});
