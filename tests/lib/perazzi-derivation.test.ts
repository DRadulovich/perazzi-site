import { describe, it, expect } from "vitest";
import { derivePanels } from "@/lib/perazzi-derivation";

describe("derivePanels", () => {
  it("uses topics/intents to derive platforms and steps", () => {
    const messages = [
      { role: "user", content: "Tell me about High Tech and MX8 for sporting clays." },
      { role: "assistant", content: "High Tech offers flatter handling with stability for sporting." },
    ] as any;

  const panels = derivePanels(messages, {
    intents: ["platform_ht", "models"],
    topics: ["platform_ht", "platforms"],
    citations: [],
  });

  expect(panels.activePlatforms).toContain("ht");
  expect(panels.nextSteps.some((step) => step.intent === "platform_ht")).toBe(true);
});

it("falls back to text parsing for fit profile", () => {
  const messages = [
    { role: "assistant", content: "For trap and skeet, a stable gun with neutral balance helps." },
  ] as any;

  const panels = derivePanels(messages, { intents: [], topics: [], citations: [] });
  expect(panels.fitProfile.disciplines).toContain("Trap");
  expect(panels.fitProfile.disciplines).toContain("Skeet");
  expect(panels.fitProfile.preferences.length).toBeGreaterThan(0);
});

it("surfaces bespoke next step when intent is bespoke", () => {
  const messages = [{ role: "assistant", content: "We can plan your bespoke build." }] as any;
  const panels = derivePanels(messages, { intents: ["bespoke"], topics: ["bespoke"], citations: [] });
  expect(panels.nextSteps.some((step) => step.intent === "learn_bespoke_process")).toBe(true);
});

it("returns empty defaults when no meta", () => {
  const panels = derivePanels([], null);
  expect(panels.activePlatforms).toHaveLength(0);
  expect(panels.nextSteps.length).toBeGreaterThan(0); // fallback step
});
});
